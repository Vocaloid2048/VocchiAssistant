// Birthday reminder core functions
const { EmbedBuilder } = require('discord.js');
const { getBirthdaysByDate, getSetting, addBirthday, removeBirthday } = require('../../util/database');
const { COLORS, MESSAGES, getUserInfo, formatDate, createEmbed, respondToInteraction, respondWithError } = require('./utils');

async function sendBirthdayReminder(client, dateStr, channelId) {
  try {
    const birthdays = await getBirthdaysByDate(dateStr);
    if (birthdays.length === 0) return;

    const channel = client.channels.cache.get(channelId);
    if (!channel) return;

    const embed = createEmbed('🎉 明天生日提醒', '', COLORS.BIRTHDAY);

    let description = '';
    for (const birthday of birthdays) {
      description += `<@${birthday.user_id}> (${birthday.display_name})\n`;
    }
    embed.setDescription(description);

    await channel.send({ embeds: [embed] });
  } catch (error) {
    console.error('Error sending birthday reminder:', error);
  }
}

async function handleBirthdayAdd(client, interaction, userInputOrigin, month, day) {
  const date = formatDate(month, day);
  const userInput = userInputOrigin.trim().replace(/^<@!?(\d+)>$/, '$1');

  try {
    const { displayName, username, userId } = await getUserInfo(client, userInput);
    await addBirthday(userId, displayName, username, date);

    const display = /^\d+$/.test(userId) ? `<@${userId}>` : displayName;
    const embed = createEmbed(MESSAGES.SUCCESS.ADD_SUCCESS, `已為 ${display} 新增生日提醒：${date}`, COLORS.SUCCESS);

    await respondToInteraction(interaction, embed, [], true);
  } catch (error) {
    console.error(error);
    await respondWithError(interaction, MESSAGES.ERRORS.ADD_FAILED);
  }
}

async function handleBirthdayRemove(client, interaction, userId) {
  try {
    const changes = await removeBirthday(userId);
    if (changes > 0) {
      const { displayName } = await getUserInfo(client, userId);
      const embed = createEmbed(MESSAGES.SUCCESS.REMOVE_SUCCESS, `已刪除 ${displayName} 的生日提醒`, COLORS.ERROR);

      await respondToInteraction(interaction, embed, [], true);
    } else {
      await respondWithError(interaction, MESSAGES.ERRORS.USER_NOT_FOUND);
    }
  } catch (error) {
    console.error(error);
    await respondWithError(interaction, MESSAGES.ERRORS.REMOVE_FAILED);
  }
}

module.exports = {
  sendBirthdayReminder,
  handleBirthdayAdd,
  handleBirthdayRemove,
};