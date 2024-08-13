import { GameBuilder } from '../core/builders/game_builder.js';
import { MatchType } from '../core/message_parser.js';

const GAMEDLE_DEFAULT_ATTEMPTS = 6;
const GAMEDLE_GUESS_ATTEMPTS = 10;

export const Classic = new GameBuilder('Gamedle (Classic)')
  .set_matcher(/Gamedle:\s(\d{2}\/\d{2}\/\d{4})\s(.*)\s?>/, [MatchType.Day, MatchType.Score])
  .set_score_parser(match => match.split('⬜').reduce((sum,line)=>sum - (line===''? 1 : 0), GAMEDLE_DEFAULT_ATTEMPTS).toString())
  .set_responder(entry => `${entry.user.server_name ?? entry.user.name} ${entry.score}`)
  .build();

export const Artwork = new GameBuilder('Gamedle (Artwork)')
.set_matcher(/Gamedle \(Artwork mode\):\s(\d{2}\/\d{2}\/\d{4})\s(.*)\s?>/, [MatchType.Day, MatchType.Score])
.set_score_parser(match => match.split('⬜').reduce((sum,line)=>sum - (line===''? 1 : 0), GAMEDLE_DEFAULT_ATTEMPTS).toString())
.build();

export const Keywords = new GameBuilder('Gamedle (Keywords)')
.set_matcher(/Gamedle \(keywords mode\):\s(\d{2}\/\d{2}\/\d{4})\s(.*)\s?>/, [MatchType.Day, MatchType.Score])
.set_score_parser(match => match.split('⬜').reduce((sum,line)=>sum - (line===''? 1 : 0), GAMEDLE_DEFAULT_ATTEMPTS).toString())
.build();

export const Guess = new GameBuilder('Gamedle (Guess)')
.set_matcher(/Gamedle \(keywords mode\):\s(\d{2}\/\d{2}\/\d{4})\s(.*)\s?>/, [MatchType.Day, MatchType.Score])
.set_score_parser(match => match.split('⬜').reduce((sum,line)=>sum - (line===''? 1 : 0), GAMEDLE_GUESS_ATTEMPTS).toString())
.build();

export const Description: string = `Daily games from Gamedle:
[Classic](https://www.gamedle.wtf/classic) | \
[Artwork](https://www.gamedle.wtf/artwork) | \
[Keywords](https://www.gamedle.wtf/keywords) | \
[Guess](https://www.gamedle.wtf/guess)`;
