import { PermissionFlagsBits } from 'discord.js';
import { init_client } from './client.js';
import Config from './config.js';
import CommandBuilder from './core/builders/command_builder.js';
import { init_database } from './core/database/util.js';
import { GameSummaryMessage } from './core/embeds/embed_structure.js';
import * as Gamedle from './games/gamedle.js';
import * as NYT from './games/new_york_times.js';
import * as NRK from './games/nrk.js';
import * as Globle from './games/globle.js';
import { GameEntryModel } from './core/database/schema.js';
import fs from 'node:fs';

// #region Constants

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
      title: 'NRK',
      description: NRK.Description,
      fields: [
        { game: NRK.Tvers, inline: true },
        { game: NRK.Former, inline: true },
      ]
    },
    {
      title: 'Globle',
      description: Globle.Description,
      fields: [
        { game: Globle.Globle, inline: true },
        { game: Globle.GlobleCapitals, inline: true },
      ]
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
    .set_description('Save a raw backup of the database in <APP_ROOT>/dump-<CURRENT_DATE_AS_ISO>.json')
    .set_handler(async (interaction) => {
      if (process.env.BOT_ADMIN_DISCORD_USER_ID === interaction.user.id) {
        const data = await GameEntryModel.find({}).exec();
        const filepath = `./dump-${new Date().toISOString().slice(0, 10)}.json`;

        fs.writeFileSync(filepath, JSON.stringify(data), { flag: 'ax' });
        await interaction.reply(`Backed up ${data.length} entries.`);
      } else {
        await interaction.reply(`Backup failed: you are not on the server side whitelist for running backups.`);
      }
    })
    .build(),
  new CommandBuilder('weekly')
    .set_description('Posts a weekly summary of your scores.')
    .set_handler(async (interaction) => {
      await interaction.reply('TODO.')
    })
    .build(),
];

// #endregion

Config.load_config();

await init_database();

await init_client(
  Config.DISCORD_BOT_TOKEN,
  response_message,
  Config.DISCORD_APPLICATION_ID,
  commands,
);
