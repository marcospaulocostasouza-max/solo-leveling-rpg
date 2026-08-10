"use strict";
const path = require("path"); require("dotenv").config({ path: path.resolve(__dirname, "../.env") }); const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(path.join(__dirname, "../apps/bot/src/database/rpg.db"), sqlite3.OPEN_READONLY);
db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name", [], (error, rows) => { if (error) throw error; let pending = rows.length; const result = {}; rows.forEach(({ name }) => db.get(`SELECT COUNT(*) count FROM "${name}"`, [], (err, row) => { if (err) throw err; result[name] = row.count; if (!--pending) { console.log(JSON.stringify(result, null, 2)); db.close(); } })); });
