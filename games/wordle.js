import Entry from '../db/models/entry.js'

const REGEX_WORDLE = /Wordle\s(\d+)\s([\dX]\/\d)/

export async function wordle(message) {
  const wordleEntry = getWordleEntry(message)
  
  message.channel.send(
    `${wordleEntry.discord_server_profile_name} scored ${wordleEntry.score} on Wordle ${wordleEntry.type_day_number}`,
  )

  await Entry.create(wordleEntry)
}

function getWordleEntry(message) {
  // Matches day (e.g. '990') and score/total (e.g. '1/6')
  const [day, score] = message.content.match(REGEX_WORDLE).slice(1,3)
  
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
  return REGEX_WORDLE.test(message)
}
