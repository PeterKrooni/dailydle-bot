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
 * A message over the limit is rejected outright, so a summary too big for one message is split
 * across several rather than cut down to fit.
 */
const MAX_MESSAGE_EMBED_LENGTH = 6000;

/**
 * Discord's limit on how many embeds one message may carry.
 */
const MAX_MESSAGE_EMBEDS = 10;

/**
 * Messages one summary may span before it starts leaving things out instead.
 *
 * Splitting is better than dropping content, but a summary that goes on for screens is its own kind
 * of unreadable - so past this many messages the layout gives something up instead, see
 * `LAYOUT_PREFERENCES`.
 */
const MAX_SUMMARY_MESSAGES = 3;

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
   * Sends the game summary as a reply to the given button interaction, then deletes the summary it
   * replaces - see `delete_replaced_summary`.
   *
   * A summary too big for one message continues into follow-up messages. The first goes out as the
   * reply to the button so the press is answered, and the rest follow it in order.
   *
   * The interaction is deferred before anything else, because building the summary hits the
   * database and Discord discards interactions that are not acknowledged within three seconds.
   *
   * @param {ButtonInteraction} interaction - The button interaction to reply to.
   */
  async send(interaction: ButtonInteraction) {
    await interaction.deferReply();

    const messages = await this.build_messages();
    const content =
      typeof this.message.content === 'string'
        ? this.message.content
        : this.message.content();

    const first = await interaction.editReply({
      // With no scoreboards to show there is nothing to explain the empty message, so say it.
      content:
        messages.length === 0 && this.message.empty
          ? `${content}\n\n${this.message.empty}`
          : content,
      embeds: messages[0] ?? [],
    });

    const posted: Snowflake[] = [first.id];
    for (const embeds of messages.slice(1)) {
      const continuation = await interaction.followUp({ embeds: embeds });
      posted.push(continuation.id);
    }

    console.log(
      `Sent summary in ${posted.length} message(s) to ${interaction.member?.user.username ?? interaction.user.username}.`,
    );

    // Only once the new summary is up do we clear away the one it replaces.
    const replaced = await GameSummaryMessage.track_summary(
      interaction.channelId,
      posted,
    );
    await GameSummaryMessage.delete_replaced_summary(interaction, replaced);
  }

  /**
   * Records `message_ids` as the current summary for `channel_id`, and returns the entry it
   * replaced - if any.
   *
   * The swap is a single atomic update so that two people clicking the summary button at the same
   * time cannot both claim, and both try to delete, the same previous summary.
   */
  private static async track_summary(
    channel_id: Snowflake,
    message_ids: Snowflake[],
  ): Promise<SummaryMessage | null> {
    return await SummaryMessageModel.findOneAndUpdate(
      { channel_id: channel_id },
      {
        $set: { channel_id: channel_id, message_ids: message_ids },
        // Clear the single-message field, so a row written by an older version is not left behind
        // pointing at a message this one has already accounted for.
        $unset: { message_id: '' },
      },
      { upsert: true },
    ).exec();
  }

  /**
   * Deletes a summary that has been replaced by a newer one, keeping a single summary per channel
   * per day. All of the replaced summary's messages go, not just the first.
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

    await Promise.all(
      replaced_message_ids(replaced).map((message_id) =>
        interaction.channel?.messages
          .fetch(message_id)
          .then((message) => message.delete())
          .catch((err) =>
            console.info(
              `Could not delete replaced summary message ${message_id}: ${err}`,
            ),
          ),
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

  /**
   * Builds the summary as a list of messages, each a list of embeds that fits what Discord accepts
   * in one message.
   *
   * Every collection is rendered whole and then packed into messages, so nothing is trimmed just to
   * make a message boundary work out. Only if the summary would still span more than
   * `MAX_SUMMARY_MESSAGES` does the layout start giving something up.
   *
   * @returns {Promise<APIEmbed[][]>} One list of embeds per message, or empty if nobody played.
   */
  private async build_messages(): Promise<APIEmbed[][]> {
    const played = await this.load_played_collections();
    if (played.length === 0) {
      return [];
    }

    for (const layout of LAYOUT_PREFERENCES) {
      const messages = pack_messages(render_collections(played, layout));

      if (messages.length <= MAX_SUMMARY_MESSAGES) {
        return messages;
      }
    }

    // Nothing fit, which takes more collections than this bot has games. Show what will fit in the
    // smallest layout and let the rest go.
    const smallest = LAYOUT_PREFERENCES[LAYOUT_PREFERENCES.length - 1];
    const messages = pack_messages(render_collections(played, smallest));
    console.warn(
      `Summary did not fit in ${MAX_SUMMARY_MESSAGES} messages; dropping ${messages.length - MAX_SUMMARY_MESSAGES} message(s) worth of collections.`,
    );

    return messages.slice(0, MAX_SUMMARY_MESSAGES);
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

    return collections.filter(
      (collection) => collection.scoreboards.length > 0,
    );
  }
}

/**
 * Renders one embed per played collection, at the given layout.
 */
function render_collections(
  played: PlayedCollection[],
  layout: ScoreboardLayout,
): APIEmbed[] {
  const embeds: APIEmbed[] = [];

  for (const { collection, scoreboards } of played) {
    const fields: APIEmbedField[] = [];
    const players = new Set<Snowflake>();
    let entries = 0;

    for (const { scoreboard, inline } of scoreboards) {
      const rendered = scoreboard.render(inline, layout);

      if (rendered === null) {
        continue;
      }

      fields.push(rendered.field);
      rendered.players.forEach((player) => players.add(player));
      entries += rendered.entries;
    }

    if (fields.length === 0) {
      continue;
    }

    const embed = new EmbedBuilder()
      .setTitle(collection.title)
      .setDescription(collection.description)
      .addFields(fields)
      .setFooter({
        text: collection.footer ?? render_participation(players.size, entries),
      });

    if (collection.color !== undefined) {
      embed.setColor(collection.color);
    }

    embeds.push(embed.data);
  }

  return embeds;
}

/**
 * Packs embeds into messages, filling each one up to Discord's limits before starting the next.
 *
 * Collections are kept whole: an embed goes entirely into one message or entirely into the next.
 */
function pack_messages(embeds: APIEmbed[]): APIEmbed[][] {
  const messages: APIEmbed[][] = [];
  let current: APIEmbed[] = [];
  let length = 0;

  for (const embed of embeds) {
    const embed_size = embed_length(embed);
    const full =
      current.length >= MAX_MESSAGE_EMBEDS ||
      length + embed_size > MAX_MESSAGE_EMBED_LENGTH;

    if (full && current.length > 0) {
      messages.push(current);
      current = [];
      length = 0;
    }

    current.push(embed);
    length += embed_size;
  }

  if (current.length > 0) {
    messages.push(current);
  }

  return messages;
}

/**
 * Counts the characters Discord counts against an embed.
 */
function embed_length(embed: APIEmbed): number {
  return (
    (embed.title?.length ?? 0) +
    (embed.description?.length ?? 0) +
    (embed.footer?.text.length ?? 0) +
    (embed.fields ?? []).reduce(
      (total, field) => total + field.name.length + field.value.length,
      0,
    )
  );
}

/**
 * Every message a tracked summary was made up of, including rows written before summaries could
 * span more than one message.
 */
function replaced_message_ids(replaced: SummaryMessage): Snowflake[] {
  if (replaced.message_ids?.length) {
    return replaced.message_ids;
  }

  return replaced.message_id ? [replaced.message_id] : [];
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
