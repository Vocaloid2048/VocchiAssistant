const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const schedule = require('node-schedule');
const { getSetting, searchBirthdays } = require('../../util/database');
const { sendBirthdayReminder, handleBirthdayAdd, handleBirthdayRemove } = require('./index');
const { COLORS, MESSAGES, createEmbed, respondToInteraction } = require('./utils');

function setupBirthdayEvents(client) {
  // Handle interactions
  client.on('interactionCreate', async (interaction) => {
    if (interaction.isAutocomplete()) {
      if (interaction.commandName === '生日提醒') {
        const focusedOption = interaction.options.getFocused(true);
        if (focusedOption.name === '用戶') {
          const query = focusedOption.value;
          try {
            const birthdays = await searchBirthdays(query);
            const choices = await Promise.all(birthdays.slice(0, 25).map(async (birthday) => {
              let displayName = birthday.display_name;
              if (/^\d+$/.test(birthday.user_id)) {
                try {
                  const user = await client.users.fetch(birthday.user_id);
                  displayName = user.displayName;
                } catch (error) {
                  // Keep the stored display_name if fetch fails
                }
              }
              return {
                name: displayName,
                value: birthday.user_id
              };
            }));
            await interaction.respond(choices);
          } catch (error) {
            console.error(error);
            await interaction.respond([]);
          }
        }
      }
    } else if (interaction.isStringSelectMenu()) {
      if (interaction.customId.startsWith('birthday_add_month_')) {
        const encodedUserInput = interaction.customId.split('_')[3];
        const userInput = Buffer.from(encodedUserInput, 'base64').toString('utf-8');
        const month = parseInt(interaction.values[0]);

        // Day select - split into two menus if more than 15 days
        const daysInMonth = new Date(2024, month, 0).getDate();
        const dayOptions1 = [];
        const dayOptions2 = [];

        for (let i = 1; i <= Math.min(daysInMonth, 15); i++) {
          dayOptions1.push({
            label: `${i}日`,
            value: i.toString(),
          });
        }

        if (daysInMonth > 15) {
          for (let i = 16; i <= daysInMonth; i++) {
            dayOptions2.push({
              label: `${i}日`,
              value: i.toString(),
            });
          }
        }

        const daySelect1 = new StringSelectMenuBuilder()
          .setCustomId(`birthday_add_day_${encodedUserInput}_${month}_1`)
          .setPlaceholder('選擇日期 (1-15)')
          .addOptions(dayOptions1);

        const row1 = new ActionRowBuilder().addComponents(daySelect1);

        let components = [row1];

        if (dayOptions2.length > 0) {
          const daySelect2 = new StringSelectMenuBuilder()
            .setCustomId(`birthday_add_day_${encodedUserInput}_${month}_2`)
            .setPlaceholder('選擇日期 (16-31)')
            .addOptions(dayOptions2);

          const row2 = new ActionRowBuilder().addComponents(daySelect2);
          components.push(row2);
        }

        const embed = createEmbed(MESSAGES.TITLES.BIRTHDAY_ADD, `選擇生日日期：`, COLORS.SUCCESS);

        await interaction.update({ embeds: [embed], components: components });
      } else if (interaction.customId.startsWith('birthday_add_day_')) {
        const parts = interaction.customId.split('_');
        const encodedUserInput = parts[3];
        const userInput = Buffer.from(encodedUserInput, 'base64').toString('utf-8');
        const month = parseInt(parts[4]);
        const day = parseInt(interaction.values[0]);

        await handleBirthdayAdd(client, interaction, userInput, month, day);
      }
    }
  });

  // Setup daily schedule
  client.once('ready', () => {
    schedule.scheduleJob('50 23 * * *', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const month = (tomorrow.getMonth() + 1).toString().padStart(2, '0');
      const day = tomorrow.getDate().toString().padStart(2, '0');
      const dateStr = `${month}/${day}`;

      const channelId = await getSetting('reminder_channel');
      if (channelId) {
        await sendBirthdayReminder(client, dateStr, channelId);
      }
    });
  });
}

module.exports = {
  setupBirthdayEvents,
};