const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { getCurrentWeather, createWeatherEmbed, createTyphoonEmbed } = require('./index');
const { respondToInteraction, respondWithError, MESSAGES, WEATHER_REGIONS, COLORS, createEmbed } = require('./utils');
const { setUserSetting, getUserSetting } = require('../../util/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('天氣')
        .setDescription('天氣相關功能')
        .addSubcommand(subcommand =>
            subcommand
                .setName('查詢')
                .setDescription('查詢即時天氣')
                .addStringOption(option =>
                    option.setName('地區')
                        .setDescription('選擇地區 (預設使用個人設定地區)')
                        .setRequired(false)
                        .addChoices(
                            ...Object.keys(WEATHER_REGIONS).map(region => ({ name: region, value: region }))
                        ))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('預報時間')
                .setDescription('設定每日天氣預報提醒時間')
                .addIntegerOption(option =>
                    option.setName('小時')
                        .setDescription('小時 (0-23)')
                        .setRequired(true)
                        .setMinValue(0)
                        .setMaxValue(23))
                .addIntegerOption(option =>
                    option.setName('分鐘')
                        .setDescription('分鐘 (0-59)')
                        .setRequired(true)
                        .setMinValue(0)
                        .setMaxValue(59)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('預設地區')
                .setDescription('設定預設天氣查詢地區')
                .addStringOption(option =>
                    option.setName('地區')
                        .setDescription('選擇地區')
                        .setRequired(true)
                        .addChoices(
                            ...Object.keys(WEATHER_REGIONS).map(region => ({ name: region, value: region }))
                        ))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === '查詢') {
            const region = interaction.options.getString('地區') || await getUserSetting(interaction.user.id, 'weather_region') || '香港天文台';
            const weatherData = await getCurrentWeather(region);
            if (!weatherData) {
                await respondWithError(interaction, MESSAGES.ERRORS.WEATHER_API_ERROR);
                return;
            }
            const embeds = [createWeatherEmbed(`【即時天氣 - ${region}】`, weatherData, region)];
            if (weatherData.typhoon) {
                embeds.push(createTyphoonEmbed(weatherData.typhoon));
            }
            await respondToInteraction(interaction, embeds[0], [], false, embeds.slice(1));
        } else if (subcommand === '預報時間') {
            const hour = interaction.options.getInteger('小時');
            const minute = interaction.options.getInteger('分鐘');
            const userId = interaction.user.id;

            await setUserSetting(userId, 'weather_reminder_hour', hour.toString());
            await setUserSetting(userId, 'weather_reminder_minute', minute.toString());

            const embed = createEmbed('設定成功', `每日天氣預報提醒時間已設定為 ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`, COLORS.SUCCESS);
            await respondToInteraction(interaction, embed);
        } else if (subcommand === '預設地區') {
            const region = interaction.options.getString('地區');
            const userId = interaction.user.id;

            await setUserSetting(userId, 'weather_region', region);

            const embed = createEmbed('設定成功', `預設天氣地區已設定為 ${region}`, COLORS.SUCCESS);
            await respondToInteraction(interaction, embed);
        }
    },
};