import {
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Message } from 'discord.js';
import { GameEntryModel } from '../core/database/schema.js';
import { Bybandle } from '../games/bybandle.js';

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
}, 60_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await GameEntryModel.deleteMany({});
});

/** A minimal Discord message carrying `content`, with replies swallowed. */
const message = (content: string) =>
  ({
    content,
    id: '1234567890123456789',
    guildId: '1234567890123456781',
    author: { id: 'user-1', displayName: 'Player' },
    member: { displayName: 'Player' },
    channel: { id: '1234567890123456780', send: async () => undefined },
  }) as unknown as Message;

describe('Bybandle share text', () => {
  test('parses the original ISO date format', async () => {
    const entry = await Bybandle.handle_message(
      message('Bybandle 2026-06-07 2/3\n🟠—🟢—⚪'),
    );

    expect(entry?.day_id).toBe('2026-06-07');
    expect(entry?.score).toBe('2/3');
  });

  test('parses the Norwegian date format and stores the day id as ISO', async () => {
    const entry = await Bybandle.handle_message(
      message('Bybandle 07.06.2026 2/3\n🟠—🟢—⚪'),
    );

    expect(entry?.day_id).toBe('2026-06-07');
    expect(entry?.score).toBe('2/3');
  });

  test('parses a loss in the Norwegian date format', async () => {
    const entry = await Bybandle.handle_message(
      message('Bybandle 07.06.2026 X/3\n🟠—🟠—🟠'),
    );

    expect(entry?.day_id).toBe('2026-06-07');
    expect(entry?.score).toBe('X/3');
  });
});
