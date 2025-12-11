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
    const dmEmbed = new EmbedBuilder()
      .setColor('#FF1493')
      .setTitle('𝐖𝐄𝐋𝐂𝐎𝐌𝐄 𝐓𝐎 𝐒𝐓𝐀𝐅𝐅 𝐀&𝐍')
      .setDescription('¡Bienvenido a nuestro servidor! Lee las normas antes de interactuar.')
      .addFields(
        {
          name: '𝐒𝐓𝐀𝐅𝐅 𝐀&𝐍\n𝐍𝐎𝐑𝐌𝐀𝐒 𝐀&𝐍',
          value: `
**1. Respeto ante todo**
No insultos, acoso, bullying ni discriminación.
Nada de discurso de odio ni ataques personales.

**2. Contenido y derechos de autor**
No plagio: si usás arte o contenido de otros, da crédito.
No reclames como propio lo que no hiciste.

**3. Contenido prohibido**
No sexual, pornografía ni insinuaciones con menores.
No gore, violencia gráfica, contenido perturbador o sensible.
No imágenes que puedan afectar a personas con epilepsia (gifs parpadeantes).

**4. Spam y publicidad**
No autopromoción, publicidad, ventas ni spam de links/mensajes.
Evitá publicar demasiados posts en poco tiempo.

**5. Privacidad**
No compartas ni pidas información personal (tuya o de otros).
Prohibido el doxxing.

❤ **6. Bienestar y seguridad**
No contenido que promueva autolesiones, suicidio o daño físico/psicológico.
Si ves algo inapropiado, no respondas: reportalo al staff.

⚠ **7. Actividades prohibidas**
Nada de fraudes, estafas, actividades ilegales o ventas de bienes regulados.
Prohibido crear cuentas "alts" para evadir sanciones.

**8. Publicaciones y chats**
Mantené el contenido relevante al servidor.
Debates permitidos, pero con respeto.
Todo el contenido debe ser apto y legal.

**9. Edad mínima**
✘ No se permite la entrada de menores de 16 años en el servidor.

---

**Normas del Staff**
Trato respetuoso y justo hacia todos.
Reglas claras y aplicadas por igual.
Sanciones transparentes: si es posible, avisar y explicar qué norma se violó.
          `,
          inline: false
        }
      )
      .setFooter({ text: '¡Diviértete y respeta a la comunidad!' })
      .setTimestamp();

    await member.send({ embeds: [dmEmbed] });
    console.log(`✓ DM enviado a ${member.user.tag}`);
  } catch (error) {
    console.error(`❌ Error enviando DM a ${member.user.tag}:`, error);
  }
});

client.login(process.env.DISCORD_TOKEN);
