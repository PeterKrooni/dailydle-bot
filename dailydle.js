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
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const data = await Entry.find({ createdAt: { $gte: startOfToday } })
  const dataCopy = JSON.parse(JSON.stringify(data))
  const dataCopyArray = Object.values(dataCopy)
  const connections = dataCopyArray.filter((a) => a.type === 'Connections')
  connections.sort(connectionsSort('score'))
  const wordles = dataCopyArray.filter((a) => a.type === 'Wordle')
  wordles.sort(wordleSort('score'))
  const minicrosswords = dataCopyArray.filter((a) => a.type === 'MiniCrossword')
  minicrosswords.sort(miniCrosswordsSort('score'))

  let iters = 0
  connections.forEach((c) => {
    iters++
    if (iters <= 5) {
      top_connections += '\n' + getEntryAsEmbedLink(c)
    }
    if (iters === 5) {
      top_connections += '\n+ ' + connections.length
    }
  })

  iters = 0
  wordles.forEach((c) => {
    iters++
    if (iters <= 5) {
      top_wordle += '\n' + getEntryAsEmbedLink(c)
    }
    if (iters === 5) {
      top_wordle += '\n+ ' + wordles.length
    }
  })

  iters = 0
  minicrosswords.forEach((c) => {
    iters++
    if (iters <= 5) {
      top_mini_crossword += '\n' + getEntryAsEmbedLink(c)
    }
    if (iters === 5) {
      top_connections += '\n+ ' + minicrosswords.length
    }
  })
}

function getEntryAsEmbedLink(entry) {
  return (
    '[' +
    entry.discord_server_profile_name +
    ' | ' +
    entry.score +
    `](https://discord.com/channels/${entry.discord_author_id}/${entry.discord_channel_id}/${entry.discord_message_id})`
  )
}

function wordleSort(field) {
  return function (a, b) {
    // Elements coming from JSON entries are strings, convert to integers.
    let x = parseInt(a[field])
    let y = parseInt(b[field])

    // The order we want is: `1, 2, 3, 4, 5, 6, X`, so we always say NaN
    // values ('X') are larger, otherwise sort as usual.
    return isNaN(x) ? 1 : isNaN(y) ? -1 : x - y
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
      url: 'https://1000logos.net/wp-content/uploads/2023/05/Wordle-Emblem.png',
    },
    description:
      'Dailydle - ' +
      new Date().toLocaleString('no-nb', {
        weekday: 'long',
        day: 'numeric',
        year: 'numeric',
        month: 'long',
      }),
    fields: getEmbedFields(),
    timestamp: new Date().toISOString(),
    footer: {
      text: 'Version 0.1.2',
      icon_url: 'https://assets-prd.ignimgs.com/2022/04/15/wordle-1650045194490.jpg',
    },
  }
}

function getEmbedFields() {
  const fields = [
    {
      name: 'Daily high scores',
      value: 'Share your dailydle scores in the channel to register your entry',
    },
    {
      name: 'Wordle',
      value: top_wordle,
      inline: true,
    },
    {
      name: 'Mini crossword',
      value: top_mini_crossword,
      inline: true,
    },
    {
      name: '',
      value: '',
      inline: false,
    },
    {
      name: 'Connections',
      value: top_connections,
      inline: true,
    },
    {
      name: 'Gamedle',
      value: top_gamedle,
      inline: true,
    },
  ]
  return fields
}

function messagePassesContentFilter(message) {
  const content = message.content

  if (!enabledChannelIDS.includes(message.channel.id)) {
    return [false, 'Channel ID is not in whitelist']
  }

  if (message.author.bot) {
    return [false, 'Message author is a bot']
  }

  if (content.length > 500) {
    return [false, 'Message content was too long']
  }

  const gameType = getGameType(content)
  if (gameType === null) {
    return [false, 'Could not determine game type']
  }

  return [true, '', gameType]
}

import * as Wordle from './games/wordle.js'
import * as MiniCrossword from './games/minicrossword.js'
import * as Connections from './games/connections.js'

function getGameType(content) {
  if (Wordle.validMessage(content)) {
    return 'Wordle'
  }

  if (MiniCrossword.validMessage(content)) {
    return 'MiniCrossword'
  }

  if (Connections.validMessage(content)) {
    return 'Connections'
  }
}

// todo delete ealier entries from this bot


export const onChannelMessage = async (message) => {
  const [validMessage, errMsg, gameType] = messagePassesContentFilter(message)
  if (validMessage) {
    try {
      switch (gameType) {
        case 'Wordle':
          await Wordle.wordle(message)
          break
        case 'MiniCrossword':
          await MiniCrossword.miniCrossword(message)
          break
        case 'Connections':
          await Connections.connections(message)
      }
      await loadEntriesForEmbed()
      await updateEmbedMessageForChannel(message)
    } catch (error) {
      console.error(error)
    }
  } else {
    console.error(`Message filter failed: ${errMsg}`)
  }

  // filtering here doesnt work
  if (
    message.channel.id == '1211255793622454273' &&
    message.content.startsWith('DROP ENTRIES') &&
    message.member?.user?.id?.startsWith('179293169849')
  ) {
    await Entry.deleteMany({}).then((res) => {
      message.channel.send(`\`\`\`Drop completed -${res.deletedCount} entries\`\`\``)
    })
  }
}

async function updateEmbedMessageForChannel(message) {
  // TODO 2fa
  //message.channel.bulkDelete(5)
  //.then(messages => console.log(`Bulk deleted ${messages.size} messages`))
  //.catch(console.error);
  message.channel.send({ embeds: [getEmbeddList()], components: links })
}
