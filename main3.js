
import { EmbedBuilder, Client, Events, GatewayIntentBits, REST, Routes, Partials  } from 'discord.js';

import { config } from 'dotenv'
config()

const commands = [
  {
    name: 'ping',
    description: 'Replies with Pong!',
  },
  {    
    name: 'list',
    description: 'List dailydles'
  },
  {
    name: 'terminate',
    description: 'clean up client-server webhook and close down server'
  },
  {
    name: 'monkeyembed',
    description: 'amongus'
  }
];
const links = [
    {
      "type": 1,
      "components": [
        {
          "style": 5,
          "label": `Wordle`,
          "url": `https://www.nytimes.com/games/wordle/index.html`,
          "disabled": false,
          "type": 2
        },
        {
          "style": 5,
          "label": `Connections`,
          "url": `https://www.nytimes.com/games/connections`,
          "disabled": false,
          "type": 2
        },
        {
          "style": 5,
          "label": `The Mini`,
          "url": `https://www.nytimes.com/crosswords/game/mini`,
          "disabled": false,
          "type": 2
        },
        {
          "style": 5,
          "label": `Gamedle`,
          "url": `https://www.gamedle.wtf`,
          "disabled": false,
          "type": 2
        },
      ]
    }
  ];
const statTrackerEmbed = {
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
            value: 'pkr | 3/6',
            inline: true
        },
        {
            name: 'Mini crossword',
            value: 'c0w | 1:28',
            inline: true
        },
        {
            name: '',
            value: '',
            inline: false
        },
        {
            name: 'Connections',
            value: 'elias | 5/4',
            inline: true
        },
        {
            name: 'Gamedle',
            value: 'dune | 1/8',
            inline: true
        },
    ],
    timestamp: new Date().toISOString(),
    footer: {
        text: 'Version 0.1.0',
        icon_url: 'https://assets-prd.ignimgs.com/2022/04/15/wordle-1650045194490.jpg',
    },
};


const cid = process.env.DISCORD_OAUTH_CLIENT_ID
const btoken = process.env.DISCORD_BOT_TOKEN

const rest = new REST({ version: '10' }).setToken(btoken);

try {
  console.log('Started refreshing application (/) commands.');

  await rest.put(Routes.applicationCommands(cid), { body: commands });

  console.log('Successfully reloaded application (/) commands.');
} catch (error) {
  console.error(error);
}

const client = new Client({ 
    partials: [
        Partials.Message,
        Partials.Channel
    ], 
    intents: [
        GatewayIntentBits.DirectMessages, 
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.GuildMessageReactions, 
        GatewayIntentBits.Guilds
    ]
    });

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

import mongoose from 'mongoose';
await mongoose.connect(process.env.DAILYDLE_DB_URI).then(() => {
    console.log(`Connected to MongoDB`)
}).catch ((error) => {
    console.log(`Failed to connect to MongoDB: ${error}`)
    process.exit(1)
})
import Entry from './entry.js'

client.on('messageCreate', async (message) => {
    if (message.channel.id === "1211255793622454273" && !message.author.bot) {
        const content = message.content
        if (content.startsWith('Wordle')) {
            const re = /Wordle (\d{3,4}) ([X\d])\/\d/g;
            if (!re.test(content)){
                message.channel.send(`Regex invalidated your response - message content: ${content} <@${message.member.id}>`)
            } else {
                const splitContent = content.split(' ')
                const wordleScore = splitContent[2]
                if (wordleScore) {
                    const authorName = message.author.displayName
                    const wordleNr = splitContent[1]
                    const score = splitContent[2]
                    try {
                        if (authorName.length > 20 || wordleNr.length > 20 || score.length > 20 ) {
                            message.channel.send(`Bot abuse detected. Self destructing in 10 seconds. (slutt å spamme din dfisdeiorgf)`)
                        } else {
                            message.channel.send(`Wordle: ${authorName} scored \n ${score} \n on Wordle ${wordleNr}`)
                            message.channel.send({ embeds: [statTrackerEmbed], components: links });
                            const newEntry = await Entry.create({
                                discord_name: authorName,
                                discord_server_profile_name: message.member.displayName,
                                discord_id: message.author.id,
                                type: "Wordle",
                                type_day_number: wordleNr,
                                score: score,
                            }).then((res) => {
                                message.channel.send(`\`\`\`Persisted document ${res}\`\`\``)
                            })
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
        }
    }
})

client.login(btoken);


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