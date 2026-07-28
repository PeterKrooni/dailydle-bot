import { Snowflake } from 'discord.js';
import { GameEntryModel, GameEntry } from '../core/database/schema.js';
import crypto from 'node:crypto';

interface DbEntry extends GameEntry {
  createdAt?: Date;
  updatedAt?: Date;
}

/** Days of history to generate, so `/weekly` has something to chart. */
const DAYS = 7;

/** Share of games a mock user skips on a given day. */
const SKIP_RATE = 0.1;

/**
 * `name` has to be the name entries are stored under - the name of the message parser that would
 * have matched a real result, not always the name of the game - or the summary will not find them.
 */
interface MockGame {
  name: string;
  score: () => string;
  day_id?: (date: Date) => string;
}

/** Picks a random integer in `[min, max]`. */
const between = (min: number, max: number): number =>
  min + Math.floor(Math.random() * (max - min + 1));

/** Picks one of `values` at random. */
const one_of = <T>(...values: T[]): T => values[between(0, values.length - 1)];

/** Rolls a `1/max` .. `max/max` score, failing `fail_rate` of the time. */
const guesses_out_of = (max: number, fail_rate: number) => (): string =>
  Math.random() < fail_rate ? `X/${max}` : `${between(1, max)}/${max}`;

const iso_date = (date: Date): string => date.toISOString().slice(0, 10);

/** 19 digits, like a real snowflake, so message links are a realistic length. */
const snowflake = (): Snowflake =>
  String(between(1, 9)) +
  Array.from({ length: 18 }, () => between(0, 9)).join('');

/** Every game the bot tracks, so a mock run exercises all of the scoreboards. */
const GAMES: MockGame[] = [
  { name: 'Wordle', score: guesses_out_of(6, 0.08) },
  { name: 'Connections', score: () => String(between(0, 4)) },
  { name: 'The Mini', score: () => String(between(28, 400)) },
  {
    name: 'Strands',
    score: () => {
      const hints = between(0, 4);
      return `${hints},${8 - hints},8`;
    },
  },
  {
    name: '🌱 Bullpen',
    score: () =>
      one_of(String(between(20, 400)), `${between(1, 9)}.${between(0, 9)}s`),
    day_id: iso_date,
  },
  {
    name: '🔥 Bullpen',
    score: () => String(between(45, 900)),
    day_id: iso_date,
  },
  { name: 'Tvers', score: () => String(between(40, 600)), day_id: iso_date },
  { name: 'Former', score: () => String(between(4, 40)), day_id: iso_date },
  { name: 'Globle', score: () => String(between(1, 20)) },
  { name: 'GlobleCapitals', score: () => String(between(1, 25)) },
  { name: 'Gamedle (Classic)', score: () => String(between(1, 6)) },
  { name: 'Gamedle (Artwork)', score: () => String(between(1, 6)) },
  { name: 'Gamedle (Keywords)', score: () => String(between(1, 6)) },
  { name: 'Gamedle (Guess)', score: () => String(between(1, 10)) },
  { name: 'FoodGuessr', score: () => String(between(3, 10)) },
  {
    name: 'TimeGuessr',
    score: () => between(12_000, 49_500).toLocaleString('en-GB'),
  },
  { name: 'Bybandle', score: guesses_out_of(5, 0.15), day_id: iso_date },
  {
    name: '4x3',
    score: () =>
      one_of(
        `${between(60, 160)},${between(0, 3)}`,
        `${between(60, 160)},0`,
        `X,${between(1, 4)}`,
        `-100,RULE BREAKER`,
      ),
    day_id: iso_date,
  },
];

/** Puzzle numbers to count up from, for the games that identify a day by one. */
const BASE_DAY_IDS: Record<string, number> = {
  Wordle: 1351,
  Connections: 629,
  'The Mini': 2025,
  Strands: 363,
  Globle: 1351,
  GlobleCapitals: 629,
  TimeGuessr: 1075,
};

