import { config } from 'dotenv'
import { initClient, addBotCleanupOnProcessExitHandlers } from './bot.js'
import { connectDB } from './db/util/db.js'
import { onChannelMessage } from './dailydle.js'

config()

const client = await initClient()
if (client === null) {
  console.log("Could not create client. Exiting...")
  process.exit(1)
} else {
  await connectDB()
  await addBotCleanupOnProcessExitHandlers(client)

  client.on('messageCreate', async (message) => {
    await onChannelMessage(message)
  })
}
