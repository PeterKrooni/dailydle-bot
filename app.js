
import { config } from 'dotenv'
config('.env.test.local')

import { initClient, addBotCleanupOnProcessExitHandlers } from './bot.js'
import { connectDB } from './db/util/db.js'

const client = await initClient()
await connectDB()
await addBotCleanupOnProcessExitHandlers(client)

import { onChannelMessage } from './dailydle.js'

client.on('messageCreate', async (message) => {
    await onChannelMessage(message)
})
