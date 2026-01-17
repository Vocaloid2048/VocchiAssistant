const { EmbedBuilder } = require('discord.js');

// Colors for embeds
const COLORS = {
  SUCCESS: 0x00FF00, // Green for success
  ERROR: 0xFF0000,   // Red for error
};

// Messages
const MESSAGES = {
  SUCCESS: {
    SUBSCRIPTION_UPDATED: '訂閱設定已更新！',
  },
  ERRORS: {
    SUBSCRIPTION_FAILED: '訂閱設定失敗，請稍後再試。',
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

module.exports = {
  COLORS,
  MESSAGES,
  createEmbed,
  respondToInteraction,
  respondWithError,
};