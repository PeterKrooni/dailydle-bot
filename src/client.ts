import {
  Client,
  Events,
  GatewayIntentBits,
  Partials,
  REST,
  Routes,
} from 'discord.js';
import { GameSummaryMessage } from './core/embeds/embed_structure.js';
import Config from './config.js';
import { SlashCommand } from './core/command.js';
import {
  register_client_callbacks,
  register_process_exit_callback,
} from './callbacks.js';

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
 * @param {string} application_id - Bot application ID.
 * @param {string} bot_token - Token used for Discord's bot API.
 * @param {string[]} commands - Commands to register.
 */
async function register_application_commands(
  application_id: string,
  bot_token: string,
  commands: SlashCommand[],
) {
  console.info('Registering Application Commands to Discord.');

  const rest = new REST({ version: '10' }).setToken(bot_token);
  await rest
    .put(Routes.applicationCommands(application_id), {
      body: commands.map((c) => c.definition),
    })
    .then(() => {
      console.info('Registered Application Commands to Discord successfully.');
    })
    .catch((err) => {
      console.error(`Could not register Application Commands to Discord: ${err}`);
      process.exit(1);
    });
}

/**
 * Initializes a Discord client.
 *
 * @param {string} bot_token - Token used for communicating with the Discord Bot API.
 * @param {GameSummaryMessage} response_message_structure - A structure for game summary messages.
 * @param {string} application_id - Bot application ID for command registration.
 * @param {string[]} commands - Application commands to register.
 * @returns {Promise<Client>} A Discord client.
 */
export async function init_client(
  bot_token: string,
  response_message_structure: GameSummaryMessage,
  application_id?: string,
  commands?: SlashCommand[],
): Promise<Client> {
  console.info('Initializing Discord Client.');

  const client = new Client({
    partials: CLIENT_PARTIALS,
    intents: CLIENT_INTENTS,
  });

  if (application_id && commands) {
    await register_application_commands(application_id, bot_token, commands);
  }

  client.once(Events.ClientReady, async () => {
    console.info(`Logged in as ${client.user?.tag}.`);
    await Promise.all(
      Config.ENABLED_CHANNEL_IDS.map((id) =>
        client.channels
          .fetch(id, { cache: true })
          .then(() =>
            console.debug(`Cached messages for allowed channel ${id}.`),
          )
          .catch((err) =>
            console.warn(
              `Failed to cache messages for allowed channel ${id}: ${err}`,
            ),
          ),
      ),
    );
  });

  console.info('Logging in...');
  await client.login(bot_token);

  register_client_callbacks(client, response_message_structure, commands);
  register_process_exit_callback(client);

  return client;
}
