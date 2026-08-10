const MessageService = require("../core/messageService");
const NPCManager = require("../npc/npcManager");

function grupoDoNPC(npc) {
    const papel = String(npc.papel || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    if (papel.includes("vilao") || papel.includes("inimigo") || papel.includes("boss")) return "Hostis";
    if (papel.includes("heroi") || papel.includes("aliado")) return "Aliados";
    return "Neutros";
}

module.exports = async (msg) => {
    const grupos = { Aliados: [], Neutros: [], Hostis: [] };
    NPCManager.listarNPCs().forEach((npc) => grupos[grupoDoNPC(npc)].push(npc));
    const linhas = ["════════════════════════════════════", "*NPCS DO MUNDO*", "════════════════════════════════════"];
    for (const [grupo, npcs] of Object.entries(grupos)) {
        linhas.push("", `*${grupo}*`);
        if (!npcs.length) linhas.push("› Nenhum NPC nesta categoria.");
        else npcs.sort((a, b) => String(a.nome).localeCompare(String(b.nome), "pt-BR")).forEach((npc) => linhas.push(`› ${npc.nome} — ${npc.papel || "NPC"}`));
    }
    linhas.push("", "_Use !amizade <nome do NPC> para consultar apenas informações que seu personagem já conhece._");
    return MessageService.send({ message: msg, text: linhas.join("\n") });
};
