const MessageService = require("../core/messageService");
const adminCore = require("../core/adminCore");
const interactionManager = require("../npc/interactionManager");

module.exports = async (msg) => {
    const numeroAdmin = msg.author || msg.from;
    if (!await adminCore.isAdmin(numeroAdmin)) {
        return MessageService.send({ message: msg, text: adminCore.msgAcessoNegado() });
    }
    try {
        const cenas = await interactionManager.encerrarTodasCenas();
        const info = await adminCore.getAdminLevel(numeroAdmin);
        adminCore.registrarLog(numeroAdmin, info.nome || "Admin", "encerrar_cenas_npc", "Todas as cenas", `${cenas.length} cena(s) encerrada(s); NPCs e jogadores liberados.`, cenas.length, 0);
        return MessageService.send({ message: msg, text: `*CENAS DE NPC ENCERRADAS*\n\n${cenas.length} interação(ões) ativa(s) foram encerradas.\nTodos os NPCs e jogadores foram liberados, sem cooldown pendente.` });
    } catch (erro) {
        console.error("[NPC-SCENE] Erro no encerramento administrativo:", erro.message);
        return MessageService.send({ message: msg, text: "Não foi possível encerrar as cenas de NPC agora." });
    }
};
