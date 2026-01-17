// Fortune core functions
const { EmbedBuilder } = require('discord.js');
const { COLORS, MESSAGES, getRandomFortune, createEmbed, respondToInteraction, respondWithError } = require('./utils');

async function handleFortune(client, interaction) {
  try {
    const fortune = getRandomFortune(client.user.id);
    const embed = createEmbed(MESSAGES.SUCCESS.FORTUNE_SUCCESS, fortune, COLORS.FORTUNE);

    await respondToInteraction(interaction, embed, [], false);
  } catch (error) {
    console.error('Error handling fortune:', error);
    await respondWithError(interaction, MESSAGES.ERRORS.FORTUNE_FAILED);
  }
}

module.exports = {
  handleFortune
};