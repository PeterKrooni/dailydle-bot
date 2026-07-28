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
import { EmbedMessage, ScoreCollection } from './embed_types.js';
import {
  LAYOUT_PREFERENCES,
  Scoreboard,
  ScoreboardLayout,
} from './embed_formatter.js';

/**
 * Discord's limit on the combined character count of every embed in one message.
 *
 * The summary is sized to fit this rather than built blindly, because a message over the limit is
 * rejected outright - which on the busiest day of the year would mean no summary at all.
 */
const MAX_MESSAGE_EMBED_LENGTH = 6000;

/**
 * Discord's limit on how many embeds one message may carry.
 */
const MAX_MESSAGE_EMBEDS = 10;

/**
 * Characters held back from the budget for each embed's footer.
 */
const FOOTER_ALLOWANCE = 48;

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

    const embeds = await this.get_embeds();
    const content =
      typeof this.message.content === 'string'
        ? this.message.content
        : this.message.content();

    const payload = {
      // With no scoreboards to show there is nothing to explain the empty message, so say it.
      content:
        embeds.length === 0 && this.message.empty
          ? `${content}\n\n${this.message.empty}`
          : content,
      embeds: embeds,
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
    const played = await this.load_played_collections();
    if (played.length === 0) {
      return [];
    }

    const layout = fit_layout(played);
    const embeds: APIEmbed[] = [];
    let budget = MAX_MESSAGE_EMBED_LENGTH;

    for (const { collection, scoreboards } of played) {
      const fields: APIEmbedField[] = [];
      const players = new Set<Snowflake>();
      let entries = 0;

      budget -= collection.title.length + collection.description.length;

      for (const { scoreboard, inline } of scoreboards) {
        const rendered = scoreboard.render(
          inline,
          layout,
          budget - FOOTER_ALLOWANCE,
        );

        if (rendered === null) {
          continue;
        }

        fields.push(rendered.field);
        rendered.players.forEach((player) => players.add(player));
        entries += rendered.entries;
        budget -= rendered.field.name.length + rendered.field.value.length;
      }

      // A collection whose scoreboards all got squeezed out contributes nothing but a title.
      if (fields.length === 0) {
        continue;
      }

      const footer =
        collection.footer ?? render_participation(players.size, entries);
      budget -= footer.length;

      const embed = new EmbedBuilder()
        .setTitle(collection.title)
        .setDescription(collection.description)
        .addFields(fields)
        .setFooter({ text: footer });

      if (collection.color !== undefined) {
        embed.setColor(collection.color);
      }

      embeds.push(embed.data);
    }

    return embeds;
  }

  /**
   * Loads every scoreboard with entries today, dropping the collections nobody played.
   *
   * Each game is one database query, and they are independent, so they go out together rather than
   * one after another - the button this runs behind is waiting on all of them.
   */
  private async load_played_collections(): Promise<PlayedCollection[]> {
    const collections = await Promise.all(
      this.message.embeds.map(async (collection) => ({
        collection: collection,
        scoreboards: (
          await Promise.all(
            collection.fields.map(async (field) => {
              const scoreboard = await field.game.load_scoreboard();

              return scoreboard === null
                ? null
                : { scoreboard: scoreboard, inline: field.inline };
            }),
          )
        ).filter((board): board is PlayedScoreboard => board !== null),
      })),
    );

    // Only collections someone played today, and only as many embeds as Discord will carry in one
    // message - anything past that is dropped before it can eat into the character budget.
    return collections
      .filter((collection) => collection.scoreboards.length > 0)
      .slice(0, MAX_MESSAGE_EMBEDS);
  }
}

/**
 * A score collection with at least one game played today.
 */
interface PlayedCollection {
  collection: ScoreCollection;
  scoreboards: PlayedScoreboard[];
}

interface PlayedScoreboard {
  scoreboard: Scoreboard;
  inline: boolean;
}

/**
 * Picks the best layout from `LAYOUT_PREFERENCES` that fits inside Discord's embed budget.
 *
 * Every scoreboard is laid out the same way, which is what keeps a busy day fair: spending the
 * budget on whichever collections happen to come first would show the New York Times in full and
 * drop 4x3 entirely. Cutting all of them back instead leaves every game someone played on the
 * summary.
 *
 * @returns {ScoreboardLayout} The layout to render in, falling back to the smallest one, in which
 * case rendering trims from the end as a last resort.
 */
function fit_layout(played: PlayedCollection[]): ScoreboardLayout {
  const fits = LAYOUT_PREFERENCES.find(
    (layout) => measure(played, layout) <= MAX_MESSAGE_EMBED_LENGTH,
  );

  return fits ?? LAYOUT_PREFERENCES[LAYOUT_PREFERENCES.length - 1];
}

/**
 * Counts the characters the summary would take up in the given layout.
 */
function measure(played: PlayedCollection[], layout: ScoreboardLayout): number {
  return played.reduce(
    (total, { collection, scoreboards }) =>
      total +
      collection.title.length +
      collection.description.length +
      FOOTER_ALLOWANCE +
      scoreboards.reduce((sum, { scoreboard, inline }) => {
        const rendered = scoreboard.render(inline, layout);
        return (
          sum +
          (rendered
            ? rendered.field.name.length + rendered.field.value.length
            : 0)
        );
      }, 0),
    0,
  );
}

/**
 * Renders a collection's footer, e.g. `3 players · 7 entries`.
 *
 * Says how much of the collection was actually played, which the scoreboards themselves cannot -
 * a scoreboard only shows the games someone got round to.
 */
function render_participation(players: number, entries: number): string {
  return `${players} ${players === 1 ? 'player' : 'players'} · ${entries} ${
    entries === 1 ? 'entry' : 'entries'
  }`;
}
