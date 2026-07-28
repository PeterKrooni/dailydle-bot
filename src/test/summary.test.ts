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
import { GameSummaryMessage } from '../core/embeds/embed_structure.js';
import {
  GameEntryModel,
  SummaryMessageModel,
} from '../core/database/schema.js';
import { GameBuilder } from '../core/builders/game_builder.js';
import { MatchType } from '../core/message_parser.js';

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
  await SummaryMessageModel.deleteMany({});
});

/** A minimal game whose parser name matches `name`, so seeded entries are found. */
const game = (name: string) =>
  new GameBuilder(name)
    .set_matcher(/^$/, [MatchType.Day, MatchType.Score])
    .build();

/** A summary of `n` single-game collections, enough alike to app.ts to exercise the same paths. */
const summary_of = (n: number) =>
  new GameSummaryMessage({
    content: 'header',
    empty: 'nothing yet',
    embeds: Array.from({ length: n }, (_, i) => ({
      title: `Collection ${i}`,
      description: `Games in collection ${i}`,
      fields: [{ game: game(`Game${i}`), inline: true }],
    })),
  });

const seed = (game: string, user: string, days_ago: number = 0) => {
  const at = new Date();
  at.setDate(at.getDate() - days_ago);
  return {
    game,
    day_id: '1',
    score: '3',
    user: {
      id: `id-${user}`,
      name: user,
      server_name: `${user}-${'n'.repeat(40)}`,
    },
    message_id: '1234567890123456789',
    channel_id: '1234567890123456780',
    server_id: '1234567890123456781',
    schema_version: '2',
    createdAt: at,
    updatedAt: at,
  };
};

const build = (summary: GameSummaryMessage) =>
  (summary as any).build_messages() as Promise<any[][]>;

const embed_length = (e: any): number =>
  (e.title?.length ?? 0) +
  (e.description?.length ?? 0) +
  (e.footer?.text.length ?? 0) +
  (e.fields ?? []).reduce(
    (t: number, f: any) => t + f.name.length + f.value.length,
    0,
  );

describe('build_messages', () => {
  test('shows nothing when nobody played', async () => {
    expect(await build(summary_of(3))).toEqual([]);
  });

  test("only shows games played today, not yesterday's", async () => {
    await GameEntryModel.insertMany([
      seed('Game0', 'A'),
      seed('Game1', 'B', 1),
      seed('Game2', 'C', 1),
    ]);

    const messages = await build(summary_of(3));
    const embeds = messages.flat();

    expect(embeds).toHaveLength(1);
    expect(embeds[0].title).toBe('Collection 0');
  });

  test('fits a quiet day in a single message', async () => {
    await GameEntryModel.insertMany([seed('Game0', 'A'), seed('Game1', 'B')]);

    expect(await build(summary_of(3))).toHaveLength(1);
  });

  test('splits a busy day across messages without dropping a played game', async () => {
    const users = Array.from({ length: 10 }, (_, u) => `User${u}`);
    await GameEntryModel.insertMany(
      Array.from({ length: 9 }, (_, i) =>
        users.map((user) => seed(`Game${i}`, user)),
      ).flat(),
    );

    const messages = await build(summary_of(9));
    const embeds = messages.flat();

    expect(messages.length).toBeGreaterThan(1);
    expect(embeds).toHaveLength(9);
    for (const message of messages) {
      expect(message.length).toBeLessThanOrEqual(10);
      expect(
        message.reduce((total, embed) => total + embed_length(embed), 0),
      ).toBeLessThanOrEqual(6000);
    }
  });

  test('footers count players and entries', async () => {
    await GameEntryModel.insertMany([
      seed('Game0', 'A'),
      { ...seed('Game0', 'B'), day_id: '2' },
    ]);

    const [embeds] = await build(summary_of(1));
    expect(embeds[0].footer.text).toBe('2 players · 2 entries');
  });
});

describe('send', () => {
  /**
   * A stand-in for a ButtonInteraction: posts get incrementing IDs, deletions are recorded, and
   * `failing_follow_ups` makes followUp throw.
   */
  const stub_interaction = (deleted: string[], failing_follow_ups = false) => {
    let next_id = 0;
    return {
      channelId: 'channel-1',
      user: { username: 'tester' },
      member: null,
      deferReply: async () => {},
      editReply: async () => ({ id: `msg-${next_id++}` }),
      followUp: async () => {
        if (failing_follow_ups) throw new Error('rate limited');
        return { id: `msg-${next_id++}` };
      },
      channel: {
        messages: {
          fetch: async (id: string) => ({
            delete: async () => {
              deleted.push(id);
            },
          }),
        },
      },
    } as any;
  };

  const seed_split_day = async () => {
    const users = Array.from({ length: 10 }, (_, u) => `User${u}`);
    await GameEntryModel.insertMany(
      Array.from({ length: 9 }, (_, i) =>
        users.map((user) => seed(`Game${i}`, user)),
      ).flat(),
    );
  };

  test('replacing a summary deletes every message of the previous one', async () => {
    await seed_split_day();
    const summary = summary_of(9);
    const deleted: string[] = [];

    await summary.send(stub_interaction(deleted));
    const first = await SummaryMessageModel.findOne({
      channel_id: 'channel-1',
    });
    expect(first!.message_ids.length).toBeGreaterThan(1);
    expect(deleted).toEqual([]);

    await summary.send(stub_interaction(deleted));
    expect(deleted.sort()).toEqual([...first!.message_ids].sort());
  });

  test('tracks what was posted even when a follow-up fails', async () => {
    await seed_split_day();
    const summary = summary_of(9);
    const deleted: string[] = [];

    await expect(summary.send(stub_interaction(deleted, true))).rejects.toThrow(
      'rate limited',
    );

    // The reply went out before the follow-up failed; it must be on record so the next summary
    // cleans it up rather than leaving it orphaned in the channel.
    const tracked = await SummaryMessageModel.findOne({
      channel_id: 'channel-1',
    });
    expect(tracked!.message_ids).toEqual(['msg-0']);

    await summary.send(stub_interaction(deleted));
    expect(deleted).toContain('msg-0');
  });

  test('still cleans up a summary tracked by the single-message schema', async () => {
    await GameEntryModel.insertMany([seed('Game0', 'A')]);
    await SummaryMessageModel.create({
      channel_id: 'channel-1',
      message_id: 'legacy-1',
    });
    const deleted: string[] = [];

    await summary_of(1).send(stub_interaction(deleted));

    expect(deleted).toEqual(['legacy-1']);
    const row = await SummaryMessageModel.findOne({
      channel_id: 'channel-1',
    }).lean();
    expect((row as any).message_id).toBeUndefined();
  });
});
