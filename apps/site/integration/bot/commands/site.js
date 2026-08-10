/**
 * Modelo de comando !site para o bot.
 * Integre este fluxo ao roteador de comandos real do projeto.
 * Requer SITE_BASE_URL e uma função de banco central para criar tokens.
 */
const crypto = require('crypto');

async function siteCommand({ senderPhone, replyPrivate, db }) {
  const player = await db.findPlayerByPhone(senderPhone);
  if (!player) return replyPrivate('Seu número ainda não está vinculado a um personagem aprovado.');

  const rawToken = crypto.randomBytes(32).toString('base64url');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await db.createSiteLoginToken({ playerId: player.id, tokenHash, expiresAt });
  const base = process.env.SITE_BASE_URL || 'https://SEU-DOMINIO.vercel.app';
  const url = `${base}/login?t=${encodeURIComponent(rawToken)}`;

  return replyPrivate(
    `🔐 Portal do Caçador\n\n${player.nome}, seu acesso está pronto.\n` +
    `Este link funciona uma única vez e expira em 10 minutos:\n${url}`
  );
}

module.exports = siteCommand;
