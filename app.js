import { config } from 'dotenv'
import { initClient, addBotCleanupOnProcessExitHandlers } from './bot.js'
import { connectDB } from './db/util/db.js'
import { onChannelMessage } from './dailydle.js'
import { verifyRequiredEnvVarsAreSet } from './services/envVarVerifier.js'
import { CouldNotCreateClientError } from './errors/CouldNotCreateClientError.js'

config()
verifyRequiredEnvVarsAreSet()

const client = await initClient()

if (!client) {
  throw new CouldNotCreateClientError()
} 

await connectDB()
await addBotCleanupOnProcessExitHandlers(client)

client.on('messageCreate', async (message) => {
  await onChannelMessage(message)
})

