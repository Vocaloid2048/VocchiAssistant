const schedule = require('node-schedule');
const { getCurrentWeather, createWeatherEmbed } = require('./index');
const { getRandomFortune } = require('../fortune/utils');
const { getAllUsersWithSetting, getUserSetting } = require('../../util/database');

const weatherJobs = new Map(); // userId -> job

// Function to schedule weather reports for a user
async function scheduleWeatherForUser(client, userId) {
  // Cancel existing job
  if (weatherJobs.has(userId)) {
    weatherJobs.get(userId).cancel();
  }

  const hour = await getUserSetting(userId, 'weather_reminder_hour') || '7';
  const minute = await getUserSetting(userId, 'weather_reminder_minute') || '0';
  const region = await getUserSetting(userId, 'weather_region') || '香港天文台';

  const rule = new schedule.RecurrenceRule();
  rule.hour = parseInt(hour);
  rule.minute = parseInt(minute);
  rule.tz = 'Asia/Hong_Kong';

  const job = schedule.scheduleJob(rule, async () => {
    try {
      const weatherData = await getCurrentWeather(region);
      if (!weatherData) return;

      const fortune = getRandomFortune(client.user.id);

      const embed = createWeatherEmbed(`【即時天氣 - ${region}】`, weatherData, region);
      embed.addFields({ name: '運氣', value: fortune, inline: false });

      const user = await client.users.fetch(userId);
      await user.send({ embeds: [embed] });
    } catch (error) {
      console.error(`Error sending weather report to ${userId}:`, error);
    }
  });

  weatherJobs.set(userId, job);
}

// Function to cancel weather reports for a user
function cancelWeatherForUser(userId) {
  if (weatherJobs.has(userId)) {
    weatherJobs.get(userId).cancel();
    weatherJobs.delete(userId);
  }
}

function setupWeatherEvents(client) {
  // Initial setup
  client.once('ready', async () => {
    const subscribedUsers = await getAllUsersWithSetting('weather_subscription', 'true');
    for (const userId of subscribedUsers) {
      await scheduleWeatherForUser(client, userId);
    }
  });

  console.log('Weather events scheduled.');
}

module.exports = {
  setupWeatherEvents,
  scheduleWeatherForUser,
  cancelWeatherForUser,
};