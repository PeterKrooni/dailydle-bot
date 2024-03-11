import mongoose from "mongoose";
import Entry from "./schema.js";

/**
 * Initializes a MongoDB connection.
 * 
 * If the connection fails, this function will log an error and exit the process.
 * 
 * @param {String} connection_string - The connection string to use for the database.
 */
export async function initDb(connection_string) {
    await mongoose.connect(connection_string)
    .then(() => {
        console.info("Connected to database.");
    }).catch((err) => {
        console.error("Failed to connect to database:", err);
        process.exit(1);
    });
}

/**
 * Generates an entry object from a message and some additional data.
 * 
 * @param {Message} message - The message to generate the entry from.
 * @param {String} game - The game type the entry is for.
 * @param {String} day - The day / id of the game entry.
 * @param {String} score - The player's score for the game entry.
 * @returns {Object} The generated entry object.
 */
export function toEntry(message, game, day, score) {
  return {
    game,
    day,
    score,
    user: {
      id: message.member.user.id,
      name: message.author.displayName,
      server_name: message.member.displayName,
    },
    message_id: message.id,
    channel_id: message.channel.id,
  }
}

/**
 * Inserts or updates an entry in the database.
 * 
 * @param {Object} entry - The entry to insert or update.
 */
export async function upsertEntry(entry) {
  return await Entry.findOneAndUpdate(
    {
      'user.id': entry.user.id,
      game: entry.game,
      day: entry.day,
    },
    entry,
    { upsert: true },
  )
}
