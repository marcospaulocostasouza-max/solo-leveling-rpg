"use strict";

const shared = require("../packages/database");
const bot = require("../apps/bot/src/core/database");
const botGet = (sql, values = []) => new Promise((resolve, reject) => bot.get(sql, values, (error, row) => error ? reject(error) : resolve(row)));
const botRun = (sql, values = []) => new Promise((resolve, reject) => bot.run(sql, values, function (error) { error ? reject(error) : resolve(this); }));

async function main() {
  if (require("../packages/database/config").provider !== "postgres") throw new Error("DATABASE_PROVIDER precisa ser postgres.");
  const player = await shared.get("SELECT id, won FROM jogadores ORDER BY id LIMIT 1");
  if (!player) throw new Error("Nenhum jogador disponivel para o teste.");
  const original = Number(player.won);
  try {
    await botRun("UPDATE jogadores SET won = won + 1 WHERE id = ?", [player.id]);
    const afterBot = await shared.playerById(player.id);
    if (Number(afterBot.won) !== original + 1) throw new Error("Alteracao do bot nao apareceu no site.");
    await shared.run("UPDATE jogadores SET won = won - 1 WHERE id = ?", [player.id]);
    const afterSite = await botGet("SELECT won FROM jogadores WHERE id = ?", [player.id]);
    if (Number(afterSite.won) !== original) throw new Error("Alteracao do site nao apareceu no bot.");
    console.log("Cutover bidirecional confirmado; estado financeiro restaurado.");
  } finally {
    await shared.run("UPDATE jogadores SET won = ? WHERE id = ?", [original, player.id]);
  }
}
main().catch(error => { console.error(`Teste de cutover falhou: ${error.message}`); process.exitCode = 1; });
