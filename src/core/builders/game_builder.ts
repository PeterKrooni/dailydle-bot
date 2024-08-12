import {
  EmbedFieldFormatter,
  ScoreFormatter,
  ScoreSorter,
} from '../embed_formatter.js';
import { Game, Responder } from '../game.js';
import { MatchParser, MatchType, MessageParser } from '../message_parser.js';

/**
 * Game builder. Builds a Game :)
 */
export class GameBuilder {
  private name?: string;

  private message_parser?: MessageParser;
  private regex?: RegExp;
  private match_order?: MatchType[];
  private day_id_parser?: MatchParser;
  private score_parser?: MatchParser;

  private formatter?: EmbedFieldFormatter;
  private score_sorter?: ScoreSorter;
  private score_formatter?: ScoreFormatter;
  private max_entries?: number;

  private responder?: Responder;

  constructor(name?: string) {
    this.name = name;
  }

  set_name(name: string): GameBuilder {
    this.name = name;
    return this;
  }

  set_message_parser(message_parser: MessageParser): GameBuilder {
    this.message_parser = message_parser;
    return this;
  }

  set_matcher(regex: RegExp, match_order: MatchType[]): GameBuilder {
    this.regex = regex;
    this.match_order = match_order;
    return this;
  }

  set_day_id_parser(day_id_parser: MatchParser): GameBuilder {
    this.day_id_parser = day_id_parser;
    return this;
  }

  set_score_parser(score_parser: MatchParser): GameBuilder {
    this.score_parser = score_parser;
    return this;
  }

  set_formatter(formatter: EmbedFieldFormatter): GameBuilder {
    this.formatter = formatter;
    return this;
  }

  set_score_sorter(score_sorter: ScoreSorter): GameBuilder {
    this.score_sorter = score_sorter;
    return this;
  }

  set_embed_field_score_formatter(
    score_formatter: ScoreFormatter
  ): GameBuilder {
    this.score_formatter = score_formatter;
    return this;
  }

  set_max_embed_field_entries(max_entries: number): GameBuilder {
    this.max_entries = max_entries;
    return this;
  }

  set_responder(responder: Responder): GameBuilder {
    this.responder = responder;
    return this;
  }

  build(): Game {
    return new Game(
      this.build_message_parser(),
      this.build_formatter(),
      this.responder
    );
  }

  private build_message_parser(): MessageParser {
    if (this.message_parser !== undefined) {
      return this.message_parser;
    }

    if (this.name === undefined) {
      throw new Error('Game name must have a value.');
    }

    if (this.regex === undefined) {
      throw new Error('Game regex must have a value');
    }

    if (this.match_order === undefined) {
      throw new Error('Game regex match order must have a value');
    }

    return new MessageParser(
      this.name,
      this.regex,
      this.match_order,
      this.day_id_parser,
      this.score_parser
    );
  }

  private build_formatter(): EmbedFieldFormatter {
    if (this.formatter !== undefined) {
      return this.formatter;
    }

    if (this.name === undefined)
      throw new Error('Game name must have a value.');

    return new EmbedFieldFormatter(
      this.name,
      this.score_sorter,
      this.score_formatter,
      this.max_entries
    );
  }
}
