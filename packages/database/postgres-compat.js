"use strict";

const { getPool, query } = require("./postgres");

function placeholders(sql) {
  let index = 0; let quote = null;
  return String(sql).replace(/'|"|\?/g, token => {
    if (token === "'" || token === '"') { quote = quote === token ? null : (quote || token); return token; }
    return quote ? token : `$${++index}`;
  });
}
function translate(sql) {
  let text = String(sql).replace(/datetime\('now'\)/gi, "CURRENT_TIMESTAMP").replace(/date\('now'\)/gi, "CURRENT_DATE");
  const ignored = /^\s*INSERT\s+OR\s+IGNORE\s+/i.test(text);
  text = text.replace(/^\s*INSERT\s+OR\s+IGNORE\s+/i, "INSERT ").replace(/^\s*INSERT\s+OR\s+REPLACE\s+/i, "INSERT ");
  if (ignored && !/\bON\s+CONFLICT\b/i.test(text)) text = text.replace(/;?\s*$/, " ON CONFLICT DO NOTHING");
  return placeholders(text);
}
async function execute(sql, params = [], client) { return (client || { query }).query(translate(sql), params); }
function callbackArgs(params, callback) { return typeof params === "function" ? [[], params] : [params || [], callback]; }
function callbackDatabase(client) {
  const db = {
    run(sql, params, callback) { const [values, done] = callbackArgs(params, callback); execute(sql, values, client).then(result => done && done.call({ lastID: result.rows?.[0]?.id, changes: result.rowCount }, null)).catch(error => done && done(error)); return db; },
    get(sql, params, callback) { const [values, done] = callbackArgs(params, callback); execute(sql, values, client).then(result => done && done(null, result.rows[0] || undefined)).catch(error => done && done(error)); return db; },
    all(sql, params, callback) { const [values, done] = callbackArgs(params, callback); execute(sql, values, client).then(result => done && done(null, result.rows)).catch(error => done && done(error)); return db; },
    exec(sql, callback) { execute(sql, [], client).then(() => callback && callback(null)).catch(error => callback && callback(error)); return db; },
    serialize(callback) { if (callback) callback(); return db; }
  };
  return db;
}
async function transaction(work) { const client = await getPool().connect(); try { await client.query("BEGIN"); const result = await work(client); await client.query("COMMIT"); return result; } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); } }
module.exports = { translate, execute, callbackDatabase, transaction };
