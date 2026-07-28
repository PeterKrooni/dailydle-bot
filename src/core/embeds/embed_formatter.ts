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

/**
 * Discord's limit on the character count of a single embed field value.
 */
export const MAX_FIELD_VALUE_LENGTH = 1024;

/**
 * Rows to show on a scoreboard before the rest are summarized as `+ N more`.
 */
export const DEFAULT_MAX_ENTRIES = 10;

/**
 * How much of a scoreboard to render.
 */
export interface ScoreboardLayout {
  /**
   * Rows to show at most.
   */
  rows: number;

  /**
   * Whether names link to the message the score was shared in.
   */
  links: boolean;
}

/**
 * Layouts to render the summary in, best first, falling through until one fits in the messages the
 * summary is allowed to span.
 *
 * A summary too big for one message is split across several before any of this applies, so the
 * first entry is what almost every day gets. These are for the day so busy that even splitting is
 * not enough. A player's name links to the message they shared their score in, and that link is
 * around five sixths of a row's length, so the links go first - deep scoreboards are worth more than
 * clickable names - and only then does the summary start showing fewer players.
 */
export const LAYOUT_PREFERENCES: ScoreboardLayout[] = [
  { rows: DEFAULT_MAX_ENTRIES, links: true },
  { rows: 6, links: true },
  { rows: 5, links: true },
  { rows: DEFAULT_MAX_ENTRIES, links: false },
  { rows: 6, links: false },
  { rows: 5, links: false },
  { rows: 3, links: false },
  { rows: 1, links: false },
];

/**
 * A rendered scoreboard, and what went into it.
 */
export interface ScoreboardField {
  /**
   * The scoreboard as an embed field.
   */
  field: APIEmbedField;

  /**
   * Discord user IDs of everyone with an entry on this scoreboard.
   */
  players: Snowflake[];

  /**
   * Number of entries on this scoreboard, counting any it had no room for.
   */
  entries: number;
}

/**
 * Formatter responsible for turning a game's entries from today into a scoreboard.
 */
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
   * Loading is separate from rendering so that the summary can see how much there is to show across
   * every game before it decides how many rows each scoreboard gets - see `Scoreboard.render`.
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

/**
 * One game's ranked entries for today, ready to be rendered as an embed field.
 */
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
   * @param {ScoreboardLayout} layout - How much of the scoreboard to render.
   * @param {number} budget - Characters the field value may take up.
   * @returns {ScoreboardField | null} The field, or `null` if there was not room for even one row.
   */
  public render(
    inline: boolean,
    layout: ScoreboardLayout,
    budget: number = MAX_FIELD_VALUE_LENGTH,
  ): ScoreboardField | null {
    const limit = Math.min(layout.rows, this.max_entries);
    const rows = render_rows(
      this.entries.slice(0, limit),
      this.style,
      layout.links,
    );
    const value = fit_rows(rows, this.entries.length, budget);

    if (value === null) {
      return null;
    }

    return {
      field: { name: this.heading, value: value, inline: inline },
      players: this.players,
      entries: this.entries.length,
    };
  }

  /**
   * Discord user IDs of everyone with an entry on this scoreboard.
   */
  public get players(): Snowflake[] {
    return [...new Set(this.entries.map((entry) => entry.user.id))];
  }
}

/**
 * Joins as many rows as fit in `budget`, summarizing everything left over as `+ N more`.
 *
 * Rows carry a link per player, so a busy day can run a scoreboard past what Discord accepts in a
 * field - and an embed Discord rejects means no summary at all. Trimming to fit keeps the top of
 * the scoreboard, which is the part worth reading.
 *
 * @returns {string | null} The field value, or `null` if there was not even room for one row.
 */
function fit_rows(
  rows: string[],
  total_entries: number,
  budget: number,
): string | null {
  const limit = Math.min(budget, MAX_FIELD_VALUE_LENGTH);
  const shown: string[] = [];

  for (const row of rows) {
    if (render_value([...shown, row], total_entries).length > limit) {
      break;
    }
    shown.push(row);
  }

  return shown.length === 0 ? null : render_value(shown, total_entries);
}

/**
 * Joins rows into a field value, ending on a `+ N more` line if any entries are left out.
 */
function render_value(rows: string[], total_entries: number): string {
  const remainder = total_entries - rows.length;

  return (remainder > 0 ? [...rows, more_row(remainder)] : rows).join('\n');
}

/**
 * Renders the line standing in for entries the scoreboard had no room for.
 *
 * `-#` is Discord's subtext markup, which renders this smaller and greyer than a real row.
 */
function more_row(remainder: number): string {
  return `-# + ${remainder} more`;
}
