import Entry from '../db/models/entry.js'

const REGEX_CONNECTIONS = /Connections\s\sPuzzle\s\#(\d+)\s([\uD83D\uDFE6-\uDFEA\s]+)/

export async function connections(message) {
  const connectionsEntry = getConnectionsEntry(message)

  const displayName = connectionsEntry.discord_server_profile_name
  const day = connectionsEntry.type_day_number

  let msg = ''
  if (connectionsEntry.score === 4) {
    msg = `${displayName} failed Connections ${day} after 4 mistakes`
  } else if (connectionsEntry.score === 1) {
    msg = `${displayName} did Connections ${day} with 1 mistake`
  } else {
    msg = `${displayName} did Connections ${day} with ${connectionsEntry.score} mistakes`
  }

  message.channel.send(msg)
  await upsert(connectionsEntry)
}

async function upsert(connectionsEntry) {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  await Entry.findOneAndUpdate({
    createdAt: { $gte: startOfToday },
    type: 'Connections',
    discord_author_id: connectionsEntry.discord_author_id,
    type_day_number: connectionsEntry.type_day_number
  }, connectionsEntry, { upsert: true })
}


function getConnectionsEntry(message) {
  const [day, input] = message.content.match(REGEX_CONNECTIONS).splice(1, 3)

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
  return REGEX_CONNECTIONS.test(message)
}
