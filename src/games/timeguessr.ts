import { GameBuilder } from '../core/builders/game_builder.js';
import { MatchType, MessageParser } from '../core/message_parser.js';

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
  .set_responder((entry) => {
    const parsedScore = Number.parseInt(entry.score.split(",")[0]);
    if (parsedScore > 40) {
      if (parsedScore >= 45) {
        return `⭐ ${entry.user.server_name ?? entry.user.name} did TimeGuessr #${entry.day_id} with score ${entry.score} ⭐`;
      }
      return `${entry.user.server_name ?? entry.user.name} did TimeGuessr #${entry.day_id} with score ${entry.score} 🔥`;
    }
    return `${entry.user.server_name ?? entry.user.name} did TimeGuessr #${entry.day_id} with score ${entry.score}.`;
  })
  .set_embed_field_score_formatter(
    (user_link, score) => `${user_link}: ${score}/50000`,
  )
  .build();

export const Description: string = `Play today's TimeGuessr game:
[TimeGuessr](https://timeguessr.com)`;
