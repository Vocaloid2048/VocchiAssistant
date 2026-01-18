const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { getCat, createCat, createCatEmbed, createActionButtons, createShopMenu } = require('./index');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('貓咪')
        .setDescription('管理你的虛擬貓咪'),

    async execute(interaction) {
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