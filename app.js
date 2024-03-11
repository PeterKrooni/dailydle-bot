import { onChannelMessage, onChannelMessageReact } from './dailydle.js'
import { checkRequiredEnvVars } from './config.js'
import { initDb } from './db/util.js'
import { initClient, registerExitHandler } from './client.js'

// Load environment variables from .env file and verify that
// all required environment variables are set:
checkRequiredEnvVars()

await initDb(process.env.MONGODB_CONNECTION_STRING)

// Initialize the Discord client:
const client = await initClient(
  process.env.DISCORD_BOT_TOKEN,
  process.env.DISCORD_OAUTH_CLIENT_ID
)

// Add bot cleanup handler to the process:
registerExitHandler(client)

client.on('messageCreate', async (message) => {
  await onChannelMessage(message)
})

client.on('messageReactionAdd', async (reaction_orig, user) => {
  await onChannelMessageReact(reaction_orig, user)
})
