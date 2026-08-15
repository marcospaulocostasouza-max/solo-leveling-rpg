const MessageService = require("../core/messageService");

/**
 * MANIPULADOR DE CONVERSAS COM NPCs
 *
 * Processa mensagens no formato:
 * !<npc_id>
 * <mensagem do jogador>
 *
 * Fluxo:
 * 1. Detectar que a primeira linha começa com "!"
 * 2. Extrair o ID do NPC
 * 3. Buscar o NPC no NPCManager
 * 4. Extrair a mensagem do jogador (restante do texto)
 * 5. Enviar para o NPCService
 * 6. Retornar a resposta do NPC no WhatsApp
 */

const NPCManager = require("../npc/npcManager");
const { converse: conversarNarrativaNova } = require("../ai/narrativeService");
const { enviarMensagemCompleta } = require("../utils/messageSplitter");
const { formatarMensagem } = require("../utils/messageFormatter");
const db = require("../core/database");
const QuestSystem = require("../systems/questSystem");
const interactionManager = require("./interactionManager");
const emotionManager = require("./emotionManager");

function extrairConversaNPC(texto) {
    const linhas = String(texto || "").replace(/\r\n/g, "\n").split("\n");
    return {
        comando: (linhas.shift() || "").trim().replace(/^!/, "").trim().toLowerCase(),
        cena: linhas.join("\n").trim()
    };
}

/**
 * Verifica se uma mensagem é uma conversa com NPC
 * Deve começar com "!" na primeira linha e o NPC deve existir
 * Aceita ID do NPC, primeiro nome ou nome completo
 *
 * @param {string} texto - Texto completo da mensagem
 * @returns {boolean}
 */
function isConversaNPC(texto) {
    if (!texto || !texto.startsWith("!")) return false;

    const { comando } = extrairConversaNPC(texto);

    // Não processar se for vazio
    if (!comando) return false;

    // Verificar se existe um NPC com esse ID ou nome
    const npc = NPCManager.carregarNPC(comando) || NPCManager.buscarPorNome(comando);
    return npc !== null;
}

/**
 * Processa a conversa com NPC
 *
 * @param {Object} msg - Objeto de mensagem do WhatsApp
 * @returns {Promise<boolean>} true se processou, false se não é conversa com NPC
 */
