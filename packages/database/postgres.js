"use strict";

const { Pool } = require("pg");
let pool;
function getPool() {
  const connectionString = process.env.DATABASE_URL_SERVERLESS || process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL não está configurada para PostgreSQL.");
  const rejectUnauthorized = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false";
  if (!pool) pool = new Pool({ connectionString, ssl: { rejectUnauthorized }, max: Number(process.env.DATABASE_POOL_MAX || 5) });
  return pool;
}
async function query(text, values = []) { return getPool().query(text, values); }
async function close() { if (pool) { await pool.end(); pool = undefined; } }
module.exports = { getPool, query, close };
