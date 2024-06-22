import Entry from '../../db/models/entry.js'

const REGEX_MINI_CROSSWORD = /https:\/\/www\.nytimes\.com\/.*\?d=([\d-]+)&t=(\d+)/

export async function miniCrossword(message) {
  const miniCrosswordEntry = getMiniCrosswordEntry(message)
  const sent = await message.channel.send(
    `${miniCrosswordEntry.discord_server_profile_name} did Mini crossword ${miniCrosswordEntry.type_day_number} in ${miniCrosswordEntry.score} seconds`,
  )
  sent.react('📋')
  await upsert(miniCrosswordEntry)
}

async function upsert(miniCrosswordEntry) {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  await Entry.findOneAndUpdate({
    createdAt: { $gte: startOfToday },
    type: 'MiniCrossword',
    discord_author_id: miniCrosswordEntry.discord_author_id,
    type_day_number: miniCrosswordEntry.type_day_number
  }, miniCrosswordEntry, { upsert: true })
}


function getMiniCrosswordEntry(message) {
  // Matches day (e.g. '2024-03-05') and time (e.g. '59')
  const [day, score] = message.content.match(REGEX_MINI_CROSSWORD).slice(1, 3)

  const miniCrosswordEntry = {
    discord_channel_id: message.channel.id,
    discord_message_id: message.id,
    discord_name: message.author.displayName,
    discord_server_profile_name: message.member.displayName,
    discord_author_id: message.member.user.id,
    type: 'MiniCrossword',
    type_day_number: day,
    score: score,
  }
  return miniCrosswordEntry
}

export function validMessage(message) {
  return REGEX_MINI_CROSSWORD.test(message)
}
