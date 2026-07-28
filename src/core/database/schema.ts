import { Snowflake } from 'discord.js';
import { Model, Schema, model } from 'mongoose';

export interface GameEntry {
  game: string;
  day_id: string;
  score: string;
  user: {
    id: Snowflake;
    name: string;
    server_name?: string;
  };
  message_id: Snowflake;
  channel_id: Snowflake;
  server_id: Snowflake;
  content?: string;
  schema_version: string;
}

const schema = new Schema<GameEntry, Model<GameEntry>>(
  {
    game: { type: String, required: true },
    day_id: { type: String, required: true },
    score: { type: String, required: true },
    user: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      server_name: String,
    },
    message_id: { type: String, required: true },
    channel_id: { type: String, required: true },
    server_id: { type: String, required: true },
    content: String,
    schema_version: { type: String, default: '2' },
  },
  { timestamps: true },
);

export const GameEntryModel = model('GameEntry', schema);

/**
 * The most recent game summary the bot posted in a channel.
 *
 * Tracked so that posting a new summary can clean up the one it replaces.
 */
export interface SummaryMessage {
  channel_id: Snowflake;

  /**
   * Every message the summary is made up of, in the order they were posted. A summary too big for
   * one message is split across several, and all of them have to be cleaned up together.
   */
  message_ids: Snowflake[];

  /**
   * Summaries tracked before they could span more than one message.
   *
   * @deprecated Read only, so rows written by an older version can still be cleaned up. New rows
   * use `message_ids`.
   */
  message_id?: Snowflake;
}

const summary_message_schema = new Schema<
  SummaryMessage,
  Model<SummaryMessage>
>(
  {
    channel_id: { type: String, required: true, unique: true },
    message_ids: { type: [String], default: [] },
    message_id: { type: String },
  },
  { timestamps: true },
);

export const SummaryMessageModel = model(
  'SummaryMessage',
  summary_message_schema,
);
