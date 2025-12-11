require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes } = require('discord.js');

const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ] 
});

const dataFile = path.join(__dirname, 'userdata.json');

function loadUserData() {
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, '{}');
  }
  return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
}

function saveUserData(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

function getUser(userId) {
  const data = loadUserData();
  if (!data[userId]) {
    data[userId] = { points: 0, username: 'Unknown', wins: 0, losses: 0, ties: 0 };
    saveUserData(data);
  }
  return data[userId];
}

function updateUserStats(userId, username, result) {
  const data = loadUserData();
  if (!data[userId]) {
    data[userId] = { points: 0, username, wins: 0, losses: 0, ties: 0 };
  }
  data[userId].username = username;
  if (result === 'win') {
    data[userId].wins += 1;
    data[userId].points += 50;
  } else if (result === 'loss') {
    data[userId].losses += 1;
    data[userId].points -= 10;
  } else if (result === 'tie') {
    data[userId].ties += 1;
    data[userId].points += 10;
  }
  saveUserData(data);
  return data[userId];
}

const commands = [
  new SlashCommandBuilder().setName('ping').setDescription('Responde Pong'),
  new SlashCommandBuilder().setName('rps').setDescription('Juega Piedra, Papel o Tijera y gana puntos').addStringOption(option => option.setName('opcion').setDescription('Elige: rock, paper o scissors').setRequired(true).addChoices({ name: 'Piedra 🪨', value: 'rock' }, { name: 'Papel 📄', value: 'paper' }, { name: 'Tijera ✂️', value: 'scissors' })),
  new SlashCommandBuilder().setName('balance').setDescription('Ver tu balance de puntos'),
  new SlashCommandBuilder().setName('leaderboard').setDescription('Ver el ranking de puntos del servidor'),
  new SlashCommandBuilder().setName('help').setDescription('Muestra todos los comandos')
].map(command => command.toJSON());

client.once('clientReady', async () => {
  console.log(`✓ Bot online como ${client.user.tag}`);
  client.user.setActivity('Usa /help para comandos', { type: 'LISTENING' });
  try {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log('✓ Slash commands registrados');
  } catch (error) {
    console.error('❌ Error registrando slash commands:', error);
  }
});

function playRPS(userChoice) {
  const choices = ['rock', 'paper', 'scissors'];
  const emojis = { rock: '🪨', paper: '📄', scissors: '✂️' };
  const names = { rock: 'Piedra', paper: 'Papel', scissors: 'Tijera' };
  const botChoice = choices[Math.floor(Math.random() * choices.length)];
  let result;
  if (userChoice === botChoice) {
    result = 'tie';
  } else if (
    (userChoice === 'rock' && botChoice === 'scissors') ||
    (userChoice === 'paper' && botChoice === 'rock') ||
    (userChoice === 'scissors' && botChoice === 'paper')
  ) {
    result = 'win';
  } else {
    result = 'loss';
  }
  const resultText = result === 'win' ? '¡Ganaste! 🎉' : result === 'loss' ? '¡Perdiste! 😢' : '¡Empate! 🤝';
  const pointsText = result === 'win' ? '+50 pts' : result === 'loss' ? '-10 pts' : '+10 pts';
  return {
    embed: new EmbedBuilder().setColor('#0099ff').setTitle('🎮 Piedra, Papel o Tijera').addFields(
      { name: 'Tu elección', value: `${emojis[userChoice]} ${names[userChoice]}`, inline: true },
      { name: 'Mi elección', value: `${emojis[botChoice]} ${names[botChoice]}`, inline: true },
      { name: 'Resultado', value: resultText, inline: false },
      { name: 'Puntos', value: pointsText, inline: false }
    ),
    result
  };
}

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;
  try {
    const { commandName, options, user } = interaction;
    if (commandName === 'ping') {
      await interaction.reply({ content: '¡Pong! 🏓', ephemeral: false });
    } else if (commandName === 'rps') {
      const userChoice = options.getString('opcion');
      const gameResult = playRPS(userChoice);
      const userStats = updateUserStats(user.id, user.username, gameResult.result);
      const statsEmbed = gameResult.embed.addFields({ name: 'Tu Balance Total', value: `⭐ ${userStats.points} puntos\n👑 W: ${userStats.wins} | L: ${userStats.losses} | T: ${userStats.ties}`, inline: false });
      await interaction.reply({ embeds: [statsEmbed], ephemeral: false });
    } else if (commandName === 'balance') {
      const userData = getUser(user.id);
      const balanceEmbed = new EmbedBuilder().setColor('#FFD700').setTitle(`💰 Balance de ${user.username}`).addFields(
        { name: '⭐ Puntos Totales', value: `${userData.points}`, inline: false },
        { name: '📊 Estadísticas', value: `👑 Victorias: ${userData.wins}\n❌ Derrotas: ${userData.losses}\n🤝 Empates: ${userData.ties}`, inline: false }
      ).setThumbnail(user.displayAvatarURL({ dynamic: true })).setFooter({ text: 'Sigue jugando para ganar más puntos' });
      await interaction.reply({ embeds: [balanceEmbed], ephemeral: true });
    } else if (commandName === 'leaderboard') {
      const allData = loadUserData();
      const sortedUsers = Object.entries(allData).map(([id, data]) => ({ id, ...data })).sort((a, b) => b.points - a.points).slice(0, 10);
      if (sortedUsers.length === 0) {
        await interaction.reply({ content: '📊 No hay datos aún. ¡Juega para aparecer en el leaderboard!', ephemeral: true });
        return;
      }
      let leaderboardText = '';
      sortedUsers.forEach((user, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
        leaderboardText += `${medal} **${user.username}** - ⭐ ${user.points} puntos\n`;
      });
      const leaderboardEmbed = new EmbedBuilder().setColor('#FFD700').setTitle('🏆 TOP 10 LEADERBOARD').setDescription(leaderboardText).setFooter({ text: 'Actualizado en tiempo real' }).setTimestamp();
      await interaction.reply({ embeds: [leaderboardEmbed], ephemeral: false });
    } else if (commandName === 'help') {
      const helpEmbed = new EmbedBuilder().setColor('#00ff00').setTitle('📋 Comandos Disponibles').addFields(
        { name: '/ping', value: 'Responde Pong', inline: false },
        { name: '/rps [opcion]', value: 'Juega Piedra, Papel o Tijera y gana puntos\n• Ganar: +50 pts\n• Empate: +10 pts\n• Perder: -10 pts', inline: false },
        { name: '/balance', value: 'Ver tu balance de puntos y estadísticas', inline: false },
        { name: '/leaderboard', value: 'Ver el ranking de los top 10 jugadores', inline: false },
        { name: '/help', value: 'Muestra este mensaje', inline: false }
      );
      await interaction.reply({ embeds: [helpEmbed], ephemeral: false });
    }
  } catch (error) {
    console.error('Error en interacción:', error);
    await interaction.reply({ content: '❌ Error al procesar comando', ephemeral: true }).catch(() => {});
  }
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  try {
    if (message.content === '!ping') {
      await message.reply('¡Pong! 🏓');
    } else if (message.content.startsWith('!rps')) {
      const args = message.content.split(' ');
      const userChoice = args[1]?.toLowerCase();
      const choices = ['rock', 'paper', 'scissors'];
      if (!userChoice || !choices.includes(userChoice)) {
        await message.reply('❌ Usa: `!rps rock` o `!rps paper` o `!rps scissors`');
        return;
      }
      const gameResult = playRPS(userChoice);
      const userStats = updateUserStats(message.author.id, message.author.username, gameResult.result);
      const statsEmbed = gameResult.embed.addFields({ name: 'Tu Balance Total', value: `⭐ ${userStats.points} puntos\n👑 W: ${userStats.wins} | L: ${userStats.losses} | T: ${userStats.ties}`, inline: false });
      await message.reply({ embeds: [statsEmbed] });
    } else if (message.content === '!balance') {
      const userData = getUser(message.author.id);
      const balanceEmbed = new EmbedBuilder().setColor('#FFD700').setTitle(`💰 Balance de ${message.author.username}`).addFields(
        { name: '⭐ Puntos Totales', value: `${userData.points}`, inline: false },
        { name: '📊 Estadísticas', value: `👑 Victorias: ${userData.wins}\n❌ Derrotas: ${userData.losses}\n🤝 Empates: ${userData.ties}`, inline: false }
      ).setThumbnail(message.author.displayAvatarURL({ dynamic: true })).setFooter({ text: 'Sigue jugando para ganar más puntos' });
      await message.reply({ embeds: [balanceEmbed] });
    } else if (message.content === '!leaderboard') {
      const allData = loadUserData();
      const sortedUsers = Object.entries(allData).map(([id, data]) => ({ id, ...data })).sort((a, b) => b.points - a.points).slice(0, 10);
      if (sortedUsers.length === 0) {
        await message.reply('📊 No hay datos aún. ¡Juega para aparecer en el leaderboard!');
        return;
      }
      let leaderboardText = '';
      sortedUsers.forEach((user, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
        leaderboardText += `${medal} **${user.username}** - ⭐ ${user.points} puntos\n`;
      });
      const leaderboardEmbed = new EmbedBuilder().setColor('#FFD700').setTitle('🏆 TOP 10 LEADERBOARD').setDescription(leaderboardText).setFooter({ text: 'Actualizado en tiempo real' }).setTimestamp();
      await message.reply({ embeds: [leaderboardEmbed] });
    } else if (message.content === '!help') {
      const helpEmbed = new EmbedBuilder().setColor('#00ff00').setTitle('📋 Comandos Disponibles').addFields(
        { name: '/ping', value: 'Responde Pong', inline: false },
        { name: '/rps [opcion]', value: 'Juega Piedra, Papel o Tijera y gana puntos\n• Ganar: +50 pts\n• Empate: +10 pts\n• Perder: -10 pts', inline: false },
        { name: '/balance', value: 'Ver tu balance de puntos y estadísticas', inline: false },
        { name: '/leaderboard', value: 'Ver el ranking de los top 10 jugadores', inline: false },
        { name: '/help', value: 'Muestra este mensaje', inline: false }
      );
      await message.reply({ embeds: [helpEmbed] });
    }
  } catch (error) {
    console.error('Error procesando mensaje:', error);
  }
});

