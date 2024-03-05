import Entry from '../db/models/entry.js'

export async function connections(message) {
  const connectionsEntry = getConnectionsEntry(message)

  const displayName = connectionsEntry.discord_server_profile_name
  const day = connectionsEntry.type_day_number

  let msg = ''
  if (connectionsEntry.score === 4) {
    msg `${displayName} failed Connections ${day} after 4 mistakes`
  } else if (connectionsEntry.score === 1) {
    msg = `${displayName} did Connections ${day} with 1 mistake`
  } else {
    msg = `${displayName} did Connections ${day} with ${connectionsEntry.score} mistakes`
  }

  message.channel.send(msg)
  await Entry.create(connectionsEntry)
}

function getConnectionsEntry(message) {
  const re = /Connections\s\sPuzzle\s\#(\d+)\s([\uD83D\uDFE6-\uDFEA\s]+)/
  const [day, input] = message.match(re).splice(1, 3)

  const score = input.split('\n').reduce((sum, line) => sum += new Set(line.trim().split('\uD83D').filter((n) => n !== '')).size == 1 ? 0 : 1, 0)

  const connectionsEntry = {
    discord_channel_id: message.channel.id,
    discord_message_id: message.id,
    discord_name: message.author.displayName,
    discord_server_profile_name: message.member.displayName,
    discord_author_id: message.member.user.id,
    type: 'Connections',
    type_day_number: day,
    score: score,
  }
  return connectionsEntry
}

export function validMessage(message) {
  const re = /Connections\s\nPuzzle\s\#\d+/g
  return re.test(message)
}
