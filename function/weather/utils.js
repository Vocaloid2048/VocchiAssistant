const { EmbedBuilder } = require('discord.js');

// Colors for embeds
const COLORS = {
  WEATHER: 0x0099FF, // Blue for weather
  SUCCESS: 0x00FF00, // Green for success
  ERROR: 0xFF0000,   // Red for error
};

// Messages
const MESSAGES = {
  SUCCESS: {
    WEATHER_SET: '地區設定成功！',
  },
  ERRORS: {
    WEATHER_API_ERROR: '無法獲取天氣數據，請稍後再試。',
    INVALID_REGION: '無效的地區。',
    WEATHER_SET_FAILED: '設定地區失敗。',
  },
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
async function respondWithError(interaction, message) {
  const embed = createEmbed('錯誤', message, COLORS.ERROR);
  await respondToInteraction(interaction, embed, [], true);
}

// Weather regions mapping (based on HKO stations, limited to 25)
const WEATHER_REGIONS = {
  '香港天文台': '香港天文台',
  '京士柏': '京士柏',
  '黃竹坑': '黃竹坑',
  '打鼓嶺': '打鼓嶺',
  '流浮山': '流浮山',
  '大埔': '大埔',
  '沙田': '沙田',
  '屯門': '屯門',
  '將軍澳': '將軍澳',
  '西貢': '西貢',
  '長洲': '長洲',
  '赤鱲角': '赤鱲角',
  '青衣': '青衣',
  '石崗': '石崗',
  '荃灣可觀': '荃灣可觀',
  '荃灣城門谷': '荃灣城門谷',
  '香港公園': '香港公園',
  '筲箕灣': '筲箕灣',
  '九龍城': '九龍城',
  '跑馬地': '跑馬地',
  '黃大仙': '黃大仙',
  '赤柱': '赤柱',
  '觀塘': '觀塘',
  '深水埗': '深水埗',
  '啟德跑道公園': '啟德跑道公園',
};

module.exports = {
  COLORS,
  MESSAGES,
  createEmbed,
  respondToInteraction,
  respondWithError,
  WEATHER_REGIONS,
};