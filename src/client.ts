import {
  Client,
  Events,
  GatewayIntentBits,
  Message,
  MessageReaction,
  PartialMessageReaction,
  Partials,
  PartialUser,
  REST,
  Routes,
  User,
} from 'discord.js';
import { GameSummaryMessage } from './core/embed_structure.js';
import Config from './config.js';
import { SlashCommand } from './core/command.js';

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
  console.info('Registering Application Commands.');

  const rest = new REST({ version: '10' }).setToken(bot_token);
  await rest
    .put(Routes.applicationCommands(application_id), {
      body: commands.map((c) => c.definition),
    })
    .then(() => {
      console.info('Registered Application Commands successfully.');
    })
    .catch((err) => {
      console.error(`Could not register Application Commands: ${err}`);
      process.exit(1);
    });
}

/**
 * Checks whether a message is valid.
 *
 * Checks whether the message is:
 * - in an enabled channel,
 * - not posted by a bot user,
 * - that the message is less than 500 characters.
 */
function message_is_valid(message: Message): boolean {
  return (
    Config.ENABLED_CHANNEL_IDS.includes(message.channel.id) &&
    !message.author.bot &&
    message.content.length <= 500
  );
}

/**
 * Checks wheter a message reaction is valid.
 * 
 * Checks whether the message reaction is:
 * - in an enabled channel,
 * - not added by a bot user,
 * - that the last message in the channel was not a Game Summary message.
 * 
 * The rationale for blocking reaction events if the last message was a summary message
 * is that the only reason we handle reaction events is to post said message.
 * We don't want to spam a channel with messages if we can avoid it.
 * 
 * related TODO: maybe add a slash-command that posts the summary.
 */
function message_reaction_is_valid(
  message_reaction: MessageReaction | PartialMessageReaction,
  user: User | PartialUser,
): boolean {
  const last_message = message_reaction.message.channel.lastMessage;

  // Reaction is in enabled channel
  const channel_is_enabled = Config.ENABLED_CHANNEL_IDS.includes(
    message_reaction.message.channel.id,
  );

  // If the last message posted was posted by this bot and contains embeds, it's probably the Game
  // Summary message.
  const last_message_was_game_summary =
    last_message?.author.id === message_reaction.client.user.id &&
    last_message.embeds.length > 0;

  return !user.bot && channel_is_enabled && !last_message_was_game_summary;
}

/**
 * Registers Discord callbacks for posted messages and message reactions.
 *
 * @param {Client} client - The Discord client.
 * @param {GameSummaryMessage} game_summary_message - Game summary message to register.
 */
function register_callbacks(
  client: Client,
  game_summary_message: GameSummaryMessage,
  commands?: SlashCommand[],
) {
  const games = game_summary_message.get_games();

  client.on(Events.MessageCreate, async (message) => {
    if (message_is_valid(message)) {
      await Promise.all(games.map((game) => game.handle_message(message)))
        .then((games) => {
          if (games.filter((entry) => entry !== undefined).length > 0)
            console.info(
              `Found valid game message for games ${games
                .filter((entry) => entry !== undefined)
                .map((entry) => `'${entry.game}'`)
                .join(', ')}.`,
            );
        })
        .catch((err) => console.warn(`Message callback failed: ${err}.`));
    }
  });
  console.info(
    `Registered callbacks for: ${game_summary_message
      .get_games()
      .map((g) => g.name)
      .join(', ')}.`,
  );

  client.on(Events.MessageReactionAdd, async (message_reaction, user) => {
    if (message_reaction_is_valid(message_reaction, user)
    ) {
      console.info('Valid reaction found, sending summary message.');
      await game_summary_message.send(message_reaction).catch((err) => {
        console.error(
          `Something went wrong while sending game summary message: ${err}`,
        );
      });
    }
  });
  console.info(`Registered message reaction callback.`);

  if (commands !== undefined) {
    client.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isChatInputCommand()) return;

      await Promise.all(
        commands.map((command) =>
          command.definition.name === interaction.commandName
            ? command.handler(interaction)
            : undefined,
        ),
      )
        .then(() => console.info('Handled interaction commands.'))
        .catch((err) => {
          interaction
            .reply('Something went wrong 😿')
            .catch((err) =>
              console.error(
                `Something went wrong while sending 'Something went wrong' reply to interaction: ${err}`,
              ),
            );
          console.error(
            `Something went wrong while handling application slash commands: ${err}`,
          );
        });
    });
    console.info(`Registered ${commands.length} application commands`);
  }
}

/**
 * Registers an exit handler on `SIGINT` and `SIGTERM` that destroys the given client.
 *
 * @param {Client} client - The client to destroy
 */
function register_process_exit_callback(client: Client) {
  const exit_callback = async () => {
    console.info('Shutdown requested, destroying client.');

    await client
      .destroy()
      .then(() => {
        console.info('Client destroyed. Exiting.');
        process.exit();
      })
      .catch((err) => {
        console.error(`Something went wrong while destroying client: ${err}`);
      });
  };

  process.on('SIGINT', exit_callback.bind(null));
  process.on('SIGTERM', exit_callback.bind(null));

  console.debug('Registered exit command callbacks.');
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

  register_callbacks(client, response_message_structure, commands);

  register_process_exit_callback(client);

  return client;
}
