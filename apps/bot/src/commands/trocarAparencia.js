"use strict";
const JogadorCore = require("../core/jogadorCore");
const MessageService = require("../core/messageService");
function extractAppearance(body) {
  return String(body || "").replace(/^!trocar\s+apar(?:e|ê)ncia\b\s*/iu, "").trim();
}
async function trocarAparencia(msg) {
  const reply = text => MessageService.send({ message: msg, text });
  try {
    const appearance = extractAppearance(msg.body);
    if (!appearance) return reply("Use *!trocar aparência <nome ou descrição>*. Você pode trocar até duas vezes.");
    const player = await JogadorCore.buscarPorNumero(msg.author || msg.from);
    if (!player) return reply("Sua ficha não foi encontrada.");
    const result = await require("../systems/appearanceChangeService").change(player.id, appearance);
    return reply(result.erro || result.mensagem);
  } catch (error) {
    console.error("[APARÊNCIA] Troca:", error.message);
    return reply("Não foi possível alterar sua aparência. A troca foi desfeita; tente novamente.");
  }
}
module.exports = trocarAparencia;
module.exports.extractAppearance = extractAppearance;
