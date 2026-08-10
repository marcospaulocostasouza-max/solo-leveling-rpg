"use strict";

const crypto = require("crypto");
const MessageService = require("../core/messageService");
const database = require("../../../../packages/database");

module.exports = async function siteCommand(msg) {
  const sender = msg.author || msg.from;
  if (!sender || sender.endsWith("@g.us")) {
    return MessageService.send({ message: msg, text: "Não foi possível identificar seu contato privado. Envie !site no privado para o bot." });
  }
  const player = await database.playerByPhone(sender);
  if (!player) return MessageService.send({ message: msg, text: "Seu número ainda não está vinculado a um personagem." });

  const rawToken = crypto.randomBytes(32).toString("base64url");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  await database.applyMigrations();
  await database.run("INSERT INTO site_login_tokens (player_id, token_hash, created_at, expires_at) VALUES (?, ?, ?, ?)", [player.id, tokenHash, new Date().toISOString(), expiresAt]);

  const base = (process.env.SITE_URL || process.env.SITE_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
  const text = `Portal do Caçador\n\n${player.nome}, seu acesso expira em 10 minutos e só pode ser usado uma vez:\n${base}/auth/token/${encodeURIComponent(rawToken)}`;
  const sent = await MessageService.send({ chatId: sender, text });
  if (!sent.sucesso) return MessageService.send({ message: msg, text: "Não consegui enviar o link no privado. Tente novamente pelo chat privado com o bot." });
  if (msg.from !== sender) await MessageService.send({ message: msg, text: "Enviei seu link de acesso no privado." });
};
