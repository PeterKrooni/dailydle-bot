import { Message } from 'discord.js';
import { GameEntryBuilder } from './builders/game_entry_builder.js';
import { GameEntry } from './database/schema.js';

export enum MatchType {
  Undefined,
  Day,
  Score,
}

export interface MatchParser {
  (match: string): string;
}

export const DEFAULT_MATCH_PARSER: MatchParser = (match) => match;

export interface ParseSpec {
  regex: RegExp;
  ordering: MatchType[];

  game_type: string;
  day_id: (match: string) => string;
  score: (match: string) => string;
}

export class MessageParser {
  name: string;
  private regex: RegExp;
  private match_order: MatchType[];
  private day_id_parser: MatchParser;
  private score_parser: MatchParser;

  constructor(
    name: string,
    regex: RegExp,
    match_order: MatchType[],
    day_id_parser: MatchParser = DEFAULT_MATCH_PARSER,
    score_parser: MatchParser = DEFAULT_MATCH_PARSER
  ) {
    this.name = name;
    this.regex = regex;
    this.match_order = match_order;
    this.day_id_parser = day_id_parser;
    this.score_parser = score_parser;
  }

  parse_message(message: Message): GameEntry | null {
    const matches = message.content.match(this.regex);
    if (matches === null) {
      return null;
    }

    let entry_builder = new GameEntryBuilder(this.name).set_metadata(message);

    for (const [idx, match_type] of this.match_order.entries()) {
      // We offset indices below by `1` as `string.match` returns the entire string in idx `0`:
      switch (match_type) {
        case MatchType.Undefined:
          continue;
        case MatchType.Day:
          entry_builder.set_day_id(this.day_id_parser(matches[idx + 1]));
          break;
        case MatchType.Score:
          entry_builder.set_score(this.score_parser(matches[idx + 1]));
          break;
      }
    }

    return entry_builder.build();
  }
}
