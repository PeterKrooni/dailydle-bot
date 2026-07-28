import { GameBuilder } from '../core/builders/game_builder.js';
import { ScoreboardStyle } from '../core/embeds/scoreboard.js';
import { MatchType, MessageParser } from '../core/message_parser.js';
import { seconds_to_clock } from '../util.js';

export const Description: string = `Daily games from Bullpen:
Available on App store / Google play`;

/** Burnt orange, after the app's icon. */
export const Color: number = 0xe76f51;

/**
 * Turns a shared solve time into seconds. Times under a minute are shared as `1.2s` and kept as
 * they are, since they carry a precision whole seconds would throw away.
 */
const parse_time = (score: string): string =>
  score.includes(':')
    ? String(Number(score.split(':')[0]) * 60 + Number(score.split(':')[1]))
    : score;

/**
 * Renders a stored solve time as a clock, whether it was stored as whole seconds or as a shared
 * sub-minute time like `5.1s`. Both end up on the same scoreboard, so both have to read the same
 * way - the tenths a fast solve was shared with are kept, since they are what separates one from
 * the next.
 */
const display_time = (score: string): string => {
  if (/^\d+$/.test(score)) {
    return seconds_to_clock(score);
  }

  const seconds = parseFloat(score);

  return isNaN(seconds) ? score : `0:${seconds.toFixed(1).padStart(4, '0')}`;
};

/**
 * Both difficulties are timed, and share a scoreboard style.
 */
const bullpen_scoreboard = (title: string): ScoreboardStyle => ({
  title: title,
  unit: 'time',
  display: display_time,
});

export const BullpenEasy = new GameBuilder('BullpenEasy')
  .add_message_parser(
    new MessageParser(
      '🌱 Bullpen',
      /Bullpen — ([0-9]{1,2}\. [a-zæøå]+\. \d{4})\s*🌱 Lett: Løst på (?![Ii]ngen tid\.?$)((?:\d+(?::\d{2})?|\d+\.\ds))/,
      [MatchType.Day, MatchType.Score],
      (date) => date,
      parse_time,
    ),
  )
  .set_scoreboard(bullpen_scoreboard('🌱 Lett'))
  .set_responder((entry) => {
    return `${entry.user.server_name ?? entry.user.name} did 🌱 Bullpen for ${entry.day_id} with score ${entry.score}.`;
  })
  .build();

export const BullpenHard = new GameBuilder('BullpenHard')
  .add_message_parser(
    new MessageParser(
      '🔥 Bullpen',
      /Bullpen — ([0-9]{1,2}\. [a-zæøå]+\. \d{4})[\s\S]*?🔥 Vanskelig: Løst på (?![Ii]ngen tid\.?$)((?:\d+(?::\d{2})?|\d+(?:\.\d+)?s))/,
      [MatchType.Day, MatchType.Score],
      (date) => date,
      parse_time,
    ),
  )
  .set_scoreboard(bullpen_scoreboard('🔥 Vanskelig'))
  .set_responder((entry) => {
    return `${entry.user.server_name ?? entry.user.name} did 🔥 Bullpen for ${entry.day_id} with score ${entry.score}.`;
  })
  .build();
