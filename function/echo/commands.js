const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { saveEcho, checkDailyLimit, getEchoRecords, deleteUserEchos } = require('./index');

// 輸入命令
const echoCommand = {
    data: new SlashCommandBuilder()
        .setName('殘響')
        .setDescription('記錄你的殘響')
        .addStringOption(option =>
            option.setName('內容')
                .setDescription('你想說的話')
                .setRequired(true)),

    async execute(interaction) {
        const content = interaction.options.getString('內容');

        // 檢查每日限制
        const canInput = await checkDailyLimit(interaction.user.id);
        if (!canInput) {
            return await interaction.reply({
                content: '今天你已經留下過殘響了，請明天再來吧！',
                ephemeral: true
            });
        }

        // 保存殘響
        await saveEcho(interaction.user.id, content);

        await interaction.reply('……收下了。');
    }
};

// 記錄命令
const recordCommand = {
    data: new SlashCommandBuilder()
        .setName('殘響記錄')
        .setDescription('查看最近的殘響記錄')
        .addIntegerOption(option =>
            option.setName('天數')
                .setDescription('最近多少天 (預設: 7)')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(30)),

    async execute(interaction) {
        const days = interaction.options.getInteger('天數') || 7;
        const records = await getEchoRecords(interaction.user.id, days);

        if (records.length === 0) {
            return await interaction.reply({
                content: '你還沒有任何殘響記錄。',
                ephemeral: true
            });
        }

        // 分頁顯示，每頁20筆
        const pageSize = 20;
        const totalPages = Math.ceil(records.length / pageSize);
        let currentPage = 0;

        const createEmbed = (page) => {
            const start = page * pageSize;
            const end = start + pageSize;
            const pageRecords = records.slice(start, end);

            const embed = new EmbedBuilder()
                .setTitle(`📝 你的殘響記錄 (最近${days}天)`)
                .setDescription(`第 ${page + 1}/${totalPages} 頁`)
                .setColor(0x9b59b6);

            pageRecords.forEach(record => {
                const timestamp = Math.floor(record.timestamp / 1000); // Discord timestamp
                embed.addFields({
                    name: `<t:${timestamp}:f>`,
                    value: record.content,
                    inline: false
                });
            });

            return embed;
        };

        const createButtons = (page) => {
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('prev_page')
                        .setLabel('上一頁')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(page === 0),
                    new ButtonBuilder()
                        .setCustomId('next_page')
                        .setLabel('下一頁')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(page === totalPages - 1)
                );
            return row;
        };

        const message = await interaction.reply({
            embeds: [createEmbed(currentPage)],
            components: totalPages > 1 ? [createButtons(currentPage)] : [],
            ephemeral: true
        });

        if (totalPages > 1) {
            const collector = message.createMessageComponentCollector({
                time: 300000 // 5分鐘
            });

            collector.on('collect', async (i) => {
                if (i.customId === 'prev_page' && currentPage > 0) {
                    currentPage--;
                } else if (i.customId === 'next_page' && currentPage < totalPages - 1) {
                    currentPage++;
                }

                await i.update({
                    embeds: [createEmbed(currentPage)],
                    components: [createButtons(currentPage)]
                });
            });
        }
    }
};

// 銷毀命令
const deleteCommand = {
    data: new SlashCommandBuilder()
        .setName('殘響銷毀')
        .setDescription('刪除所有你的殘響記錄'),

    async execute(interaction) {
        // 直接顯示確認信息
        const confirmEmbed = new EmbedBuilder()
            .setTitle('⚠️ 最後確認')
            .setDescription('真的要刪除嗎？可是這些是這段時間你説過的真心話誒......')
            .setColor(0xff6b6b);

        const message = await interaction.reply({
            embeds: [confirmEmbed],
            components: [{
                type: 1,
                components: [
                    {
                        type: 2,
                        style: 4, // Danger
                        label: '刪除',
                        custom_id: `echo_delete_${interaction.user.id}`
                    },
                    {
                        type: 2,
                        style: 2, // Secondary
                        label: '取消',
                        custom_id: `echo_cancel_${interaction.user.id}`
                    }
                ]
            }],
            ephemeral: true
        });

        // 設置 collector 來處理按鈕點擊
        const collector = message.createMessageComponentCollector({
            time: 30000 // 30秒
        });

        collector.on('collect', async (i) => {
            if (i.customId === `echo_delete_${interaction.user.id}`) {
                await deleteUserEchos(interaction.user.id);
                await i.update({
                    content: '你的所有殘響記錄已被刪除。',
                    embeds: [],
                    components: []
                });
            } else if (i.customId === `echo_cancel_${interaction.user.id}`) {
                await i.update({
                    content: '取消刪除操作。',
                    embeds: [],
                    components: []
                });
            }
        });

        collector.on('end', async () => {
            // 如果超時，刪除按鈕
            try {
                await interaction.editReply({
                    components: []
                });
            } catch (error) {
                // 忽略錯誤
            }
        });
    }
};

module.exports = [echoCommand, recordCommand, deleteCommand];