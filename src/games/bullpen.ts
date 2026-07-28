import { GameBuilder } from '../core/builders/game_builder.js';
import { ScoreboardStyle } from '../core/embeds/scoreboard.js';
import { MatchType, MessageParser } from '../core/message_parser.js';
import { seconds_to_clock } from '../util.js';

export const Description: string = `Daily games from Bullpen:
Available on App store / Google play`;

export const Color: number = 0xe76f51;

/** Solve times are shared as `mm:ss`, or as `1.2s` when under a minute. */
const parse_time = (score: string): string =>
  score.includes(':')
    ? String(Number(score.split(':')[0]) * 60 + Number(score.split(':')[1]))
    : score;

const display_time = (score: string): string => {
  if (/^\d+$/.test(score)) {
    return seconds_to_clock(score);
  }

  const seconds = parseFloat(score);

  return isNaN(seconds) ? score : `0:${seconds.toFixed(1).padStart(4, '0')}`;
};

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
