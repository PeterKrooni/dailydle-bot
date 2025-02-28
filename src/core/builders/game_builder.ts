import {
  EmbedFieldFormatter,
  ScoreFormatter,
  ScoreSorter,
} from '../embeds/embed_formatter.js';
import { Game, Responder } from '../game.js';
import { MatchParser, MatchType, MessageParser } from '../message_parser.js';

/**
 * Game builder. Builds a Game :)
 */
export class GameBuilder {
  private name?: string;

  private message_parsers: MessageParser[] = [];
  private regex?: RegExp;
  private match_order?: MatchType[];
  private day_id_parser?: MatchParser;
  private score_parser?: MatchParser;

  private formatter?: EmbedFieldFormatter;
  private score_sorter?: ScoreSorter;
  private score_formatter?: ScoreFormatter;
  private max_entries?: number;

  private responder?: Responder;

  /**
   * Initializes a Game builder
   * @param {string?} name - Optional. The name of the game.
   */
  constructor(name?: string) {
    this.name = name;
  }

  /**
   * Sets the name of the game.
   */
  set_name(name: string): GameBuilder {
    this.name = name;
    return this;
  }

  /**
   * Sets the message parser used for handling incoming Discord messages.
   *
   * If the message parser is set, `set_matcher`, `set_day_id_parser` and
   * `set_score_parser` can be ignored.
   */
  add_message_parser(message_parser: MessageParser): GameBuilder {
    this.message_parsers.push(message_parser);
    return this;
  }

  /**
   * Sets the regex and order of matches for a game. Used to build a `MessageParser`.
   *
   * @param {RegExp} regex - The regex used to match a Discord message's content.
   * @param {MatchType[]} match_order - The order in which matches of specific types appear.
   *
   * @example
   * // For the string "ab", "a" will be matched as the Day, and "b" as the Score.
   * builder.set_matcher(/^(a)(b)$/, [MatchType.Day, MatchType.Score]);
   */
  set_matcher(regex: RegExp, match_order: MatchType[]): GameBuilder {
    this.regex = regex;
    this.match_order = match_order;
    return this;
  }

  /**
   * Sets the Day ID parser, used for preformatting a Day extracted from a Discord message.
   * Used to build a `MessageParser`.
   *
   */
  set_day_id_parser(day_id_parser: MatchParser): GameBuilder {
    this.day_id_parser = day_id_parser;
    return this;
  }

  /**
   * Sets the Score parser, used for preformatting a score extracted from a Discord message.
   * Used to build a `MessageParser`.
   */
  set_score_parser(score_parser: MatchParser): GameBuilder {
    this.score_parser = score_parser;
    return this;
  }

  /**
   * Sets the `EmbedFieldFormatter` for this game.
   */
  set_formatter(formatter: EmbedFieldFormatter): GameBuilder {
    this.formatter = formatter;
    return this;
  }

  /**
   * Sets the score sorter used for displaying high-scores in an embed field.
   */
  set_score_sorter(score_sorter: ScoreSorter): GameBuilder {
    this.score_sorter = score_sorter;
    return this;
  }

  /**
   * Sets the formatter used for displaying a user and their score in the embed field.
   */
  set_embed_field_score_formatter(
    score_formatter: ScoreFormatter,
  ): GameBuilder {
    this.score_formatter = score_formatter;
    return this;
  }

  /**
   * Sets the maximum game entries allowed for a embed field.
   */
  set_max_embed_field_entries(max_entries: number): GameBuilder {
    this.max_entries = max_entries;
    return this;
  }

  /**
   * Sets the responder used for replying to valid game entries.
   */
  set_responder(responder: Responder): GameBuilder {
    this.responder = responder;
    return this;
  }

  /**
   * Builds a game.
   *
   * @returns {Game}
   * @throws If the Game's name is undefined.
   * @throws If the Game's regex or match order are undefined.
   */
  build(): Game {
    if (this.name === undefined) {
      throw new Error('Game name must have a value.');
    }

    return new Game(
      this.name,
      this.build_message_parsers(),
      this.build_formatter(),
      this.responder,
    );
  }

  private build_message_parsers(): MessageParser[] {
    if (this.message_parsers.length > 0) {
      return this.message_parsers;
    }

    // If `message_parsers` length is 0, we just build 1 parser below:
    if (this.name === undefined) {
      throw new Error('Game name must have a value.');
    }

    if (this.regex === undefined) {
      throw new Error('Game regex must have a value');
    }

    if (this.match_order === undefined) {
      throw new Error('Game regex match order must have a value');
    }

    return [
      new MessageParser(
        this.name,
        this.regex,
        this.match_order,
        this.day_id_parser,
        this.score_parser,
      ),
    ];
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
      this.max_entries,
    );
  }
}

export default GameBuilder;
