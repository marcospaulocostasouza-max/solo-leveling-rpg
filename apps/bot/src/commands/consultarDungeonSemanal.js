"use strict";

const MessageService = require("../core/messageService");
const WeeklyDungeon = require("../systems/weeklyDungeonSystem");
const { MessageMedia } = require("whatsapp-web.js");

module.exports = async msg => {
    const registro = await WeeklyDungeon.obterAtiva();
    if (!registro) return MessageService.send({ message: msg, text: "_*「 DUNGEON SEMANAL 」*_\n_Nenhuma Dungeon semanal está liberada no momento._" });
    const dungeon = JSON.parse(registro.dados);
    const fim = dungeon.fimEm || registro.data_expiracao;
    const dataFim = fim ? new Date(fim).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "Em 7 dias";
    const texto = `_*「 DUNGEON SEMANAL — ${String(dungeon.nome).toUpperCase()} 」*_
_• Tema: ${dungeon.tema}_
_• Rank: ${dungeon.rank}_
_• Descrição: ${dungeon.descricao}_
_• Objetivo: ${dungeon.objetivo}_
_• Boss: ${dungeon.boss || "Nenhum"}_
_• Limite: ${dungeon.participantes || "Não informado"}_

_*PRÊMIOS:*_
_• XP: ${dungeon.xp || 0}_
_• Won: ${dungeon.won || 0}_
_• Itens: ${dungeon.itens || "Nenhum"}_

_*REGRAS:*_ ${dungeon.regras || "Regras gerais de Dungeon."}
_*DURAÇÃO:*_ 7 dias
_*ENCERRA EM:*_ ${dataFim}`;
    const imagem = String(dungeon.imagem || "").match(/^data:(image\/[\w.+-]+);base64,([\s\S]+)$/i);
    return imagem
        ? MessageService.sendMedia({ message: msg, media: new MessageMedia(imagem[1], imagem[2], `dungeon-semanal-${dungeon.nome}`), opcoesAdicionais: { caption: texto } })
        : MessageService.send({ message: msg, text: texto });
};
