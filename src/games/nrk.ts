import { GameBuilder } from '../core/builders/game_builder.js';
import { MatchType, MessageParser } from '../core/message_parser.js';


export const Tvers = new GameBuilder('Tvers') 
  .add_message_parser(
    new MessageParser(
      'Tvers',
      /(\d{1,4}) poeng i (dagens) Tvers!/,
      [MatchType.Score, MatchType.Day],
      () => new Date().toISOString().slice(0, 10),
      (match) => match,
    ),
  )
  .set_responder((entry) => {
    return `${entry.user.server_name ?? entry.user.name} did Tvers ${entry.day_id} with score ${entry.score}.`;
  })
  .set_embed_field_score_formatter(
    (user_link: any, score: any) => 
      `${user_link} : ${score}`,
  )
  .build();

export const Former = new GameBuilder('Former')
  .add_message_parser(
    new MessageParser(
      'Former',
      /Eg klarte (dagens) Former på (\d{1,3}) trekk!/,
      [MatchType.Day, MatchType.Score],
      () => new Date().toISOString().slice(0, 10),
      (match) => match,
    ),
  )
  .set_responder((entry) => {
    console.log('have entry: ', entry)
    const d = new Date();
    return `${entry.user.server_name ?? entry.user.name} did Former ${entry.day_id} in ${entry.score} moves.`;
  })
  .set_embed_field_score_formatter(
    (user_link: any, score: any) => 
      `${user_link} : ${score}`,
  )
  .build();

export const Description: string = `Daily games from Norsk Rikskringkasting (NRK):
[Tvers](https://www.nrk.no/spill/tvers) | \
[Former](https://www.nrk.no/spill/former)`;
