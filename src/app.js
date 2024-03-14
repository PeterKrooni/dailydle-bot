import { checkRequiredEnvVars, initLogging } from './config.js'
import { initDb } from './db/util.js'
import { initClient, registerExitHandler } from './client.js'
import { Events } from 'discord.js'
import Wordle from './games/wordle.js'
import Connections from './games/connections.js'
import MiniCrossword from './games/minicrossword.js'
import Gamedle from './games/gamedle.js'
import { interactionHandler, messageHandler } from './handlers.js'
import { embedCommand } from './commands.js'

// Load environment variables from .env file and verify that
// all required environment variables are set:
checkRequiredEnvVars()

initLogging(process.env.LOG_LEVEL)

await initDb(process.env.MONGODB_CONNECTION_STRING)

const client = await initClient(
  process.env.DISCORD_BOT_TOKEN,
  process.env.DISCORD_OAUTH_CLIENT_ID,
  [embedCommand],
  [Wordle, Connections, MiniCrossword, Gamedle],
)

// Add bot cleanup handler to the process:
registerExitHandler(client)

client.on(Events.MessageCreate, async (message) => await messageHandler(message))
// client.on(Events.MessageReactionAdd, async (reaction_orig, user) => await onChannelMessageReact(reaction_orig, user))
client.on(Events.InteractionCreate, async (interaction) => await interactionHandler(interaction))
