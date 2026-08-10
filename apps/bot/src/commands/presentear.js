const db = require("../core/database");
const MessageService = require("../core/messageService");
const NPCManager = require("../npc/npcManager");
const giftSystem = require("../npc/giftSystem");

module.exports = async (msg) => {
    const numero = msg.author || msg.from;
    const partes = (msg.body || "").trim().split(/\s+/);
    const npcId = partes[1]?.toLowerCase();
    const itemNome = partes.slice(2).join(" ").trim();
    if (!npcId || !itemNome) return MessageService.send({ message: msg, text: "Use: *!presentear <id_do_npc> <item do inventário>*" });
    const jogador = await new Promise((resolve) => db.get("SELECT id, numero, nome FROM jogadores WHERE numero = ?", [numero], (err, row) => resolve(row || null)));
    const npc = NPCManager.carregarNPC(npcId) || NPCManager.buscarPorNome(npcId);
    if (!jogador) return MessageService.send({ message: msg, text: "Você precisa ter uma ficha aprovada." });
    if (!npc) return MessageService.send({ message: msg, text: "NPC não encontrado." });
    const resultado = await giftSystem.presentear({ npc, jogador, itemNome });
    if (resultado.erro) return MessageService.send({ message: msg, text: resultado.erro });
    const reacoes = {
        gostou: `${npc.nome} gostou do presente. Vínculo +5%.`,
        desgostou: `${npc.nome} não gostou do presente. Vínculo -5%.`,
        indiferente: `${npc.nome} aceitou o presente, mas pareceu indiferente.`
    };
    return MessageService.send({ message: msg, text: `*PRESENTE ENTREGUE*\n${reacoes[resultado.reacao]}\nVínculo atual: *${resultado.resultado.vinculoDepois}%*` });
};
