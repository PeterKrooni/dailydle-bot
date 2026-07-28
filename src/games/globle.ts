import { GameBuilder } from '../core/builders/game_builder.js';
import { ScoreboardStyle } from '../core/embeds/scoreboard.js';
import { MatchType, MessageParser } from '../core/message_parser.js';

/**
 * Both Globles are won by naming the country in as few guesses as possible, and getting it on the
 * first guess is a genuine fluke worth marking.
 */
const globle_scoreboard = (title: string): ScoreboardStyle => ({
  title: title,
  unit: 'guesses',
  is_perfect: (score) => score === '1',
});

export const Globle = new GameBuilder('Globle')
  .add_message_parser(
    new MessageParser(
      'Globle',
      /(\w{3} \d{1,2}, \d{4})[\s\S]*?=\s*(\d+)[\s\S]*?#globle(\s+)?$/,
      [MatchType.Day, MatchType.Score],
      (match) => match,
      (match) => match,
    ),
  )
  .set_scoreboard(globle_scoreboard('Globle'))
  .set_responder((entry) => {
    return `${entry.user.server_name ?? entry.user.name} did Globle for ${entry.day_id} with score ${entry.score}.`;
  })
  .build();

export const GlobleCapitals = new GameBuilder('GlobleCapitals')
  .add_message_parser(
    new MessageParser(
      'GlobleCapitals',
      /(\w{3} \d{1,2}, \d{4})[\s\S]*?=\s*(\d+)[\s\S]*?#globle\s+#capitals/,
      [MatchType.Day, MatchType.Score],
      (match) => match,
      (match) => match,
    ),
  )
  .set_scoreboard(globle_scoreboard('Capitals'))
  .set_responder((entry) => {
    return `${entry.user.server_name ?? entry.user.name} did Globle (capitals) for ${entry.day_id} with score ${entry.score}.`;
  })
  .build();

export const Description: string = `Daily games from Globle:
[Globle](https://globle-game.com/) | \
[Globle Capitals](https://globle-capitals.com/)`;

/** Teal, after the site's ocean. */
export const Color: number = 0x14b8a6;
