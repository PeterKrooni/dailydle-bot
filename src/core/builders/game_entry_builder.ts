import { Message } from 'discord.js';
import { GameEntry } from '../database/schema.js';

export class GameEntryBuilder {
  private entry: any;

  constructor(game?: string) {
    this.entry = {
      game: game,
      day_id: undefined,
      score: undefined,
      user: {
        id: undefined,
        name: undefined,
        server_name: undefined,
      },
      message_id: undefined,
      channel_id: undefined,
      content: undefined,
    };
  }

  set_metadata(message: Message): GameEntryBuilder {
    this.entry = {
      ...this.entry,
      user: {
        id: message.author.id,
        name: message.author.displayName,
        server_name: message.member?.displayName,
      },
      message_id: message.id,
      channel_id: message.channel.id,
      server_id: message.guildId,
      content: message.content,
    };
    return this;
  }

  set_game(game: string): GameEntryBuilder {
    this.entry.game = game;
    return this;
  }

  set_day_id(day_id: string): GameEntryBuilder {
    this.entry.day_id = day_id;
    return this;
  }

  set_score(score: string): GameEntryBuilder {
    this.entry.score = score;
    return this;
  }

  build(): GameEntry {
    // Return a copy of private entry:
    return { ...this.entry };
  }
}

export default GameEntryBuilder;
