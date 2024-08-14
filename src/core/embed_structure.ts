import {
  APIEmbed,
  APIEmbedField,
  EmbedBuilder,
  MessageReaction,
  PartialMessageReaction,
} from 'discord.js';
import Game from './game.js';

/**
 * An embed field in a Discord message.
 */
interface FieldStruct {
  game: Game;
  inline: boolean;
}

/**
 * An embed in a Discord message.
 */
interface EmbedStruct {
  title: string;
  description: string;
  fields: FieldStruct[];
  footer?: string;
}

/**
 * Represents a basic Discord message with content and embeds.
 */
interface MessageStruct {
  content: string | (() => string);
  embeds: EmbedStruct[];
}

/**
 * Represents a Discord message containing a summary of all game entries today.
 */
export class GameSummaryMessage {
  private structure: MessageStruct;

  /**
   * Initializes a game summary message with the given structure.
   *
   * @param {MessageStruct} structure The structure of the message.
   */
  constructor(structure: MessageStruct) {
    this.structure = structure;
  }

  /**
   * Sends the game summary message to the given message reaction's channel.
   *
   * @param {MessageReaction | PartialMessageReaction} message_reaction - Message reaction in the channel to send to.
   */
  async send(message_reaction: MessageReaction | PartialMessageReaction) {
    const message = message_reaction.message;
    const payload = {
      content:
        typeof this.structure.content === 'string'
          ? this.structure.content
          : this.structure.content(),
      embeds: await this.get_embeds(),
    };

    await message.channel
      .send(payload)
      .then(() =>
        console.log(
          `Sent reaction message to ${message.member?.displayName ?? message.author!.displayName}.`
        )
      )
      .catch((err) => console.warn(`Could not send reaction message: ${err}`));
  }

  /**
   * Returns a list of all games in the message.
   *
   * @returns {Game[]} The games in the message.
   */
  get_games(): Game[] {
    return this.structure.embeds.flatMap((embed) =>
      embed.fields.map((field) => field.game)
    );
  }

  private async get_embeds(): Promise<APIEmbed[]> {
    const embeds: APIEmbed[] = [];

    for (const embed_structure of this.structure.embeds) {
      const fields: APIEmbedField[] = [];

      for (const field_structure of embed_structure.fields) {
        const field = await field_structure.game.get_embed_field();
        if (field !== null) {
          fields.push(field);
        }
      }

      const footer_options = embed_structure.footer
        ? { text: embed_structure.footer }
        : null;

      const embed = new EmbedBuilder()
        .setTitle(embed_structure.title)
        .setDescription(embed_structure.description)
        .addFields(fields)
        .setFooter(footer_options).data;

      embeds.push(embed);
    }

    return embeds;
  }
}
