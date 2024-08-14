import { EmbedField, Message } from 'discord.js';
import { MessageParser } from './message_parser.js';
import { GameEntry, GameEntryModel } from './database/schema.js';
import { EmbedFieldFormatter } from './embed_formatter.js';

export interface Responder {
  (entry: GameEntry): string;
}

export const DEFAULT_RESPONDER: Responder = (entry: GameEntry) =>
  `${entry.user.server_name ?? entry.user.name} did ${entry.game} ${entry.day_id}: ${entry.score}`;

/**
 * Represents a game. Handles message parsing and responding.
 */
export class Game {
  private message_parser: MessageParser;
  private embed_field_formatter: EmbedFieldFormatter;
  private responder: Responder;

  /**
   * Creates a `Game` instance.
   *
   * @param {MessageParser} message_parser - Parser used for validating and parsing discord messages
   * into game-specific entries.
   * @param {EmbedFieldFormatter} embed_field_formatter - Formatter used to structure an embed field.
   * @param {Responder} [responder=DEFAULT_RESPONDER] - Optional. The responder used for sending a
   * reply to valid game messages.
   */
  constructor(
    message_parser: MessageParser,
    embed_field_formatter: EmbedFieldFormatter,
    responder: Responder = DEFAULT_RESPONDER
  ) {
    this.message_parser = message_parser;
    this.embed_field_formatter = embed_field_formatter;
    this.responder = responder;
  }

  /**
   * Matches a Discord message. If the message is a valid game entry, it is:
   * - parsed,
   * - saved to a database via `GameEntryModel`,
   * - and replied to in Discord by the client.
   *
   * @param {Message} message - The message to validate.
   * @returns {Promise<GameEntry | null>} A promise that resolves to a `GameEntry` or `null` if the
   * message does not match.
   */
  public async handle_message(message: Message): Promise<GameEntry | undefined> {
    const entry = this.message_parser.parse_message(message);
    if (entry == null) {
      return undefined;
    }

    await Game.upsert_entry(entry);
    await Game.send_response(message, this.responder(entry));

    return entry;
  }

  private static async upsert_entry(entry: GameEntry) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDay());

    const filter = {
      createdAt: { $gte: today },
      game: entry.game,
      day_id: entry.day_id,
      'user.id': entry.user.id,
    };
    const options = { upsert: true };

    return await GameEntryModel.findOneAndUpdate(filter, entry, options);
  }

  private static async send_response(message: Message, content: string) {
    const sent_message = await message.channel.send(content);
    await sent_message.react('📋');
  }

  /**
   * Generates an Embed field with all of today's entries for this game.
   *
   * @param {boolean} [inline=true] - Whether the embed should be inline or not.
   * @returns {Promise<EmbedField>} An embed field.
   */
  public get_embed_field = async (
    inline: boolean = true
  ): Promise<EmbedField | null> =>
    await this.embed_field_formatter.get_embed_field(inline);

  /**
   * Returns the name of the game.
   */
  get name() {
    return this.message_parser.name;
  }
}

export default Game;
