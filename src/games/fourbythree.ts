import { GameBuilder } from '../core/builders/game_builder.js';
import { highest_first } from '../core/embeds/scoreboard.js';
import { MatchType, MessageParser } from '../core/message_parser.js';

/**
 * Shared 4x3 results look like this:
 *
 * ```
 * 27 July 2026
 * 121 points • 1 mistake
 * 🌟🟦🟦
 * 🟨🟪🌟
 * 🟨🌟🟨
 * 🟩🌟🟩
 * 🟪🌟🟪
 * https://4x3.fun
 * ```
 *
 * The first line is the puzzle date, localized by the browser the score was shared from. The
 * summary line holds the point total, or `Out of guesses` when the puzzle was not solved, followed
 * by `No mistakes`, `<n> mistake(s)` or `RULE BREAKER 💀` (letting the shared word go last every
 * guess, which is worth -100 points). Every following row is one guess of three words, where 🌟 is
 * the word shared by all four categories.
 */
const REGEX_4X3 =
  /^(.+)\n((?:-?\d+ points|Out of guesses) • (?:\d+ mistakes?|No mistakes|RULE BREAKER 💀))\n(?:[🌟🟦🟩🟨⬜🟪]{3}\n)+https:\/\/4x3\.fun/mu;

/** Score of a puzzle that was not solved. 4x3 only awards points for a solve. */
const NO_POINTS = 'X';

/** Mistake count of a rule breaker result, which does not share how many mistakes were made. */
const RULE_BREAKER = 'RULE BREAKER';

/**
 * Normalizes the localized puzzle date to `YYYY-MM-DD`. Dates in a locale we cannot parse fall back
 * to today, as a shared result is virtually always today's puzzle.
 */
const parse_day_id = (date: string): string => {
  const parsed = new Date(date);
  const day = isNaN(parsed.valueOf()) ? new Date() : parsed;

  return [
    day.getFullYear(),
    String(day.getMonth() + 1).padStart(2, '0'),
    String(day.getDate()).padStart(2, '0'),
  ].join('-');
};

/**
 * Turns the summary line into a `<points>,<mistakes>` score, e.g. `121,1`.
 */
const parse_score = (summary: string): string => {
  const [points, mistakes] = summary.split(' • ');

  return [
    points === 'Out of guesses' ? NO_POINTS : points.replace(' points', ''),
    mistakes.startsWith(RULE_BREAKER)
      ? RULE_BREAKER
      : mistakes === 'No mistakes'
        ? '0'
        : parseInt(mistakes).toString(),
  ].join(',');
};

const points_of = (score: string): string => score.split(',')[0];
const mistakes_of = (score: string): string => score.split(',')[1];

export const FourByThree = new GameBuilder('4x3')
  .add_message_parser(
    new MessageParser(
      '4x3',
      REGEX_4X3,
      [MatchType.Day, MatchType.Score],
      parse_day_id,
      parse_score,
    ),
  )
  // Scored on points, so the biggest number wins. An unsolved puzzle scores `X` and ranks last.
  .set_score_sorter(highest_first())
  .set_scoreboard({
    unit: 'points',
    display: points_of,
    is_perfect: (score) =>
      points_of(score) !== NO_POINTS && mistakes_of(score) === '0',
    is_failed: (score) =>
      points_of(score) === NO_POINTS || mistakes_of(score) === RULE_BREAKER,
  })
  .set_responder((entry) => {
    const user = entry.user.server_name ?? entry.user.name;
    const points = points_of(entry.score);
    const mistakes = mistakes_of(entry.score);

    if (mistakes === RULE_BREAKER) {
      return `${user} broke the rules on 4x3 ${entry.day_id}, scoring ${points} points 💀`;
    }
    if (points === NO_POINTS) {
      return `${user} ran out of guesses on 4x3 ${entry.day_id} after ${mistakes} mistakes`;
    }
    if (mistakes === '0') {
      return `⭐ ${user} got ✨perfect✨ on 4x3 ${entry.day_id} with ${points} points ⭐`;
    }
    return `${user} did 4x3 ${entry.day_id} with ${points} points and ${mistakes} mistake${mistakes === '1' ? '' : 's'}`;
  })
  .build();

export const Description: string = `Daily 4x3 puzzle by Hank Green:
[Play 4x3](https://4x3.fun/)`;

/** Gold, after the 🌟 shared word. */
export const Color: number = 0xfacc15;
