"use strict";

const crypto = require("crypto");
const MessageService = require("../core/messageService");
const database = require("../../../../packages/database");

module.exports = async function siteCommand(msg) {
  const sender = msg.author || msg.from;
  if (!sender || sender.endsWith("@g.us")) {
    return MessageService.send({ message: msg, text: `*「 ACESSO AO SISTEMA 」*

Não foi possível identificar seu contato privado.

› Envie *!site* diretamente no privado do bot.
› Seu link pessoal será entregue com segurança por lá.` });
  }

  const player = await database.playerByPhone(sender);
  if (!player) return MessageService.send({ message: msg, text: `*「 ACESSO NÃO AUTORIZADO 」*

O Sistema não encontrou um Caçador vinculado a este número.

› Crie e aprove sua ficha antes de acessar o Portal.
› Use *!ficha* para iniciar seu registro.` });

  const rawToken = crypto.randomBytes(32).toString("base64url");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  await database.applyMigrations();
  await database.run("INSERT INTO site_login_tokens (player_id, token_hash, created_at, expires_at) VALUES (?, ?, ?, ?)", [player.id, tokenHash, new Date().toISOString(), expiresAt]);

  const base = (process.env.SITE_URL || process.env.SITE_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
  const text = `*━━━━━━━━━━━━━━━━━━━━━━*
*「 PORTAL DO CAÇADOR 」*
*━━━━━━━━━━━━━━━━━━━━━━*

_O Sistema reconheceu sua assinatura._

*Caçador:* ${player.nome}
*Destino:* Página Inicial do Portal
*Validade:* 10 minutos
*Uso:* único

*ACESSAR O SISTEMA:*
${base}/auth/token/${encodeURIComponent(rawToken)}

_Este acesso é pessoal. Não compartilhe o link com outros jogadores._

*━━━━━━━━━━━━━━━━━━━━━━*`;

  const sent = await MessageService.send({ chatId: sender, text });
  if (!sent.sucesso) return MessageService.send({ message: msg, text: "*「 FALHA DE CONEXÃO 」*\n\nO Sistema não conseguiu entregar seu acesso. Envie *!site* novamente no privado do bot." });
  if (msg.from !== sender) await MessageService.send({ message: msg, text: "*「 LINK GERADO 」*\n\nSeu acesso ao Portal do Caçador foi enviado no privado." });
};
