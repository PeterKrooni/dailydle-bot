import { readFileSync, writeFileSync } from 'fs'
import { GameEntry } from '../core/database/schema.js';
import { Snowflake } from 'discord.js';

interface DbEntry extends GameEntry {
    updatedAt: any,
    createdAt: any,
} 

export async function generate_mock_data() {
    const f: DbEntry[] = JSON.parse(readFileSync(new URL('./data.json', import.meta.url), 'utf-8'));

    // Getting the first 5 users
    const users: any[] = [];
    const found_ids: Snowflake[] = [];

    f.forEach(entry => {
        if (!found_ids.includes(entry.user.id)) {
            found_ids.push(entry.user.id);
            if (users.length < 5) {
                users.push(entry.user);
            }
        }
    });

    const games = [
        "Wordle",
        "Connections",
        "The Mini",
        "Strands",
        "Globle",
        "GlobleCapitals"
    ] as const;

    type Game = typeof games[number];

    const scores: Record<Game, string[]> = {
        "Wordle": ["X/6", "1/6", "2/6", "3/6", "4/6", "5/6"],
        "Connections": ["0", "1", "2", "3", "4"],
        "The Mini": ["10", "15", "25", "35", "48", "68", "72", "91", "113", "121", "144", "159", "231", "241", "251"],
        "Strands": ["0,7,7", "1,6,7", "2,6,8", "0,8,8", "3,3,6", "4,3,7"], // strands scores arent really synced between days, so this might look a bit weird
        "Globle": ["4", "5", "8", "10", "13", "15", "19", "22"],
        "GlobleCapitals": ["6", "7", "9", "11", "16", "17", "23", "27"]
    };

    // Track day_ids separately for each game
    const gameDayCounts: Record<Game, number> = {
        "Wordle": 1351, // Start from 1351 for Wordle
        "Connections": 629, // Start from 629 for Connections
        "The Mini": 2025, // Start from 2025 for The Mini
        "Strands": 363, // Start from 363 for Strands
        "Globle": 1351, // Start from 1351 for Globle
        "GlobleCapitals": 629 // Start from 629 for GlobleCapitals
    };

    const entries: DbEntry[] = [];

    users.forEach(user => {
        games.forEach(g => {
            for (let i = 0; i < 7; i++) {
                if (Math.random() < 0.1) continue; // 10% chance to skip game

                const date = new Date();
                date.setDate(date.getDate() - (7 - i));
                date.setHours(10, 46, 8, 531); // consistent timestamp

                // Get Unix timestamp in milliseconds
                const timestamp = date.getTime(); 

                // Increment the day_id for each game
                const day_id = `${gameDayCounts[g]++}`;

                const scoresForGame = scores[g];
                const score = scoresForGame[Math.floor(Math.random() * scoresForGame.length)];

                const template = f.find(e => e.game === g);

                if (!template) continue;

                // Game-specific content adjustments
                let content = '';
                switch (g) {
                    case "Wordle":
                        content = `Wordle ${day_id} ${score}\n\n🟨🟨⬛⬛🟨\n🟩🟨🟨🟨⬛\n🟩🟩⬛🟩🟩\n🟩🟩🟩🟩🟩`;
                        break;
                    case "Connections":
                        content = `Connections\nPuzzle ${day_id}\n🟨🟪🟨🟨\n🟨🟪🟦🟨\n🟨🟪🟩🟨\n🟦🟪🟦🟪`;
                        break;
                    case "The Mini":
                        content = `https://www.nytimes.com/badges/games/mini.html?d=${day_id}&t=152&c=d269e4db734962e54e9f9421f067c763&smid=url-share`;
                        break;
                    case "Globle":
                    case "GlobleCapitals":
                        content = `🌎 ${day_id} 🌍\n🔥 ${score} | Avg. Guesses: ${Math.floor(Math.random() * 10 + 5)}\n🟥🟩🟦 = ${score}\n\nhttps://globle-game.com\n#globle`;
                        break;
                    default:
                        content = `${g} ${day_id}\n“Let us prey”\n💡🔵🟡🔵\n🔵🔵🔵`;
                        break;
                }


                // Create a new mocked entry
                const entry: DbEntry = {
                    user,
                    game: g,
                    day_id,
                    score,
                    content,
                    channel_id: "1335589483705532429", // Placeholder channel_id
                    message_id: crypto.randomUUID(), // Randomized message ID
                    schema_version: "2",
                    server_id: "1313917326013235251", // Placeholder server ID
                    createdAt: {
                        "$date": {
                            "$numberLong": timestamp.toString() // Convert Unix timestamp to string
                        }
                    },
                    updatedAt: {
                        "$date": {
                            "$numberLong": timestamp.toString() // Same timestamp for updatedAt
                        }
                    }
                };

                entries.push(entry);
            }
        });
    });

    await writeFileSync('./src/test/output.json', JSON.stringify(entries))
    return `Created ${entries.length} mock entries.`
}
