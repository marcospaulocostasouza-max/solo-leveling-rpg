"use strict";

const MessageService = require("../core/messageService");
const adminCore = require("../core/adminCore");
const WeeklyDungeon = require("../systems/weeklyDungeonSystem");
const parseFichaCampos = require("../utils/parseFichaCampos");

module.exports = async msg => {
    try {
        const actor = msg.author || msg.from;
        if (!await adminCore.isAdmin(actor)) return MessageService.send({ message: msg, text: adminCore.msgAcessoNegado() });
        const dungeon = parseFichaCampos(msg.body);
        if (!dungeon.nome || !dungeon.tema || !dungeon.rank || !dungeon.descricao || !dungeon.objetivo) {
            return MessageService.send({ message: msg, text: "[!] Ficha incompleta. Use !FDungeon." });
        }
        await WeeklyDungeon.liberar(actor, dungeon);
        return MessageService.send({ message: msg, text: `[+] Dungeon semanal *${dungeon.nome}* liberada por 7 dias.` });
    } catch (error) {
        console.error("[DUNGEON-WEEKLY]", error.message);
        return MessageService.send({ message: msg, text: "[!] Não foi possível liberar a Dungeon semanal." });
    }
};
