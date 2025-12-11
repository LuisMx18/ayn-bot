require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes } = require('discord.js');

const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ] 
});

// Definir slash commands
const commands = [
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Responde Pong'),
  
  new SlashCommandBuilder()
    .setName('rps')
    .setDescription('Juega Piedra, Papel o Tijera')
    .addStringOption(option =>
      option.setName('opcion')
        .setDescription('Elige: rock, paper o scissors')
        .setRequired(true)
        .addChoices(
          { name: 'Piedra 🪨', value: 'rock' },
          { name: 'Papel 📄', value: 'paper' },
          { name: 'Tijera ✂️', value: 'scissors' }
        )
    ),

  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Muestra todos los comandos')
].map(command => command.toJSON());

// Registrar slash commands
client.once('clientReady', async () => {
  console.log(`✓ Bot online como ${client.user.tag}`);
  client.user.setActivity('!help para comandos', { type: 'LISTENING' });

  try {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log('✓ Slash commands registrados');
  } catch (error) {
    console.error('❌ Error registrando slash commands:', error);
  }
});

// Función para jugar RPS
function playRPS(userChoice) {
  const choices = ['rock', 'paper', 'scissors'];
  const emojis = { rock: '🪨', paper: '📄', scissors: '✂️' };
  const names = { rock: 'Piedra', paper: 'Papel', scissors: 'Tijera' };
  
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
      { name: 'Tu elección', value: `${emojis[userChoice]} ${names[userChoice]}`, inline: true },
      { name: 'Mi elección', value: `${emojis[botChoice]} ${names[botChoice]}`, inline: true },
      { name: 'Resultado', value: result, inline: false }
    );

  return embed;
}

// Slash commands
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  try {
    const { commandName, options } = interaction;

    if (commandName === 'ping') {
      await interaction.reply({ content: '¡Pong! 🏓', ephemeral: false });
    }

    else if (commandName === 'rps') {
      const userChoice = options.getString('opcion');
      const embed = playRPS(userChoice);
      await interaction.reply({ embeds: [embed], ephemeral: false });
    }

    else if (commandName === 'help') {
      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('📋 Comandos Disponibles')
        .addFields(
          { name: '/ping', value: 'Responde Pong', inline: false },
          { name: '/rps [opcion]', value: 'Juega Piedra, Papel o Tijera', inline: false },
          { name: '/help', value: 'Muestra este mensaje', inline: false }
        );
      await interaction.reply({ embeds: [embed], ephemeral: false });
    }
  } catch (error) {
    console.error('Error en interacción:', error);
    await interaction.reply({ content: '❌ Error al procesar comando', ephemeral: true }).catch(() => {});
  }
});

// Comandos de prefijo ! (retrocompatibilidad)
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  try {
    if (message.content === '!ping') {
      await message.reply('¡Pong! 🏓');
    }

    else if (message.content.startsWith('!rps')) {
      const args = message.content.split(' ');
      const userChoice = args[1]?.toLowerCase();
      const choices = ['rock', 'paper', 'scissors'];

      if (!userChoice || !choices.includes(userChoice)) {
        await message.reply('❌ Usa: `!rps rock` o `!rps paper` o `!rps scissors`');
        return;
      }

      const embed = playRPS(userChoice);
      await message.reply({ embeds: [embed] });
    }

    else if (message.content === '!help') {
      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('📋 Comandos Disponibles')
        .addFields(
          { name: '/ping', value: 'Responde Pong', inline: false },
          { name: '/rps [opcion]', value: 'Juega Piedra, Papel o Tijera', inline: false },
          { name: '/help', value: 'Muestra este mensaje', inline: false }
        );
      await message.reply({ embeds: [embed] });
    }
  } catch (error) {
    console.error('Error procesando mensaje:', error);
  }
});

// Evento: usuario se une al servidor
client.on('guildMemberAdd', async (member) => {
  try {
    // Obtener canal general
    const welcomeChannel = member.guild.channels.cache.find(
      channel => channel.isTextBased() && (channel.name === 'general' || channel.name === 'bienvenida')
    ) || member.guild.systemChannel;

    // Obtener canal de normas
    const rulesChannel = member.guild.channels.cache.find(
      channel => channel.isTextBased() && channel.name === 'normas'
    );

    if (!welcomeChannel) {
      console.log('❌ No se encontró canal para enviar bienvenida');
      return;
    }

    const welcomeEmbed = new EmbedBuilder()
      .setColor('#FF1493')
      .setTitle(`🎉 ¡Bienvenido ${member.user.username}!`)
      .setDescription(`¡Hola ${member}! 👋\n\nBienvenido a **${member.guild.name}**. Antes de empezar, por favor lee las normas del servidor.\n\n${rulesChannel ? `📋 Lee las normas en ${rulesChannel}` : ''}`)
      .setImage('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdmowYTZkNzJqMWo3YWs3b3J4YWZveHZucWZyMTZtNjBkMDB0MjBkZiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3o85xIO33l7RlmLR4I/giphy.gif')
      .setFooter({ text: '¡Esperamos que disfrutes tu estadía! 😊' })
      .setTimestamp();

    await welcomeChannel.send({ content: `${member}`, embeds: [welcomeEmbed] });
    console.log(`✓ Mensaje de bienvenida enviado para ${member.user.tag}`);
  } catch (error) {
    console.error(`❌ Error enviando mensaje de bienvenida:`, error);
  }
});

client.login(process.env.DISCORD_TOKEN);
