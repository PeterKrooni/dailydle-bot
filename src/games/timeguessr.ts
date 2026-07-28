import { GameBuilder } from '../core/builders/game_builder.js';
import { highest_first, numeric } from '../core/embeds/scoreboard.js';
import { MatchType, MessageParser } from '../core/message_parser.js';

const TIMEGUESSR_MAX_POINTS = 50_000;

const TIMEGUESSR_GREAT_SCORE = 45_000;

const TIMEGUESSR_GOOD_SCORE = 40_000;

export const TimeGuessr = new GameBuilder('TimeGuessr')
  .add_message_parser(
    new MessageParser(
      'TimeGuessr',
      /^TimeGuessr #(\d{1,5}) ([0-9]{1,3}(?:,[0-9]{3})?)\/50,000/,
      [MatchType.Day, MatchType.Score],
      (day) => day.trim(),
      (score) => score.trim(),
    ),
  )
  .set_score_sorter(highest_first())
  .set_scoreboard({
    unit: `points / ${TIMEGUESSR_MAX_POINTS.toLocaleString('en-GB')}`,
    is_perfect: (score) => numeric(score) >= TIMEGUESSR_GREAT_SCORE,
  })
  .set_responder((entry) => {
    // `numeric` reads the score through its thousands separator - `parseInt` alone would take
    // `44,123` as 44, and a sub-1000 score as a number in the tens of thousands.
    const points = numeric(entry.score);
    const user = entry.user.server_name ?? entry.user.name;

    if (points >= TIMEGUESSR_GREAT_SCORE) {
      return `⭐ ${user} did TimeGuessr #${entry.day_id} with score ${entry.score} ⭐`;
    }
    if (points >= TIMEGUESSR_GOOD_SCORE) {
      return `${user} did TimeGuessr #${entry.day_id} with score ${entry.score} 🔥`;
    }
    return `${user} did TimeGuessr #${entry.day_id} with score ${entry.score}.`;
  })
  .build();

export const Description: string = `Play today's TimeGuessr game:
[TimeGuessr](https://timeguessr.com)`;

/** Sepia, for a game about old photographs. */
export const Color: number = 0xc08552;
