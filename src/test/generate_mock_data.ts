import { Snowflake } from 'discord.js';
import { writeFileSync } from 'fs';
import { GameEntryModel, GameEntry } from '../core/database/schema.js';
import crypto from 'node:crypto'; // Add this import at the top

interface DbEntry extends GameEntry {
    createdAt?: Date;
    updatedAt?: Date;
}

export async function generate_mock_data() {
    // First, let's analyze existing data patterns
    const existingEntries = await GameEntryModel.find({}).exec();
    
    // Get active users from the last month
    const activeUsers = await GameEntryModel.distinct('user', {
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });
    
    // Take 5 random active users or create mock users if none exist
    const selectedUsers = activeUsers.length > 0 
        ? activeUsers.sort(() => 0.5 - Math.random()).slice(0, 5)
        : Array.from({ length: 5 }, (_, i) => ({
            id: crypto.randomUUID() as Snowflake,
            name: `TestUser${i + 1}`,
            server_name: `ServerNickname${i + 1}`
        }));

    const games = [
        "Wordle",
        "Connections",
        "The Mini",
        "Strands",
        "Globle",
        "GlobleCapitals"
    ] as const;

    const entries: DbEntry[] = [];
    const today = new Date();

    // Generate entries for the last 7 days
    for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
        const currentDate = new Date(today);
        currentDate.setDate(currentDate.getDate() - dayOffset);
        
        for (const user of selectedUsers) {
            // Generate entries for each game type with a 90% participation rate
            for (const game of games) {
                if (Math.random() > 0.9) continue; // 90% participation rate

                const dayId = calculateDayId(game, currentDate);
                const score = generateScore(game);
                const content = generateContent(game, dayId, score);

                const entry: DbEntry = {
                    game,
                    day_id: dayId.toString(),
                    score,
                    user: {
                        id: user.id,
                        name: user.name,
                        server_name: user.server_name
                    },
                    message_id: crypto.randomUUID() as Snowflake, // This is fine as randomUUID() exists in both Web and Node Crypto
                    channel_id: existingEntries[0]?.channel_id || "1335589483705532429" as Snowflake,
                    server_id: existingEntries[0]?.server_id || "1313917326013235251" as Snowflake,
                    content,
                    schema_version: "2",
                    createdAt: currentDate,
                    updatedAt: currentDate
                };

                entries.push(entry);
            }
        }
    }
    entries.forEach(e => {
      e.schema_version = "-1"; // version -1 = mock data
    })
    writeFileSync('./src/test/output.json', JSON.stringify(entries, null, 2));
  const enable_dev_features = process.argv.includes('--dev')
  if (enable_dev_features) {
    console.info('\x1b[36m%s\x1b[0m', '--dev: Development features will be enabled')
  }

  return `Created ${entries.length} realistic mock entries. ${enable_dev_features 
    ? 'Added directly to db since the bot is running in dev mode, and should be running an in-memory database.'
    : ''}`;

}

function calculateDayId(game: string, date: Date): number {
    const baseIds: Record<string, number> = {
        "Wordle": 1351,
        "Connections": 629,
        "The Mini": 2025,
        "Strands": 363,
        "Globle": 1351,
        "GlobleCapitals": 629
    };

    const daysSinceBase = Math.floor((date.getTime() - new Date('2024-01-01').getTime()) / (1000 * 60 * 60 * 24));
    return (baseIds[game] || 1) + daysSinceBase;
}

function generateScore(game: string): string {
    switch (game) {
        case "Wordle":
            return `${Math.floor(Math.random() * 6) + 1}/6`;
        case "Connections":
            return `${Math.floor(Math.random() * 4)}`;
        case "The Mini":
            return `${Math.floor(Math.random() * 200) + 50}`;
        case "Strands":
            const attempts = Math.floor(Math.random() * 8);
            const correct = Math.floor(Math.random() * 8);
            const total = 8;
            return `${attempts},${correct},${total}`;
        case "Globle":
        case "GlobleCapitals":
            return `${Math.floor(Math.random() * 20) + 3}`;
        default:
            return "0";
    }
}

// Then replace the crypto.randomBytes usage in generateContent:
function generateContent(game: string, dayId: number, score: string): string {
    switch (game) {
        case "Wordle":
            return generateWordleContent(dayId, score);
        case "Connections":
            return generateConnectionsContent(dayId, score);
        case "The Mini":
            // Fix the crypto.randomBytes usage:
            return `https://www.nytimes.com/badges/games/mini.html?d=${dayId}&t=${score}&c=${crypto.randomBytes(16).toString('hex')}&smid=url-share`;
        case "Globle":
        case "GlobleCapitals":
            return `🌎 ${dayId} 🌍\n🔥 ${score} | Avg. Guesses: ${Math.floor(Number(score) * 1.5)}\n🟥🟩🟦 = ${score}\n\nhttps://globle-game.com\n#globle`;
        default:
            return `${game} ${dayId}\n${score}`;
    }
}

function generateWordleContent(dayId: number, score: string): string {
    const patterns = [
        "⬛🟨⬛🟩⬛",
        "🟨🟨⬛⬛🟨",
        "🟩🟨🟨🟨⬛",
        "🟩🟩⬛🟩🟩",
        "🟩🟩🟩🟩🟩"
    ];

    const attempts = parseInt(score) || 6;
    const grid = patterns
        .slice(0, attempts)
        .join('\n');

    return `Wordle ${dayId} ${score}\n\n${grid}`;
}

function generateConnectionsContent(dayId: number, score: string): string {
    const colors = ['🟪', '🟦', '🟨', '🟩'];
    const attempts = Math.min(Number(score), 4);
    let content = `Connections\nPuzzle ${dayId}\n`;
    
    for (let i = 0; i < attempts; i++) {
        content += shuffle([...colors]).slice(0, 4).join('') + '\n';
    }
    
    return content;
}

function shuffle<T>(array: T[]): T[] {
    return array.sort(() => Math.random() - 0.5);
}