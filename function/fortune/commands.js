const { SlashCommandBuilder } = require('discord.js');
const { handleFortune } = require('./index');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('運氣')
    .setDescription('查詢今日運氣'),

  async execute(interaction) {
    await handleFortune(interaction.client, interaction);
  }
};