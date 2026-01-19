const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { createCat, getCat, updateCatStats } = require('../../util/database');

// Cat ASCII Arts
const CAT_ASCII_ARTS = [
  `
 /\\_/\\
( o.o )
 > ^ <
`,
  `
 /\\_/\\
( -.- )
 > ^ <
`,
  `
 /\\_/\\
( =^.^= )
 > ^ <
`,
  `
 /\\_/\\
( >.< )
 > ^ <
`,
  `
 /\\_/\\
( ^.^ )
 > ^ <
`
];

// Items
const ITEMS = {
  food: { name: '食物', price: 10, effect: { hunger: -20, health: 5 } },
  toy: { name: '玩具', price: 15, effect: { happiness: 20 } }
};

// Time-based actions
const TIME_ACTIONS = {
  morning: { feed: true, play: true },
  afternoon: { feed: true, play: true },
  evening: { feed: true, play: true }
};

// Generate cat image (ASCII Art)
function generateCatImage(cat) {
  const level = cat.level || 1;
  const artIndex = Math.min(level - 1, CAT_ASCII_ARTS.length - 1);
  return `\`\`\`\n${CAT_ASCII_ARTS[artIndex]}\`\`\``;
}

// Create progress bar
function createProgressBar(value, max = 100, length = 10) {
  const percentage = Math.max(0, Math.min(100, (value / max) * 100));
  const filled = Math.round((percentage / 100) * length);
  const empty = length - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

// Check if action is allowed based on time
function canPerformAction(lastTime, hours = 4) {
  if (!lastTime) return { canPerform: true, remainingTime: 0 };
  const now = new Date();
  const last = new Date(lastTime);
  const elapsed = now - last;
  const cooldownMs = hours * 60 * 60 * 1000;
  const remainingMs = cooldownMs - elapsed;

  if (remainingMs <= 0) {
    return { canPerform: true, remainingTime: 0 };
  } else {
    return { canPerform: false, remainingTime: remainingMs };
  }
}

// Format remaining time as Discord timestamp
function formatRemainingTime(ms) {
  const now = new Date();
  const availableTime = new Date(now.getTime() + ms);
  const timestamp = Math.floor(availableTime.getTime() / 1000);
  return `<t:${timestamp}:R>`;
}

// Feed cat
async function feedCat(userId) {
  const cat = await getCat(userId);
  if (!cat) return { success: false, message: '你還沒有貓咪！' };
  const actionCheck = canPerformAction(cat.last_feed);
  if (!actionCheck.canPerform) {
    const remainingTime = formatRemainingTime(actionCheck.remainingTime);
    return { success: false, message: `餵食冷卻中，請在${remainingTime}後再來。` };
  }

  const newHunger = Math.max(0, cat.hunger - 20);
  const newHealth = Math.min(100, cat.health + 5);
  const expGain = 10;
  const newExp = cat.experience + expGain;
  const newLevel = Math.floor(newExp / 100) + 1; // Level up every 100 exp
  await updateCatStats(userId, { hunger: newHunger, health: newHealth, experience: newExp, level: newLevel, last_feed: new Date().toISOString() });
  return { success: true, message: `餵食成功！飢餓度: ${newHunger}, 健康度: ${newHealth}, 獲得 ${expGain} 經驗值` };
}

// Play with cat
async function playWithCat(userId) {
  const cat = await getCat(userId);
  if (!cat) return { success: false, message: '你還沒有貓咪！' };
  const actionCheck = canPerformAction(cat.last_play);
  if (!actionCheck.canPerform) {
    const remainingTime = formatRemainingTime(actionCheck.remainingTime);
    return { success: false, message: `玩耍冷卻中，請在${remainingTime}後再來。` };
  }

  const newHappiness = Math.min(100, cat.happiness + 20);
  const expGain = 15;
  const newExp = cat.experience + expGain;
  const newLevel = Math.floor(newExp / 100) + 1;
  await updateCatStats(userId, { happiness: newHappiness, experience: newExp, level: newLevel, last_play: new Date().toISOString() });
  return { success: true, message: `玩耍成功！幸福值: ${newHappiness}, 獲得 ${expGain} 經驗值` };
}

// Work (earn money)
async function workCat(userId) {
  const cat = await getCat(userId);
  if (!cat) return { success: false, message: '你還沒有貓咪！' };
  const actionCheck = canPerformAction(cat.last_work, 8);
  if (!actionCheck.canPerform) {
    const remainingTime = formatRemainingTime(actionCheck.remainingTime);
    return { success: false, message: `工作冷卻中，請在${remainingTime}後再來。` };
  }

  const earn = 20;
  const newMoney = cat.money + earn;
  const expGain = 20;
  const newExp = cat.experience + expGain;
  const newLevel = Math.floor(newExp / 100) + 1;
  await updateCatStats(userId, { money: newMoney, experience: newExp, level: newLevel, last_work: new Date().toISOString() });
  return { success: true, message: `工作成功！賺取 ${earn} 金錢，目前金錢: ${newMoney}, 獲得 ${expGain} 經驗值` };
}

// Buy item
async function buyItem(userId, itemType) {
  const cat = await getCat(userId);
  if (!cat) return { success: false, message: '你還沒有貓咪！' };

  const item = ITEMS[itemType];
  if (!item) return { success: false, message: '無效物品！' };
  if (cat.money < item.price) return { success: false, message: '金錢不足！' };

  const newMoney = cat.money - item.price;
  const updates = { money: newMoney };

  // Apply item effects with bounds checking
  if (item.effect.hunger !== undefined) {
    updates.hunger = Math.max(0, Math.min(100, cat.hunger + item.effect.hunger));
  }
  if (item.effect.health !== undefined) {
    updates.health = Math.max(0, Math.min(100, cat.health + item.effect.health));
  }
  if (item.effect.happiness !== undefined) {
    updates.happiness = Math.max(0, Math.min(100, cat.happiness + item.effect.happiness));
  }

  await updateCatStats(userId, updates);
  return { success: true, message: `購買 ${item.name} 成功！` };
}

// Toggle auto feed
async function toggleAutoFeed(userId) {
  const cat = await getCat(userId);
  if (!cat) return { success: false, message: '你還沒有貓咪！' };

  const newAutoFeed = !cat.auto_feed;
  await updateCatStats(userId, { auto_feed: newAutoFeed });
  return { success: true, message: `自動餵食已${newAutoFeed ? '開啟' : '關閉'}` };
}

// Idle earn money
async function idleEarn(userId) {
  const cat = await getCat(userId);
  if (!cat) return;

  const earn = 5; // Idle earn 5 money per hour
  const newMoney = cat.money + earn;
  await updateCatStats(userId, { money: newMoney });
}

// Toggle auto play
async function toggleAutoPlay(userId) {
  const cat = await getCat(userId);
  if (!cat) return { success: false, message: '你還沒有貓咪！' };

  const newAutoPlay = !cat.auto_play;
  await updateCatStats(userId, { auto_play: newAutoPlay });
  return { success: true, message: `自動玩耍已${newAutoPlay ? '開啟' : '關閉'}` };
}

// Create cat embed
function createCatEmbed(cat) {
  const embed = new EmbedBuilder()
    .setTitle(`${cat.name} 的狀態`)
    .setDescription(generateCatImage(cat))
    .addFields(
      { name: '健康度', value: `${createProgressBar(cat.health)}\n${cat.health}/100`, inline: true },
      { name: '飢餓度', value: `${createProgressBar(cat.hunger)}\n${cat.hunger}/100`, inline: true },
      { name: '幸福值', value: `${createProgressBar(cat.happiness)}\n${cat.happiness}/100`, inline: true },
      { name: '金錢', value: `${cat.money}`, inline: true },
      { name: '經驗值', value: `${cat.experience}`, inline: true },
      { name: '等級', value: `${cat.level}`, inline: true }
    )
    .setColor('#ff69b4');

  return embed;
}

// Create action buttons
function createActionButtons(cat) {
  const row1 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('cat_feed')
        .setLabel('餵食')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🍖'),
      new ButtonBuilder()
        .setCustomId('cat_play')
        .setLabel('玩耍')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🎾'),
      new ButtonBuilder()
        .setCustomId('cat_work')
        .setLabel('工作')
        .setStyle(ButtonStyle.Success)
        .setEmoji('💼'),
      new ButtonBuilder()
        .setCustomId('cat_status')
        .setLabel('狀態')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📊')
    );

  const row2 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('cat_auto_feed')
        .setLabel(`自動餵食 ${cat && cat.auto_feed ? '✅' : '❌'}`)
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('cat_auto_play')
        .setLabel(`自動玩耍 ${cat && cat.auto_play ? '✅' : '❌'}`)
        .setStyle(ButtonStyle.Secondary)
    );

  return [row1, row2];
}

// Create shop menu
function createShopMenu() {
  const row = new ActionRowBuilder()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('cat_shop')
        .setPlaceholder('選擇要購買的物品')
        .addOptions(
          { label: '食物 (10 金錢)', value: 'food', description: '降低飢餓，提升健康' },
          { label: '玩具 (15 金錢)', value: 'toy', description: '提升幸福' }
        )
    );

  return row;
}

module.exports = {
  createCat,
  getCat,
  feedCat,
  playWithCat,
  workCat,
  buyItem,
  toggleAutoFeed,
  toggleAutoPlay,
  idleEarn,
  createCatEmbed,
  createActionButtons,
  createShopMenu,
  generateCatImage
};