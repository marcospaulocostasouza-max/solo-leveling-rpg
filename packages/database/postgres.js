"use strict";

const { Pool } = require("pg");
let pool;

function connectionConfig(value) {
  const url = new URL(value);
  // URI SSL parameters can replace node-postgres' explicit ssl object.
  for (const key of ["sslmode", "sslcert", "sslkey", "sslrootcert"]) url.searchParams.delete(key);
  const configured = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED;
  const isSupabase = /(^|\.)supabase\.com$/i.test(url.hostname);
  const rejectUnauthorized = configured === "true" ? true : configured === "false" ? false : !isSupabase;
  return { connectionString: url.toString(), ssl: { rejectUnauthorized } };
}
function getPool() {
  const connectionString = process.env.DATABASE_URL_SERVERLESS || process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL não está configurada para PostgreSQL.");
  if (!pool) pool = new Pool({ ...connectionConfig(connectionString), max: Number(process.env.DATABASE_POOL_MAX || 5) });
  return pool;
}
async function query(text, values = []) { return getPool().query(text, values); }
async function close() { if (pool) { await pool.end(); pool = undefined; } }
module.exports = { getPool, query, close, connectionConfig };
