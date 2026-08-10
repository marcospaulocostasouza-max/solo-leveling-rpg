const db = require("../core/database");
const MessageService = require("../core/messageService");
const NPCManager = require("../npc/npcManager");
const relationshipManager = require("../npc/relationshipManager");

const consultar = (sql, params = [], todos = false) => new Promise((resolve, reject) => (todos ? db.all(sql, params, (erro, linhas) => erro ? reject(erro) : resolve(linhas || [])) : db.get(sql, params, (erro, linha) => erro ? reject(erro) : resolve(linha))));

module.exports = async (msg) => {
    try {
        const numero = msg.author || msg.from;
        const jogador = await consultar("SELECT numero, nome FROM jogadores WHERE numero = ?", [numero]);
        if (!jogador) return MessageService.send({ message: msg, text: "[!] Não foi possível encontrar sua ficha." });
        await relationshipManager.garantirTabela();
        await new Promise((resolve) => db.run("CREATE TABLE IF NOT EXISTS npc_resumos_cena (npc_id TEXT NOT NULL, jogador_id TEXT NOT NULL, resumo TEXT NOT NULL, atualizado_em TEXT NOT NULL, PRIMARY KEY (npc_id, jogador_id))", () => resolve()));

        const nomeNPC = msg.body.replace(/^!amizade/i, "").trim();
        if (!nomeNPC) {
            const relacoes = await consultar("SELECT * FROM npc_relationships WHERE jogadorId = ? ORDER BY vinculo DESC, hostilidade DESC", [jogador.numero], true);
            if (!relacoes.length) return MessageService.send({ message: msg, text: "*AMIZADE*\n\nVocê ainda não concluiu uma cena com nenhum NPC." });
            const linhas = relacoes.map((relacao) => {
                const npc = NPCManager.carregarNPC(relacao.npcId);
                return `› *${npc?.nome || relacao.npcId}*\n  Vínculo: *${relacao.vinculo}%* | Hostilidade: *${relacao.hostilidade}%*`;
            });
            return MessageService.send({ message: msg, text: ["════════════════════════════════════", `*AMIZADE — ${jogador.nome}*`, "════════════════════════════════════", "", ...linhas, "", "_Use !amizade <nome do NPC> para ver o resumo da última cena._"].join("\n") });
        }

        const npc = NPCManager.buscarPorNome(nomeNPC);
        if (!npc) return MessageService.send({ message: msg, text: "[!] NPC não encontrado." });
        const relacao = await consultar("SELECT vinculo, hostilidade FROM npc_relationships WHERE npcId = ? AND jogadorId = ?", [npc.id, jogador.numero]);
        const resumo = await consultar("SELECT resumo, atualizado_em FROM npc_resumos_cena WHERE npc_id = ? AND jogador_id = ?", [npc.id, jogador.numero]);
        const conhecidos = npc.descricao || npc.personalidade || "Nenhuma informação pública adicional disponível.";
        return MessageService.send({ message: msg, text: ["════════════════════════════════════", `*AMIZADE — ${npc.nome}*`, "════════════════════════════════════", "", `› Vínculo: *${relacao?.vinculo || 0}%*`, `› Hostilidade: *${relacao?.hostilidade || 0}%*`, "", "*Informações conhecidas*", `› ${conhecidos}`, "", "*Última cena*", `› ${resumo?.resumo || "Nenhuma cena encerrada com este NPC."}`, resumo?.atualizado_em ? `› Registrada em: ${resumo.atualizado_em}` : ""].filter(Boolean).join("\n") });
    } catch (erro) {
        console.error("Erro no comando amizade:", erro);
        return MessageService.send({ message: msg, text: "[!] Não foi possível consultar esse vínculo agora." });
    }
};
