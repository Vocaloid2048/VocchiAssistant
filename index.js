const { Client, GatewayIntentBits, Collection, REST, Routes, EmbedBuilder, MessageFlags } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const { setupBirthdayEvents } = require('./function/birthday/event');
const { setupFortuneEvents } = require('./function/fortune/event');
const { setupWeatherEvents } = require('./function/weather/event');
const { setupMoodEvents } = require('./function/mood/event');
const { setupCatEvents } = require('./function/cat/event');
const { setupEchoEvents, initEchoDB, startScheduledReplies } = require('./function/echo/event');
require('./backup');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
  ],
});

function getCommandFiles(dirPath) {
  const files = [];
  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...getCommandFiles(fullPath));
    } else if (item.endsWith('.js')) {
      files.push(fullPath);
    }
  }

  return files;
}

client.commands = new Collection();

const functionPath = path.join(__dirname, 'function');
const commandFiles = [
  ...getCommandFiles(functionPath).filter(file => file.includes('commands.js'))
];

for (const filePath of commandFiles) {
  const commands = require(filePath);
  const commandArray = Array.isArray(commands) ? commands : [commands];

  for (const command of commandArray) {
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(`[警告] 指令 ${filePath} 中的一個命令缺少 "data" 或 "execute" 屬性。`);
    }
  }
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

client.once('ready', async () => {
  console.log(`已登入為 ${client.user.tag}！`);

  try {
    console.log('開始刷新應用程式 (/) 指令。');

    const commandsData = Array.from(client.commands.values()).map(command => command.data.toJSON());

    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commandsData },
    );

    console.log('成功重新載入應用程式 (/) 指令。');
  } catch (error) {
    console.error(error);
  }

  // Setup birthday events
  setupBirthdayEvents(client);

  // Setup fortune events
  setupFortuneEvents(client);

  // Setup weather events
  setupWeatherEvents(client);

  // Setup mood events
  setupMoodEvents(client);

  // Setup cat events
  setupCatEvents(client);

  // Setup echo events
  await initEchoDB();
  setupEchoEvents(client);
  startScheduledReplies(client);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`找不到與 ${interaction.commandName} 相符的指令。`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: '執行此指令時發生錯誤！', flags: MessageFlags.Ephemeral });
    } else {
      await interaction.reply({ content: '執行此指令時發生錯誤！', flags: MessageFlags.Ephemeral });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);