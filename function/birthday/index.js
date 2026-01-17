// Birthday reminder core functions
const { EmbedBuilder, MessageFlags } = require('discord.js');
const { getBirthdaysByDate, getSetting, addBirthday, removeBirthday } = require('../../util/database');

async function sendBirthdayReminder(client, dateStr, channelId) {
  try {
    const birthdays = await getBirthdaysByDate(dateStr);
    if (birthdays.length > 0) {
      const channel = client.channels.cache.get(channelId);
      if (!channel) return;

      const embed = new EmbedBuilder()
        .setTitle('🎉 明天生日提醒')
        .setColor(0xffd700);

      let description = '';
      for (const birthday of birthdays) {
        description += `<@${birthday.user_id}> (${birthday.display_name})\n`;
      }
      embed.setDescription(description);

      await channel.send({ embeds: [embed] });
    }
  } catch (error) {
    console.error('Error sending birthday reminder:', error);
  }
}

async function handleBirthdayAdd(client, interaction, userInputOrigin, month, day) {
  const date = `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;

  const userInput = userInputOrigin.trim().replace("<@", "").replace(">", "");;
  
  try {
    let displayName = userInput;
    let username = userInput;
    let userId = userInput;

    // Try to fetch user if it's a Discord ID
    try {
      const user = await client.users.fetch(userInput);
      displayName = user.displayName;
      username = user.username;
      userId = user.id;
    } catch (error) {
      // If not a valid Discord ID, use the input as custom name
      console.log('Using custom name:', userInput);
    }

    await addBirthday(userId, displayName, username, date);

    const embed = new EmbedBuilder()
      .setTitle('生日提醒已新增')
      .setDescription(`已為 ${/^\d+$/.test(userId) ? `<@${userId}>` : displayName} 新增生日提醒：${date}`)
      .setColor(0x00ff00);

    if (interaction.replied || interaction.deferred) {
      await interaction.editReply({ embeds: [embed], components: [] });
    } else {
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
  } catch (error) {
    console.error(error);
    const errorMessage = { content: '新增生日提醒時發生錯誤。', flags: MessageFlags.Ephemeral };
    if (interaction.replied || interaction.deferred) {
      await interaction.editReply(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
}

async function handleBirthdayRemove(client, interaction, userId) {
  try {
    const changes = await removeBirthday(userId);
    if (changes > 0) {
      let displayName = userId;
      let username = userId;

      // Try to fetch user if it's a Discord ID
      try {
        const user = await client.users.fetch(userId);
        displayName = user.displayName;
        username = user.username;
      } catch (error) {
        // If not a valid Discord ID, use the input as custom name
        console.log('Using custom name for removal:', userId);
      }

      const embed = new EmbedBuilder()
        .setTitle('生日提醒已刪除')
        .setDescription(`已刪除 ${displayName} 的生日提醒`)
        .setColor(0xff0000);

      if (interaction.replied || interaction.deferred) {
        await interaction.editReply({ embeds: [embed], components: [] });
      } else {
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      }
    } else {
      const errorMessage = { content: '找不到該用戶的生日提醒。', flags: MessageFlags.Ephemeral };
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    }
  } catch (error) {
    console.error(error);
    const errorMessage = { content: '刪除生日提醒時發生錯誤。', flags: MessageFlags.Ephemeral };
    if (interaction.replied || interaction.deferred) {
      await interaction.editReply(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
}

module.exports = {
  sendBirthdayReminder,
  handleBirthdayAdd,
  handleBirthdayRemove,
};