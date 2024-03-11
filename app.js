import { onChannelMessage, onChannelMessageReact } from './dailydle.js'
import { checkRequiredEnvVars, initLogging } from './config.js'
import { initDb } from './db/util.js'
import { initClient, registerExitHandler } from './client.js'
import { Events } from 'discord.js'

// Load environment variables from .env file and verify that
// all required environment variables are set:
checkRequiredEnvVars()

initLogging(process.env.LOG_LEVEL)

await initDb(process.env.MONGODB_CONNECTION_STRING)

const client = await initClient(
  process.env.DISCORD_BOT_TOKEN,
  process.env.DISCORD_OAUTH_CLIENT_ID
)

// Add bot cleanup handler to the process:
registerExitHandler(client)

client.on(Events.MessageCreate, async (message) => {
  await onChannelMessage(message)
})

client.on(Events.MessageReactionAdd, async (reaction_orig, user) => {
  await onChannelMessageReact(reaction_orig, user)
})

console.info('Ready')
