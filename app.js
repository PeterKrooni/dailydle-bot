
import { config } from 'dotenv'
config()

import { initClient } from './bot.js'
import { connectDB } from './db/util/db.js'

const client = await initClient()
await connectDB()

import { onChannelMessage } from './dailydle.js'

client.on('messageCreate', async (message) => {
    await onChannelMessage(message)
})

process.stdin.resume(); // so the program will not close instantly
async function exitHandler(err) {
    console.info('EXITHANDLER: recieved exit command, cleaning up client connection', err)
    await client.destroy()
    .then((res) => {
        process.exit();
    })
    .catch((err) => 87)
}

// do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

// catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));

// catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));