import Game from '../game.js';

/**
 * An a single field entry in a score collection.
 * Example: 
 */
export interface ScoreField {
  game: Game;
  inline: boolean;
}

/**
 * A collection of field entries, with related title and description data.
 */
export interface ScoreCollection {
  title: string;
  description: string;
  fields: ScoreField[];
  footer?: string;
}

/**
 * Represents a basic Discord message with content and embeds.
 */
export interface EmbedMessage {
  content: string | (() => string);
  embeds: ScoreCollection[];
}
