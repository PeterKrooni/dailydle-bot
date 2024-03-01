import Entry from '../db/models/entry.js'

export async function miniCrossword(message) {
    const miniCrosswordEntry = getMiniCrosswordEntry(message)
    message.channel.send(`${ miniCrosswordEntry.discord_server_profile_name} did Mini crossword ${miniCrosswordEntry.type_day_number} in ${miniCrosswordEntry.score} seconds`)
    await Entry.create(miniCrosswordEntry)
    let top_mini_crossword = ''
    const embedLoadData = await loadMiniCrosswordEntries()
    let iters = 0
    embedLoadData.sorted_minicrosswords.forEach(v => {
      iters += 1
      if (iters <= 5) {
        top_mini_crossword += '\n' + getEntryAsEmbedLink(v)
      }
      if (iters === 5) {
        top_mini_crossword += '\n...'
      }
    })
    return top_mini_crossword
}

function getMiniCrosswordEntry(message) {
    const score = message.content.split('&t=')[1]?.split('&c=')[0]
    const authorName = message.author.displayName
    const miniCrosswordNr = message.content.split('html?d=')[1]?.split('&t='+score)[0]
    const miniCrosswordEntry = {
      discord_channel_id: message.channel.id,
      discord_message_id: message.id ,
      discord_name: authorName,
      discord_server_profile_name: message.member.displayName,
      discord_author_id: message.member.user.id,
      type: "MiniCrossword",
      type_day_number: miniCrosswordNr,
      score: score,
    }
    return miniCrosswordEntry
}

async function loadMiniCrosswordEntries() {
    const res = {}
  
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const data = await Entry.find({createdAt: {$gte: startOfToday}})
  
    const dataCopy = JSON.parse(JSON.stringify(data))
    const dataCopyArray = Object.values(dataCopy)
    const minicrosswords = dataCopyArray.filter(a => a.type === 'MiniCrossword') 
    minicrosswords.sort(sortBy('score'))
  
    res.sorted_minicrosswords = minicrosswords
    res.top_minicrossword = minicrosswords[0]
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