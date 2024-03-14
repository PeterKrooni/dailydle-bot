import { Client, Collection, GatewayIntentBits, Partials, REST, Routes, SlashCommandBuilder } from 'discord.js'
import Game from './games/game.js'

const clientPartials = [Partials.Message, Partials.Channel]

// TODO: Not sure we need DM intents?
const clientIntents = [
  GatewayIntentBits.DirectMessages,
  GatewayIntentBits.DirectMessageReactions,
  GatewayIntentBits.MessageContent,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.GuildMessageReactions,
  GatewayIntentBits.Guilds,
]

/**
 * Registers application commands with Discord.
 *
 * If the registration fails, this function will log an error and exit the process.
 *
 * @param {Client} client - The Discord client instance.
 * @param {String} bot_token - The bot's token.
 * @param {String} oath_client_id - The client ID of the bot's OAuth application.
 * @param {[{ data: SlashCommandBuilder, execute(interaction): Promise<void>}]} commands - An array of command objects to register with Discord.
 */
async function registerApplicationCommands(client, bot_token, oath_client_id, commands) {
  if (!commands || commands.length === 0) {
    console.debug('No application commands to register')
    return
  }

  console.info('Registering application commands')

  // Register application commands with Discord
  const rest = new REST({ version: '10' }).setToken(bot_token)
  await rest
    .put(Routes.applicationCommands(oath_client_id), { body: commands.map((command) => command.data) })
    .then(() => {
      console.info(`Successfully registered ${commands.length} application commands`)
    })
    .catch((err) => {
      console.error('Failed to register application commands:', err)
      process.exit(1)
    })

  // Add commands to client for interaction handling
  client.commands = new Collection()
  commands.forEach((command) => client.commands.set(command.data.name, command))
}

/**
 * Adds a list of games to the client object.
 *
 * @param {Client} client - The Discord client instance.
 * @param {Game[]} games - An array of game objects to register with the client.
 */
async function registerGames(client, games) {
  if (games && games.length > 0) {
    client.games = games
    console.info(`Registered ${games.length} games`)
  } else {
    console.debug('No games to register')
  }
}

/**
 * Initializes a Discord client.
 *
 * If commands are provided, registers them with Discord.
 *
 * If the client fails to initialize, this function will log an error and exit the process.
 *
 * @param {String} bot_token - The bot's token.
 * @param {String} oath_client_id - The client ID of the bot's OAuth application.
 * @param {[{ data: SlashCommandBuilder, execute(interaction): Promise<void> }]?} commands - An array of command objects to register with Discord.
 * @param {Game[]} games - An array of game objects to register with the client.
 * @returns
 */
export async function initClient(bot_token, oath_client_id, commands, games) {
  console.info('Initializing Discord client')

  // Create client instance
  const client = new Client({
    partials: clientPartials,
    intents: clientIntents,
  })

  await registerApplicationCommands(client, bot_token, oath_client_id, commands)
  await registerGames(client, games)

  client.once('ready', () => console.info(`Logged in as ${client.user.tag}`))
  await client.login(bot_token).catch((err) => {
    console.error('Failed to initialize client:', err)
    process.exit(1)
  })

  return client
}

/**
 * Adds bot cleanup handlers to the process.
 *
 * @param {Client} client - The Discord client instance.
 */
export function registerExitHandler(client) {
  console.debug('Registering exit handler')

  process.on('SIGINT', async () => {
    console.info('Received exit command')
    client
      .destroy()
      .then(() => {
        console.info('Client destroyed. Exiting')
        process.exit()
      })
      .catch((err) => {
        console.error('Failed to destroy client:', err)
        process.exit(1)
      })
  })
}