client.on('guildMemberAdd', async (member) => {
  try {
    console.log(`📝 Usuario ${member.user.tag} se unió al servidor`);
    const welcomeChannel = member.guild.channels.cache.find(channel => channel.isTextBased() && (channel.name.includes('general') || channel.name.includes('bienvenida') || channel.name.includes('welcome')));
    if (!welcomeChannel) {
      console.log(`❌ No se encontró canal de bienvenida en ${member.guild.name}`);
      return;
    }
    const rulesChannel = member.guild.channels.cache.find(channel => channel.isTextBased() && channel.name.includes('normas'));
    const welcomeEmbed = new EmbedBuilder()
      .setColor('#FF1493')
      .setTitle(`🎉 ¡Bienvenido ${member.user.username}!`)
      .setDescription(`¡Hola ${member}! 👋\n\nBienvenido a **${member.guild.name}**, una comunidad dedicada a las dinámicas sociales, anime y mucho más. Nos alegra mucho que te unas a nosotros.`)
      .addFields(
        { name: '📋 Primeros Pasos', value: `Antes de empezar, asegúrate de leer nuestras ${rulesChannel ? `normas en ${rulesChannel}` : '**normas del servidor**'}. Son rápidas de leer y nos ayudan a mantener un espacio seguro y respetuoso para todos.`, inline: false },
        { name: '👥 ¿Necesitas Ayuda?', value: `Nuestro **staff estará encantado de ayudarte**. No dudes en hacer preguntas si algo no te queda claro. Estamos aquí para que disfrutes al máximo de la comunidad.`, inline: false },
        { name: '🎮 Dinámicas y Eventos', value: `Contamos con **dinámicas semanales**, **minijuegos**, **actividades diarias** y eventos especiales para mantener la comunidad activa y divertida. ¡No te los pierdas!`, inline: false },
        { name: '⭐ Actividad Diaria', value: `Participa en nuestros minijuegos diarios como **Piedra, Papel o Tijera** (\`/rps\`) para ganar puntos y compite en el leaderboard con otros miembros de la comunidad.`, inline: false },
        { name: '💬 Interactúa', value: `Siéntete libre de compartir tus opiniones, crear debates respetuosos y conectar con otros miembros. La comunidad crece con tu participación.`, inline: false }
      )
      .setImage('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNDBpMGEzZHY3dDI1bWtzaGQ5bWI3NmNncGdieDlvNmxtMmJoZm00OSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3ov9jIYPU7NMT6TS7K/giphy.gif')
      .setFooter({ text: '¡Esperamos que disfrutes tu estadía! 😊 Bienvenido a la familia.' })
      .setTimestamp();
    await welcomeChannel.send({ content: `${member}`, embeds: [welcomeEmbed] });
    console.log(`✅ Mensaje de bienvenida enviado a ${welcomeChannel.name}`);
  } catch (error) {
    console.error(`❌ Error en guildMemberAdd:`, error);
  }
});

client.login(process.env.DISCORD_TOKEN);
