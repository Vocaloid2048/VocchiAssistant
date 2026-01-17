const schedule = require('node-schedule');
const { getTodayForecast, createWeatherEmbed } = require('./index');
const { getRandomFortune } = require('../fortune/utils');
const { getAllUsersWithSetting } = require('../../util/database');

function setupWeatherEvents(client) {
  // Schedule daily weather report at 7:00 AM
  const rule = new schedule.RecurrenceRule();
  rule.hour = 7;
  rule.minute = 0;
  rule.tz = 'Asia/Hong_Kong'; // Hong Kong timezone

  schedule.scheduleJob(rule, async () => {
    try {
      const forecast = await getTodayForecast();
      if (!forecast) return;

      const fortune = getRandomFortune(client.user.id);

      const embed = createWeatherEmbed('今天天氣預報', forecast);
      embed.addFields({ name: '運氣', value: fortune, inline: false });

      // Get all users subscribed to weather
      const subscribedUsers = await getAllUsersWithSetting('weather_subscription', 'true');

      for (const userId of subscribedUsers) {
        try {
          const user = await client.users.fetch(userId);
          await user.send({ embeds: [embed] });
        } catch (error) {
          console.error(`Failed to send weather report to ${userId}:`, error);
        }
      }
    } catch (error) {
      console.error('Error sending daily weather report:', error);
    }
  });

  console.log('Weather events scheduled.');
}

module.exports = {
  setupWeatherEvents,
};