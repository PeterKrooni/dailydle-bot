import { GameBuilder } from '../core/builders/game_builder.js';
import { MatchType } from '../core/message_parser.js';
import { seconds_to_display_time } from '../util.js';

export const Wordle = new GameBuilder('Wordle')
  .set_matcher(/Wordle (\d+\s?,?\d+) ([1-6X]\/6)/, [
    MatchType.Day,
    MatchType.Score,
  ])
  .set_responder(
    (entry) =>
      `${entry.user.server_name ?? entry.user.name} scored ${entry.score} on Wordle ${entry.day_id}`
  )
  .build();

export const Connections = new GameBuilder('Connections')
  .set_matcher(/Connections\s\sPuzzle\s\#(\d+)\s([\uD83D\uDFE6-\uDFEA\s]+)/, [
    MatchType.Day,
    MatchType.Score,
  ])
  .set_score_parser((match) =>
    match
      .split('\n')
      .reduce(
        (sum, line) =>
          (sum +=
            new Set(
              line
                .trim()
                .split('\uD83D')
                .filter((n) => n !== '')
            ).size == 1
              ? 0
              : 1),
        0
      )
      .toString()
  )
  .set_responder(
    (entry) =>
      `${entry.user.server_name ?? entry.user.name} ${Number(entry.score) > 4 ? 'failed' : 'did'} Connections ${entry.day_id} with ${entry.score == '0' ? 'no' : entry.score} mistakes`
  )
  .build();

export const TheMini = new GameBuilder('The Mini')
  .set_matcher(/https:\/\/www\.nytimes\.com\/.*\?d=([\d-]+)&t=(\d+)/, [
    MatchType.Day,
    MatchType.Score,
  ])
  .set_responder(
    (entry) =>
      `${entry.user.server_name ?? entry.user.name} did The Mini in ${seconds_to_display_time(entry.score)}`
  )
  .set_embed_field_score_formatter((score) => seconds_to_display_time(score))
  .build();

export const Strands = new GameBuilder('Strands')
  .set_matcher(/Strands\s(#\d+)\s“.*”\s([💡🔵🟡\s]+)/, [
    MatchType.Day,
    MatchType.Score,
  ])
  .set_score_parser((match) => {
    const result = match.replace('\n', '');
    const hints = result.match(/💡/g)?.length ?? 0;
    const words = result.match(/[🔵🟡]/g)?.length ?? 0;

    return `${hints},${words - hints},${words}`;
  })
  .set_responder((entry) => {
    const hints = entry.score.split(',')[0];
    if (hints == '0') {
      return `${entry.user.server_name ?? entry.user.name} got 🌟perfect🌟 on Strands ${entry.day_id}`;
    }
    return `${entry.user.server_name ?? entry.user.name} did Strands ${entry.day_id} with ${hints} hints`;
  })
  .set_embed_field_score_formatter((score) =>
    score.split(',').slice(1).join(' / ')
  )
  .build();

export const Description: string = `Daily games from the New York Times:
[Wordle](https://www.nytimes.com/games/wordle) | \
[Connections](https://www.nytimes.com/games/connections) | \
[Mini Crossword](https://www.nytimes.com/crosswords/game/mini) | \
[Strands](https://www.nytimes.com/games/strands)`;
