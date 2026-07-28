import { GameBuilder } from '../core/builders/game_builder.js';
import { ScoreboardStyle } from '../core/embeds/scoreboard.js';
import { Responder } from '../core/game.js';
import { MatchParser, MatchType } from '../core/message_parser.js';

const GAMEDLE_DEFAULT_ATTEMPTS = 6;
const GAMEDLE_GUESS_ATTEMPTS = 10;

function gamedle_score_parser(max_attempts: number): MatchParser {
  return (match) =>
    match
      .split('⬜')
      .reduce((sum, line) => sum - (line === '' ? 1 : 0), max_attempts)
      .toString();
}

/**
 * Every Gamedle mode counts guesses against a cap, and a score at the cap means the game was never
 * guessed. Modes are titled without the `Gamedle` prefix, which the embed around them already says.
 */
function gamedle_scoreboard(
  title: string,
  max_attempts: number,
): ScoreboardStyle {
  return {
    title: title,
    unit: 'guesses',
    display: (score) => `${score}/${max_attempts}`,
    is_perfect: (score) => score === '1',
    is_failed: (score) => Number(score) >= max_attempts,
  };
}

function gamedle_responder(max_attempts: number): Responder {
  return (entry) =>
    `${entry.user.server_name ?? entry.user.name} ${Number(entry.score) < max_attempts ? 'did' : 'failed'} ${entry.game} with ${entry.score} attempts.`;
}

export const Classic = new GameBuilder('Gamedle (Classic)')
  .set_matcher(/Gamedle:\s(\d{2}\/\d{2}\/\d{4})\s(.*)\s?>/, [
    MatchType.Day,
    MatchType.Score,
  ])
  .set_score_parser(gamedle_score_parser(GAMEDLE_DEFAULT_ATTEMPTS))
  .set_scoreboard(gamedle_scoreboard('Classic', GAMEDLE_DEFAULT_ATTEMPTS))
  .set_responder(gamedle_responder(GAMEDLE_DEFAULT_ATTEMPTS))
  .build();

export const Artwork = new GameBuilder('Gamedle (Artwork)')
  .set_matcher(/Gamedle \(Artwork mode\):\s(\d{2}\/\d{2}\/\d{4})\s(.*)\s?>/, [
    MatchType.Day,
    MatchType.Score,
  ])
  .set_score_parser(gamedle_score_parser(GAMEDLE_DEFAULT_ATTEMPTS))
  .set_scoreboard(gamedle_scoreboard('Artwork', GAMEDLE_DEFAULT_ATTEMPTS))
  .set_responder(gamedle_responder(GAMEDLE_DEFAULT_ATTEMPTS))
  .build();

export const Keywords = new GameBuilder('Gamedle (Keywords)')
  .set_matcher(/Gamedle \(keywords mode\):\s(\d{2}\/\d{2}\/\d{4})\s(.*)\s?>/, [
    MatchType.Day,
    MatchType.Score,
  ])
  .set_score_parser(gamedle_score_parser(GAMEDLE_DEFAULT_ATTEMPTS))
  .set_scoreboard(gamedle_scoreboard('Keywords', GAMEDLE_DEFAULT_ATTEMPTS))
  .set_responder(gamedle_responder(GAMEDLE_DEFAULT_ATTEMPTS))
  .build();

export const Guess = new GameBuilder('Gamedle (Guess)')
  .set_matcher(/Gamedle \(Guess mode\):\s(\d{2}\/\d{2}\/\d{4})\s(.*)\s?>/, [
    MatchType.Day,
    MatchType.Score,
  ])
  .set_score_parser(gamedle_score_parser(GAMEDLE_GUESS_ATTEMPTS))
  .set_scoreboard(gamedle_scoreboard('Guess', GAMEDLE_GUESS_ATTEMPTS))
  .set_responder(gamedle_responder(GAMEDLE_GUESS_ATTEMPTS))
  .build();

export const Description: string = `Daily games from Gamedle:
[Classic](https://www.gamedle.wtf/classic) | \
[Artwork](https://www.gamedle.wtf/artwork) | \
[Keywords](https://www.gamedle.wtf/keywords) | \
[Guess](https://www.gamedle.wtf/guess)`;

/** Purple, after the site's header. */
export const Color: number = 0x9b5de5;
