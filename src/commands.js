import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js'
import { embedMessageComponents, getEmbed } from './embed.js'
import Entry from './db/schema.js'

export const embedCommand = {
  data: new SlashCommandBuilder().setName('embed').setDescription('Sends an embed message.'),
  async execute(interaction) {
    console.info('Embed command received')

    await interaction.reply({
      embeds: [await getEmbed(interaction.client.games)],
      components: embedMessageComponents,
    })
  },
}

export const dropEntriesCommand = {
  data: new SlashCommandBuilder()
    .setName('drop')
    .setDescription('Drops entries from the database.')
    .addStringOption((option) =>
      option
        .setName('mode')
        .setDescription('The mode to drop entries for.')
        .addChoices(
          { name: 'Wordle', value: 'Wordle' },
          { name: 'Connections', value: 'Connections' },
          { name: 'Mini Crossword', value: 'Mini Crossword' },
          { name: 'Gamedle', value: 'Gamedle' },
          { name: 'All', value: 'All' }
        )
        .setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    console.info('Delete command received')
    const mode = interaction.options.getString('mode')
    options = { game: mode }
    if (mode === 'All') {
      console.warn('Deleting all entries')
    } else {
      console.info(`Deleting entries for mode ${mode}`)
    }

    await Entry.deleteMany(options)
      .then((result) => {
        console.info(`Deleted ${result.deletedCount} entries`)
        interaction.reply({ content: `Deleted ${result.deletedCount} entries.`, ephemeral: true })
      })
      .catch((err) => {
        console.error(err)
        interaction.reply({ content: 'There was an error while deleting the entries.', ephemeral: true })
      })
  },
}
