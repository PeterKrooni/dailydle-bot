import Entry from '../../db/models/entry.js'

const GAME_NAME = 'Strands'
const GAME_NR = /[#][0-9]+/g
const RESULT = /[💡🔵🟡]+/

const REGEX_STRANDS = /Strands\s[#][0-9]+\s[“][A-Za-z0-9'!?\s]+[”][\uD83D\uDCA1\uD83D\uDD35\uD83D\uDFE1\s]+/gm

export async function strands(message) {
    const entry = getEntry(message)
    const displayMessage = getDisplayMessage(entry)

    const sent = await message.channel.send(displayMessage)
    sent.react('📋')
    await upsert(entry)
}

export function validMessage(message) {
    return REGEX_STRANDS.test(message)
}

function getEntry(message) {
    const day = message.content.match(GAME_NR)[0].replace('#', '')
    const result = message.content.replace(/\s/g, '').match(RESULT)[0]
    const lightbulbs = result.match(/💡/g)
    const hints_used = lightbulbs === null ? 0 : lightbulbs.length

    const entry = {
        discord_channel_id: message.channel.id,
        discord_message_id: message.id,
        discord_name: message.author.displayName,
        discord_server_profile_name: message.member.displayName,
        discord_author_id: message.member.user.id,
        type: GAME_NAME,
        type_day_number: day,
        score: hints_used,
    }

    return entry
}

function getDisplayMessage(entry) {
    const hints = entry.score
    const displayName = entry.discord_server_profile_name

    if (hints === 0) {
        return `${displayName} got a ✨perfect✨ on ${GAME_NAME} ${entry.type_day_number}`
    }
 
    return `${displayName} did ${GAME_NAME} ${entry.type_day_number} with ${hints} hints`
}

async function upsert(entry) {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    await Entry.findOneAndUpdate({
      createdAt: { $gte: startOfToday },
      type: GAME_NAME,
      discord_author_id: entry.discord_author_id,
      type_day_number: entry.type_day_number
    }, entry, { upsert: true })
}