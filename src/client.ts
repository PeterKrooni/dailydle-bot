import {
  Client,
  GatewayIntentBits,
  Message,
  Partials,
  REST,
  Routes,
} from 'discord.js';
import { GameSummaryMessage } from './core/embed_structure.js';
import Config from './config.js';
import Game from './core/game.js';

/**
 * Partial client permissions needed for this bot.
 */
const CLIENT_PARTIALS: Partials[] = [Partials.Message, Partials.Channel];

/**
 * Gateway intent structure needed for this bot.
 */
const CLIENT_INTENTS: GatewayIntentBits[] = [
  GatewayIntentBits.DirectMessages,
  GatewayIntentBits.DirectMessageReactions,
  GatewayIntentBits.MessageContent,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.GuildMessageReactions,
  GatewayIntentBits.Guilds,
];

/**
 * Registers application commands with Discord's API.
 *
 * @param {string} bot_token - Token used for Discord's bot API.
 * @param {string} oath2_client_id - Token used for Discord's REST API.
 * @param {string[]} commands - Commands to register.
 */
async function register_application_commands(
  bot_token: string,
  oath2_client_id: string,
  commands: string[]
) {
  console.info('Registering Application Commands.');

  const rest = new REST({ version: '10' }).setToken(bot_token);
  await rest
    .put(Routes.applicationCommands(oath2_client_id), {})
    .then(() => {
      console.info("Registered Application Commands successfully.");
      // TODO: Log
    })
    .catch((err) => {
      // TODO: Log err
      console.error(`Could not register Application Commands: ${err}`);
      process.exit(1);
    });
}

/**
 * Checks whether a message is valid or not.
 *
 * Checks whether the message is:
 * - in an enabled channel,
 * - not posted by a bot user,
 * - that the message is less than 500 characters.
 */
function message_is_valid(message: Message): boolean {
  const enabled_channel_ids = Config.ENABLED_CHANNEL_IDS;

  return (
    message.channel.id in enabled_channel_ids &&
    !message.author.bot &&
    message.content.length <= 500
  );
}

/**
 * Registers Discord callbacks for posted messages and message reactions.
 *
 * @param {Client} client - The Discord client.
 * @param {GameSummaryMessage} game_summary_message - Game summary message to register.
 */
function register_callbacks(
  client: Client,
  game_summary_message: GameSummaryMessage
) {
  const games = game_summary_message.get_games();

  client.on('messageCreate', async (message) => {
    if (message_is_valid(message)) {
      let passed = [];
      for (const game of games) {
        if ((await game.match(message)) !== null) {
          passed.push(game.name);
        }
      }

      if (passed.length > 0) {
        console.info(
          `Found valid game message for games ${passed.map((n) => `'${n}'`).join(', ')}.`
        );
      }
    }
  });

  client.on('messageReactionAdd', async (message_reaction, user) => {
    if (
      message_reaction.message.channel.id in Config.ENABLED_CHANNEL_IDS &&
      !user.bot
    ) {
      await game_summary_message.send(message_reaction);
    }
  });
}

/**
 * Initializes a Discord client.
 *
 * @param {string} bot_token - Token used for communicating with the Discord Bot API.
 * @param {string} oath2_client_id - Token used for communicating with the Discord REST API.
 * @param {string[]} commands - Application commands to register.
 * @param {GameSummaryMessage} response_message_struture - A structure for game summary messages.
 * @returns {Promise<Client>} A Discord client.
 */
export async function init_client(
  bot_token: string,
  oath2_client_id: string,
  commands: string[],
  response_message_struture: GameSummaryMessage
): Promise<Client> {
  console.info('Initializing Discord Client.');

  const client = new Client({
    partials: CLIENT_PARTIALS,
    intents: CLIENT_INTENTS,
  });

  // await register_application_commands(bot_token, oath2_client_id, commands);

  console.info(`Registering callbacks for:${response_message_struture.get_games().map(g => g.name).join(', ')}.`);
  register_callbacks(client, response_message_struture);

  return client;
}
