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
    let top_mini_crossword = ''
    const embedLoadData = await loadConnectionsEntries()
    let iters = 0
    embedLoadData.sorted_connections.forEach(v => {
      iters += 1
      if (iters <= 5) {
        top_mini_crossword += '\n' + getEntryAsEmbedLink(v)
      }
      if (iters === 5) {
        top_mini_crossword += '\n + ' + embedLoadData.sorted_connections.length
      }
    })
    return top_mini_crossword
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

async function loadConnectionsEntries() {
    const res = {}
  
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const data = await Entry.find({createdAt: {$gte: startOfToday}})
  
    const dataCopy = JSON.parse(JSON.stringify(data))
    const dataCopyArray = Object.values(dataCopy)
    const connections = dataCopyArray.filter(a => a.type === 'Connections') 
    connections.sort(sortBy('score'))
  
    res.sorted_connections = connections
    res.top_connections = connections[0]
    return res
}

function sortBy(field) {
    return function(a, b) {
      return (a[field] > b[field]) - (a[field] < b[field])
    };
}

function getEntryAsEmbedLink(entry) {
    return '['
    + entry.discord_server_profile_name 
    + ' | ' 
    + entry.score
    + `](https://discord.com/channels/${entry.discord_author_id}/${entry.discord_channel_id}/${entry.discord_message_id})`
  }