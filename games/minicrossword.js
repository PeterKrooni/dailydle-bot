import Entry from '../db/models/entry.js'

export async function miniCrossword(message) {
  const miniCrosswordEntry = getMiniCrosswordEntry(message)
  message.channel.send(
    `${miniCrosswordEntry.discord_server_profile_name} did Mini crossword ${miniCrosswordEntry.type_day_number} in ${miniCrosswordEntry.score} seconds`,
  )
  await Entry.create(miniCrosswordEntry)
}

function getMiniCrosswordEntry(message) {
  const score = message.content.split('&t=')[1]?.split('&c=')[0]
  const miniCrosswordNr = message.content.split('html?d=')[1]?.split('&t=' + score)[0]
  const authorName = message.author.displayName
  const miniCrosswordEntry = {
    discord_channel_id: message.channel.id,
    discord_message_id: message.id,
    discord_name: authorName,
    discord_server_profile_name: message.member.displayName,
    discord_author_id: message.member.user.id,
    type: 'MiniCrossword',
    type_day_number: miniCrosswordNr,
    score: score,
  }
  return miniCrosswordEntry
}
