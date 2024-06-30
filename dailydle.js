import Entry from './db/models/entry.js'

import { links } from './constants.js'
import { enabledChannelID } from './constants.js'

let top_wordle = ''
let top_mini_crossword = ''
let top_connections = ''
let top_strands = ''
let top_normal_gamedle = ''
let top_artwork_gamedle = ''
let top_keyword_gamedle = ''
let top_guess_gamedle = ''

async function loadEntriesForEmbed() {
  top_wordle = ''
  top_mini_crossword = ''
  top_connections = ''
  top_strands = ''
  top_normal_gamedle = ''
  top_artwork_gamedle = ''
  top_keyword_gamedle = ''
  top_guess_gamedle = ''
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
  const strands = dataCopyArray.filter((a) => a.type === 'Strands')
  strands.sort(strandsSort('score'))
  const normalGamedles = dataCopyArray.filter((a) => a.type === 'Gamedle')
  normalGamedles.sort(gamedleSort('score'))
  const artworkGamedles = dataCopyArray.filter((a) => a.type === 'Gamedle (Artwork)')
  artworkGamedles.sort(gamedleSort('score'))
  const keywordGamedles = dataCopyArray.filter((a) => a.type === 'Gamedle (keywords)')
  keywordGamedles.sort(gamedleSort('score'))
  const guessGamedles = dataCopyArray.filter((a) => a.type === 'Gamedle (Guess)')
  guessGamedles.sort(gamedleSort('score'))

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
      top_mini_crossword += '\n+ ' + minicrosswords.length
    }
  })

  iters = 0
  strands.forEach((c) => {
    iters++
    if (iters <= 5) {
      top_strands += '\n' + getEntryAsEmbedLink(c)
    }
    if (iters === 5) {
      top_strands += '\n+ ' + strands.length
    }
  })

  iters = 0
  normalGamedles.forEach((c) => {
    iters++
    if (iters <= 5) {
      top_normal_gamedle += '\n' + getEntryAsEmbedLink(c)
    }
    if (iters === 5) {
      top_normal_gamedle += '\n+ ' + normalGamedles.length
    }
  })

  iters = 0
  artworkGamedles.forEach((c) => {
    iters++
    if (iters <= 5) {
      top_artwork_gamedle += '\n' + getEntryAsEmbedLink(c)
    }
    if (iters === 5) {
      top_artwork_gamedle += '\n+ ' + artworkGamedles.length
    }
  })

  iters = 0
  keywordGamedles.forEach((c) => {
    iters++
    if (iters <= 5) {
      top_keyword_gamedle += '\n' + getEntryAsEmbedLink(c)
    }
    if (iters === 5) {
      top_keyword_gamedle += '\n+ ' + keywordGamedles.length
    }
  })

  iters = 0
  guessGamedles.forEach((c) => {
    iters++
    if (iters <= 5) {
      top_guess_gamedle += '\n' + getEntryAsEmbedLink(c)
    }
    if (iters === 5) {
      top_guess_gamedle += '\n+ ' + guessGamedles.length
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

function strandsSort(field) {
  return wordleSort(field)
}

function gamedleSort(field) {
  // todo idk
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
      text: 'Version 1.1.1',
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
      name: 'Connections',
      value: top_connections,
      inline: true,
    },
    {
      name: 'Strands',
      value: top_strands,
      inline: true,
    },
    {
      name: 'Gamedle (normal)',
      value: top_normal_gamedle,
      inline: false,
    },
    {
      name: 'Gamedle (artwork)',
      value: top_artwork_gamedle,
      inline: false,
    },
    {
      name: 'Gamedle (keyword)',
      value: top_keyword_gamedle,
      inline: false,
    },
    {
      name: 'Gamedle (guess)',
      value: top_guess_gamedle,
      inline: false,
    },
  ]
  return fields
}

function messagePassesContentFilter(message) {
  const content = message.content

  if (enabledChannelID !== message.channel.id) {
    return [false, `Channel ID is not in whitelist. Expected ${enabledChannelID} but recieved ${message.channel.id}`]
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

import * as Wordle from './games/new_york_times/wordle.js'
import * as MiniCrossword from './games/new_york_times/minicrossword.js'
import * as Connections from './games/new_york_times/connections.js'
import * as Strands from './games/new_york_times/strands.js'
import * as Gamedle from './games/gamedle.js'

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

  if (Strands.validMessage(content)) {
    return 'Strands'
  }

  if (Gamedle.validMessage(content)) {
    return 'Gamedle'
  }

  return null
}

// todo delete ealier entries from this bot

import { dumpEntriesToFile } from './debug/dump.js'

export const onChannelMessage = async (message) => {
  const [validMessage, errMsg, gameType] = messagePassesContentFilter(message)

  if (message.content.startsWith('/backup')
    && message.author.id === process.env.ADMIN_DISCORD_USER_ID) {
    await dumpEntriesToFile()
    .then((res) => {
      message.reply(`Backed up ${res} entries.`)
    }).catch((err) => {
      console.error(`Backup failed due to error: ${err}`)
      message.reply('Backup failed. Consult the server logs for more information.')
    })
  }

  if (!validMessage) {
    console.log(`Recived a non-game message, ignoring... (reason: ${errMsg})`) //TODO add a logging lib? e.g Pino 
    return
  }
  
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
        break
      case 'Strands':
        await Strands.strands(message)
        break
      case 'Gamedle':
        await Gamedle.gamedle(message)
        break
    }
  } catch (error) {
    console.error(error)
  }
}

export const onChannelMessageReact = async (reaction_orig, user) => {
  if (!user.bot && enabledChannelID === reaction_orig.message.channel.id) {
    await loadEntriesForEmbed()
    await updateEmbedMessageForChannel(reaction_orig.message)
  }
}

async function updateEmbedMessageForChannel(message) {
  // TODO 2fa
  //message.channel.bulkDelete(5)
  //.then(messages => console.log(`Bulk deleted ${messages.size} messages`))
  //.catch(console.error);
  message.channel.send({ embeds: [getEmbeddList()], components: links })
}
