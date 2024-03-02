import Entry from '../db/models/entry.js'

export async function connections(message) {
    const connectionsEntry = getConnectionsEntry(message)
    if (connectionsEntry.score === 4) {
        message.channel.send(`${ connectionsEntry.discord_server_profile_name} failed Connections ${connectionsEntry.type_day_number} after ${connectionsEntry.score} mistakes`)
    } else if (connectionsEntry.score === 1) {
        message.channel.send(`${ connectionsEntry.discord_server_profile_name} did Connections ${connectionsEntry.type_day_number} with ${connectionsEntry.score} mistake`)   
    } else {
        message.channel.send(`${ connectionsEntry.discord_server_profile_name} did Connections ${connectionsEntry.type_day_number} with ${connectionsEntry.score} mistakes`)   
    }
    await Entry.create(connectionsEntry)
}

function getConnectionsEntry(message) {
    const connectionsNr = message.content.split('\n')[1].split('Puzzle #')[1]
    const inputArray = message.content.split('Puzzle #'+connectionsNr)[1]
    let score = 0
    inputArray.split('\n').forEach(ia => {
        let iats = ia.trim().split('\ud83d')
        if (iats.length === 5) {
            iats.shift()
            score += [...new Set(iats.filter(i => i!=='' && i!=['','']&&i!=[]))].length === 1 ? 0 : 1 
        }   
    })
    const authorName = message.author.displayName
    const connectionsEntry = {
      discord_channel_id: message.channel.id,
      discord_message_id: message.id ,
      discord_name: authorName,
      discord_server_profile_name: message.member.displayName,
      discord_author_id: message.member.user.id,
      type: "Connections",
      type_day_number: connectionsNr,
      score: score,
    }
    return connectionsEntry
}
