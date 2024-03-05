import { EmbedBuilder, Client, Events, GatewayIntentBits, REST, Routes, Partials } from 'discord.js'
import { config } from 'dotenv'
import { commands } from './constants.js'
config()

export async function initClient() {
  const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN
  const rest = new REST({ version: '10' }).setToken(BOT_TOKEN)
  try {
    console.log('Started refreshing application (/) commands.')
    await rest.put(Routes.applicationCommands(process.env.DISCORD_OAUTH_CLIENT_ID), { body: commands })
    console.log('Successfully reloaded application (/) commands.')
  } catch (error) {
    console.error(error)
    return
  }

  const client = new Client({
    partials: [Partials.Message, Partials.Channel],
    intents: [
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.DirectMessageReactions,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.Guilds,
    ],
  })
  client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}! (bot.js::init)`)
  })
  client.login(BOT_TOKEN)
  return client
}

export async function addBotCleanupOnProcessExitHandlers(client) {
  process.stdin.resume() // so the program will not close instantly
  async function exitHandler() {
    console.info('EXITHANDLER: received exit command')
    await client
      .destroy()
      .then(() => {
        console.log("Client destroyed. Exiting")
        process.exit()
      })
      .catch((err) => console.log(err))
  }

  // do something when app is closing
  process.on('SIGINT', exitHandler.bind())
}
