// Birthday reminder core functions
const { EmbedBuilder } = require('discord.js');
const { getBirthdaysByDate, getSetting, addBirthday, removeBirthday, getUserSetting } = require('../../util/database');
const { COLORS, MESSAGES, getUserInfo, formatDate, createEmbed, respondToInteraction, respondWithError } = require('./utils');

async function sendBirthdayGreetings(client, dateStr) {
  try {
    const birthdays = await getBirthdaysByDate(dateStr);
    if (birthdays.length === 0) return;

    for (const birthday of birthdays) {
      try {
        const user = await client.users.fetch(birthday.user_id);
        const dmEmbed = createEmbed('🎂 生日快樂！', `今天是你的生日！祝你生日快樂！🎉`, COLORS.BIRTHDAY);
        await user.send({ embeds: [dmEmbed] });
      } catch (error) {
        console.error(`Failed to send birthday greeting to ${birthday.user_id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error sending birthday greetings:', error);
  }
}

async function sendBirthdayReminder(client, dateStr) {
  try {
    const birthdays = await getBirthdaysByDate(dateStr);
    if (birthdays.length === 0) return;

    // Get all users who have birthday_subscription = 'true'
    // Since we don't have a way to get all subscribed users easily, we'll check each birthday user
    for (const birthday of birthdays) {
      try {
        const subscription = await getUserSetting(birthday.user_id, 'birthday_subscription');
        if (subscription === 'true') {
          const user = await client.users.fetch(birthday.user_id);
          const dmEmbed = createEmbed('🎉 明天生日提醒', `明天是你的生日！別忘了慶祝一下！`, COLORS.BIRTHDAY);
          await user.send({ embeds: [dmEmbed] });
        }
      } catch (error) {
        console.error(`Failed to send birthday reminder to ${birthday.user_id}:`, error);
      }
    }
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
    const embed = createEmbed(MESSAGES.SUCCESS.BIRTHDAY_ADD_SUCCESS, `已為 ${display} 新增生日提醒：${date}`, COLORS.SUCCESS);

    await respondToInteraction(interaction, embed, [], true);
  } catch (error) {
    console.error(error);
    await respondWithError(interaction, MESSAGES.ERRORS.BIRTHDAY_ADD_FAILED);
  }
}

async function handleBirthdayRemove(client, interaction, userId) {
  try {
    const changes = await removeBirthday(userId);
    if (changes > 0) {
      const { displayName } = await getUserInfo(client, userId);
      const embed = createEmbed(MESSAGES.SUCCESS.BIRTHDAY_REMOVE_SUCCESS, `已刪除 ${displayName} 的生日提醒`, COLORS.ERROR);

      await respondToInteraction(interaction, embed, [], true);
    } else {
      await respondWithError(interaction, MESSAGES.ERRORS.BIRTHDAY_USER_NOT_FOUND);
    }
  } catch (error) {
    console.error(error);
    await respondWithError(interaction, MESSAGES.ERRORS.BIRTHDAY_REMOVE_FAILED);
  }
}

module.exports = {
  sendBirthdayReminder,
  sendBirthdayGreetings,
  handleBirthdayAdd,
  handleBirthdayRemove,
};