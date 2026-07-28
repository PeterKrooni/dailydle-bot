import { GameEntry } from '../database/schema.js';

/**
 * Awarded to the first three ranks of a scoreboard.
 */
const MEDALS = ['🥇', '🥈', '🥉'];

/**
 * Appended to a flawless result.
 */
const PERFECT = '✨';

/**
 * Appended to a result that never solved the puzzle.
 */
const FAILED = '💀';

/**
 * Renders a stored score as it should read in a scoreboard's score column.
 *
 * Scores are stored as whatever was easiest to parse out of a shared result - seconds for timed
 * games, `hints,words,total` for Strands - so this is where a game turns storage into something
 * worth looking at.
 */
export interface ScoreDisplay {
  (score: string): string;
}

/**
 * Reads a stored score as a number so it can be ranked. `NaN` ranks last, whichever direction the
 * scoreboard sorts in, which is how unsolved puzzles end up at the bottom.
 */
export interface ScoreValue {
  (score: string): number;
}

/**
 * Answers a yes/no question about a stored score, e.g. whether it solved the puzzle.
 */
export interface ScorePredicate {
  (score: string): boolean;
}

/**
 * A function that sorts game entries, best result first.
 */
export interface ScoreSorter {
  (a: GameEntry, b: GameEntry): number;
}

/**
 * How a game's results are presented on the summary scoreboard.
 *
 * Everything is optional: a game that scores plainly - one number, lower is better, no way to lose
 * - needs none of it.
 */
export interface ScoreboardStyle {
  /**
   * Heading of the scoreboard. Defaults to the name the game's entries are stored under, which is
   * not always presentable - `GlobleCapitals`, `🌱 Bullpen`.
   */
  title?: string;

  /**
   * What the score measures, e.g. `guesses`, shown after the title. Without it a bare number on a
   * scoreboard is a guess at whether more or less of it is better.
   */
  unit?: string;

  /**
   * Renders the score column. Defaults to the score exactly as stored.
   */
  display?: ScoreDisplay;

  /**
   * Whether a score is flawless, and so worth an ✨.
   */
  is_perfect?: ScorePredicate;

  /**
   * Whether a score failed to solve the puzzle. Those get a 💀 and never take a medal, so that a
   * day where everybody failed does not crown a winner.
   */
  is_failed?: ScorePredicate;
}

/**
 * Reads the leading number of a score.
 *
 * Handles the shapes games actually store: `3/6` is three, `X/6` is `NaN`, `0,8,8` is zero, and
 * thousands separators in a score like TimeGuessr's `44,123` are read as one number rather than
 * truncated at the comma.
 */
export const numeric: ScoreValue = (score) =>
  parseFloat(score.replace(/,(?=\d{3}(?:\D|$))/g, ''));

/**
 * Sorts entries by score, lowest first - guesses, mistakes, moves, solve times.
 *
 * @param {ScoreValue} [value=numeric] - Reads the number to sort on out of a stored score.
 */
export const lowest_first =
  (value: ScoreValue = numeric): ScoreSorter =>
  (a, b) =>
    compare(value(a.score), value(b.score), 1);

/**
 * Sorts entries by score, highest first - points, correct answers.
 *
 * @param {ScoreValue} [value=numeric] - Reads the number to sort on out of a stored score.
 */
export const highest_first =
  (value: ScoreValue = numeric): ScoreSorter =>
  (a, b) =>
    compare(value(a.score), value(b.score), -1);

/**
 * Compares two score values in the given direction, ranking unreadable scores last either way.
 */
function compare(x: number, y: number, direction: number): number {
  if (isNaN(x)) {
    return isNaN(y) ? 0 : 1;
  }
  return isNaN(y) ? -1 : (x - y) * direction;
}

/**
 * Builds the heading of a scoreboard, e.g. `Wordle · guesses`.
 *
 * @param {ScoreboardStyle} style - The game's scoreboard style.
 * @param {string} fallback_title - Title to use when the style does not name one.
 */
export function render_heading(
  style: ScoreboardStyle,
  fallback_title: string,
): string {
  const title = style.title ?? fallback_title;

  return style.unit ? `${title} · ${style.unit}` : title;
}

/**
 * Renders one scoreboard row per entry, e.g. ``🥇 `3/6` [Jørgen](…)``.
 *
 * `entries` must already be sorted best first - rank comes from position in the list, and entries
 * showing the same score share a rank.
 *
 * Scores are padded to a common width inside inline code so they line up as a column. Inline code
 * is the only monospace Discord offers that still renders a link next to it, and padding on the
 * front only keeps the padding from being stripped as code fence padding.
 *
 * @param {GameEntry[]} entries - Today's entries for one game, best first.
 * @param {ScoreboardStyle} style - How this game's scores are presented.
 * @param {boolean} [links=true] - Whether names link to the message the score was shared in. The
 * link is most of a row's length, so a summary too big for Discord gives these up - see
 * `LAYOUT_PREFERENCES`.
 * @returns {string[]} One rendered row per entry, in the same order.
 */
export function render_rows(
  entries: GameEntry[],
  style: ScoreboardStyle,
  links: boolean = true,
): string[] {
  if (entries.length === 0) {
    return [];
  }

  const display = style.display ?? ((score: string) => score);
  const scores = entries.map((entry) => display(entry.score));
  const width = Math.max(...scores.map((score) => score.length));

  let rank = 0;
  let previous_score: string | undefined;

  return entries.map((entry, index) => {
    // Position in the list is the rank, except for entries showing the same score as the one above
    // them, which keep that entry's rank.
    if (scores[index] !== previous_score) {
      rank = index + 1;
      previous_score = scores[index];
    }

    const failed = style.is_failed?.(entry.score) ?? false;
    const marker = failed
      ? ` ${FAILED}`
      : style.is_perfect?.(entry.score)
        ? ` ${PERFECT}`
        : '';

    const score = `\`${scores[index].padStart(width)}\``;
    const user = links ? render_user_link(entry) : render_user(entry);

    return `${render_rank(rank, failed)} ${score} ${user}${marker}`;
  });
}

/**
 * Renders a rank as a medal, or as a plain number once the medals run out.
 */
function render_rank(rank: number, failed: boolean): string {
  return !failed && rank <= MEDALS.length ? MEDALS[rank - 1] : `\`${rank}.\``;
}

/**
 * Renders a player's name as a link to the message their score was shared in.
 */
function render_user_link(entry: GameEntry): string {
  const message_url = `https://discord.com/channels/${entry.server_id}/${entry.channel_id}/${entry.message_id}`;

  return `[${render_user(entry)}](${message_url})`;
}

/**
 * Renders a player's name.
 */
function render_user(entry: GameEntry): string {
  return entry.user.server_name ?? entry.user.name;
}
