"use strict";

const MessageService = require("../core/messageService");
const adminCore = require("../core/adminCore");
const Wizard = require("../systems/creationWizardService");

module.exports = async msg => {
  const actor = msg.author || msg.from;
  try {
    if (!await adminCore.isAdmin(actor)) return MessageService.send({ message: msg, text: adminCore.msgAcessoNegado() });
    const body = String(msg.body || "").trim();
    if (/^!criar dungeon semanal\s*$/i.test(body)) return MessageService.send({ message: msg, text: `_*「 CRIAÇÃO GUIADA DE DUNGEON SEMANAL 」*_\n\n${await Wizard.start(actor, "DUNGEON")}\n\n_Responda apenas à pergunta. Use !cancelar criação para interromper._` });
    const name = body.replace(/^!anexar imagem dungeon semanal\b/i, "").trim();
    if (!name) throw new Error("Informe o nome da Dungeon após o comando.");
    if (!msg.hasMedia || typeof msg.downloadMedia !== "function") throw new Error("Envie a imagem anexada usando este comando como legenda.");
    const result = await Wizard.attachImage(actor, "DUNGEON", name, await msg.downloadMedia());
    return MessageService.send({ message: msg, text: `_*「 IMAGEM DA DUNGEON 」*_\n\n_[+] ${result}` });
  } catch (error) {
    return MessageService.send({ message: msg, text: `_*「 DUNGEON SEMANAL 」*_\n\n_[!] ${error.message}` });
  }
};
