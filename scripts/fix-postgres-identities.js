"use strict";

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const sqlite3 = require("sqlite3").verbose();
const { query, close } = require("../packages/database/postgres");
const quote = value => `"${String(value).replace(/"/g, '""')}"`;
const source = new sqlite3.Database(path.resolve(__dirname, "../apps/bot/src/database/rpg.db"), sqlite3.OPEN_READONLY);
const all = sql => new Promise((resolve, reject) => source.all(sql, [], (error, rows) => error ? reject(error) : resolve(rows)));

async function main() {
  const tables = await all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
  for (const { name } of tables) {
    const id = (await all(`PRAGMA table_info(${quote(name)})`)).find(column => column.name === "id" && column.pk && /INT/i.test(column.type || ""));
    if (!id) continue;
    const sequence = `${name}_id_seq`;
    await query(`CREATE SEQUENCE IF NOT EXISTS ${quote(sequence)}`);
    await query(`ALTER TABLE ${quote(name)} ALTER COLUMN "id" SET DEFAULT nextval('${sequence}')`);
    await query(`SELECT setval('${sequence}', COALESCE((SELECT MAX("id") FROM ${quote(name)}), 0) + 1, false)`);
  }
  console.log("Identidades PostgreSQL configuradas sem alterar registros existentes.");
}
main().catch(error => { console.error(`Correcao de identidades falhou: ${error.message}`); process.exitCode = 1; }).finally(async () => { source.close(); await close(); });
