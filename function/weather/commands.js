const { SlashCommandBuilder } = require('discord.js');
const { getCurrentWeather, createWeatherEmbed, createTyphoonEmbed } = require('./index');
const { respondToInteraction, respondWithError, MESSAGES, WEATHER_REGIONS, COLORS } = require('./utils');
const { getUserSetting } = require('../../util/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('天氣')
        .setDescription('查詢即時天氣')
        .addStringOption(option =>
            option.setName('地區')
                .setDescription('選擇地區 (預設使用個人設定地區)')
                .setRequired(false)
                .addChoices(
                    ...Object.keys(WEATHER_REGIONS).map(region => ({ name: region, value: region }))
                )),

    async execute(interaction) {
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
    },
};