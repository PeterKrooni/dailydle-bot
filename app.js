
import { config } from 'dotenv'
config()

import { links } from './constants.js'
import { initClient } from './bot.js'
import { connectDB } from './db.js'
import { enabledChannelIDS } from './constants.js'

let top_wordle = '...'
let top_mini_crossword = '...'
let top_connections = '...'
let top_gamedle = '...'

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

const client = await initClient()
await connectDB()

import Entry from './entry.js'
import loadEntiesForEmbed from './loadEmbed.js'

client.on('messageCreate', async (message) => {
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
                const splitContent = content.split(' ')
                const wordleScore = splitContent[2].split('\n')[0] ?? splitContent[2]
                if (wordleScore) {
                    const authorName = message.author.displayName
                    const wordleNr = splitContent[1]
                    const score = wordleScore[0] + wordleScore[1] + wordleScore[2]
                    try {
                        if (false){// authorName.length > 20 || wordleNr.length > 20 || score.length > 20 ) {
                            message.channel.send(`Bot abuse detected. Self destructing in 10 seconds. (slutt å spamme din dfisdeiorgf)`)
                        } else {
                            message.channel.send(`${ message.member.displayName} scored ${score} on Wordle ${wordleNr}`)
                            const newEntry = await Entry.create({
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
                        }
                    } catch (error) {
                        console.error('error: ', error)
                    }
                }
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
})

process.stdin.resume(); // so the program will not close instantly
async function exitHandler(err) {
    console.info('EXITHANDLER: recieved exit command, cleaning up client connection', err)
    await client.destroy()
    .then((res) => {
        process.exit();
    })
    .catch((err) => 87)
}

// do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

// catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));

// catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));