import { EmbedField } from 'discord.js';
import { GameEntry, GameEntryModel } from '../database/schema.js';
import { get_today } from '../../util.js';

/**
 * A function that sorts game entries.
 */
export interface ScoreSorter {
  (a: GameEntry, b: GameEntry): number;
}

/**
 * A function that formats a score for display in a message embed.
 *
 * @param {string} user_link - A username formatted with a link to their game entry message.
 * @param {string} score - Their score.
 */
export interface ScoreFormatter {
  (user_link: string, score: string): string;
}

/**
 * Default score sorter. Sorts in ascending order, with letters after numbers.
 */
export const DEFAULT_SCORE_SORTER: ScoreSorter = (
  a: GameEntry,
  b: GameEntry,
) => {
  const x = parseInt(a.score);
  const y = parseInt(b.score);
  return isNaN(x) ? 1 : isNaN(y) ? -1 : x - y;
};

/**
 * Default score formatter. Returns `<user_link> : <score>`.
 */
export const DEFAULT_SCORE_FORMATTER: ScoreFormatter = (
  user_link: string,
  score: string,
) => `${user_link} : ${score}`;

/**
 * Formatter responsible for generating an embed field for a game.
 */
export class EmbedFieldFormatter {
  private name: string;
  private score_sorter: ScoreSorter;
  private score_formatter: ScoreFormatter;
  private max_entries?: number;

  /**
   * Initializes an `EmbedFieldFormatter`.
   *
   * @param {string} name - The name of the game, used as the title of the embed field.
   * @param {ScoreSorter} [score_sorter=DEFAULT_SCORE_SORTER] - Score sorting function for
   * displaying top entries.
   * @param {ScoreFormatter} [score_formatter=DEFAULT_SCORE_FORMATTER] - Score formatting function
   * for displaying game entries.
   * @param {number} [max_entries=5] - Optional. The maximum entries to show in the field, the
   * remainder being displayed as `+N`.
   */
  constructor(
    name: string,
    score_sorter: ScoreSorter = DEFAULT_SCORE_SORTER,
    score_formatter: ScoreFormatter = DEFAULT_SCORE_FORMATTER,
    max_entries: number = 5,
  ) {
    this.name = name;
    this.score_sorter = score_sorter;
    this.score_formatter = score_formatter;
    this.max_entries = max_entries;
  }

  /**
   * Generates an embed field.
   *
   * @param {boolean} [inline=true] - Whether the embed field should be inline.
   * @returns {Promise<EmbedField>} The embed field.
   */
  public async get_embed_field(
    inline: boolean = true,
  ): Promise<EmbedField | null> {
    let entries = await GameEntryModel.find({
      game: this.name,
      createdAt: { $gte: get_today() },
    }).exec();
    entries.sort(this.score_sorter);

    // Handle max entries. If `max_entries` is set, slice the array and
    // save the remainder so we can use it later to append a `+ N` to
    // the end of the field.
    let remainder = 0;
    if (this.max_entries !== undefined) {
      remainder = entries.length - this.max_entries;
      entries = entries.slice(0, this.max_entries);
    }

    if (entries.length === 0) {
      return null;
    }

    let value = entries
      .map((e) => {
        const message_url = `https://discord.com/channels/${e.server_id}/${e.channel_id}/${e.message_id}`;
        const user = `[${e.user.server_name ?? e.user.name}](${message_url})`;
    
        return this.score_formatter(user, e.score)
      })
      .join('\n');

    // Add remainder if applicable
    if (remainder > 0) {
      value += `\n+ ${remainder}`;
    }

    return {
      name: this.name,
      value: value,
      inline: inline,
    };
  }
}
