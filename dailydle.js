
import Entry from './db/models/entry.js'

import { links } from './constants.js'
import { enabledChannelIDS } from './constants.js'

let top_wordle = ''
let top_mini_crossword = ''
let top_connections = '🛠️'
let top_gamedle = '🛠️'

function sortBy(field) {
  return function(a, b) {
    return (a[field] > b[field]) - (a[field] < b[field])
  };
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
  
function getEmbeddList() {
  return {
      color: 0x498f49,
      author: {
          name: 'Daylidle stat tracker',
          icon_url: 'https://assets-prd.ignimgs.com/2022/04/15/wordle-1650045194490.jpg',
          url: 'https://discord.js.org',
      },
      thumbnail: {
          url: 'https://1000logos.net/wp-content/uploads/2023/05/Wordle-Emblem.png'
      },
      description: 'Dailydle - Fredag 1. mars, 2024',
      fields: getEmbedFields(),
      timestamp: new Date().toISOString(),
      footer: {
          text: 'Version 0.1.0',
          icon_url: 'https://assets-prd.ignimgs.com/2022/04/15/wordle-1650045194490.jpg',
      },
  };
}

function getEmbedFields() {
  const fields = [{
        name: 'Daily high scores',
        value: 'Share your dailydle scores in the channel to register your entry',
    },
    {
        name: 'Wordle',
        value: top_wordle,
        inline: true
    },
    {
        name: 'Mini crossword',
        value: top_mini_crossword,
        inline: true
    },
    {
        name: '',
        value: '',
        inline: false
    },
    {
        name: 'Connections',
        value: top_connections,
        inline: true
    },
    {
        name: 'Gamedle',
        value: top_gamedle,
        inline: true
    }]
  return fields
}

function messagePassesContentFilter(message) {
  const content = message.content
  if (!enabledChannelIDS.includes(message.channel.id)) {
    return [false, 'channelid not in whitelist']
  }
  if (message.author.bot) {
    return [false, 'filtered due to author being a bot']
  }
  if (!content.startsWith('Wordle') && !content.startsWith('https://www.nytimes.com/badges/games/mini.html?d=')) {
    return [false, 'startsWith check failed']
  }
  const re = /Wordle (\d{3,4}) ([X\d])\/\d/g;
  if (!re.test(content) && !content.startsWith('https://www.nytimes.com/badges/games/mini.html?d=')){
    return [false, 'regex invalidated the message']
  }
  if (content.length > 500) {
    return [false, 'message content was too long']
  }
  return [true, '', getGameType(message.content)]
}

function getGameType(content) {
   if (content.startsWith('Wordle')) {
    return 'Wordle'
   } else if (content.startsWith('https://www.nytimes.com/badges/games/mini.html?d=')){
    return 'MiniCrossword'
   }
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

function getEntryAsEmbedLink(entry) {
  return '['
  + entry.discord_server_profile_name 
  + ' | ' 
  + entry.score
  + `](https://discord.com/channels/${entry.discord_author_id}/${entry.discord_channel_id}/${entry.discord_message_id})`
}

// todo delete ealier entries from this bot 

export const onChannelMessage = async(message) => { 
  const filterResult = messagePassesContentFilter(message)
  if (filterResult[0]) {
    try {
      switch (filterResult[2]) {
        case 'Wordle':
          await wordle(message)
          break;
        case 'MiniCrossword':
          await miniCrossword(message)
          break;
      }
      await updateEmbedMessageForChannel(message)
    } catch (error) {
      console.error(error)
    }
  } else {
    console.error(filterResult[1])
  }

  // remove or move this shit
  if (message.content.startsWith('DROP ENTRIES')) {
    await Entry.deleteMany({})
    .then((res) => {
        console.info(res)
        message.channel.send(`\`\`\`Drop completed -${res.deletedCount} entries\`\`\``)
    })
  }
}

async function miniCrossword(message) {
  const miniCrosswordEntry = getMiniCrosswordEntry(message)
  message.channel.send(`${ miniCrosswordEntry.discord_server_profile_name} scored ${miniCrosswordEntry.score} on Mini crossword ${miniCrosswordEntry.type_day_number}`)
  await Entry.create(miniCrosswordEntry)
  top_mini_crossword = ''
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
}

async function updateEmbedMessageForChannel(message) {
  // TODO 2fa
  //message.channel.bulkDelete(5)
  //.then(messages => console.log(`Bulk deleted ${messages.size} messages`))
  //.catch(console.error);
  message.channel.send({ embeds: [getEmbeddList()], components: links });
}

async function wordle(message) {
  const wordleEntry = getWordleEntry(message)
  message.channel.send(`${ wordleEntry.discord_server_profile_name} scored ${wordleEntry.score} on Wordle ${wordleEntry.type_day_number}`)
  await Entry.create(wordleEntry) 
  top_wordle = ''
  const embedLoadData = await loadWordleEntries(true)
  let iters = 0
  embedLoadData.sorted_wordles.forEach(v => {
    iters += 1
    if (iters <= 5) {
      top_wordle += '\n' + getEntryAsEmbedLink(v)
    }
    if (iters === 5) {
      top_wordle += '\n...'
    }
  })
}