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
import { GameEntry, GameEntryModel } from './core/database/schema.js';
import fs from 'node:fs';
import { generate_weekly_chart } from './charts/weekly_chart.js';
import { generate_mock_data } from './test/generate_mock_data.js';

// #region Constants

const response_message_content = () =>
  `**Dailydle** - ${new Date().toLocaleDateString('en-GB', { weekday: 'long', month: 'long', day: 'numeric' })}
  
Share your dailydle scores in this channel to register your entry`;

const enable_dev_features = process.argv.includes('--dev')
if (enable_dev_features) {
  console.info('\x1b[36m%s\x1b[0m', 'Development features are enabled (found --dev in application parameters)')
} 

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

const bot_commands = [
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
    .set_description('Posts a weekly summary scores for a specific gammode (only Wordle currently).')
    .set_handler(async (interaction) => {
      await generate_weekly_chart("Wordle")
      await interaction.reply({files: [{attachment: './generated_chart.png'}]})
    })
    .build(),
];

const dev_commands = [
  new CommandBuilder('mock')
    .set_description('Generate test data.')
    .set_handler(async (interaction) => {
      const enable_dev_features = process.argv.includes('--dev')
      // dev: insert mock data directly into db, since it uses an in memory database for dev and it gets wiped on every rerun
      if (enable_dev_features) {
        await generate_mock_data()
          .then((res) => interaction.reply(res))
          .catch((err) => interaction.reply(`Failed to created mock data. Error: ${err}`))
      } else {
        await interaction.reply('Error: This command should only be available when running --dev mode.')
      }
    })
    .build(),
]

// #endregion

Config.load_config();

await init_database();

const populate_dev_db_with_mockdata_on_startup = process.argv.includes('--populate-db-with-mock-data')

if (enable_dev_features && populate_dev_db_with_mockdata_on_startup) {
  await generate_mock_data()
    .then((res) => console.log(`\x1b[36m%s\x1b[0m`,`--dev: ${res}`))
    .catch((err) => console.log(`Failed to created mock data. Error: ${err}`))
}

await init_client(
  Config.DISCORD_BOT_TOKEN,
  response_message,
  Config.DISCORD_APPLICATION_ID,
  enable_dev_features ? bot_commands.concat(dev_commands) : bot_commands,
);
