const fs = require('fs');
const path = require('path');
const schedule = require('node-schedule');

const dbPath = path.join(__dirname, 'db', 'data.db');
const localBackupDir = path.join(__dirname, 'db', 'backups');
const externalBackupDir = '/volumes/Stargazer/VocchiAssistantDb/';

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5); // YYYY-MM-DDTHH-MM-SS
  const backupFileName = `data_backup_${timestamp}.db`;

  // 本地備份
  ensureDirectoryExists(localBackupDir);
  const localBackupPath = path.join(localBackupDir, backupFileName);
  try {
    fs.copyFileSync(dbPath, localBackupPath);
    console.log(`本地資料庫備份成功: ${localBackupPath}`);
  } catch (error) {
    console.error(`本地備份失敗: ${error.message}`);
  }

  // 外部備份
  ensureDirectoryExists(externalBackupDir);
  const externalBackupPath = path.join(externalBackupDir, backupFileName);
  try {
    fs.copyFileSync(dbPath, externalBackupPath);
    console.log(`外部資料庫備份成功: ${externalBackupPath}`);
  } catch (error) {
    console.error(`外部備份失敗: ${error.message}`);
  }
}

// 每天凌晨12點執行備份
schedule.scheduleJob('0 0 * * *', backupDatabase);

console.log('資料庫備份調度器已啟動，每天凌晨12點自動備份。');

module.exports = { backupDatabase };