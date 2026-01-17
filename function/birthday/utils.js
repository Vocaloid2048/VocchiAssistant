// Birthday utilities
const { EmbedBuilder, MessageFlags } = require('discord.js');

// Constants
const COLORS = {
  SUCCESS: 0x00ff00,
  ERROR: 0xff0000,
  INFO: 0x0099ff,
  WARNING: 0xffa500,
  BIRTHDAY: 0xffd700
};

const MESSAGES = {
  ERRORS: {
    ADD_FAILED: '新增生日提醒時發生錯誤。',
    REMOVE_FAILED: '刪除生日提醒時發生錯誤。',
    LIST_FAILED: '獲取生日列表時發生錯誤。',
    SEARCH_FAILED: '搜索用戶時發生錯誤。',
    USER_NOT_FOUND: '找不到該用戶的生日提醒。',
    NO_BIRTHDAYS: '目前沒有任何生日提醒。'
  },
  SUCCESS: {
    ADD_SUCCESS: '生日提醒已新增',
    REMOVE_SUCCESS: '生日提醒已刪除'
  },
  TITLES: {
    ADD: '新增生日提醒',
    REMOVE: '刪除生日提醒',
    LIST: '生日提醒列表',
    TEST: '測試生日提醒'
  }
};

/**
 * Parse user input to extract user ID from mention format
 * @param {string} input - User input
 * @returns {string} Cleaned user input
 */
function parseUserInput(input) {
  return input.trim().replace(/^<@!?(\d+)>$/, '$1');
}

/**
 * Check if a string is a valid Discord user ID
 * @param {string} str - String to check
 * @returns {boolean} True if valid Discord ID
 */
function isDiscordId(str) {
  return /^\d+$/.test(str);
}

/**
 * Get user display information
 * @param {Client} client - Discord client
 * @param {string} userId - User ID or custom name
 * @returns {Promise<{displayName: string, username: string, userId: string}>}
 */
async function getUserInfo(client, userId) {
  const cleanId = parseUserInput(userId);

  try {
    const user = await client.users.fetch(cleanId);
    return {
      displayName: user.displayName,
      username: user.username,
      userId: user.id
    };
  } catch (error) {
    // Not a valid Discord ID, treat as custom name
    return {
      displayName: cleanId,
      username: cleanId,
      userId: cleanId
    };
  }
}

/**
 * Format date string
 * @param {number} month - Month (1-12)
 * @param {number} day - Day (1-31)
 * @returns {string} Formatted date string
 */
function formatDate(month, day) {
  return `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
}

/**
 * Sort birthdays by date
 * @param {Array} birthdays - Array of birthday objects
 * @returns {Array} Sorted birthdays
 */
function sortBirthdaysByDate(birthdays) {
  return birthdays.sort((a, b) => {
    const [aMonth, aDay] = a.date.split('/').map(Number);
    const [bMonth, bDay] = b.date.split('/').map(Number);
    if (aMonth !== bMonth) return aMonth - bMonth;
    return aDay - bDay;
  });
}

/**
 * Get display name for birthday list
 * @param {Object} birthday - Birthday object
 * @returns {string} Display name
 */
function getBirthdayDisplayName(birthday) {
  return isDiscordId(birthday.user_id) ? `<@${birthday.user_id}>` : birthday.display_name;
}

/**
 * Create embed with consistent styling
 * @param {string} title - Embed title
 * @param {string} description - Embed description (optional)
 * @param {number} color - Embed color
 * @returns {EmbedBuilder} Configured embed
 */
function createEmbed(title, description, color = COLORS.INFO) {
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setColor(color);

  if (description && description.trim().length > 0) {
    embed.setDescription(description);
  }

  return embed;
}

/**
 * Handle interaction response with proper error handling
 * @param {Interaction} interaction - Discord interaction
 * @param {EmbedBuilder} embed - Embed to send
 * @param {Array} components - Components to include
 * @param {boolean} ephemeral - Whether to make ephemeral
 */
async function respondToInteraction(interaction, embed, components = [], ephemeral = false) {
  const options = { embeds: [embed] };
  if (components.length > 0) options.components = components;
  if (ephemeral) options.flags = MessageFlags.Ephemeral;

  if (interaction.replied || interaction.deferred) {
    await interaction.editReply(options);
  } else {
    await interaction.reply(options);
  }
}

/**
 * Handle interaction error response
 * @param {Interaction} interaction - Discord interaction
 * @param {string} errorMessage - Error message
 */
async function respondWithError(interaction, errorMessage) {
  const embed = createEmbed('錯誤', errorMessage, COLORS.ERROR);
  await respondToInteraction(interaction, embed, [], true);
}

module.exports = {
  COLORS,
  MESSAGES,
  parseUserInput,
  isDiscordId,
  getUserInfo,
  formatDate,
  sortBirthdaysByDate,
  getBirthdayDisplayName,
  createEmbed,
  respondToInteraction,
  respondWithError
};