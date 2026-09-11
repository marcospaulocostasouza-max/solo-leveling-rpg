const MessageService = require("../core/messageService");

/*
 * COMANDO: !missao / !missoes
 * 
 * Exibe as missões disponíveis do jogador.
 */

const db = require("../core/database");
const QuestSystem = require("../systems/questSystem");

const GUIA_MISSOES = `\n*COMO CONSEGUIR MISSÕES*\n> Missões podem ser oferecidas por administradores, narrações próprias, eventos do RPG ou NPCs durante uma interação.\n> Quando uma missão for disponibilizada, use *!Aceitar Missão <nome>*.\n> Para ofertas de um personagem, use *!Missões NPC <id>*.\n> A aceitação só funciona para missões realmente liberadas ao seu personagem.\n`;

module.exports = async (msg) => {
    const numero = msg.author || msg.from;
    const corpo = (msg.body || "").trim();
    
    try {
        const jogador = await new Promise((resolve, reject) => db.get("SELECT * FROM jogadores WHERE numero = ?", [numero], (err, row) => err ? reject(err) : resolve(row)));
        if (!jogador) return MessageService.send({ message: msg, text: "*═══ Você precisa ter uma ficha aprovada. ═══*" });
        
        const aceitarPrefixo = /^!(?:aceitar|iniciar)\s+miss[aã]o(?:\s+|$)/i;
        if (aceitarPrefixo.test(corpo)) {
            const nomeMissao = corpo.replace(aceitarPrefixo, "").trim();
            const resultado = await QuestSystem.aceitarMissao(jogador.id, nomeMissao);
            if (resultado.erro) return MessageService.send({ message: msg, text: resultado.erro });
            const missao = resultado.missao;
            await MessageService.send({ message: msg, text: `*${resultado.jaAtiva ? 'MISSÃO JÁ ATIVA' : 'MISSÃO ACEITA'}*\n*${missao.nome}*\n\n*Objetivo:* ${missao.objetivo_texto || missao.objetivo}\n\nRealize a tarefa e envie *!entregar missão ${missao.nome}* na primeira linha, seguido do relato de pelo menos 300 palavras. A ADM verifica o objetivo antes de liberar a recompensa.` });
            if (!resultado.jaAtiva && missao.npc_id) {
                const npc = require('../npc/npcManager').carregarNPC(missao.npc_id);
                const dialogo = await require('../ia/missionDialogueEngine').gerarDialogoAceitar(npc, jogador, missao);
                if (dialogo) await MessageService.send({ message: msg, text: dialogo });
            }
            return;
        }

        const detalhePrefixo = /^!(?:miss[aã]o|consultar miss(?:[aã]o|[oõ]es))\s+/i;
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
${GUIA_MISSOES}
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
        const pendentes = missoes.filter(m => m.status === 'em_avaliacao');
        if (pendentes.length) mensagem += '*EM AVALIAÇÃO:*\n' + pendentes.map(m => `> ${m.nome}`).join('\n') + '\n\n';

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
        
        mensagem += GUIA_MISSOES;
        await MessageService.send({ message: msg, text: mensagem });
    } catch (error) {
        console.error('[QUEST] Falha no comando:', error.message);
        await MessageService.send({ message: msg, text: 'Não foi possível consultar a missão agora. Tente novamente; seu progresso foi preservado.' });
    }
};
