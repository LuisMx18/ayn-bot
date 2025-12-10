require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ] 
});

client.once('ready', () => {
  console.log(`✓ Bot online como ${client.user.tag}`);
  client.user.setActivity('!help para comandos', { type: 'LISTENING' });
});

// Comando: !rps rock/paper/scissors
client.on('messageCreate', message => {
  if (message.author.bot) return;

  // Comando Ping
  if (message.content === '!ping') {
    message.reply('¡Pong!');
    return;
  }

  // Comando RPS (Piedra, Papel, Tijera)
  if (message.content.startsWith('!rps')) {
    const userChoice = message.content.split(' ')[1]?.toLowerCase();
    const choices = ['rock', 'paper', 'scissors'];
    const emojis = { rock: '🪨', paper: '📄', scissors: '✂️' };
    const names = { rock: 'Piedra', paper: 'Papel', scissors: 'Tijera' };

    if (!userChoice || !choices.includes(userChoice)) {
      return message.reply('❌ Usa: `!rps rock` o `!rps paper` o `!rps scissors`');
    }

    const botChoice = choices[Math.floor(Math.random() * choices.length)];
    let result;

    if (userChoice === botChoice) {
      result = '¡Empate! 🤝';
    } else if (
      (userChoice === 'rock' && botChoice === 'scissors') ||
      (userChoice === 'paper' && botChoice === 'rock') ||
      (userChoice === 'scissors' && botChoice === 'paper')
    ) {
      result = '¡Ganaste! 🎉';
    } else {
      result = '¡Perdiste! 😢';
    }

    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('🎮 Piedra, Papel o Tijera')
      .addFields(
        { name: `${message.author.username}`, value: `${emojis[userChoice]} ${names[userChoice]}`, inline: true },
        { name: 'Bot', value: `${emojis[botChoice]} ${names[botChoice]}`, inline: true }
      )
      .addFields({ name: 'Resultado', value: result, inline: false })
      .setFooter({ text: `Usa !rps rock/paper/scissors para jugar de nuevo` });

    message.reply({ embeds: [embed] });
  }

  // Comando Help
  if (message.content === '!help') {
    const embed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('📋 Comandos Disponibles')
      .addFields(
        { name: '!ping', value: 'Responde Pong', inline: false },
        { name: '!rps rock/paper/scissors', value: 'Juega Piedra, Papel o Tijera contra el bot', inline: false },
        { name: '!help', value: 'Muestra este mensaje', inline: false }
      );

    message.reply({ embeds: [embed] });
  }
});

client.login(process.env.DISCORD_TOKEN);