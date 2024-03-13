import { isAllowedChannel } from './config.js'

// Incredibly important
const logColors = { reset: '\x1b[0m', gray: '\x1b[90m' }
const fmtmsg = (msg) => `${logColors.gray}${msg.length > 100 ? msg.slice(0, 100) + '...' : msg}${logColors.reset}`

export const messageHandler = async (message) => {
  if (message.author.bot) return
  if (!isAllowedChannel(message.channel.id)) {
    console.debug(`Ignoring message from non-allowed channel '${message.channel.id}'`)
    return
  }

  console.debug(`Received message from ${message.member.displayName}: ${fmtmsg(message.content)}`)
  await Promise.all(message.client.games.map(async (game) => game.handleMessage(message)))
}

export const interactionHandler = async (interaction) => {
  if (!interaction.isCommand() || !interaction.isChatInputCommand()) return
  console.debug(`Interaction received: ${fmtmsg(interaction.commandName)}`)

  const command = interaction.client.commands.get(interaction.commandName)
  if (!command) {
    console.error(`No command matching ${interaction.commandName} found.`)
    return
  }

  try {
    await command.execute(interaction)
  } catch (error) {
    console.error(error)
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true })
    } else {
      await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true })
    }
  }
}
