const MessageService = require("../core/messageService");

/*
 * COMANDO: !missao / !missoes
 * 
 * Exibe as missões disponíveis do jogador.
 */

const db = require("../core/database");
const QuestSystem = require("../systems/questSystem");

module.exports = async (msg) => {
    const numero = msg.author || msg.from;
    const corpo = (msg.body || "").trim();
    
    db.get("SELECT id, nome FROM jogadores WHERE numero = ?", [numero], async (err, jogador) => {
        if (!jogador) return MessageService.send({ message: msg, text: "*═══ Você precisa ter uma ficha aprovada. ═══*" });
        
        const aceitarPrefixo = /^!aceitar miss(?:a|ã)o\s+/i;
        if (aceitarPrefixo.test(corpo)) {
            const nomeMissao = corpo.replace(aceitarPrefixo, "").trim();
            const resultado = await QuestSystem.aceitarMissao(jogador.id, nomeMissao);
            return MessageService.send({ message: msg, text: resultado.erro || `*MISSÃO ACEITA*\n*${resultado.missao.nome}* agora está ativa.` });
        }

        const detalhePrefixo = /^!(?:miss(?:a|ã)o|consultar miss(?:a|õ)es)\s+/i;
        if (detalhePrefixo.test(corpo)) {
            const nomeMissao = corpo.replace(detalhePrefixo, "").trim();
            if (nomeMissao && !/^npc\b/i.test(nomeMissao)) {
                const missao = await QuestSystem.buscarMissaoPorNome(jogador.id, nomeMissao);
                if (!missao) return MessageService.send({ message: msg, text: "Missão não encontrada entre os conteúdos disponíveis para você." });
                return MessageService.send({ message: msg, text: `*${missao.nome}*\n\n${missao.descricao || "Sem descrição."}\n\n*NPC:* ${missao.npc_id || "—"}\n*Tipo:* ${missao.tipo}\n*Dificuldade:* Rank ${missao.rank || "—"}\n${missao.nivel_recomendado ? `*Nível recomendado:* ${missao.nivel_recomendado}\n` : ""}*Vínculo necessário:* ${missao.vinculo_necessario || 0}%\n*Objetivo:* ${missao.objetivo_texto || missao.objetivo}\n*Recompensas:* ${missao.recompensa_xp} XP | ${missao.recompensa_won} Won\n\n${missao.status === "disponivel" ? `Para aceitar: *!aceitar missão ${missao.nome}*` : `Status: *${missao.status}*`}` });
            }
        }

        const missoes = await QuestSystem.listarMissoes(jogador.id);
        
        if (!missoes || missoes.length === 0) {
            return MessageService.send({ message: msg, text: `
*═══ MISSÕES ═══*
────────────────────────══
*═══ Jogador: ═══* ${jogador.nome}
Nenhuma missão disponível no momento.
────────────────────────══
_═ Sistema de Missões_
            ` });
        }
        
        let mensagem = `
*═══ MISSÕES ═══*
────────────────────────══
*═══ Jogador: ═══* ${jogador.nome}
────────────────────────══
`;
        
        const ativas = missoes.filter(m => m.status === "ativa");
        const disponiveis = missoes.filter(m => m.status === "disponivel");
        const completas = missoes.filter(m => m.status === "completa");

        if (disponiveis.length > 0) {
            mensagem += `*═══ DISPONÍVEIS: ═══*\n`;
            disponiveis.forEach(m => {
                mensagem += `> *${m.nome}*\n> NPC: ${m.npc_id || "—"} | Dificuldade: Rank ${m.rank || "?"}\n> Use: !aceitar missão ${m.nome}\n`;
            });
            mensagem += "\n";
        }
        
        if (ativas.length > 0) {
            mensagem += `*═══ ATIVAS: ═══*\n`;
            ativas.forEach(m => {
                mensagem += `> *${m.nome}* [${m.progresso}/${m.objetivo}]
${m.npc_id ? `> NPC: ${m.npc_id} | Dificuldade: Rank ${m.rank || "?"}\n` : ""}${m.objetivo_texto ? `> Objetivo: ${m.objetivo_texto}\n` : ""}${m.nivel_recomendado ? `> Nível recomendado: ${m.nivel_recomendado}\n` : ""}${m.npc_id ? `> Vínculo necessário: ${m.vinculo_necessario}%\n` : ""}
> ═ ${m.descricao || "Sem descrição"}
> ═ ${m.recompensa_xp} XP | ${m.recompensa_won} Won
`;
            });
        }
        
        if (completas.length > 0) {
            mensagem += `\n*═══ COMPLETAS: ═══*\n`;
            completas.forEach(m => {
                mensagem += `> ═ *${m.nome}*\n`;
            });
        }
        
        mensagem += `\n────────────────────────══\n_═ Complete missões para evoluir!_`;
        
        await MessageService.send({ message: msg, text: mensagem });
    });
};
