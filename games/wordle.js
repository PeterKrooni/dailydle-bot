import Entry from '../db/models/entry.js'

export async function wordle(message) {
  const wordleEntry = getWordleEntry(message)
  message.channel.send(
    `${wordleEntry.discord_server_profile_name} scored ${wordleEntry.score} on Wordle ${wordleEntry.type_day_number}`,
  )
  await Entry.create(wordleEntry)
}

function getWordleEntry(message) {
  // Matches day (e.g. '990') and score/total (e.g. '1/6')
  const re = /Wordle\s(\d+)\s([\dX]\/\d)/

  // slice because the first element is the entire matched region
  const [day, score] = message.content.match(re).slice(1,3)
  
  const wordleEntry = {
    discord_channel_id: message.channel.id,
    discord_message_id: message.id,
    discord_name: message.author.displayName,
    discord_server_profile_name: message.member.displayName,
    discord_author_id: message.member.user.id,
    type: 'Wordle',
    type_day_number: day,
    score: score,
  }
  return wordleEntry
}

export function validMessage(message) {
  const re = /Wordle\s\d+\s[\dX]\/\d/g
  re.test(message)
}
