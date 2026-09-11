"use strict";
const database = require("../../../../packages/database");
const adminCore = require("../core/adminCore");
const WeeklyDungeon = require("../systems/weeklyDungeonSystem");
const MessageService = require("../core/messageService");
module.exports = async msg => {
    try {
        const actor = msg.author || msg.from;
        if (!await adminCore.isAdmin(actor)) throw new Error("Somente a ADM pode aprovar Dungeon semanal.");
        const name = String(msg.body || "").replace(/^!aprovar dungeon semanal\s*/i, "").trim();
        if (!name) throw new Error("Use !aprovar dungeon semanal Nome do Jogador.");
        const player = await database.get("SELECT * FROM jogadores WHERE LOWER(nome)=LOWER(?)", [name]);
        if (!player) throw new Error("Jogador não encontrado.");
        const result = await WeeklyDungeon.aprovarConclusao(player.id, actor);
        const extras = result.itens.length ? ` | Itens: ${result.itens.join(", ")}` : "";
        return MessageService.send({ message: msg, text: `*DUNGEON SEMANAL APROVADA*\n${player.nome}: ${result.xp} XP | ${result.won} Won | ${result.cristais} Cristais${extras}` });
    } catch (error) { return MessageService.send({ message: msg, text: error.message }); }
};
