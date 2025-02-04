import { GameBuilder } from '../core/builders/game_builder.js'
import { MatchType, MessageParser } from '../core/message_parser.js';

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
  .set_responder((entry) => {
    return `${entry.user.server_name ?? entry.user.name} did Globle for ${entry.day_id} with score ${entry.score}.`;
  })
  .set_embed_field_score_formatter(
    (user_link, score) => 
      `${user_link} : ${score}`,
  )
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
  .set_responder((entry) => {
    return `${entry.user.server_name ?? entry.user.name} did Globle (capitals) for ${entry.day_id} with score ${entry.score}.`;
  })
  .set_embed_field_score_formatter(
    (user_link, score) => 
      `${user_link} : ${score}`,
  )
  .build();

  export const Description: string = `Daily games from Globle:
  [Globle](https://globle-game.com/) | \
  [Globle Capitals](https://globle-capitals.com/)`;
  