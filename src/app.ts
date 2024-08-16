import { PermissionFlagsBits } from 'discord.js';
import { init_client } from './client.js';
import Config from './config.js';
import CommandBuilder from './core/builders/command_builder.js';
import { init_database } from './core/database/util.js';
import { GameSummaryMessage } from './core/embed_structure.js';
import * as Gamedle from './games/gamedle.js';
import * as NYT from './games/new_york_times.js';
import { GameEntryModel } from './core/database/schema.js';
import fs from 'node:fs';

Config.load_config();

const response_message_content = () =>
  `**Dailydle** - ${new Date().toLocaleDateString('en-GB', { weekday: 'long', month: 'long', day: 'numeric' })}
  
Share your dailydle scores in this channel to register your entry`;

const response_message = new GameSummaryMessage({
  content: response_message_content,
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

const commands = [
  new CommandBuilder('backup')
    .set_description('Save a backup of the database.')
    .set_permissions(PermissionFlagsBits.Administrator)
    .set_handler(async (interaction) => {
      const data = await GameEntryModel.find({}).exec();
      const filepath = `./dump-${new Date().toISOString().slice(0, 10)}.json`;

      fs.writeFileSync(filepath, JSON.stringify(data), { flag: 'ax' });
      await interaction.reply(`Backed up ${data.length} entries.`);
    })
    .build(),
];

await init_database();

await init_client(
  Config.DISCORD_BOT_TOKEN,
  response_message,
  Config.DISCORD_APPLICATION_ID,
  commands,
);
