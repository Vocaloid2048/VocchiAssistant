const { EmbedBuilder } = require('discord.js');

// Colors
const COLORS = {
    SUCCESS: 0x00ff00,
    ERROR: 0xff0000,
    INFO: 0x0099ff,
    WARNING: 0xffff00
};

// Messages
const MESSAGES = {
    ERRORS: {
        NO_CAT: '你還沒有貓咪！請先創建一隻貓咪。',
        COOLDOWN: '動作冷卻中，請稍後再試。',
        INSUFFICIENT_MONEY: '金錢不足！',
        INVALID_ITEM: '無效物品！'
    },
    SUCCESS: {
        FEED: '餵食成功！',
        PLAY: '玩耍成功！',
        WORK: '工作成功！',
        BUY: '購買成功！'
    }
};

// Create embed
function createEmbed(title, description, color = COLORS.INFO) {
    return new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color)
        .setTimestamp();
}

// Respond to interaction
async function respondToInteraction(interaction, embed, components = [], ephemeral = false, additionalEmbeds = []) {
    const options = {
        embeds: [embed, ...additionalEmbeds],
        components,
        ephemeral
    };
    if (interaction.replied || interaction.deferred) {
        await interaction.editReply(options);
    } else {
        await interaction.reply(options);
    }
}

// Respond with error
async function respondWithError(interaction, message, ephemeral = true) {
    const embed = createEmbed('錯誤', message, COLORS.ERROR);
    await respondToInteraction(interaction, embed, [], ephemeral);
}

module.exports = {
    createEmbed,
    COLORS,
    MESSAGES,
    respondToInteraction,
    respondWithError
};