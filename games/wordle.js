import Entry from '../db/models/entry.js'

export async function wordle(message) {
  const wordleEntry = getWordleEntry(message)
  message.channel.send(
    `${wordleEntry.discord_server_profile_name} scored ${wordleEntry.score} on Wordle ${wordleEntry.type_day_number}`,
  )
  await Entry.create(wordleEntry)
}

function getWordleEntry(message) {
  const splitContent = message.content.split(' ')
  const wordleScore = splitContent[2].split('\n')[0] ?? splitContent[2]
  const score = wordleScore[0] + wordleScore[1] + wordleScore[2]
  const authorName = message.author.displayName
  const wordleNr = splitContent[1]
  const wordleEntry = {
    discord_channel_id: message.channel.id,
    discord_message_id: message.id,
    discord_name: authorName,
    discord_server_profile_name: message.member.displayName,
    discord_author_id: message.member.user.id,
    type: 'Wordle',
    type_day_number: wordleNr,
    score: score,
  }
  return wordleEntry
}
