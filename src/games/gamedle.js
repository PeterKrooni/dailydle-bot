import Entry from '../db/schema.js'
import { toEntry, upsertEntry } from '../db/util.js'

async function handleMessage(gamemode, regex, message) {
  const match = message.content.match(regex)
  const { day, score } = match ? { day: match[1], score: match[2].split('🟩')[0].length / 2 + 1 } : {}

  if (day === undefined || score === undefined) {
    return
  } else {
    const entry = toEntry(message, gamemode, day, score)
    await upsertEntry(entry)
    return entry
  }
}

function formatReply(gamemode, entry, maxAttempts = 6) {
  if (entry.score >= maxAttempts) {
    return `failed ${gamemode}`
  } else {
    return `completed ${gamemode} in ${entry.score} attempts`
  }
}

async function getFormattedTopScores(gamemode, maxAttempts = 6) {
  const today = new Date().toISOString().split('T')[0]
  const entries = await Entry.find({ game: gamemode, createdAt: { $gte: today } }).exec()

  return entries
    .sort((a, b) => a.score - b.score)
    .map((entry) => {
      const score = entry.score >= maxAttempts ? 'X' : entry.score
      const msgLink = `https://discord.com/channels/${entry.user.id}/${entry.channel_id}/${entry.message_id}`
      return `[${entry.user.server_name} | ${score}/${maxAttempts} ](${msgLink})`
    })
    .join('\n')
}

async function toEmbedField(gamemode, fieldOrder, maxAttempts = 6) {
  return {
    name: `Gamedle (${gamemode})`,
    value: await getFormattedTopScores(gamemode, maxAttempts),
    inline: false,
    order: fieldOrder,
  }
}

const gamemodes = [
  {
    name: 'Classic',
    handleMessage: (message) => handleMessage('Classic', /Gamedle: (\d{2}\/\d{2}\/\d{4}) (.*) >/, message),
    formatReply: (entry) => formatReply('Classic', entry),
    toEmbedField: (n = 0) => toEmbedField('Classic', 0 + n),
  },
  {
    name: 'Artwork mode',
    handleMessage: (message) =>
      handleMessage('Artwork mode', /Gamedle \([Aa]rtwork mode\): (\d{2}\/\d{2}\/\d{4}) (.*) >/, message),
    formatReply: (entry) => formatReply('Artwork mode', entry),
    toEmbedField: (n = 0) => toEmbedField('Artwork mode', 1 + n),
  },
  {
    name: 'Keywords mode',
    handleMessage: (message) =>
      handleMessage('Keywords mode', /Gamedle \([Kk]eywords mode\): (\d{2}\/\d{2}\/\d{4}) (.*) >/, message),
    formatReply: (entry) => formatReply('Keywords mode', entry),
    toEmbedField: (n = 0) => toEmbedField('Keywords mode', 2 + n),
  },
  {
    name: 'Guess mode',
    handleMessage: (message) =>
      handleMessage('Guess mode', /Gamedle \([Gg]uess mode\): (\d{2}\/\d{2}\/\d{4}) (.*) >/, message),
    formatReply: (entry) => formatReply('Guess mode', entry, 10),
    toEmbedField: (n = 0) => toEmbedField('Guess mode', 3 + n, 10),
  },
]

export const Gamedle = {
  handleMessage: async function (message) {
    let validModes = []
    let replies = []

    for (const gamemode of gamemodes) {
      const entry = await gamemode.handleMessage(message)
      if (entry !== undefined) {
        validModes.push(gamemode.name)
        replies.push(gamemode.formatReply(entry))
      }
    }

    if (validModes.length > 0) {
      console.debug(`Received valid Gamedle (${validModes.join(', ')}) message`)
    } else {
      console.debug(`Message is invalid for game Gamedle`)
    }

    if (replies.length > 0) {
      await message.reply(`${message.member.displayName} ${replies.join(', ')}`)
    }
  },
  toEmbedField: async function () {
    return await Promise.all(gamemodes.map((gamemode) => gamemode.toEmbedField(4))) // Hardcoded order offset for now
  },
}

export default Gamedle
