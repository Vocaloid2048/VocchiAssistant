const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, MessageFlags } = require('discord.js');
const { getAllBirthdays, searchBirthdays } = require('../../util/database');
const { handleBirthdayAdd, handleBirthdayRemove } = require('.');
const { COLORS, MESSAGES, sortBirthdaysByDate, getBirthdayDisplayName, createEmbed, respondToInteraction, respondWithError } = require('./utils');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('生日提醒')
    .setDescription('管理生日提醒')
    .addSubcommand(subcommand =>
      subcommand
        .setName('新增')
        .setDescription('新增生日提醒')
        .addStringOption(option =>
          option.setName('用戶')
            .setDescription('輸入Discord用戶ID或自定義名字')
            .setRequired(true))
        .addIntegerOption(option =>
          option.setName('月份')
            .setDescription('生日月份 (1-12)')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(12))
        .addIntegerOption(option =>
          option.setName('日期')
            .setDescription('生日日期 (1-31)')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(31)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('刪除')
        .setDescription('刪除生日提醒')
        .addStringOption(option =>
          option.setName('用戶')
            .setDescription('輸入用戶ID或名字進行搜索')
            .setRequired(true)
            .setAutocomplete(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('列表')
        .setDescription('查看所有生日提醒'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('測試')
        .setDescription('測試生日提醒功能')
        .addStringOption(option =>
          option.setName('用戶')
            .setDescription('輸入用戶ID或名字進行搜索')
            .setRequired(true)
            .setAutocomplete(true))),
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === '新增') {
      const userInput = interaction.options.getString('用戶');
      const month = interaction.options.getInteger('月份');
      const day = interaction.options.getInteger('日期');

      if (month && day) {
        // Direct add with provided date
        await handleBirthdayAdd(interaction.client, interaction, userInput, month, day);
      } else {
        // Show month select menu
        const monthOptions = [];
        for (let i = 1; i <= 12; i++) {
          monthOptions.push({
            label: `${i}月`,
            value: i.toString(),
          });
        }

        const monthSelect = new StringSelectMenuBuilder()
          .setCustomId(`birthday_add_month_${Buffer.from(userInput).toString('base64')}`)
          .setPlaceholder('選擇月份')
          .addOptions(monthOptions);

        const embed = createEmbed(MESSAGES.TITLES.ADD, `為 ${userInput} 選擇生日月份：`, COLORS.SUCCESS);
        const row = new ActionRowBuilder().addComponents(monthSelect);

        await interaction.reply({ embeds: [embed], components: [row], flags: MessageFlags.Ephemeral });
      }
    } else if (subcommand === '刪除') {
      const userId = interaction.options.getString('用戶');
      await handleBirthdayRemove(interaction.client, interaction, userId);
    } else if (subcommand === '列表') {
      try {
        const birthdays = await getAllBirthdays();
        if (birthdays.length === 0) {
          const embed = createEmbed(MESSAGES.TITLES.LIST, MESSAGES.ERRORS.NO_BIRTHDAYS, COLORS.INFO);
          return interaction.reply({ embeds: [embed] });
        }

        const embed = createEmbed(MESSAGES.TITLES.LIST, '', COLORS.INFO);

        // Sort birthdays by date
        const sortedBirthdays = sortBirthdaysByDate(birthdays);

        let description = '';
        for (const birthday of sortedBirthdays) {
          const display = getBirthdayDisplayName(birthday);
          description += `${birthday.date} - ${display}\n`;
        }
        embed.setDescription(description);

        await interaction.reply({ embeds: [embed] });
      } catch (error) {
        console.error(error);
        await respondWithError(interaction, MESSAGES.ERRORS.LIST_FAILED);
      }
    } else if (subcommand === '測試') {
      const userId = interaction.options.getString('用戶');
      // Simulate birthday reminder for tomorrow
      const embed = createEmbed('🎉 明天生日提醒', `<@${userId}>`, COLORS.BIRTHDAY);

      await interaction.reply({ embeds: [embed] });
    }
  }
};