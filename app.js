import { config } from 'dotenv'
import { initClient, addBotCleanupOnProcessExitHandlers } from './bot.js'
import { connectDB } from './db/util/db.js'
import { onChannelMessage, onChannelMessageReact } from './dailydle.js'
import { verifyEnvVars } from './services/envVarVerifier.js'
import { CouldNotCreateClientError } from './errors/CouldNotCreateClientError.js'

config()
verifyEnvVars()

const client = await initClient()

if (!client) {
  throw new CouldNotCreateClientError()
} 

await connectDB()
await addBotCleanupOnProcessExitHandlers(client)

client.on('messageCreate', async (message) => {
  await onChannelMessage(message)
})
client.on('messageReactionAdd', async (reaction_orig, user) => {
  await onChannelMessageReact(reaction_orig, user)
})

