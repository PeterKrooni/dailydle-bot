import {
  Message,
  Client,
  Events,
  CacheType,
  Interaction,
} from 'discord.js';
import Config from './config.js';
import { SlashCommand } from './core/command.js';
import { GameSummaryMessage } from './core/embeds/embed_structure.js';
import Game from './core/game.js';
import { SUMMARY_BUTTON_ID } from './core/summary_button.js';

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
 * Generates a callback function that validates and matches Discord messages for the given games.
 *
 * @param games A list of games to match messages against
 */
function generate_message_event_callback(
  games: Game[],
): (message: Message<boolean>) => Promise<void> {
  return async (message) => {
    if (message_is_valid(message)) {

      const resubmitReference
        = process.env.BOT_ADMIN_DISCORD_USER_ID === message.author.id
        && message.content.match(/resubmit/)
        && message.reference?.messageId
      if (resubmitReference) {
            const referencedMessage = await message.channel.messages.fetch(message.reference.messageId);
            message = referencedMessage as Message<boolean>;
      }

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
  };
}

/**
 * Generates a callback function that handles interaction events.
 *
 * Handles two kinds of interaction:
 * - presses of the game summary button, which is attached to every game response, and
 * - application slash commands, if any were registered.
 *
 * @param game_summary_message The game summary message to send when the summary button is pressed.
 * @param commands The slash commands to handle.
 */
function generate_interaction_event_callback(
  game_summary_message: GameSummaryMessage,
  commands?: SlashCommand[],
): (interaction: Interaction<CacheType>) => Promise<void> {
  return async (interaction) => {
    if (interaction.isButton()) {
      if (
        interaction.customId !== SUMMARY_BUTTON_ID ||
        !Config.ENABLED_CHANNEL_IDS.includes(interaction.channelId)
      ) {
        return;
      }

      console.info('Summary button pressed, sending summary message.');
      await game_summary_message.send(interaction).catch((err) => {
        console.error(
          `Something went wrong while sending game summary message: ${err}`,
        );
      });
      return;
    }

    if (!interaction.isChatInputCommand() || commands === undefined) return;

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
  };
}

/**
 * Registers Discord callbacks for posted messages and interactions - the latter covering both the
 * game summary button and slash command handlers, if applicable.
 *
 * @param {Client} client - The Discord client.
 * @param {GameSummaryMessage} game_summary_message - Game summary message to register.
 * @param {SlashCommand[]} [commands] - Optional. Application slash commands to register handlers
 * for.
 */
export function register_client_callbacks(
  client: Client,
  game_summary_message: GameSummaryMessage,
  commands?: SlashCommand[],
) {
  const games = game_summary_message.get_games();
  const game_names = game_summary_message
    .get_games()
    .map((g) => g.name)
    .join(', ');

  client.on(Events.MessageCreate, generate_message_event_callback(games));
  console.info(`Registered callbacks for: ${game_names}.`);

  client.on(
    Events.InteractionCreate,
    generate_interaction_event_callback(game_summary_message, commands),
  );
  console.info(
    `Registered interaction callback for the summary button${
      commands !== undefined
        ? ` and ${commands.length} application command handlers`
        : ''
    }.`,
  );
}

/**
 * Registers an exit handler on `SIGINT` and `SIGTERM` that destroys the given client.
 *
 * @param {Client} client - The client to destroy
 */
export function register_process_exit_callback(client: Client) {
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
