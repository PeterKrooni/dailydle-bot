import Entry from '../db/models/entry.js'

const REGEX_MINI_CROSSWORD = /https:\/\/www\.nytimes\.com\/.*\?d=([\d-]+)&t=(\d+)/

export async function miniCrossword(message) {
  const miniCrosswordEntry = getMiniCrosswordEntry(message)
  message.channel.send(
    `${miniCrosswordEntry.discord_server_profile_name} did Mini crossword ${miniCrosswordEntry.type_day_number} in ${miniCrosswordEntry.score} seconds`,
  )
  await Entry.create(miniCrosswordEntry)
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
