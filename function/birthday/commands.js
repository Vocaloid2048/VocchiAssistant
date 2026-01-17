const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, MessageFlags } = require('discord.js');
const { getAllBirthdays, searchBirthdays } = require('../../util/database');
const { handleBirthdayAdd, handleBirthdayRemove } = require('.');

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
        const dateStr = `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
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

        const embed = new EmbedBuilder()
          .setTitle('新增生日提醒')
          .setDescription(`為 ${userInput} 選擇生日月份：`)
          .setColor(0x00ff00);

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
          const embed = new EmbedBuilder()
            .setTitle('生日提醒列表')
            .setDescription('目前沒有任何生日提醒。')
            .setColor(0x0099ff);
          return interaction.reply({ embeds: [embed] });
        }

        const embed = new EmbedBuilder()
          .setTitle('生日提醒列表')
          .setColor(0x0099ff);

        // Sort birthdays by date
        birthdays.sort((a, b) => {
          const [aMonth, aDay] = a.date.split('/').map(Number);
          const [bMonth, bDay] = b.date.split('/').map(Number);
          if (aMonth !== bMonth) return aMonth - bMonth;
          return aDay - bDay;
        });

        let description = '';
        for (const birthday of birthdays) {
          const display = /^\d+$/.test(birthday.user_id) ? `<@${birthday.user_id}>` : birthday.display_name;
          description += `${birthday.date} - ${display}\n`;
        }
        embed.setDescription(description);

        await interaction.reply({ embeds: [embed] });
      } catch (error) {
        console.error(error);
        await interaction.reply({ content: '獲取生日列表時發生錯誤。', flags: MessageFlags.Ephemeral });
      }
    } else if (subcommand === '測試') {
      const userId = interaction.options.getString('用戶');
      // Simulate birthday reminder for tomorrow
      const embed = new EmbedBuilder()
        .setTitle('🎉 明天生日提醒')
        .setDescription(`<@${userId}>`)
        .setColor(0xffd700);

      await interaction.reply({ embeds: [embed] });
    }
  }
};