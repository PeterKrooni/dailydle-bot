
import Entry from './db/models/entry.js'

import { links } from './constants.js'
import { enabledChannelIDS } from './constants.js'

let top_wordle = '...'
let top_mini_crossword = '...'
let top_connections = '...'
let top_gamedle = '...'

function sortBy(field) {
  return function(a, b) {
    return (a[field] > b[field]) - (a[field] < b[field])
  };
}

async function loadEntiesForEmbed(today) {
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
      description: 'Dailydle - Søndag 25. februar, 2024',
      fields: [
          {
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
          },
      ],
      timestamp: new Date().toISOString(),
      footer: {
          text: 'Version 0.1.0',
          icon_url: 'https://assets-prd.ignimgs.com/2022/04/15/wordle-1650045194490.jpg',
      },
  };
}

function messagePassesContentFilter(message) {
  const content = message.content
  if (!enabledChannelIDS.includes(message.channel.id)) {
    return [false, 'channelid not in whitelist']
  }
  if (message.author.bot) {
    return [false, 'filtered due to author being a bot']
  }
  if (!content.startsWith('Wordle')) {
    return [false, 'startsWith check failed']
  }
  const re = /Wordle (\d{3,4}) ([X\d])\/\d/g;
  if (!re.test(content)){
    return [false, 'regex invalidated the message']
  }
  if (content.length > 500) {
    return [false, 'message content was too long']
  }
  return [true, '']
}

export const onChannelMessage = async(message) => { 
  const filterResult = messagePassesContentFilter(message)
  if (filterResult[0]) {
    const splitContent = message.content.split(' ')
            const wordleScore = splitContent[2].split('\n')[0] ?? splitContent[2]
            if (wordleScore) {
                const authorName = message.author.displayName
                const wordleNr = splitContent[1]
                const score = wordleScore[0] + wordleScore[1] + wordleScore[2]
                try {
                    message.channel.send(`${ message.member.displayName} scored ${score} on Wordle ${wordleNr}`)
                    await Entry.create({
                        discord_channel_id: message.channel.id,
                        discord_message_id: message.id ,
                        discord_name: authorName,
                        discord_server_profile_name: message.member.displayName,
                        discord_author_id: message.member.user.id,
                        type: "Wordle",
                        type_day_number: wordleNr,
                        score: score,
                    }).then((res) => {
                        if (message.channel.id === "1211255793622454273") {
                            message.channel.send(`\`\`\`Persisted document ${res}\`\`\``)
                        }
                    })
                    const embedLoadData = await loadEntiesForEmbed(true)
                    console.info(embedLoadData)
                    top_wordle = '['+embedLoadData.top_wordle.discord_server_profile_name + ' | ' + embedLoadData.top_wordle.score+`](https://discord.com/channels/${embedLoadData.top_wordle.discord_author_id}/${embedLoadData.top_wordle.discord_channel_id}/${embedLoadData.top_wordle.discord_message_id})`
                    message.channel.send({ embeds: [getEmbeddList()], components: links });
                } catch (error) {
                    console.error('error: ', error)
                }
            }
  }

  // remove or move this shit
  if (enabledChannelIDS.includes(message.channel.id) && !message.author.bot) {
    const content = message.content
    if (content.length > 500) {
        return
    }
    if (content.startsWith('Wordle')) {
        const re = /Wordle (\d{3,4}) ([X\d])\/\d/g;
        if (!re.test(content)){
            message.channel.send(`Regex invalidated your response - message content: ${content} <@${message.member.id}>`)
        } else {
            
        }
    } else if (content.startsWith('LIST ALL ENTRIES IN DATABASE PLEASE (IM A dummyyummshimmybummy)')) {
        await Entry.find()
        .then((res) => {
            if (res.length > 1999) {
                message.channel.send(`\`\`\`Recieved documents, but size was above limit (size: ${res.length})\`\`\``)
            } else {
                message.channel.send(`\`\`\`Recieved documents ${res}\`\`\``)
            }
        })
    } else if (content.startsWith('BOBBY TABLES ALERT ALERT POOPDECK ABCDEFGHIJKLMNOPQRSTUVWXYZÆØÅ')) {
        await Entry.deleteMany({})
        .then((res) => {
            console.info(res)
            message.channel.send(`\`\`\`Completed -> -${res.deletedCount}\`\`\``)
        })
    } else if (content.startsWith('test loadEntiesForEmbed')) {
        await loadEntiesForEmbed(content.startsWith('test loadEntiesForEmbed today'))
        .then((res) => {
            message.channel.send(`\`\`\`Test output: -> -${res}\`\`\``)
        })            
    }
  }
}