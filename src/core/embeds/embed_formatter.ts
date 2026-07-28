import { APIEmbedField, Snowflake } from 'discord.js';
import { GameEntry, GameEntryModel } from '../database/schema.js';
import { get_today } from '../../util.js';
import {
  lowest_first,
  render_heading,
  render_rows,
  ScoreboardStyle,
  ScoreSorter,
} from './scoreboard.js';

/** Discord's limit on the character count of a single embed field value. */
export const MAX_FIELD_VALUE_LENGTH = 1024;

/** Rows to show before the rest are summarized as `+ N more`. */
export const DEFAULT_MAX_ENTRIES = 10;

/** A rendered scoreboard, and what went into it. */
export interface ScoreboardField {
  field: APIEmbedField;
  players: Snowflake[];

  /** Entries on this scoreboard, counting any it had no room for. */
  entries: number;
}

/** Turns a game's entries from today into a scoreboard. */
export class EmbedFieldFormatter {
  private game_names: string[];
  private style: ScoreboardStyle;
  private score_sorter: ScoreSorter;
  private max_entries: number;

  /**
   * Initializes an `EmbedFieldFormatter`.
   *
   * @param {string[]} game_names - Names entries for this game are stored under. A game can have
   * more than one, as each of its message parsers names the entries it produces.
   * @param {ScoreboardStyle} [style={}] - How this game's scores are presented.
   * @param {ScoreSorter} [score_sorter=lowest_first()] - Ranks the entries, best result first.
   * @param {number} [max_entries=DEFAULT_MAX_ENTRIES] - Rows to show before the remainder is
   * summarized as `+ N more`.
   */
  constructor(
    game_names: string[],
    style: ScoreboardStyle = {},
    score_sorter: ScoreSorter = lowest_first(),
    max_entries: number = DEFAULT_MAX_ENTRIES,
  ) {
    this.game_names = game_names;
    this.style = style;
    this.score_sorter = score_sorter;
    this.max_entries = max_entries;
  }

  /**
   * Loads and ranks today's entries for this game.
   *
   * @returns {Promise<Scoreboard | null>} The scoreboard, or `null` if nobody played today.
   */
  public async load(): Promise<Scoreboard | null> {
    const entries = await GameEntryModel.find({
      game: { $in: this.game_names },
      createdAt: { $gte: get_today() },
    }).exec();

    if (entries.length === 0) {
      return null;
    }

    return new Scoreboard(
      render_heading(this.style, this.game_names[0]),
      this.style,
      [...entries].sort(this.score_sorter),
      this.max_entries,
    );
  }
}

/** One game's ranked entries for today, ready to be rendered as an embed field. */
export class Scoreboard {
  readonly heading: string;
  readonly entries: GameEntry[];
  private style: ScoreboardStyle;
  private max_entries: number;

  constructor(
    heading: string,
    style: ScoreboardStyle,
    entries: GameEntry[],
    max_entries: number,
  ) {
    this.heading = heading;
    this.style = style;
    this.entries = entries;
    this.max_entries = max_entries;
  }

  /**
   * Renders the scoreboard as an embed field.
   *
   * @param {boolean} inline - Whether the embed field should be inline.
   * @returns {ScoreboardField | null} The field, or `null` if there was not room for even one row.
   */
  public render(inline: boolean): ScoreboardField | null {
    const rows = render_rows(
      this.entries.slice(0, this.max_entries),
      this.style,
    );
    const value = fit_rows(rows, this.entries.length);

    if (value === null) {
      return null;
    }

    return {
      field: { name: this.heading, value: value, inline: inline },
      players: this.players,
      entries: this.entries.length,
    };
  }

  /** Discord user IDs of everyone with an entry on this scoreboard. */
  public get players(): Snowflake[] {
    return [...new Set(this.entries.map((entry) => entry.user.id))];
  }
}

/**
 * Joins as many rows as fit in one field, summarizing the rest as `+ N more`. Rows carry a link per
 * player, so ten can run past the field limit on their own.
 *
 * @returns {string | null} The field value, or `null` if there was not room for even one row.
 */
function fit_rows(rows: string[], total_entries: number): string | null {
  const shown: string[] = [];

  for (const row of rows) {
    if (
      render_value([...shown, row], total_entries).length >
      MAX_FIELD_VALUE_LENGTH
    ) {
      break;
    }
    shown.push(row);
  }

  return shown.length === 0 ? null : render_value(shown, total_entries);
}

/** Ends on a `+ N more` line if any entries are left out. */
function render_value(rows: string[], total_entries: number): string {
  const remainder = total_entries - rows.length;

  return (remainder > 0 ? [...rows, more_row(remainder)] : rows).join('\n');
}

/** Italic, not `-#` subtext - Discord does not render subtext inside embed fields. */
function more_row(remainder: number): string {
  return `*+ ${remainder} more*`;
}
