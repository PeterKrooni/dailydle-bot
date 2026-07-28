import { GameEntry } from '../database/schema.js';

const MEDALS = ['🥇', '🥈', '🥉'];

const PERFECT = '✨';

const FAILED = '💀';

/** Renders a stored score as it should read in the score column. */
export interface ScoreDisplay {
  (score: string): string;
}

/** Reads a stored score as a number for ranking. `NaN` always ranks last. */
export interface ScoreValue {
  (score: string): number;
}

export interface ScorePredicate {
  (score: string): boolean;
}

/** Sorts game entries, best result first. */
export interface ScoreSorter {
  (a: GameEntry, b: GameEntry): number;
}

/**
 * How a game's results are presented on the summary scoreboard. All optional - a game scored on one
 * number, lower being better, with no way to lose, needs none of it.
 */
export interface ScoreboardStyle {
  /** Defaults to the name entries are stored under, which is not always presentable. */
  title?: string;

  /** What the score measures, e.g. `guesses`, shown after the title. */
  unit?: string;

  /** Defaults to the score exactly as stored. */
  display?: ScoreDisplay;

  /** Marked with ✨. */
  is_perfect?: ScorePredicate;

  /** Marked with 💀, and never given a medal. */
  is_failed?: ScorePredicate;
}

/**
 * Reads the leading number of a score: `3/6` is three, `X/6` is `NaN`, `0,8,8` is zero, and
 * TimeGuessr's `44,123` is read whole rather than truncated at the comma.
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

/** Ranks unreadable scores last, whichever direction is sorted in. */
function compare(x: number, y: number, direction: number): number {
  if (isNaN(x)) {
    return isNaN(y) ? 0 : 1;
  }
  return isNaN(y) ? -1 : (x - y) * direction;
}

/** Builds the heading of a scoreboard, e.g. `Wordle · guesses`. */
export function render_heading(
  style: ScoreboardStyle,
  fallback_title: string,
): string {
  const title = style.title ?? fallback_title;

  return style.unit ? `${title} · ${style.unit}` : title;
}

/**
 * Renders one scoreboard row per entry, e.g. ``🥇 `3/6` [Jørgen](…)``. `entries` must already be
 * sorted best first, as rank comes from position in the list.
 *
 * Scores are padded inside inline code to line up as a column - it is the only monospace Discord
 * offers that still renders a link beside it, and padding only the front keeps Discord from
 * stripping it.
 */
export function render_rows(
  entries: GameEntry[],
  style: ScoreboardStyle,
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
    // Entries showing the same score share a rank.
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

    return `${render_rank(rank, failed)} ${score} ${render_user_link(entry)}${marker}`;
  });
}

/** A medal, or a plain number once the medals run out. */
function render_rank(rank: number, failed: boolean): string {
  return !failed && rank <= MEDALS.length ? MEDALS[rank - 1] : `\`${rank}.\``;
}

/** Links the player's name to the message they shared their score in. */
function render_user_link(entry: GameEntry): string {
  const message_url = `https://discord.com/channels/${entry.server_id}/${entry.channel_id}/${entry.message_id}`;

  return `[${render_user(entry)}](${message_url})`;
}

function render_user(entry: GameEntry): string {
  return entry.user.server_name ?? entry.user.name;
}
