import { GameBuilder } from '../core/builders/game_builder.js';
import { highest_first, numeric } from '../core/embeds/scoreboard.js';
import { MatchType, MessageParser } from '../core/message_parser.js';

/** Points on offer across a daily round. */
const TIMEGUESSR_MAX_POINTS = 50_000;

/** From here up, a round went well enough to be worth marking. */
const TIMEGUESSR_GREAT_SCORE = 45_000;

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
  // Scored on points, so the biggest number wins. Scores are stored with their thousands separator,
  // which `numeric` reads through.
  .set_score_sorter(highest_first())
  .set_scoreboard({
    // The maximum belongs in the heading rather than repeated on every row.
    unit: `points / ${TIMEGUESSR_MAX_POINTS.toLocaleString('en-GB')}`,
    is_perfect: (score) => numeric(score) >= TIMEGUESSR_GREAT_SCORE,
  })
  .set_responder((entry) => {
    const parsedScore = Number.parseInt(entry.score.split(',')[0]);
    if (parsedScore > 40) {
      if (parsedScore >= 45) {
        return `⭐ ${entry.user.server_name ?? entry.user.name} did TimeGuessr #${entry.day_id} with score ${entry.score} ⭐`;
      }
      return `${entry.user.server_name ?? entry.user.name} did TimeGuessr #${entry.day_id} with score ${entry.score} 🔥`;
    }
    return `${entry.user.server_name ?? entry.user.name} did TimeGuessr #${entry.day_id} with score ${entry.score}.`;
  })
  .build();

export const Description: string = `Play today's TimeGuessr game:
[TimeGuessr](https://timeguessr.com)`;

/** Sepia, for a game about old photographs. */
export const Color: number = 0xc08552;