export async function generate_mock_data() {
  const existingEntries = await GameEntryModel.find({}).exec();

  // Get active users from the last month
  const activeUsers = await GameEntryModel.distinct('user', {
    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
  });

  // Take 5 random active users, or create mock users if none exist - enough of them to push a
  // scoreboard past its 10 rows, so the `+ N more` trimming is exercised too.
  const selectedUsers =
    activeUsers.length > 0
      ? activeUsers.sort(() => 0.5 - Math.random()).slice(0, 5)
      : Array.from({ length: 12 }, (_, i) => ({
          id: snowflake(),
          name: `TestUser${i + 1}`,
          // Marked so an invented score is never mistaken for somebody's real result.
          server_name: `[mock] User${i + 1}`,
        }));

  const entries: DbEntry[] = [];
  const today = new Date();

  for (let dayOffset = DAYS - 1; dayOffset >= 0; dayOffset--) {
    const currentDate = new Date(today);
    currentDate.setDate(currentDate.getDate() - dayOffset);

    for (const user of selectedUsers) {
      for (const game of GAMES) {
        if (Math.random() < SKIP_RATE) continue;

        const day_id =
          game.day_id?.(currentDate) ?? calculateDayId(game.name, currentDate);
        const score = game.score();

        entries.push({
          game: game.name,
          day_id: String(day_id),
          score,
          user: {
            id: user.id,
            name: user.name,
            server_name: user.server_name,
          },
          message_id: snowflake(),
          channel_id:
            existingEntries[0]?.channel_id ||
            ('1335589483705532429' as Snowflake),
          server_id:
            existingEntries[0]?.server_id ||
            ('1313917326013235251' as Snowflake),
          content: generateContent(game.name, day_id, score),
          // version -1 = mock data
          schema_version: '-1',
          createdAt: currentDate,
          updatedAt: currentDate,
        });
      }
    }
  }

  const enable_dev_features = process.argv.includes('--dev');
  if (enable_dev_features) {
    await GameEntryModel.insertMany(entries as GameEntry[]);
  }

  return `Created ${entries.length} realistic mock entries across ${GAMES.length} games. ${
    enable_dev_features
      ? 'Added directly to db since the bot is running in dev mode, and should be running an in-memory database.'
      : ''
  }`;
}

function calculateDayId(game: string, date: Date): number | string {
  const base = BASE_DAY_IDS[game];
  if (base === undefined) {
    return iso_date(date);
  }

  const daysSinceBase = Math.floor(
    (date.getTime() - new Date('2024-01-01').getTime()) / (1000 * 60 * 60 * 24),
  );
  return base + daysSinceBase;
}

function generateContent(
  game: string,
  dayId: number | string,
  score: string,
): string {
  switch (game) {
    case 'Wordle':
      return generateWordleContent(dayId, score);
    case 'Connections':
      return generateConnectionsContent(dayId, score);
    case 'The Mini':
      return `https://www.nytimes.com/badges/games/mini.html?d=${dayId}&t=${score}&c=${crypto.randomBytes(16).toString('hex')}&smid=url-share`;
    case 'Globle':
    case 'GlobleCapitals':
      return `🌎 ${dayId} 🌍\n🔥 ${score} | Avg. Guesses: ${Math.floor(Number(score) * 1.5)}\n🟥🟩🟦 = ${score}\n\nhttps://globle-game.com\n#globle`;
    default:
      return `${game} ${dayId}\n${score}`;
  }
}

function generateWordleContent(dayId: number | string, score: string): string {
  const patterns = [
    '⬛🟨⬛🟩⬛',
    '🟨🟨⬛⬛🟨',
    '🟩🟨🟨🟨⬛',
    '🟩🟩⬛🟩🟩',
    '🟩🟩🟩🟩🟩',
  ];

  const attempts = parseInt(score) || 6;
  const grid = patterns.slice(0, attempts).join('\n');

  return `Wordle ${dayId} ${score}\n\n${grid}`;
}

function generateConnectionsContent(
  dayId: number | string,
  score: string,
): string {
  const colors = ['🟪', '🟦', '🟨', '🟩'];
  const attempts = Math.min(Number(score), 4);
  let content = `Connections\nPuzzle ${dayId}\n`;

  for (let i = 0; i < attempts; i++) {
    content +=
      shuffle([...colors])
        .slice(0, 4)
        .join('') + '\n';
  }

  return content;
}

function shuffle<T>(array: T[]): T[] {
  return array.sort(() => Math.random() - 0.5);
}
