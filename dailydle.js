
import Entry from './db/models/entry.js'

import { links } from './constants.js'
import { enabledChannelIDS } from './constants.js'

let top_wordle = ''
let top_mini_crossword = ''
let top_connections = ''
let top_gamedle = '🛠️'
  
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
          text: 'Version 0.1.1',
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
          .then((res) => {
            top_wordle = res
          })
          break;
        case 'MiniCrossword':
          await miniCrossword(message)
          .then((res) => {
            top_mini_crossword = res
          })
          break;
        case "Connections":
          await connections(message)
          .then((res) => {
            top_connections = res
          })
      }
      await updateEmbedMessageForChannel(message)
    } catch (error) {
      console.error(error)
    }
  } else {
    console.error(filterResult[1])
  }

  // remove or move this shit
  if (message.content.startsWith('DROP ENTRIES') && message.message.user.id.startsWith('179293169849')) {
    await Entry.deleteMany({})
    .then((res) => {
        console.info(res)
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
