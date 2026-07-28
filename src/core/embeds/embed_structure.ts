import {
  APIEmbed,
  APIEmbedField,
  ButtonInteraction,
  EmbedBuilder,
  Snowflake,
} from 'discord.js';
import Game from '../game.js';
import { SummaryMessage, SummaryMessageModel } from '../database/schema.js';
import { get_today } from '../../util.js';
import { EmbedMessage } from './embed_types.js';


/**
 * Represents a Discord message containing a summary of all game entries today.
 */
export class GameSummaryMessage {
  private message: EmbedMessage;

  /**
   * Initializes a game summary message with the given message.
   *
   * @param {EmbedMessage} message The message.
   */
  constructor(message: EmbedMessage) {
    this.message = message;
  }

  /**
   * Sends the game summary message as a reply to the given button interaction, then deletes the
   * summary message it replaces - see `delete_replaced_summary`.
   *
   * The interaction is deferred before anything else, because building the summary hits the
   * database and Discord discards interactions that are not acknowledged within three seconds.
   *
   * @param {ButtonInteraction} interaction - The button interaction to reply to.
   */
  async send(interaction: ButtonInteraction) {
    await interaction.deferReply();

    const payload = {
      content:
        typeof this.message.content === 'string'
          ? this.message.content
          : this.message.content(),
      embeds: await this.get_embeds(),
    };
    const summary = await interaction.editReply(payload);
    console.log(
      `Sent summary message to ${interaction.member?.user.username ?? interaction.user.username}.`,
    );

    // Only once the new summary is up do we clear away the one it replaces.
    const replaced = await GameSummaryMessage.track_summary(
      interaction.channelId,
      summary.id,
    );
    await GameSummaryMessage.delete_replaced_summary(interaction, replaced);
  }

  /**
   * Records `message_id` as the current summary message for `channel_id`, and returns the entry it
   * replaced - if any.
   *
   * The swap is a single atomic update so that two people clicking the summary button at the same
   * time cannot both claim, and both try to delete, the same previous summary.
   */
  private static async track_summary(
    channel_id: Snowflake,
    message_id: Snowflake,
  ): Promise<SummaryMessage | null> {
    return await SummaryMessageModel.findOneAndUpdate(
      { channel_id: channel_id },
      { channel_id: channel_id, message_id: message_id },
      { upsert: true },
    ).exec();
  }

  /**
   * Deletes a summary message that has been replaced by a newer one, keeping a single summary per
   * channel per day.
   *
   * Summaries from previous days are left alone - those are a record of that day. Failing to
   * delete is not treated as an error: the message may well be gone already.
   */
  private static async delete_replaced_summary(
    interaction: ButtonInteraction,
    replaced: SummaryMessage | null,
  ) {
    const updated_at = (replaced as { updatedAt?: Date } | null)?.updatedAt;
    if (!replaced || !updated_at || updated_at < get_today()) {
      return;
    }

    await interaction.channel?.messages
      .fetch(replaced.message_id)
      .then((message) => message.delete())
      .catch((err) =>
        console.info(
          `Could not delete replaced summary message ${replaced.message_id}: ${err}`,
        ),
      );
  }

  /**
   * Returns a list of all games in the message.
   *
   * @returns {Game[]} The games in the message.
   */
  get_games(): Game[] {
    return this.message.embeds.flatMap((embed) =>
      embed.fields.map((field) => field.game),
    );
  }

  private async get_embeds(): Promise<APIEmbed[]> {
    const embeds: APIEmbed[] = [];

    for (const embed_structure of this.message.embeds) {
      const fields: APIEmbedField[] = [];

      for (const field_structure of embed_structure.fields) {
        const field = await field_structure.game.get_embed_field();
        if (field !== null) {
          fields.push(field);
        }
      }

      // Only include collections someone has played today. Games with no entries produce no
      // field, so an empty field list means nobody played anything in this collection.
      if (fields.length === 0) {
        continue;
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
