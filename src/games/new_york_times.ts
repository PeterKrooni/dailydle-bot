import { GameBuilder } from '../core/builders/game_builder.js';
import { MatchType, MessageParser } from '../core/message_parser.js';
import { seconds_to_display_time } from '../util.js';

export const Wordle = new GameBuilder('Wordle')
  .set_matcher(/Wordle (\d+\s?,?\d+) ([1-6X]\/6)/, [
    MatchType.Day,
    MatchType.Score,
  ])
  .set_responder(
    (entry) =>
      `${entry.user.server_name ?? entry.user.name} scored ${entry.score} on Wordle ${entry.day_id}`,
  )
  .build();

export const Connections = new GameBuilder('Connections')
  .set_matcher(/Connections\sPuzzle\s#(\d+)\s([🟩🟨🟦🟪\s]+)/u, [
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
                .filter((n) => n !== ''),
            ).size == 1
              ? 0
              : 1),
        0,
      )
      .toString(),
  )
  .set_responder(
    (entry) =>
      `${entry.user.server_name ?? entry.user.name} 
    ${Number(entry.score) < 4 ? 'did' : 'failed'} Connections ${entry.day_id} 
    ${Number(entry.score) < 4 ? 'with' : 'after'} 
    ${entry.score == '0' ? 'no' : entry.score} mistakes`,
  )
  .build();

export const TheMini = new GameBuilder('The Mini')
  .add_message_parser(
    new MessageParser(
      'The Mini',
      /https:\/\/www\.nytimes\.com\/.*\?d=([\d-]+)&t=(\d+)/,
      [MatchType.Day, MatchType.Score],
    ),
  )
  .add_message_parser(
    new MessageParser(
      'The Mini',
      /I solved the (\d+\/\d+\/\d+) New York Times Mini Crossword in ([\d:]+)!/,
      [MatchType.Day, MatchType.Score],
      (match) => new Date(`${match}Z`).toISOString().slice(0, 10),
      (match) => {
        // Takes a display time input e.g. `1:23:59` and converts it to seconds.
        const HOUR_IN_SECONDS = 3600;
        const unit_constants = [1, 60];
        return match
          .split(':') // Split on `:`
          .map(Number) // Convert to integers
          .reverse() // Reverse order so we start with seconds
          .map((u, i) => u * (unit_constants.at(i) ?? HOUR_IN_SECONDS)) // Multiply by unit constant (second, minute, hour for everything else)
          .reduce((acc, v) => acc + v, 0) // Sum
          .toString(); // Return as string
      },
    ),
  )
  .set_responder(
    (entry) =>
      `${entry.user.server_name ?? entry.user.name} did The Mini in ${seconds_to_display_time(entry.score)}`,
  )
  .set_embed_field_score_formatter(
    (user_link: any, score: any) => `${user_link} : ${seconds_to_display_time(score)}`,
  )
  .build();

export const Strands = new GameBuilder('Strands')
  .set_matcher(/Strands\s(#\d+)\s“.*”\s([💡🔵🟡\s]+)/u, [
    MatchType.Day,
    MatchType.Score,
  ])
  .set_score_parser((match) => {
    const result = match.replace('\n', '');
    const hints = result.match(/💡/gu)?.length ?? 0;
    const words = result.match(/[🔵🟡]/gu)?.length ?? 0;

    return `${hints},${words - hints},${words}`;
  })
  .set_responder((entry) => {
    const hints = entry.score.split(',')[0];
    if (hints == '0') {
      return `${entry.user.server_name ?? entry.user.name} got ✨perfect✨ on Strands ${entry.day_id}`;
    }
    return `${entry.user.server_name ?? entry.user.name} did Strands ${entry.day_id} with ${hints} hints`;
  })
  .set_embed_field_score_formatter(
    (user_link: any, score: any) =>
      `${user_link} : ${score.split(',').slice(1).join('/')}`,
  )
  .build();

export const Description: string = `Daily games from the New York Times:
[Wordle](https://www.nytimes.com/games/wordle) | \
[Connections](https://www.nytimes.com/games/connections) | \
[Mini Crossword](https://www.nytimes.com/crosswords/game/mini) | \
[Strands](https://www.nytimes.com/games/strands)`;
