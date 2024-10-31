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
  schema_version: string
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
    schema_version: { type: String, default: "2" },
  },
  { timestamps: true },
);

export const GameEntryModel = model('GameEntry', schema);
