// Fortune utilities
const { EmbedBuilder, MessageFlags } = require('discord.js');

// Constants
const COLORS = {
  SUCCESS: 0x00ff00,
  ERROR: 0xff0000,
  INFO: 0x0099ff,
  WARNING: 0xffa500,
  FORTUNE: 0xffd700
};

const MESSAGES = {
  ERRORS: {
    FORTUNE_FAILED: '獲取運氣時發生錯誤。'
  },
  SUCCESS: {
    FORTUNE_SUCCESS: '今日運氣'
  },
  FORTUNES: [
    '大吉：今天運氣極佳，一切順利！',
    '中吉：今天運氣不錯，注意小細節。',
    '小吉：今天運氣一般，保持樂觀。',
    '吉：今天運氣尚可，機會來了要把握。',
    '末吉：今天運氣平平，耐心等待。',
    '凶：今天運氣不佳，小心行事。',
    '大凶：今天運氣很差，避免冒險。'
  ]
};

/**
 * Get a random fortune message based on today's date
 * @returns {string} Fortune message for today
 */
function getRandomFortune(clientId) {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  const dateNum = parseInt(dateStr)+parseInt(clientId.slice(-4));
  
  // Use date number to generate consistent index
  const index = dateNum % MESSAGES.FORTUNES.length;
  return MESSAGES.FORTUNES[index];
}

/**
 * Create an embed with the given title, description, and color
 * @param {string} title - Embed title
 * @param {string} description - Embed description
 * @param {number} color - Embed color
 * @returns {EmbedBuilder} The created embed
 */
function createEmbed(title, description, color) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setTimestamp();
}

/**
 * Respond to an interaction with an embed
 * @param {Interaction} interaction - The interaction to respond to
 * @param {EmbedBuilder} embed - The embed to send
 * @param {Array} components - Components to include
 * @param {boolean} ephemeral - Whether the response should be ephemeral
 */
async function respondToInteraction(interaction, embed, components = [], ephemeral = false) {
  const options = { embeds: [embed] };
  if (components.length > 0) options.components = components;
  if (ephemeral) options.flags = MessageFlags.Ephemeral;

  if (interaction.deferred || interaction.replied) {
    await interaction.editReply(options);
  } else {
    await interaction.reply(options);
  }
}

/**
 * Respond to an interaction with an error message
 * @param {Interaction} interaction - The interaction to respond to
 * @param {string} message - The error message
 */
async function respondWithError(interaction, message) {
  const embed = createEmbed('錯誤', message, COLORS.ERROR);
  await respondToInteraction(interaction, embed, [], true);
}

module.exports = {
  COLORS,
  MESSAGES,
  getRandomFortune,
  createEmbed,
  respondToInteraction,
  respondWithError
};