async function processarConversaNPC(msg) {
    const texto = msg.body;

    // Verificar se é uma conversa com NPC
    if (!isConversaNPC(texto)) {
        if (texto && texto.startsWith("!") && !texto.includes("\n")) {
            const numero = msg.author || msg.from;
            const nomeMissao = texto.slice(1).trim();
            const jogador = await new Promise((resolve) => db.get("SELECT id FROM jogadores WHERE numero = ?", [numero], (err, row) => resolve(row || null)));
            if (jogador && nomeMissao) {
                const missao = await QuestSystem.buscarMissaoPorNome(jogador.id, nomeMissao);
                if (missao) {
                    await MessageService.send({ message: msg, text: `*${missao.nome}*\n\n${missao.descricao || "Sem descrição."}\n\n*NPC:* ${missao.npc_id || "—"}\n*Dificuldade:* Rank ${missao.rank || "—"}\n*Objetivo:* ${missao.objetivo_texto || missao.objetivo}\n*Recompensas:* ${missao.recompensa_xp} XP | ${missao.recompensa_won} Won\n\n${missao.status === "disponivel" ? `Para aceitar: *!aceitar missão ${missao.nome}*` : `Status: *${missao.status}*`}` });
                    return true;
                }
            }
        }
        return false;
    }

    // Somente a primeira linha e o comando. Todo o restante, incluindo
    // dialogos e paragrafos, e preservado como a cena enviada pelo jogador.
    const { comando: comandoNPC, cena: mensagemJogador } = extrairConversaNPC(texto);

    // Buscar NPC por ID exato ou por nome
    const npc = NPCManager.carregarNPC(comandoNPC) || NPCManager.buscarPorNome(comandoNPC);
    
    if (!npc) {
        await MessageService.send({ message: msg, text: "NPC não encontrado. Verifique o nome ou ID do personagem." });
        return true;
    }
    
    const npcId = npc.id;

    // Caso o jogador envie apenas o comando sem mensagem
    if (!mensagemJogador) {
        await MessageService.send({ message: msg, text: "Escreva uma mensagem abaixo do comando para conversar com " + npc.nome + "." });
        return true;
    }

    // Obter ID do jogador (número do WhatsApp)
    const jogadorId = msg.author || msg.from;

    try {
        const cena = await interactionManager.iniciarCena(npcId, jogadorId);
        if (!cena.permitido) {
            if (cena.motivo === "npc_em_cena") {
                await MessageService.send({ message: msg, text: `[!] *${npc.nome}* já está em cena com outro jogador. Aguarde o fim da interação.` });
            } else if (cena.motivo === "jogador_em_cena") {
                const npcAtual = NPCManager.carregarNPC(cena.npcId);
                await MessageService.send({ message: msg, text: `[!] Você já está em cena com *${npcAtual?.nome || cena.npcId}*. Use *!fim de interação <NPC>* antes de iniciar outra.` });
            } else {
                await MessageService.send({ message: msg, text: `[!] *${npc.nome}* estará disponível em aproximadamente ${cena.horasRestantes}h.` });
            }
            return true;
        }
        // Enviar para o NPCService que orquestra todo o fluxo:
        // ContextManager → PromptBuilder → Ollama → ConversationManager
        // Fase 2: Ophilia usa a única pipeline narrativa nova. Outros NPCs
        // permanecem temporariamente no fluxo legado até sua migração.
        let resposta;
        try {
            resposta = await conversarNarrativaNova(npcId, jogadorId, mensagemJogador);
            // A pipeline nova retorna o texto cru sem cabeçalho — aplica o
            // cabeçalho único de formatação (com nome completo do NPC) aqui.
            resposta = formatarMensagem(npc, resposta, await emotionManager.obterEmocao(npcId, jogadorId));
        } catch (erroPipelineNova) {
            console.error(`[NPC_CONVERSA] Pipeline narrativa nova falhou para "${npcId}" (${erroPipelineNova.message}). Usando fallback legado.`);
            resposta = await require("../ia/npcServiceV2").conversarComNPC(npcId, jogadorId, mensagemJogador);
            resposta = formatarMensagem(npc, resposta, await emotionManager.obterEmocao(npcId, jogadorId));
        }

        if (!resposta) {
            await MessageService.send({ message: msg, text: "Não consegui responder no momento. Tente novamente." });
            return true;
        }

        // Enviar resposta usando o sistema de divisão automática
        // que preserva a integridade da narrativa mesmo em mensagens longas
        const jogador = await new Promise((resolve) => db.get("SELECT id FROM jogadores WHERE numero = ?", [jogadorId], (err, row) => resolve(row || null)));
        if (jogador) {
            const pedidoForja = /\b(forj|fabric|criar|produz|martel|material|equipamento|arma|armadura)\w*/i.test(mensagemJogador);
            if (npcId === "bilac" && pedidoForja) {
                const ForjaSystem = require("../systems/forjaSystem");
                let sessaoForja = await ForjaSystem.getSessao(jogador.id);
                if (!sessaoForja) sessaoForja = await ForjaSystem.criarSessao(jogador.id, "Bilac");
                if (sessaoForja?.npc_nome === "Bilac") {
                    resposta += `\n\n∆ *Bilac aceita avaliar uma encomenda.*\n_Use *!preciso de um item* para apresentar os materiais à oficina._`;
                }
            }
            if (npcId === "vysache") {
                const ForjaSystem = require("../systems/forjaSystem");
                const sessaoForja = await ForjaSystem.getSessao(jogador.id);
                if (sessaoForja?.npc_nome === "Vysache" && sessaoForja.etapa === "encaminhado_vysache") {
                    resposta += `\n\n∆ *A recomendação de Bilac e a receita superior estão registradas.*\n_Se aceitar o preço do mestre, use *!aceitar forja vysache*._`;
                }
            }
            const oferta = await QuestSystem.obterOfertaDeMissaoNPC(jogador.id, npcId);
            if (oferta) {
                resposta += `\n\n∆ *${npc.nome} parece querer falar sobre "${oferta.nome}".*\n_Se quiser aceitar, use: !aceitar missão ${oferta.nome}_`;
            }
        }

        const resultado = await enviarMensagemCompleta(msg, resposta, {
            limite: 3000,
            delay: 500
        });

        if (!resultado.sucesso) {
            console.error("[NPC_CONVERSA] Falha no envio da mensagem:", resultado.validacao.detalhes);
        }

        return true;
    } catch (error) {
        console.error("[NPC_CONVERSA] Erro ao processar conversa:", error.message);
        await MessageService.send({ message: msg, text: "Ocorreu um erro durante a conversa. Tente novamente." });
        return true;
    }
}

module.exports = {
    processarConversaNPC,
    isConversaNPC,
    extrairConversaNPC
};
