"use strict";

const crypto = require("crypto");
const database = require("../packages/database");

async function consume(token) {
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  return database.get("UPDATE site_login_tokens SET used_at = CURRENT_TIMESTAMP WHERE token_hash = ? AND used_at IS NULL AND expires_at > ? RETURNING player_id", [hash, new Date().toISOString()]);
}
async function main() {
  if (require("../packages/database/config").provider !== "postgres") throw new Error("DATABASE_PROVIDER precisa ser postgres.");
  const player = await database.get("SELECT id FROM jogadores ORDER BY id LIMIT 1");
  if (!player) throw new Error("Nenhum jogador para teste.");
  try {
    const token = crypto.randomBytes(32).toString("base64url");
    const hash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    await database.run("INSERT INTO site_login_tokens (player_id, token_hash, created_at, expires_at) VALUES (?, ?, ?, ?)", [player.id, hash, new Date().toISOString(), expiresAt]);
    const first = await consume(token);
    if (Number(first?.player_id) !== Number(player.id)) throw new Error("Token nao vinculou o jogador correto.");
    if (await consume(token)) throw new Error("Token reutilizado foi aceito.");
    const expired = crypto.randomBytes(32).toString("base64url");
    await database.run("INSERT INTO site_login_tokens (player_id, token_hash, created_at, expires_at) VALUES (?, ?, ?, ?)", [player.id, crypto.createHash("sha256").update(expired).digest("hex"), new Date().toISOString(), new Date(Date.now() - 1000).toISOString()]);
    if (await consume(expired)) throw new Error("Token expirado foi aceito.");
    console.log("Token unico, expiracao e vinculo de jogador confirmados.");
  } finally {
    await database.run("DELETE FROM site_login_tokens WHERE used_at IS NOT NULL OR expires_at <= ?", [new Date().toISOString()]);
  }
}
main().catch(error => { console.error(`Teste de autenticacao falhou: ${error.message}`); process.exitCode = 1; });
