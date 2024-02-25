
import { EmbedBuilder, Client, Events, GatewayIntentBits, REST, Routes } from 'discord.js';

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

const dailydles = "Wordle -> https://www.nytimes.com/games/wordle/index.html | Connections -> https://www.nytimes.com/games/connections | Mini Crossword -> https://www.nytimes.com/crosswords/game/mini | Gamedle -> https://www.gamedle.wtf/ |Rankdle -> https://rankdle.com/ |"


const cid = process.env.DISCORD_OAUTH_CLIENT_ID
const csecret = process.env.DISCORD_OAUTH_CLIENT_SECRET
const btoken = process.env.DISCORD_BOT_TOKEN

const rest = new REST({ version: '10' }).setToken(btoken);

try {
  console.log('Started refreshing application (/) commands.');

  await rest.put(Routes.applicationCommands(cid), { body: commands });

  console.log('Successfully reloaded application (/) commands.');
} catch (error) {
  console.error(error);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.once(Events.ClientReady, async () => {
	const channel = client.channels.cache.get('1211255793622454273')
    console.info(channel)
    channel.send('IM ONLINE bro')
});


client.on('interactionCreate', async interaction => {
  console.debug('COMMAND:', interaction.commandName)
  if (!interaction.isChatInputCommand()) {
    console.info(interaction.message)
  };
  
  switch(interaction.commandName) {
    case 'ping':
        await interaction.reply('Pong!');
    case 'list':
        await interaction.reply(dailydles);
    case 'terminate':
        await interaction.reply(interaction.user?.displayName + ' (servername: ' + interaction.member?.displayName + ') used command terminate. Will destroy bot connection.')
        .then((onReady) => {
            exitHandler()
        })
        .catch((onError) => {
            interaction.reply('Error terminating server.')            
        })
    case 'monkeyembed':
        // inside a command, event listener, etc.
        const exampleEmbed = new EmbedBuilder()
        .setColor(0xAAFFAA)
        .setTitle('Dailydle')
        .setURL('https://www.nytimes.com/games/wordle/index.html')
        .addFields([
            { name: 'Field 1', value: 'Value 1' },
            { name: 'Field 2', value: 'Value 2' },
        ])
        .setTimestamp()
        interaction.reply({ embeds: [exampleEmbed]});
  }
});




client.login(btoken);


process.stdin.resume(); // so the program will not close instantly
async function exitHandler() {
    console.info('EXITHANDLER: recieved exit command, cleaning up client connection')
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