import { SlashCommandBuilder } from 'discord.js'
import { getEmbed } from './embed.js'
import { links } from './constants.js'

export const embedCommand = {
  data: new SlashCommandBuilder().setName('embed').setDescription('Sends an embed message.'),
  async execute(interaction) {
    console.log('Embed command received')

    await interaction.reply({
      embeds: [await getEmbed(interaction.client.games)],
      components: links,
    })
  },
}
