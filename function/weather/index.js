const { EmbedBuilder } = require('discord.js');
const { createEmbed, COLORS, MESSAGES, respondWithError } = require('./utils');

// Fetch weather data from HKO API
async function fetchWeatherData(dataType, lang = 'tc') {
  const url = `https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=${dataType}&lang=${lang}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null;
  }
}

// Fetch astronomical data (sunrise/sunset)
async function fetchSunData() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1; // getMonth() is 0-based
  const day = today.getDate();
  const url = `https://data.weather.gov.hk/weatherAPI/opendata/opendata.php?dataType=SRS&rformat=json&year=${year}&month=${month}&day=${day}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data.data && data.data.length > 0) {
      return {
        sunrise: data.data[0][1],
        sunset: data.data[0][3],
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching sun data:', error);
    return null;
  }
}

// Fetch moon data (moonrise/moonset)
async function fetchMoonData() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  const url = `https://data.weather.gov.hk/weatherAPI/opendata/opendata.php?dataType=MRS&rformat=json&year=${year}&month=${month}&day=${day}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data.data && data.data.length > 0) {
      return {
        moonrise: data.data[0][1],
        moonset: data.data[0][3],
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching moon data:', error);
    return null;
  }
}

// Get current weather for a region
async function getCurrentWeather(region) {
  const data = await fetchWeatherData('rhrread');
  if (!data || !data.temperature || !data.temperature.data) return null;

  // Get sun data
  const sunData = await fetchSunData();

  // Get moon data
  const moonData = await fetchMoonData();

  // Find the station for the region
  const station = data.temperature.data.find(st => st.place === region);
  if (!station) return null;

  const temp = station.value;
  const unit = station.unit || 'C';

  // Humidity
  const humidityData = data.humidity?.data?.find(st => st.place === region);
  let humidity = 'N/A';
  if (humidityData && typeof humidityData.value === 'number') {
    humidity = `${humidityData.value}%`;
  } else {
    // If no data for region, use observatory or first in list
    const observatoryHumidity = data.humidity?.data?.find(st => st.place === '香港天文台' && typeof st.value === 'number');
    if (observatoryHumidity) {
      humidity = `${observatoryHumidity.value}% (天文台)`;
    } else {
      const first = data.humidity?.data?.find(st => typeof st.value === 'number');
      if (first) {
        humidity = `${first.value}% (${first.place})`;
      }
    }
  }

  // Rainfall
  const rainfallData = data.rainfall?.data?.find(st => st.place === region);
  let rainfall = 'N/A';
  if (rainfallData && typeof rainfallData.value === 'number') {
    rainfall = `${rainfallData.value} ${rainfallData.unit}`;
  } else {
    // If no data for region, use observatory or first in list
    const observatoryRainfall = data.rainfall?.data?.find(st => st.place === '西貢' && typeof st.max === 'number');
    if (observatoryRainfall) {
      rainfall = `${observatoryRainfall.max} ${observatoryRainfall.unit} (西貢)`;
    } else {
      const first = data.rainfall?.data?.find(st => typeof st.max === 'number');
      if (first) {
        rainfall = `${first.max} ${first.unit} (${first.place})`;
      }
    }
  }

  // Wind (try mean wind)
  const windData = data.wind?.data?.find(st => st.place === region);
  let wind = 'N/A';
  if (windData) {
    wind = windData.meanSpeed ? `${windData.meanSpeed} ${windData.unit}` : `${windData.speed} ${windData.unit}`;
  }

  // Sunrise/Sunset
  const sunrise = sunData?.sunrise || 'N/A';
  const sunset = sunData?.sunset || 'N/A';

  // Moonrise/Moonset
  const moonrise = moonData?.moonrise || 'N/A';
  const moonset = moonData?.moonset || 'N/A';

  // Weather description (global icon)
  const weatherDesc = data.icon && data.icon.length > 0 ? getWeatherDescription(data.icon[0]) : 'N/A';

  // Warning message
  const warning = data.warningMessage ? data.warningMessage.join('\n') : null;

  // Typhoon message
  const typhoon = data.tcmessage ? data.tcmessage : null;

  // Get forecast for max/min temp
  const forecast = await getTodayForecast();

  return {
    temperature: `${temp}°${unit}`,
    maxTemp: forecast?.maxTemp || 'N/A',
    minTemp: forecast?.minTemp || 'N/A',
    humidity,
    rainfall,
    wind,
    description: weatherDesc,
    warning,
    typhoon,
    sunrise,
    sunset,
    moonrise,
    moonset,
  };
}

// Get forecast for today
async function getTodayForecast() {
  const data = await fetchWeatherData('fnd');
  if (!data || !data.weatherForecast) return null;

  const today = data.weatherForecast[0]; // Today's forecast
  if (!today) return null;

  const maxTemp = today.forecastMaxtemp?.value ? `${today.forecastMaxtemp.value}°${today.forecastMaxtemp.unit}` : 'N/A';
  const minTemp = today.forecastMintemp?.value ? `${today.forecastMintemp.value}°${today.forecastMintemp.unit}` : 'N/A';
  const desc = today.forecastWeather || 'N/A';
  const humidity = today.forecastRelativeHumidity?.value ? `${today.forecastRelativeHumidity.value}%` : 'N/A';
  const wind = today.forecastWind || 'N/A';

  return {
    maxTemp,
    minTemp,
    description: desc,
    humidity,
    wind,
  };
}

// Simple weather description mapping (based on HKO icons)
function getWeatherDescription(icon) {
  const descriptions = {
    50: '☀️ 陽光充沛',
    51: '🌤️ 間有陽光',
    52: '⛅ 短暫陽光',
    53: '🌦️ 間有陽光幾陣驟雨',
    54: '🌦️ 短暫陽光有驟雨',
    60: '☁️ 多雲',
    61: '☁️ 密雲',
    62: '🌦️ 微雨',
    63: '🌧️ 雨',
    64: '⛈️ 大雨',
    65: '⛈️ 雷暴',
    70: '🌑 天色良好(新月)',
    71: '🌒 天色良好(眉月)',
    72: '🌔 天色良好(盈凸)',
    73: '🌕 天色良好(滿月)',
    74: '🌖 天色良好(虧凸)',
    75: '🌘 天色良好(殘月)',
    76: '☁️ 大致多雲',
    77: '🌙 天色大致良好',
    80: '💨 大風',
    81: '🏜️ 乾燥',
    82: '💧 潮濕',
    83: '🌫️ 霧',
    84: '🌫️ 薄霧',
    85: '🌫️ 煙霞',
    90: '🥵 熱',
    91: '☀️ 暖',
    92: '❄️ 涼',
    93: '🥶 冷',
    };
  return descriptions[icon] || '❓ 未知';
}

// Create weather embed
function createWeatherEmbed(title, weatherData, region = null) {
  const description = weatherData.warning ? `⚠️ ${weatherData.warning}` : '';
  const embed = createEmbed(title, description, COLORS.WEATHER);

  const tempField = weatherData.temperature && weatherData.maxTemp && weatherData.minTemp
    ? `${weatherData.temperature} (↑${weatherData.maxTemp} / ↓${weatherData.minTemp})`
    : weatherData.temperature || 'N/A';

  embed.addFields(
    { name: '🌡️ 温度', value: tempField, inline: true },
    { name: '🌤️ 天氣狀況', value: weatherData.description || 'N/A', inline: true },
     { name: '\u200b', value: ' ', inline: false }, 
    { name: '💧 濕度', value: weatherData.humidity || 'N/A', inline: true},
    { name: '🌧️ 降雨量', value: weatherData.rainfall || 'N/A', inline: true },
     { name: '\u200b', value: ' ', inline: false }, 
    { name: '🌅 日出', value: weatherData.sunrise || 'N/A', inline: true },
    { name: '🌇 日落', value: weatherData.sunset || 'N/A', inline: true },
     { name: '\u200b', value: ' ', inline: false }, 
    { name: '🌙 月出', value: weatherData.moonrise || 'N/A', inline: true },
    { name: '🌑 月落', value: weatherData.moonset || 'N/A', inline: true }
  );

  return embed;
}

// Create typhoon embed
function createTyphoonEmbed(typhoonData) {
  const description = Array.isArray(typhoonData) ? typhoonData.join('\n') : typhoonData;
  const embed = createEmbed('🌀 颱風資訊', description, COLORS.WEATHER);
  return embed;
}

module.exports = {
  getCurrentWeather,
  getTodayForecast,
  createWeatherEmbed,
  createTyphoonEmbed,
};