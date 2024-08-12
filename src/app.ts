import { init_client } from './client.js';
import Config from './config.js';
import { GameSummaryMessage } from './core/embed_structure.js';
import * as Gamedle from './games/gamedle.js';
import * as NYT from './games/new_york_times.js';

Config.load_config();

const response_message = new GameSummaryMessage({
  content: () =>
    `**Dailydle** - ${new Date().toLocaleDateString('en-GB', { weekday: 'long', month: 'long', day: 'numeric' })}`,
  embeds: [
    {
      title: 'New York Times',
      description: NYT.Description,
      fields: [
        { game: NYT.Wordle, inline: true },
        { game: NYT.Connections, inline: true },
        { game: NYT.TheMini, inline: true },
        { game: NYT.Strands, inline: true },
      ],
    },
    {
      title: 'Gamedle',
      description: Gamedle.Description,
      fields: [
        { game: Gamedle.Classic, inline: true },
        { game: Gamedle.Artwork, inline: true },
        { game: Gamedle.Keywords, inline: true },
        { game: Gamedle.Guess, inline: true },
      ],
    },
  ],
});

const client = await init_client(
  Config.discord_bot_token,
  Config.discord_oauth2_client_id,
  [],
  response_message
);
