const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { addMoodRecord, getMoodRecords } = require('../../util/database');
const { respondToInteraction, respondWithError, MESSAGES, MOOD_EMOJIS, COLORS, createEmbed } = require('./utils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('心情')
        .setDescription('心情記錄功能')
        .addSubcommand(subcommand =>
            subcommand
                .setName('記錄')
                .setDescription('記錄當前心情')
                .addStringOption(option =>
                    option.setName('表情')
                        .setDescription('選擇表情符號')
                        .setRequired(true)
                        .addChoices(
                            ...Object.entries(MOOD_EMOJIS).map(([emoji, desc]) => ({ name: `${emoji} ${desc}`, value: emoji }))
                        ))
                .addStringOption(option =>
                    option.setName('描述')
                        .setDescription('簡短描述（可選）')
                        .setRequired(false)
                        .setMaxLength(200)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('查看')
                .setDescription('查看過往心情記錄')
                .addIntegerOption(option =>
                    option.setName('數量')
                        .setDescription('查看最近幾筆記錄（預設10筆）')
                        .setRequired(false)
                        .setMinValue(1)
                        .setMaxValue(50))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === '記錄') {
            await handleRecordMood(interaction);
        } else if (subcommand === '查看') {
            await handleViewMoods(interaction);
        }
    },
};

async function handleRecordMood(interaction) {
    const emoji = interaction.options.getString('表情');
    const description = interaction.options.getString('描述') || '';

    try {
        await addMoodRecord(interaction.user.id, emoji, description);
        const embed = createEmbed('心情記錄成功', `${emoji} ${description ? description : '（無描述）'}`, COLORS.SUCCESS);
        await respondToInteraction(interaction, embed, [], true);
    } catch (error) {
        console.error('Error recording mood:', error);
        await respondWithError(interaction, MESSAGES.ERRORS.MOOD_RECORD_FAILED);
    }
}

async function handleViewMoods(interaction) {
    const limit = interaction.options.getInteger('數量') || 10;

    try {
        const records = await getMoodRecords(interaction.user.id, limit);

        if (records.length === 0) {
            await respondWithError(interaction, MESSAGES.ERRORS.NO_RECORDS);
            return;
        }

        let description = '';
        for (const record of records) {
            const date = new Date(record.timestamp).toLocaleString('zh-TW');
            description += `${record.emoji} ${record.description || '（無描述）'} - ${date}\n`;
        }

        const embed = createEmbed(MESSAGES.SUCCESS.MOOD_VIEWED, description, COLORS.MOOD);
        await respondToInteraction(interaction, embed, [], true);
    } catch (error) {
        console.error('Error viewing moods:', error);
        await respondWithError(interaction, '查看心情記錄時發生錯誤。');
    }
}