import { GameBuilder } from '../core/builders/game_builder.js';
import { MatchType, MessageParser } from '../core/message_parser.js';

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
  .set_responder((entry) => {
    return entry.score === "10" ? `⭐ ${entry.user.server_name ?? entry.user.name} achieved a perfect score on FoodGuessr! ⭐`
      : `${entry.user.server_name ?? entry.user.name} did FoodGuessr with score ${entry.score}/10.`;
  })
  .set_embed_field_score_formatter(
    (user_link, score) => `${user_link}: ${score}/10`,
  )
  .build();

export const Description: string = `Daily FoodGuessr Plate-Off game:
[Play FoodGuessr](https://www.foodguessr.com/game/plate-off/daily)`;