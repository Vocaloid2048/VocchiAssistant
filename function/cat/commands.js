const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const { getCat, createCat, createCatEmbed, createActionButtons, createShopMenu } = require('./index');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('貓咪')
        .setDescription('管理你的虛擬貓咪')
        .addStringOption(option =>
            option.setName('功能')
                .setDescription('選擇功能 (預設: 狀態)')
                .setRequired(false)
                .addChoices(
                    { name: '狀態', value: '狀態' },
                    { name: '幫助', value: '幫助' }
                )),

    async execute(interaction) {
        const functionChoice = interaction.options.getString('功能') || '狀態';

        if (functionChoice === '幫助') {
            const helpEmbed = new EmbedBuilder()
                .setTitle('🐱 虛擬養貓說明')
                .setDescription('歡迎使用虛擬養貓功能！這裡是完整的使用指南。')
                .addFields(
                    {
                        name: '🎯 基本操作',
                        value: 
                            '**餵食**: 降低飢餓度，提升健康度 (冷卻4小時)\n' +
                            '**玩耍**: 提升幸福值 (冷卻4小時)\n' +
                            '**工作**: 賺取金錢 (冷卻8小時)\n' +
                            '**狀態**: 查看貓咪詳細狀態'
                    },
                    {
                        name: '🛒 商店系統',
                        value: 
                            '**食物**: 10金錢 - 降低飢餓，提升健康\n' +
                            '**玩具**: 15金錢 - 提升幸福值'
                    },
                    {
                        name: '⚙️ 自動功能',
                        value: 
                            '**自動餵食**: 每天7am/12pm/6pm自動餵食\n' +
                            '**自動玩耍**: 每天7am/12pm/6pm自動玩耍\n' +
                            '點擊按鈕即可開啟/關閉'
                    },
                    {
                        name: '📊 狀態說明',
                        value: 
                            '**健康度**: 餵食時提升，影響貓咪狀態\n' +
                            '**飢餓度**: 餵食時降低，過低會影響健康\n' +
                            '**幸福值**: 玩耍時提升，影響貓咪心情\n' +
                            '**經驗值**: 操作時獲得，用於升級\n' +
                            '**等級**: 每100經驗升級，解鎖新外觀'
                    },
                    {
                        name: '⏰ 時間機制',
                        value: 
                            '**放置賺錢**: 每3小時自動賺5金錢\n' +
                            '**冷卻時間**: 顯示下次可操作時間\n' +
                            '**自動執行**: 固定時間自動照顧貓咪'
                    },
                    {
                        name: '🎮 使用方法',
                        value: 
                            '1. 使用 `/貓咪` 指令開始\n' +
                            '2. 第一次使用會要求輸入貓咪名字\n' +
                            '3. 點擊按鈕進行各種操作\n' +
                            '4. 從下拉選單購買物品\n' +
                            '5. 設定自動功能讓貓咪自理'
                    }
                )
                .setColor('#ff69b4')
                .setFooter({ text: '享受養貓的樂趣吧！' });

            await interaction.reply({ embeds: [helpEmbed], ephemeral: true });
            return;
        }

        // Default: show status
        const cat = await getCat(interaction.user.id);

        if (!cat) {
            // Show modal to input cat name
            const modal = new ModalBuilder()
                .setCustomId('cat_name_modal')
                .setTitle('創建你的貓咪');

            const nameInput = new TextInputBuilder()
                .setCustomId('cat_name')
                .setLabel('貓咪名字')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('輸入貓咪的名字')
                .setRequired(true);

            const firstActionRow = new ActionRowBuilder().addComponents(nameInput);
            modal.addComponents(firstActionRow);

            await interaction.showModal(modal);
        } else {
            const embed = createCatEmbed(cat);
            const buttons = createActionButtons(cat);
            const shop = createShopMenu();
            await interaction.reply({
                embeds: [embed],
                components: [...buttons, shop],
                ephemeral: true
            });
        }
    },
};