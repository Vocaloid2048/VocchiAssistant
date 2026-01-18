const { Events } = require('discord.js');
const { feedCat, playWithCat, workCat, buyItem, createCatEmbed, createActionButtons, createShopMenu, createCat, toggleAutoFeed, toggleAutoPlay, idleEarn } = require('./index');
const schedule = require('node-schedule');

const catJobs = new Map(); // userId -> job

// Setup cat events
function setupCatEvents(client) {
  client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isModalSubmit()) {
      if (interaction.customId === 'cat_name_modal') {
        const name = interaction.fields.getTextInputValue('cat_name');
        await createCat(interaction.user.id, name);
        const newCat = await require('./index').getCat(interaction.user.id);
        const embed = createCatEmbed(newCat);
        const buttons = createActionButtons(newCat);
        const shop = createShopMenu();
        await interaction.reply({
          content: `歡迎 ${name} 加入你的家庭！`,
          embeds: [embed],
          components: [...buttons, shop],
          ephemeral: true
        });
        return;
      }
    }

    if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

    const customId = interaction.customId;
    if (!customId.startsWith('cat_')) return;

    const userId = interaction.user.id;

    try {
      let result;
      if (customId === 'cat_feed') {
        result = await feedCat(userId);
      } else if (customId === 'cat_play') {
        result = await playWithCat(userId);
      } else if (customId === 'cat_work') {
        result = await workCat(userId);
      } else if (customId === 'cat_auto_feed') {
        result = await toggleAutoFeed(userId);
      } else if (customId === 'cat_auto_play') {
        result = await toggleAutoPlay(userId);
      } else if (customId === 'cat_status') {
        const cat = await require('./index').getCat(userId);
        const embed = createCatEmbed(cat);
        const buttons = createActionButtons(cat);
        const shop = createShopMenu();
        await interaction.update({
          embeds: [embed],
          components: [...buttons, shop]
        });
        return;
      } else if (customId === 'cat_shop') {
        const itemType = interaction.values[0];
        result = await buyItem(userId, itemType);
      }

      if (result) {
        const cat = await require('./index').getCat(userId);
        const embed = createCatEmbed(cat);
        const buttons = createActionButtons(cat);
        const shop = createShopMenu();

        await interaction.update({
          content: result.message,
          embeds: [embed],
          components: [...buttons, shop]
        });
      }
    } catch (error) {
      console.error('Cat interaction error:', error);
      await interaction.reply({ content: '發生錯誤，請稍後再試。', ephemeral: true });
    }
  });

  // Schedule auto actions
  const autoJob = schedule.scheduleJob('0 7,12,18 * * *', async () => { // 7am, 12pm, 6pm
    const { getAllCats } = require('../../util/database');
    const cats = await getAllCats();
    for (const cat of cats) {
      await idleEarn(cat.user_id);
      if (cat.auto_feed) {
        await feedCat(cat.user_id);
      }
      if (cat.auto_play) {
        await playWithCat(cat.user_id);
      }
    }
  });
}

module.exports = {
  setupCatEvents
};