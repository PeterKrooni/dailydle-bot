import {
  Message,
  MessageReaction,
  PartialMessageReaction,
  User,
  PartialUser,
  Client,
  Events,
  CacheType,
  Interaction,
} from 'discord.js';
import Config from './config.js';
import { SlashCommand } from './core/command.js';
import { GameSummaryMessage } from './core/embeds/embed_structure.js';
import Game from './core/game.js';

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
 * Checks whether a message reaction is valid.
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
  const last_message = message_reaction.message.channel.messages?.cache?.last();

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
 * Generates a callback function that validates and matches Discord messages for the given games.
 *
 * @param games A list of games to match messages against
 */
function generate_message_event_callback(
  games: Game[],
): (message: Message<boolean>) => Promise<void> {
  return async (message) => {
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
  };
}

/**
 * Generates a callback function that validates message reactions and sends a game summary
 * response.
 *
 * @param game_summary_message The game summary message to send.
 */
function generate_message_reaction_event_callback(
  game_summary_message: GameSummaryMessage,
): (
  message_reaction: MessageReaction | PartialMessageReaction,
  user: User | PartialUser,
) => Promise<void> {
  return async (message_reaction, user) => {
    if (message_reaction_is_valid(message_reaction, user)) {
      console.info('Valid reaction found, sending summary message.');
      await game_summary_message.send(message_reaction).catch((err) => {
        console.error(
          `Something went wrong while sending game summary message: ${err}`,
        );
      });
    }
  };
}

/**
 * Generates a callback function that handles interaction events.
 *
 * @param commands The interactions to handle.
 */
function generate_interaction_event_callback(
  commands: SlashCommand[],
): (interaction: Interaction<CacheType>) => Promise<void> {
  return async (interaction) => {
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
  };
}

/**
 * Registers Discord callbacks for posted messages and message reactions, as well as
 * slash command handlers - if applicable.
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
    Events.MessageReactionAdd,
    generate_message_reaction_event_callback(game_summary_message),
  );
  console.info(`Registered message reaction callback.`);

  if (commands !== undefined) {
    client.on(
      Events.InteractionCreate,
      generate_interaction_event_callback(commands),
    );
    console.info(`Registered ${commands.length} application command handlers.`);
  }
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
