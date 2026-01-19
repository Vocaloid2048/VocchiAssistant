const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./db/data.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the data database.');
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS birthdays (
    user_id TEXT PRIMARY KEY,
    display_name TEXT,
    username TEXT,
    date TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS user_settings (
    user_id TEXT,
    key TEXT,
    value TEXT,
    PRIMARY KEY (user_id, key)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS mood_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    emoji TEXT NOT NULL,
    description TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS cats (
    user_id TEXT PRIMARY KEY,
    name TEXT,
    health INTEGER DEFAULT 100,
    hunger INTEGER DEFAULT 50,
    happiness INTEGER DEFAULT 50,
    money INTEGER DEFAULT 100,
    experience INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    head TEXT DEFAULT 'default',
    body TEXT DEFAULT 'default',
    legs TEXT DEFAULT 'default',
    tail TEXT DEFAULT 'default',
    auto_feed BOOLEAN DEFAULT 0,
    auto_play BOOLEAN DEFAULT 0,
    last_feed DATETIME,
    last_play DATETIME,
    last_work DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

function addBirthday(userId, displayName, username, date) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare('INSERT OR REPLACE INTO birthdays (user_id, display_name, username, date) VALUES (?, ?, ?, ?)');
    stmt.run(userId, displayName, username, date, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.changes);
      }
    });
    stmt.finalize();
  });
}

function removeBirthday(userId) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare('DELETE FROM birthdays WHERE user_id = ?');
    stmt.run(userId, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.changes);
      }
    });
    stmt.finalize();
  });
}

function getAllBirthdays() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM birthdays', [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

function getNextBirthday() {
  return new Promise((resolve, reject) => {
    const today = new Date();
    const monthDay = `${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getDate().toString().padStart(2, '0')}`;
    
    // 首先查詢今天或之後的下一個生日
    db.get('SELECT * FROM birthdays WHERE date >= ? ORDER BY date ASC LIMIT 1', [monthDay], (err, row) => {
      if (err) {
        return reject(err);
      }
      
      if (row) {
        resolve(row);
      } else {
        // 如果今年剩餘時間沒有生日（例如查詢時是 12 月但下一個生日在 1 月），則抓取全表日期最早的一個
        db.get('SELECT * FROM birthdays ORDER BY date ASC LIMIT 1', [], (err, firstRow) => {
          if (err) {
            reject(err);
          } else {
            resolve(firstRow);
          }
        });
      }
    });
  });
}

function getBirthdaysByDate(date) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM birthdays WHERE date = ?', [date], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

function searchBirthdays(query) {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM birthdays WHERE user_id LIKE ? OR display_name LIKE ? ORDER BY display_name LIMIT 25`;
    const searchTerm = `%${query}%`;
    db.all(sql, [searchTerm, searchTerm], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

function setSetting(key, value) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    stmt.run(key, value, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.changes);
      }
    });
    stmt.finalize();
  });
}

function setConfig(key, value, userId = null) {
  if (userId) {
    return setUserSetting(userId, key, value);
  } else {
    return setSetting(key, value);
  }
}

function getSetting(key) {
  return new Promise((resolve, reject) => {
    db.get('SELECT value FROM settings WHERE key = ?', [key], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row ? row.value : null);
      }
    });
  });
}

function setUserSetting(userId, key, value) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare('INSERT OR REPLACE INTO user_settings (user_id, key, value) VALUES (?, ?, ?)');
    stmt.run(userId, key, value, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.changes);
      }
    });
    stmt.finalize();
  });
}

function getUserSetting(userId, key) {
  return new Promise((resolve, reject) => {
    db.get('SELECT value FROM user_settings WHERE user_id = ? AND key = ?', [userId, key], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row ? row.value : null);
      }
    });
  });
}

function getAllUsersWithSetting(key, value) {
  return new Promise((resolve, reject) => {
    db.all('SELECT user_id FROM user_settings WHERE key = ? AND value = ?', [key, value], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows.map(row => row.user_id));
      }
    });
  });
}

function addMoodRecord(userId, emoji, description) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare('INSERT INTO mood_records (user_id, emoji, description) VALUES (?, ?, ?)');
    stmt.run(userId, emoji, description, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.lastID);
      }
    });
    stmt.finalize();
  });
}

function getMoodRecords(userId, limit = 10) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM mood_records WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?', [userId, limit], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Cat functions
function createCat(userId, name) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare('INSERT OR REPLACE INTO cats (user_id, name) VALUES (?, ?)');
    stmt.run(userId, name, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.changes);
      }
    });
    stmt.finalize();
  });
}

function getCat(userId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM cats WHERE user_id = ?', [userId], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function updateCatStats(userId, stats) {
  return new Promise((resolve, reject) => {
    const fields = Object.keys(stats);
    const values = Object.values(stats);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const sql = `UPDATE cats SET ${setClause} WHERE user_id = ?`;
    values.push(userId);
    const stmt = db.prepare(sql);
    stmt.run(values, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.changes);
      }
    });
    stmt.finalize();
  });
}

function getAllCats() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM cats', [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

module.exports = {
  getDB: () => db,
  addBirthday,
  removeBirthday,
  getAllBirthdays,
  getBirthdaysByDate,
  searchBirthdays,
  setSetting,
  getSetting,
  setConfig,
  setUserSetting,
  getUserSetting,
  getAllUsersWithSetting,
  getNextBirthday,
  addMoodRecord,
  getMoodRecords,
  createCat,
  getCat,
  updateCatStats,
  getAllCats,
  close: () => db.close()
};