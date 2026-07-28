import Game from '../game.js';

/** One scoreboard in a score collection. */
export interface ScoreField {
  game: Game;
  inline: boolean;
}

/**
 * A collection of scoreboards for related games, e.g. everything from the New York Times.
 */
export interface ScoreCollection {
  title: string;
  description: string;
  fields: ScoreField[];

  /** Colour of the embed's left edge, as `0xRRGGBB`. */
  color?: number;

  /** Defaults to a count of who played, see `render_participation`. */
  footer?: string;
}

/**
 * Represents a basic Discord message with content and embeds.
 */
export interface EmbedMessage {
  content: string | (() => string);
  embeds: ScoreCollection[];

  /** Appended to `content` on a day with no scoreboards to show at all. */
  empty?: string;
}
