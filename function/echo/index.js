const { EmbedBuilder } = require('discord.js');
const { getDB, initDB } = require('../../util/database');
const schedule = require('node-schedule');
const axios = require('axios');
const moment = require('moment-timezone');

// 初始化數據庫表
async function initEchoDB() {
    const db = getDB();
    await db.runAsync(`
        CREATE TABLE IF NOT EXISTS echoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            content TEXT NOT NULL,
            want_reply BOOLEAN DEFAULT 0,
            timestamp INTEGER NOT NULL,
            replied BOOLEAN DEFAULT 0
        )
    `);

    // 創建每日輸入記錄表
    await db.runAsync(`
        CREATE TABLE IF NOT EXISTS daily_echo_limit (
            user_id TEXT PRIMARY KEY,
            last_input_date TEXT NOT NULL
        )
    `);
}

// 保存殘響
async function saveEcho(userId, content, wantReply) {
    const db = getDB();
    const timestamp = Date.now();
    await db.runAsync(
        'INSERT INTO echoes (user_id, content, want_reply, timestamp) VALUES (?, ?, ?, ?)',
        [userId, content, wantReply, timestamp]
    );

    // 更新每日限制
    const today = moment().format('YYYY-MM-DD');
    await db.runAsync(
        'INSERT OR REPLACE INTO daily_echo_limit (user_id, last_input_date) VALUES (?, ?)',
        [userId, today]
    );
}

// 檢查每日限制
async function checkDailyLimit(userId) {
    const db = getDB();
    const today = moment().format('YYYY-MM-DD');
    const row = await db.getAsync(
        'SELECT last_input_date FROM daily_echo_limit WHERE user_id = ?',
        [userId]
    );
    return !row || row.last_input_date !== today;
}

// 獲取記錄
async function getEchoRecords(userId, days) {
    const db = getDB();
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    const rows = await db.allAsync(
        'SELECT content, timestamp FROM echoes WHERE user_id = ? AND timestamp > ? ORDER BY timestamp DESC',
        [userId, cutoff]
    );
    return rows;
}

// 刪除用戶所有記錄
async function deleteUserEchos(userId) {
    const db = getDB();
    await db.runAsync('DELETE FROM echoes WHERE user_id = ?', [userId]);
    await db.runAsync('DELETE FROM daily_echo_limit WHERE user_id = ?', [userId]);
}

// 生成AI回覆
async function generateAIReply(content) {
    try {
        // 使用Ollama API
        const response = await axios.post('http://ollama:11434/api/generate', {
            model: 'qwen2.5:0.5b',
            prompt: `你是一個夢幻的AI，總是處於半夢半醒的狀態，回覆風格特別飄忽、沒重點，像在說夢話。請根據用戶的殘響內容，給出一個夢幻的、抽象的、沒有邏輯的回覆。不要直接回應內容，而是像在喃喃自語一樣。

用戶的殘響：${content}

請用繁體中文給出一個簡短的、夢幻的回覆：`,
            stream: false,
            options: {
                num_ctx: 512,
                num_predict: 30
            }
        });

        return response.data.response.trim() || '……夢裡的聲音，漸漸遠去……';
    } catch (error) {
        console.error('AI回覆生成失敗:', error);
        return '……夢裡的聲音，漸漸遠去……';
    }
}

// 發送AI回覆
async function sendAIReply(client, userId, content) {
    try {
        const user = await client.users.fetch(userId);
        const reply = await generateAIReply(content);

        const embed = new EmbedBuilder()
            .setTitle('🌙 殘響的回音')
            .setDescription(reply)
            .setColor(0x9b59b6)
            .setFooter({ text: '來自夢境的低語' });

        await user.send({ embeds: [embed] });
    } catch (error) {
        console.error('發送AI回覆失敗:', error);
    }
}

// 啟動定時任務：每天凌晨2-5點隨機時間檢查並發送回覆 (HKT)
function startScheduledReplies(client) {
    // 取消現有任務
    schedule.cancelJob('echo-reply');

    // 每天凌晨2點執行 (HKT)
    schedule.scheduleJob('echo-reply', '30 21 * * *', async () => {
        const db = getDB();
        const now = moment();
        const yesterday = now.clone().subtract(1, 'day');

        // 獲取昨天且want_reply為true且未回覆的記錄
        const rows = await db.allAsync(
            'SELECT id, user_id, content FROM echoes WHERE want_reply = 1 AND replied = 0 AND timestamp > ? AND timestamp <= ?',
            [yesterday.valueOf(), now.valueOf()]
        );

        for (const row of rows) {
            // 隨機延遲0-3小時
            const delay = Math.random() * 1000;
            setTimeout(async () => {
                await sendAIReply(client, row.user_id, row.content);
                // 標記為已回覆
                await db.runAsync('UPDATE echoes SET replied = 1 WHERE id = ?', [row.id]);
            }, delay);
        }
    });
}

module.exports = {
    saveEcho,
    getEchoRecords,
    deleteUserEchos,
    checkDailyLimit,
    initEchoDB,
    startScheduledReplies
};