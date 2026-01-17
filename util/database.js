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

module.exports = {
  addBirthday,
  removeBirthday,
  getAllBirthdays,
  getBirthdaysByDate,
  searchBirthdays,
  setSetting,
  getSetting,
  close: () => db.close()
};