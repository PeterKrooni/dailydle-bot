import { GameBuilder } from '../core/builders/game_builder.js';
import { highest_first } from '../core/embeds/scoreboard.js';
import { MatchType, MessageParser } from '../core/message_parser.js';

const FOODGUESSR_PLATES = 10;

export const FoodGuessr = new GameBuilder('FoodGuessr')
  .add_message_parser(
    new MessageParser(
      'FoodGuessr',
      /^I got (\d{1,2})\/10 on today's FoodGuessr Plate-Off!/,
      [MatchType.Score],
      undefined,
      (score) => score.trim(),
    ),
  )
  .set_score_sorter(highest_first())
  .set_scoreboard({
    unit: 'correct',
    display: (score) => `${score}/${FOODGUESSR_PLATES}`,
    is_perfect: (score) => Number(score) === FOODGUESSR_PLATES,
  })
  .set_responder((entry) => {
    return Number(entry.score) === FOODGUESSR_PLATES
      ? `⭐ ${entry.user.server_name ?? entry.user.name} achieved a perfect score on FoodGuessr! ⭐`
      : `${entry.user.server_name ?? entry.user.name} did FoodGuessr with score ${entry.score}/${FOODGUESSR_PLATES}.`;
  })
  .build();

export const Description: string = `Daily FoodGuessr Plate-Off game:
[Play FoodGuessr](https://www.foodguessr.com/game/plate-off/daily)`;

export const Color: number = 0xef476f;
