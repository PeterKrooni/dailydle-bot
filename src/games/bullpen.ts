import { GameBuilder } from '../core/builders/game_builder.js';
import { MatchType, MessageParser } from '../core/message_parser.js';

export const Description: string = `Daily games from Bullpen:
Available on App store / Google play`;

export const BullpenEasy = new GameBuilder('BullpenEasy')
  .add_message_parser(
    new MessageParser(
      'BullpenEasy',
      /Bullpen — ([0-9]{1,2}\. [a-zæøå]+\. \d{4})\s*🌱 Lett: Løst på (?![Ii]ngen tid\.?$)((?:\d+(?::\d{2})?|\d+\.\ds))/,
      [MatchType.Day, MatchType.Score],
      (date) => date,
      (score) =>
        score.includes(":")
          ? (String)((Number)(score.split(":")[0])*60 + (Number)(score.split(":")[1]))
          : score
    )
  )
  .set_matcher(
    /Bullpen — ([0-9]{1,2}\. [a-zæøå]+\. \d{4})\s*🌱 Lett: Løst på (?![Ii]ngen tid\.?$)((?:\d+(?::\d{2})?|\d+\.\ds))/,
    [MatchType.Day, MatchType.Score]
  )
  .set_responder((entry) => {
    return `${entry.user.server_name ?? entry.user.name} did 🌱 Bullpen for ${entry.day_id} with score ${entry.score}.`;
  })
  .set_embed_field_score_formatter(
    (user_link: any, score: any) =>
      `${user_link} : ${score}`,
  )
  .build();

export const BullpenHard = new GameBuilder('BullpenHard')
  .add_message_parser(
    new MessageParser(
      'BullpenHard',
      /Bullpen — ([0-9]{1,2}\. [a-zæøå]+\. \d{4})[\s\S]*?🔥 Vanskelig: Løst på (?![Ii]ngen tid\.?$)((?:\d+(?::\d{2})?|\d+(?:\.\d+)?s))/,
      [MatchType.Day, MatchType.Score],
      (date) => date,
      (score) =>
        score.includes(":")
          ? (String)((Number)(score.split(":")[0])*60 + (Number)(score.split(":")[1]))
          : score
    )
  )
  .set_responder((entry) => {
    return `${entry.user.server_name ?? entry.user.name} did 🔥 Bullpen for ${entry.day_id} with score ${entry.score}.`;
  })
  .set_embed_field_score_formatter(
    (user_link: any, score: any) =>
      `${user_link} : ${score}`,
  )
  .build();

