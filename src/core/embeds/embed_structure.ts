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
import { Scoreboard } from './embed_formatter.js';

/**
 * Discord's character limit, both on a single embed and on every embed in one message combined.
 *
 * A message over the limit is rejected outright, so a summary too big for one is split across as
 * many as it takes rather than cut down to fit. Collections are packed whole, so the only thing
 * splitting cannot rescue is a single embed over the limit - see the warning in `pack_messages`.
 */
const MAX_EMBED_LENGTH = 6000;

/** Discord's limit on how many embeds one message may carry. */
const MAX_MESSAGE_EMBEDS = 10;

/**
 * Represents a Discord message containing a summary of all game entries today.
 */
export class GameSummaryMessage {
  private message: EmbedMessage;

  /**
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

    // Whatever happens below, every message that made it out must be tracked - an untracked
    // message is invisible to cleanup and sits in the channel forever.
    const posted: Snowflake[] = [first.id];
    try {
      for (const embeds of messages.slice(1)) {
        const continuation = await interaction.followUp({ embeds: embeds });
        posted.push(continuation.id);
      }

      console.log(
        `Sent summary in ${posted.length} message(s) to ${interaction.member?.user.username ?? interaction.user.username}.`,
      );
    } finally {
      // Only once the new summary is up do we clear away the one it replaces.
      const replaced = await GameSummaryMessage.track_summary(
        interaction.channelId,
        posted,
      );
      await GameSummaryMessage.delete_replaced_summary(interaction, replaced);
    }
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
   * Builds the summary as a list of messages, each a list of embeds. Collections are rendered whole
   * and packed into as many messages as it takes, so nothing is trimmed to fit a boundary.
   *
   * @returns {Promise<APIEmbed[][]>} One list of embeds per message, or empty if nobody played.
   */
  private async build_messages(): Promise<APIEmbed[][]> {
    const played = await this.load_played_collections();

    return played.length === 0 ? [] : pack_messages(render_collections(played));
  }

  /**
   * Loads every scoreboard with entries today, dropping the collections nobody played. One query per
   * game, issued together rather than in sequence - the button press is waiting on all of them.
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

/** Renders one embed per played collection. */
function render_collections(played: PlayedCollection[]): APIEmbed[] {
  const embeds: APIEmbed[] = [];

  for (const { collection, scoreboards } of played) {
    const fields: APIEmbedField[] = [];
    const players = new Set<Snowflake>();
    let entries = 0;

    for (const { scoreboard, inline } of scoreboards) {
      const rendered = scoreboard.render(inline);

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
 * Fills each message up to Discord's limits before starting the next, keeping collections whole - an
 * embed goes entirely into one message or entirely into the next.
 */
function pack_messages(embeds: APIEmbed[]): APIEmbed[][] {
  const messages: APIEmbed[][] = [];
  let current: APIEmbed[] = [];
  let length = 0;

  for (const embed of embeds) {
    const embed_size = embed_length(embed);

    if (embed_size > MAX_EMBED_LENGTH) {
      console.warn(
        `Embed '${embed.title}' is ${embed_size} characters, over Discord's ${MAX_EMBED_LENGTH} limit for one embed. Splitting cannot help - the collection has too many games for one embed.`,
      );
    }

    const full =
      current.length >= MAX_MESSAGE_EMBEDS ||
      length + embed_size > MAX_EMBED_LENGTH;

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

/** Counts the characters Discord counts against an embed. */
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

/** Also reads rows written before summaries could span more than one message. */
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

/** Renders a collection's footer, e.g. `3 players · 7 entries`. */
function render_participation(players: number, entries: number): string {
  return `${players} ${players === 1 ? 'player' : 'players'} · ${entries} ${
    entries === 1 ? 'entry' : 'entries'
  }`;
}
