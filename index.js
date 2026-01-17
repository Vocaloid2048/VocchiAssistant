const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
  ],
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.log(`[警告] 指令 ${filePath} 缺少 "data" 或 "execute" 屬性。`);
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
      await interaction.followUp({ content: '執行此指令時發生錯誤！', ephemeral: true });
    } else {
      await interaction.reply({ content: '執行此指令時發生錯誤！', ephemeral: true });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);