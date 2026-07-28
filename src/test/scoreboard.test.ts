import { describe, test, expect } from '@jest/globals';
import {
  highest_first,
  lowest_first,
  numeric,
  render_heading,
  render_rows,
} from '../core/embeds/scoreboard.js';
import { Scoreboard } from '../core/embeds/embed_formatter.js';
import { GameEntry } from '../core/database/schema.js';

const entry = (score: string, name: string = 'Player'): GameEntry => ({
  game: 'Test',
  day_id: '1',
  score,
  user: { id: `id-${name}`, name },
  message_id: '1234567890123456789',
  channel_id: '1234567890123456780',
  server_id: '1234567890123456781',
  schema_version: '2',
});

describe('numeric', () => {
  test('reads plain and fraction scores', () => {
    expect(numeric('3')).toBe(3);
    expect(numeric('3/6')).toBe(3);
    expect(numeric('X/6')).toBeNaN();
  });

  test('reads a thousands separator as one number', () => {
    expect(numeric('44,123')).toBe(44123);
  });

  test('does not merge list-shaped scores', () => {
    expect(numeric('0,8,8')).toBe(0); // Strands: hints first
    expect(numeric('120,2')).toBe(120); // 4x3: points first
    expect(numeric('-100,RULE BREAKER')).toBe(-100);
  });
});

describe('sorters', () => {
  test('lowest_first ranks ascending with unreadable scores last', () => {
    const sorted = [entry('X/6'), entry('4/6'), entry('1/6')].sort(
      lowest_first(),
    );
    expect(sorted.map((e) => e.score)).toEqual(['1/6', '4/6', 'X/6']);
  });

  test('highest_first ranks descending with unreadable scores last', () => {
    const sorted = [entry('X,2'), entry('120,0'), entry('157,1')].sort(
      highest_first(),
    );
    expect(sorted.map((e) => e.score)).toEqual(['157,1', '120,0', 'X,2']);
  });
});

describe('render_heading', () => {
  test('joins title and unit', () => {
    expect(render_heading({ title: 'Wordle', unit: 'guesses' }, 'x')).toBe(
      'Wordle · guesses',
    );
  });

  test('falls back to the stored name without a title', () => {
    expect(render_heading({}, 'GlobleCapitals')).toBe('GlobleCapitals');
  });
});

describe('render_rows', () => {
  test('awards medals by rank, sharing rank on ties', () => {
    const rows = render_rows(
      [entry('1/6', 'A'), entry('1/6', 'B'), entry('3/6', 'C')],
      {},
    );
    expect(rows[0]).toContain('🥇');
    expect(rows[1]).toContain('🥇');
    expect(rows[2]).toContain('🥉');
  });

  test('numbers ranks past the medals', () => {
    const rows = render_rows(
      ['1', '2', '3', '4'].map((s, i) => entry(s, `P${i}`)),
      {},
    );
    expect(rows[3]).toContain('`4.`');
  });

  test('failed entries get a skull and never a medal', () => {
    const rows = render_rows([entry('X/6', 'A')], {
      is_failed: (score) => score.startsWith('X'),
    });
    expect(rows[0]).toContain('💀');
    expect(rows[0]).not.toContain('🥇');
    expect(rows[0]).toContain('`1.`');
  });

  test('perfect entries get a sparkle', () => {
    const rows = render_rows([entry('1/6', 'A')], {
      is_perfect: (score) => score.startsWith('1/'),
    });
    expect(rows[0]).toContain('✨');
  });

  test('pads scores to a column and links the player name', () => {
    const rows = render_rows([entry('9', 'A'), entry('15', 'B')], {});
    expect(rows[0]).toContain('` 9`');
    expect(rows[1]).toContain('`15`');
    expect(rows[0]).toContain('[A](https://discord.com/channels/');
  });

  test('renders through the display function', () => {
    const rows = render_rows([entry('83', 'A')], {
      display: (score) => `${score}s`,
    });
    expect(rows[0]).toContain('`83s`');
  });
});

describe('Scoreboard.render', () => {
  const board = (entries: GameEntry[], max_entries: number = 10) =>
    new Scoreboard('Test · unit', {}, entries, max_entries);

  test('summarizes entries past the row cap as an italic more-line', () => {
    const entries = Array.from({ length: 12 }, (_, i) =>
      entry(String(i + 1), `Player${i}`),
    );
    const rendered = board(entries).render(true);

    expect(rendered).not.toBeNull();
    const lines = rendered!.field.value.split('\n');
    const more = lines[lines.length - 1].match(/^\*\+ (\d+) more\*$/);

    // Rows shown plus the more-line remainder must account for every entry.
    expect(more).not.toBeNull();
    expect(lines.length - 1 + Number(more![1])).toBe(12);
    // Subtext does not render inside embed fields, so the more-line must never use it.
    expect(rendered!.field.value).not.toContain('-#');
  });

  test('trims rows that do not fit the field limit, keeping the top', () => {
    const entries = Array.from({ length: 10 }, (_, i) =>
      entry(String(i + 1), `Player${i}-${'x'.repeat(100)}`),
    );
    const rendered = board(entries).render(true);

    expect(rendered).not.toBeNull();
    expect(rendered!.field.value.length).toBeLessThanOrEqual(1024);
    expect(rendered!.field.value).toContain('Player0');
    expect(rendered!.field.value).toMatch(/\*\+ \d+ more\*$/);
    expect(rendered!.entries).toBe(10);
  });

  test('counts each player once', () => {
    const rendered = board([entry('1', 'A'), entry('2', 'A')]).render(true);
    expect(rendered!.players).toEqual(['id-A']);
  });
});
