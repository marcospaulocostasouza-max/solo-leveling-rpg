"use strict";
const MessageService = require("../core/messageService");
const database = require("../../../../packages/database");
const WeeklyDungeon = require("../systems/weeklyDungeonSystem");

module.exports = async msg => {
    try {
        const player = await database.playerByPhone(msg.author || msg.from);
        if (!player) throw new Error("Você precisa ter uma ficha aprovada para concluir a Dungeon semanal.");
        const result = await WeeklyDungeon.solicitarConclusao(player.id);
        if (result.duplicada) return MessageService.send({ message: msg, text: "Sua conclusão desta Dungeon semanal já está aguardando avaliação ou já foi aprovada." });
        return MessageService.send({ message: msg, text: `*DUNGEON SEMANAL ENTREGUE*\n${result.dados.nome || "Dungeon semanal"}\nA ADM irá verificar sua participação antes de liberar as recompensas.` });
    } catch (error) {
        console.error("[DUNGEON-WEEKLY] Conclusão:", error.message);
        return MessageService.send({ message: msg, text: error.message });
    }
};
