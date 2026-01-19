const { Events, EmbedBuilder } = require('discord.js');
const { deleteUserEchos, initEchoDB, startScheduledReplies } = require('./index');

async function setupEchoEvents(client) {
    // 不再需要 modal 處理，因為銷毀直接使用按鈕
}

module.exports = {
    setupEchoEvents,
    initEchoDB,
    startScheduledReplies
};