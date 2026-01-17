const { SlashCommandBuilder } = require('discord.js');
const { setUserSetting, getUserSetting } = require('../../util/database');
const { createEmbed, COLORS, respondToInteraction, respondWithError } = require('./utils');
const { rescheduleWeatherForUser } = require('../weather/event');

const SUBSCRIPTIONS = {
  '生日提醒': 'birthday_subscription',
  '天氣資訊': 'weather_subscription',
  '所有': 'all'
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('訂閱')
    .setDescription('管理資訊訂閱')
    .addStringOption(option =>
      option.setName('項目')
        .setDescription('要訂閱的項目')
        .setRequired(true)
        .addChoices(
          { name: '所有', value: 'all' },
          { name: '生日提醒', value: 'birthday_subscription' },
          { name: '天氣資訊', value: 'weather_subscription' }
        ))
    .addStringOption(option =>
      option.setName('狀態')
        .setDescription('訂閱狀態')
        .setRequired(true)
        .addChoices(
          { name: '同意', value: 'true' },
          { name: '取消', value: 'false' }
        )),

  async execute(interaction) {
    const subscriptionKey = interaction.options.getString('項目');
    const status = interaction.options.getString('狀態');
    const userId = interaction.user.id;

    try {
      if (subscriptionKey === 'all') {
        await setUserSetting(userId, 'birthday_subscription', status);
        await setUserSetting(userId, 'weather_subscription', status);
        const statusText = status === 'true' ? '已同意' : '已取消';
        const embed = createEmbed('訂閱設定', `${statusText} 所有項目的接收`, COLORS.SUCCESS);
        await respondToInteraction(interaction, embed);
      } else {
        await setUserSetting(userId, subscriptionKey, status);
        const itemName = Object.keys(SUBSCRIPTIONS).find(k => SUBSCRIPTIONS[k] === subscriptionKey);
        const statusText = status === 'true' ? '已同意' : '已取消';
        const embed = createEmbed('訂閱設定', `${statusText} ${itemName} 的接收`, COLORS.SUCCESS);
        await respondToInteraction(interaction, embed);
      }

    } catch (error) {
      console.error('Error setting subscription:', error);
      respondWithError(interaction, '設定失敗，請稍後再試。');
    }
  },
};