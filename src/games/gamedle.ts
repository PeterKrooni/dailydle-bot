import { GameBuilder } from '../core/builders/game_builder.js';
import { MatchType } from '../core/message_parser.js';

export const Classic = new GameBuilder('Gamedle (Classic)')
  .set_matcher(
    /Gamedle\s{0,1}(?:|\((\w+) mode\)): (\d{2}\/\d{2}\/\d{4}) (.*) >/,
    [MatchType.Day]
  )
  .build();

export const Artwork = new GameBuilder('Gamedle (Artwork)').build();

export const Keywords = new GameBuilder('Gamedle (Keywords)').build();

export const Guess = new GameBuilder('Gamedle (Guess)').build();

export const Description: string = `Daily games from Gamedle:
[Classic](https://www.gamedle.wtf/classic) | \
[Artwork](https://www.gamedle.wtf/artwork) | \
[Keywords](https://www.gamedle.wtf/keywords) | \
[Guess](https://www.gamedle.wtf/guess)`;
