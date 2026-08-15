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
    const total = Object.values(grupos).reduce((soma, npcs) => soma + npcs.length, 0);
    const mensagens = [["════════════════════════════════════", "*NPCS DO MUNDO*", `*Total:* ${total}`, "════════════════════════════════════"]];
    for (const [grupo, npcs] of Object.entries(grupos)) {
        const linhas = [`*${grupo.toUpperCase()}* (${npcs.length})`, "──────────────────────────"];
        if (!npcs.length) linhas.push("› Nenhum NPC nesta categoria.");
        else npcs.sort((a, b) => String(a.nome).localeCompare(String(b.nome), "pt-BR")).forEach((npc) => linhas.push(`› *${npc.nome}*`, `  Comando: !${npc.id}`, `  ${npc.profissao || npc.papel || "NPC"} • ${npc.localizacao || "Local não informado"}`));
        mensagens.push(linhas);
    }
    mensagens.push(["_Use !amizade <nome do NPC> para consultar apenas informações que seu personagem já conhece._", "_Para aprender como iniciar, continuar e encerrar uma cena, use *!Npc*._"]);
    let resultado;
    for (const linhas of mensagens) resultado = await MessageService.send({ message: msg, text: linhas.join("\n") });
    return resultado;
};
