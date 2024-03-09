import Entry from '../db/models/entry.js'

const REGEX_GAMEDLE = /Gamedle\s{0,1}(?:|\((\w+) mode\)): (\d{2}\/\d{2}\/\d{4}) (.*) >/

export async function gamedle(message) {
  const gamedleEntry = getGamedleEntry(message)
  const displayName = gamedleEntry.discord_server_profile_name
  const day = gamedleEntry.type_day_number
  const type = gamedleEntry.type
  const score = gamedleEntry.score

  const sent = await message.channel.send(`${displayName} completed ${type} ${day}: ${score}`)
  message.react('✅')
  sent.react('📋')
  await upsert(gamedleEntry)
}

async function upsert(gamedleEntry) {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  await Entry.findOneAndUpdate({
    createdAt: { $gte: startOfToday },
    type: gamedleEntry.type,
    discord_author_id: gamedleEntry.discord_author_id,
    type_day_number: gamedleEntry.type_day_number
  }, gamedleEntry, { upsert: true })
}


function getGamedleEntry(message) {

  const mode = message.content.match(REGEX_GAMEDLE)[1] 
  const day = message.content.match(REGEX_GAMEDLE)[2]
  const input = message.content.match(REGEX_GAMEDLE)[3]

  const attempts = input.split('⬜').reduce((sum,line)=>sum+=line===''?1:0,0)
  const failed = new Set(input).size === 1
  const score = `${attempts} tries left (${failed?'lost':'won'})`

  const gamedleEntry = {
    discord_channel_id: message.channel.id,
    discord_message_id: message.id,
    discord_name: message.author.displayName,
    discord_server_profile_name: message.member.displayName,
    discord_author_id: message.member.user.id,
    type: 'Gamedle' + (mode !== undefined ? (' (' + mode + ')') : ''),
    type_day_number: day,
    score: score
  }
  return gamedleEntry
}

export function validMessage(message) {
  return REGEX_GAMEDLE.test(message)
}
