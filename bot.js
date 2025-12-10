require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ] 
});

client.once('ready', () => console.log('Bot online!'));

client.on('messageCreate', message => {
  if (message.content === '!ping') {
    message.reply('¡Pong!');
  }
});

client.login(process.env.DISCORD_TOKEN);
