const { EmbedBuilder } = require('discord.js');

// Colors for embeds
const COLORS = {
  MOOD: 0xFFC0CB, // Pink for mood
  SUCCESS: 0x00FF00, // Green for success
  ERROR: 0xFF0000,   // Red for error
};

// Messages
const MESSAGES = {
  SUCCESS: {
    MOOD_RECORDED: '心情記錄成功！',
    MOOD_VIEWED: '查看心情記錄',
  },
  ERRORS: {
    MOOD_RECORD_FAILED: '記錄心情失敗，請稍後再試。',
    NO_RECORDS: '您還沒有任何心情記錄。',
    INVALID_EMOJI: '請選擇有效的表情符號。',
  },
};

// Common emojis for mood selection
const MOOD_EMOJIS = {
  '😀': '開心',
  '😢': '難過',
  '😠': '生氣',
  '😴': '疲憊',
  '😍': '愛',
  '🤔': '思考',
  '😎': '自信',
  '😭': '哭泣',
  '🥰': '溫暖',
  '😱': '驚訝',
};

// Create embed
function createEmbed(title, description, color) {
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setColor(color)
    .setTimestamp();
  if (description) {
    embed.setDescription(description);
  }
  return embed;
}

// Respond to interaction
async function respondToInteraction(interaction, embed, components = [], ephemeral = false, additionalEmbeds = []) {
  const options = { embeds: [embed, ...additionalEmbeds] };
  if (components.length > 0) {
    options.components = components;
  }
  if (ephemeral) {
    options.flags = 64; // Ephemeral flag
  }

  if (interaction.replied) {
    await interaction.followUp(options);
  } else if (interaction.deferred) {
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
  MOOD_EMOJIS,
  respondToInteraction,
  respondWithError,
};