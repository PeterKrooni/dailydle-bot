import { initClient, addBotCleanupOnProcessExitHandlers } from './bot.js'
import { onChannelMessage, onChannelMessageReact } from './dailydle.js'
import { CouldNotCreateClientError } from './errors/CouldNotCreateClientError.js'
import { checkRequiredEnvVars } from './config.js'
import { initDb } from './db/util.js'

// Load environment variables from .env file and verify that
// all required environment variables are set:
checkRequiredEnvVars()

const client = await initClient()

if (!client) {
  throw new CouldNotCreateClientError()
}


await initDb(process.env.MONGODB_CONNECTION_STRING)
await addBotCleanupOnProcessExitHandlers(client)

client.on('messageCreate', async (message) => {
  await onChannelMessage(message)
})
client.on('messageReactionAdd', async (reaction_orig, user) => {
  await onChannelMessageReact(reaction_orig, user)
})

