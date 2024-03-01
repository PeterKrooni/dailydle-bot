import Entry from '../db/models/entry.js'

export async function wordle(message) {
    const wordleEntry = getWordleEntry(message)
    message.channel.send(`${ wordleEntry.discord_server_profile_name} scored ${wordleEntry.score} on Wordle ${wordleEntry.type_day_number}`)
    await Entry.create(wordleEntry) 
    let top_wordle = ''
    const embedLoadData = await loadWordleEntries(true)
    let iters = 0
    embedLoadData.sorted_wordles.forEach(v => {
      iters += 1
      if (iters <= 5) {
        top_wordle += '\n' + getEntryAsEmbedLink(v)
      }
      if (iters === 5) {
        top_wordle += '\n + ' + embedLoadData.sorted_wordles.length
      }
    })
    return top_wordle
}

function getWordleEntry(message) {
    const splitContent = message.content.split(' ')
    const wordleScore = splitContent[2].split('\n')[0] ?? splitContent[2]
    const score = wordleScore[0] + wordleScore[1] + wordleScore[2]
    const authorName = message.author.displayName
    const wordleNr = splitContent[1]
    const wordleEntry = {
      discord_channel_id: message.channel.id,
      discord_message_id: message.id ,
      discord_name: authorName,
      discord_server_profile_name: message.member.displayName,
      discord_author_id: message.member.user.id,
      type: "Wordle",
      type_day_number: wordleNr,
      score: score,
    }
    return wordleEntry
  }

  async function loadWordleEntries(today) {
    if (!today) {
        const data = await Entry.find()
        return data
    }
    const res = {}

    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const data = await Entry.find({createdAt: {$gte: startOfToday}})

    const dataCopy = JSON.parse(JSON.stringify(data))
    const dataCopyArray = Object.values(dataCopy)
    const wordles = dataCopyArray.filter(a => a.type === 'Wordle') 
    wordles.sort(sortBy('score'))

    res.sorted_wordles = wordles
    res.top_wordle = wordles[0]
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