import { GameBuilder } from '../core/builders/game_builder.js';
import { ScoreFormatter, ScoreSorter } from '../core/embed_formatter.js';
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

function gamedle_score_formatter(max_attempts: number): ScoreFormatter {
  return (user_link, score) =>
    `${user_link} : ${score === '1' ? '🌟' : Number(score) < max_attempts ? score : '💀'}`;
}

function gamedle_responder(max_attempts: number): Responder {
  return (entry) =>
    `${entry.user.server_name ?? entry.user.name} ${Number(entry.score) < max_attempts ? 'did' : 'failed'} ${entry.game} with ${entry.score} attempts.`;
}

const score_sorter: ScoreSorter = (a, b) => Number(a.score) - Number(b.score);

export const Classic = new GameBuilder('Gamedle (Classic)')
  .set_matcher(/Gamedle:\s(\d{2}\/\d{2}\/\d{4})\s(.*)\s?>/, [
    MatchType.Day,
    MatchType.Score,
  ])
  .set_score_parser(gamedle_score_parser(GAMEDLE_DEFAULT_ATTEMPTS))
  .set_embed_field_score_formatter(
    gamedle_score_formatter(GAMEDLE_DEFAULT_ATTEMPTS),
  )
  .set_responder(gamedle_responder(GAMEDLE_DEFAULT_ATTEMPTS))
  .build();

export const Artwork = new GameBuilder('Gamedle (Artwork)')
  .set_matcher(/Gamedle \(Artwork mode\):\s(\d{2}\/\d{2}\/\d{4})\s(.*)\s?>/, [
    MatchType.Day,
    MatchType.Score,
  ])
  .set_score_parser(gamedle_score_parser(GAMEDLE_DEFAULT_ATTEMPTS))
  .set_embed_field_score_formatter(
    gamedle_score_formatter(GAMEDLE_DEFAULT_ATTEMPTS),
  )
  .set_responder(gamedle_responder(GAMEDLE_DEFAULT_ATTEMPTS))
  .build();

export const Keywords = new GameBuilder('Gamedle (Keywords)')
  .set_matcher(/Gamedle \(keywords mode\):\s(\d{2}\/\d{2}\/\d{4})\s(.*)\s?>/, [
    MatchType.Day,
    MatchType.Score,
  ])
  .set_score_parser(gamedle_score_parser(GAMEDLE_DEFAULT_ATTEMPTS))
  .set_embed_field_score_formatter(
    gamedle_score_formatter(GAMEDLE_DEFAULT_ATTEMPTS),
  )
  .set_responder(gamedle_responder(GAMEDLE_DEFAULT_ATTEMPTS))
  .build();

export const Guess = new GameBuilder('Gamedle (Guess)')
  .set_matcher(/Gamedle \(Guess mode\):\s(\d{2}\/\d{2}\/\d{4})\s(.*)\s?>/, [
    MatchType.Day,
    MatchType.Score,
  ])
  .set_score_parser(gamedle_score_parser(GAMEDLE_GUESS_ATTEMPTS))
  .set_embed_field_score_formatter(
    gamedle_score_formatter(GAMEDLE_GUESS_ATTEMPTS),
  )
  .set_responder(gamedle_responder(GAMEDLE_GUESS_ATTEMPTS))
  .build();

export const Description: string = `Daily games from Gamedle:
[Classic](https://www.gamedle.wtf/classic) | \
[Artwork](https://www.gamedle.wtf/artwork) | \
[Keywords](https://www.gamedle.wtf/keywords) | \
[Guess](https://www.gamedle.wtf/guess)`;
