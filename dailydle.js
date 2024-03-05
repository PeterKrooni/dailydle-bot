
import Entry from './db/models/entry.js'

import { links } from './constants.js'
import { enabledChannelIDS } from './constants.js'

let top_wordle = ''
let top_mini_crossword = ''
let top_connections = ''
let top_gamedle = '🛠️'
  
async function loadEntriesForEmbed() {
  top_wordle = ''
  top_mini_crossword = ''
  top_connections = ''
  top_gamedle = '🛠️'
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const data = await Entry.find({createdAt: {$gte: startOfToday}})
  const dataCopy = JSON.parse(JSON.stringify(data))
  const dataCopyArray = Object.values(dataCopy)
  const connections = dataCopyArray.filter(a => a.type === 'Connections') 
  connections.sort(connectionsSort('score'))
  const wordles = dataCopyArray.filter(a => a.type === 'Wordle') 
  wordles.sort(wordleSort('score'))
  const minicrosswords = dataCopyArray.filter(a => a.type === 'MiniCrossword') 
  minicrosswords.sort(miniCrosswordsSort('score'))
  
  let iters = 0
  connections.forEach(c => {
    iters ++
    if (iters <= 5) {
      top_connections += '\n' + getEntryAsEmbedLink(c)
    }
    if (iters === 5) {
      top_connections += '\n+ ' + connections.length
    }
  })
    
  iters = 0
  wordles.forEach(c => {
    iters ++
    if (iters <= 5) {
      top_wordle += '\n' + getEntryAsEmbedLink(c)
    }
    if (iters === 5) {
      top_wordle += '\n+ ' + wordles.length
    }
  })
    
  iters = 0
  minicrosswords.forEach(c => {
    iters ++
    if (iters <= 5) {
      top_mini_crossword += '\n' + getEntryAsEmbedLink(c)
    }
    if (iters === 5) {
      top_connections += '\n+ ' + minicrosswords.length
    }
  })
  
}

function getEntryAsEmbedLink(entry) {
  return '['
  + entry.discord_server_profile_name 
  + ' | ' 
  + entry.score
  + `](https://discord.com/channels/${entry.discord_author_id}/${entry.discord_channel_id}/${entry.discord_message_id})`
}

function wordleSort(field) {
  return function(a, b) {
    // Elements coming from JSON entries are strings, convert to integers.
    let x = parseInt(a[field])
    let y = parseInt(b[field])

    // The order we want is: `1, 2, 3, 4, 5, 6, X`, so we always say NaN
    // values ('X') are larger, otherwise sort as usual.
    return (isNaN(x) ? 1 : (isNaN(y) ? -1 : x - y))
  }
}
function connectionsSort(field) {
  // If we get a NaN value here something's fucked, just put it at the 
  // end of the list 😊 otherwise we want ascending order, so wordleSort
  // works fine:
  return wordleSort(field)
}
function miniCrosswordsSort(field) {
  // If we get a NaN value here something's fucked, just put it at the 
  // end of the list 😊 otherwise we want ascending order, so wordleSort
  // works fine:
  return wordleSort(field)
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
      description: 'Dailydle - ' + new Date().toLocaleString('no-nb', {weekday:'long', day:'numeric', year:'numeric', month:'long'}),
      fields: getEmbedFields(),
      timestamp: new Date().toISOString(),
      footer: {
          text: 'Version 0.1.2',
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
  if (!content.startsWith('Wordle') && !content.startsWith('https://www.nytimes.com/badges/games/mini.html?d=') && !content.startsWith("Connections")) {
    return [false, 'startsWith check failed']
  }
  const mcRe = /https:\/\/www\.nytimes\.com\/.*&t=(\d+).*/g
  const re = /Wordle (\d{3,4}) ([X\d])\/\d/g;
  if (!re.test(content) && !content.startsWith('https://www.nytimes.com/badges/games/mini.html?d=') && !content.startsWith("Connections")){
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
   } else if (content.startsWith("Connections")) {
    return "Connections"
   }
}

// todo delete ealier entries from this bot 

import { wordle } from './games/wordle.js'
import { miniCrossword } from './games/minicrossword.js'
import { connections } from './games/connections.js'

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
        case "Connections":
          await connections(message)
      }
      await loadEntriesForEmbed()
      await updateEmbedMessageForChannel(message)
    } catch (error) {
      console.error(error)
    }
  } else {
    console.error(filterResult[1])
  }

  // filtering here doesnt work
  if (message.channel.id == '1211255793622454273' && message.content.startsWith('DROP ENTRIES') && message.member?.user?.id?.startsWith('179293169849')) {
    await Entry.deleteMany({})
    .then((res) => {
        message.channel.send(`\`\`\`Drop completed -${res.deletedCount} entries\`\`\``)
    })
  }
}

async function updateEmbedMessageForChannel(message) {
  // TODO 2fa
  //message.channel.bulkDelete(5)
  //.then(messages => console.log(`Bulk deleted ${messages.size} messages`))
  //.catch(console.error);
  message.channel.send({ embeds: [getEmbeddList()], components: links });
}
