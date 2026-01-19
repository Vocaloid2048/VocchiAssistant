const { getDB, initDB } = require('../../util/database');
const moment = require('moment-timezone');

// 初始化數據庫表
async function initEchoDB() {
    const db = getDB();
    await db.run(`
        CREATE TABLE IF NOT EXISTS echoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            content TEXT NOT NULL,
            timestamp INTEGER NOT NULL
        )
    `);

    // 創建每日輸入記錄表
    await db.run(`
        CREATE TABLE IF NOT EXISTS daily_echo_limit (
            user_id TEXT PRIMARY KEY,
            last_input_date TEXT NOT NULL
        )
    `);
}

// 保存殘響
async function saveEcho(userId, content) {
    const db = getDB();
    const timestamp = Date.now();
    await db.run(
        'INSERT INTO echoes (user_id, content, timestamp) VALUES (?, ?, ?)',
        [userId, content, timestamp]
    );

    // 更新每日限制
    const today = moment().tz('Asia/Hong_Kong').format('YYYY-MM-DD');
    await db.run(
        'INSERT OR REPLACE INTO daily_echo_limit (user_id, last_input_date) VALUES (?, ?)',
        [userId, today]
    );
}

// 檢查每日限制
async function checkDailyLimit(userId) {
    const db = getDB();
    const today = moment().tz('Asia/Hong_Kong').format('YYYY-MM-DD');
    const row = await db.get(
        'SELECT last_input_date FROM daily_echo_limit WHERE user_id = ?',
        [userId]
    );
    return !row || row.last_input_date !== today;
}

// 獲取記錄
async function getEchoRecords(userId, days) {
    const db = getDB();
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    const rows = await db.all(
        'SELECT content, timestamp FROM echoes WHERE user_id = ? AND timestamp > ? ORDER BY timestamp DESC',
        [userId, cutoff]
    );
    return rows;
}

// 刪除用戶所有記錄
async function deleteUserEchos(userId) {
    const db = getDB();
    await db.run('DELETE FROM echoes WHERE user_id = ?', [userId]);
    await db.run('DELETE FROM daily_echo_limit WHERE user_id = ?', [userId]);
}

module.exports = {
    saveEcho,
    getEchoRecords,
    deleteUserEchos,
    checkDailyLimit,
    initEchoDB
};