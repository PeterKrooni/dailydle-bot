import { GameBuilder } from '../core/builders/game_builder.js';
import { MatchType } from '../core/message_parser.js';

export const Bybandle = new GameBuilder('Bybandle')
  .set_matcher(/Bybandle (\d{4}-\d{2}-\d{2}) ([\dX]\/\d)/, [
    MatchType.Day,
    MatchType.Score,
  ])
  .set_scoreboard({
    unit: 'guesses',
    is_perfect: (score) => score.startsWith('1/'),
    is_failed: (score) => score.startsWith('X'),
  })
  .set_responder((entry) => {
    const user = entry.user.server_name ?? entry.user.name;
    if (entry.score.startsWith('X')) {
      return `${user} did not recognize the Bybandle jingle for ${entry.day_id}`;
    }
    return `${user} scored ${entry.score} on Bybandle ${entry.day_id}`;
  })
  .build();

export const Description: string = `Guess today's Bergen light rail jingle:
[Bybandle](https://bybandle-production.up.railway.app)`;

export const Color: number = 0x005aa7;
