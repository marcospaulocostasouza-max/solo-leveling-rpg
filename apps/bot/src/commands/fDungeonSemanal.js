"use strict";

const MessageService = require("../core/messageService");
const adminCore = require("../core/adminCore");

module.exports = async msg => {
    if (!await adminCore.isAdmin(msg.author || msg.from)) return MessageService.send({ message: msg, text: adminCore.msgAcessoNegado() });
    return MessageService.send({ message: msg, text: `_*「 FICHA DE DUNGEON SEMANAL 」*_
_Copie, preencha e envie mantendo !Liberar Dungeon na primeira linha._

!Liberar Dungeon
NOME: [Nome]
TEMA: [Tema e ambientação]
RANK: [E / D / C / B / A / S]
DESCRIÇÃO: [Descrição detalhada]
OBJETIVO: [Condição de conclusão]
BOSS: [Nome ou Nenhum]
PARTICIPANTES: [Limite]
XP: [Prêmio]
WON: [Prêmio]
ITENS: [Prêmios em itens ou Nenhum]
REGRAS: [Regras específicas]

_A duração é automática: 7 dias a partir da publicação._` });
};
