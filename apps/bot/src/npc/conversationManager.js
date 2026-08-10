/**
 * CONVERSATION MANAGER
 *
 * Gerencia o histórico de conversas entre jogadores e NPCs.
 *
 * O histórico é separado por jogador e por NPC, mantendo apenas
 * as últimas N mensagens (configurável, padrão 15).
 *
 * Utiliza armazenamento em memória (Map), com arquitetura preparada
 * para substituir por SQLite no futuro.
 *
 * Este módulo NÃO conhece o Ollama nem monta prompts.
 * Ele apenas gerencia o histórico das conversas.
 *
 * Funções:
 * - adicionarMensagem(jogadorId, npcId, papel, conteudo) - Adiciona mensagem
 * - obterHistorico(jogadorId, npcId) - Retorna histórico da conversa
 * - limparHistorico(jogadorId, npcId) - Limpa histórico de uma conversa
 * - removerConversa(jogadorId, npcId) - Remove conversa completamente
 * - removerTodasConversasJogador(jogadorId) - Remove todas conversas de um jogador
 */

// Configuração do histórico
const CONFIG = {
    // Número máximo de mensagens por conversa (padrão 15, entre 10 e 20)
    maxMensagens: 15
};

// Estrutura: Map<jogadorId, Map<npcId, Array<mensagens>>>
const conversas = new Map();

/**
 * Ajusta o limite máximo de mensagens por conversa
 */
function configurarMaxMensagens(limite) {
    if (limite >= 10 && limite <= 20) {
        CONFIG.maxMensagens = limite;
        return true;
    }
    return false;
}

/**
 * Obtém o Map de conversas de um jogador (cria se não existir)
 */
function getConversasJogador(jogadorId) {
    if (!conversas.has(jogadorId)) {
        conversas.set(jogadorId, new Map());
    }
    return conversas.get(jogadorId);
}

/**
 * Obtém o array de mensagens de uma conversa (cria se não existir)
 */
function getMensagens(jogadorId, npcId) {
    const conversasJogador = getConversasJogador(jogadorId);
    if (!conversasJogador.has(npcId)) {
        conversasJogador.set(npcId, []);
    }
    return conversasJogador.get(npcId);
}

/**
 * Adiciona uma mensagem ao histórico da conversa
 *
 * @param {string} jogadorId - ID do jogador
 * @param {string} npcId - ID do NPC
 * @param {string} papel - "jogador" ou "npc"
 * @param {string} conteudo - Conteúdo da mensagem
 */
function adicionarMensagem(jogadorId, npcId, papel, conteudo) {
    if (!jogadorId || !npcId || !papel || !conteudo) {
        return false;
    }

    const mensagens = getMensagens(jogadorId, npcId);

    mensagens.push({
        papel: papel,
        conteudo: conteudo,
        data: new Date().toISOString()
    });

    // Manter apenas as últimas N mensagens
    if (mensagens.length > CONFIG.maxMensagens) {
        const excedente = mensagens.length - CONFIG.maxMensagens;
        mensagens.splice(0, excedente);
    }

    return true;
}

/**
 * Retorna o histórico de uma conversa
 *
 * @param {string} jogadorId - ID do jogador
 * @param {string} npcId - ID do NPC
 * @returns {Array} Lista de mensagens
 */
function obterHistorico(jogadorId, npcId) {
    if (!jogadorId || !npcId) return [];
    return getMensagens(jogadorId, npcId);
}

/**
 * Limpa o histórico de uma conversa (mantém a conversa no Map)
 */
function limparHistorico(jogadorId, npcId) {
    if (!jogadorId || !npcId) return false;

    const conversasJogador = conversas.get(jogadorId);
    if (conversasJogador && conversasJogador.has(npcId)) {
        conversasJogador.set(npcId, []);
        return true;
    }
    return false;
}

/**
 * Remove uma conversa completamente (jogador + NPC)
 */
function removerConversa(jogadorId, npcId) {
    if (!jogadorId || !npcId) return false;

    const conversasJogador = conversas.get(jogadorId);
    if (conversasJogador) {
        const removido = conversasJogador.delete(npcId);
        // Se o jogador não tem mais conversas, remover do Map principal
        if (conversasJogador.size === 0) {
            conversas.delete(jogadorId);
        }
        return removido;
    }
    return false;
}

/**
 * Remove todas as conversas de um jogador
 */
function removerTodasConversasJogador(jogadorId) {
    return conversas.delete(jogadorId);
}

/**
 * Retorna estatísticas do gerenciador (para debug)
 */
function getEstatisticas() {
    let totalConversas = 0;
    let totalMensagens = 0;

    for (const [jogadorId, conversasJogador] of conversas) {
        totalConversas += conversasJogador.size;
        for (const [npcId, mensagens] of conversasJogador) {
            totalMensagens += mensagens.length;
        }
    }

    return {
        jogadores: conversas.size,
        conversas: totalConversas,
        mensagens: totalMensagens,
        maxMensagens: CONFIG.maxMensagens
    };
}

module.exports = {
    adicionarMensagem,
    obterHistorico,
    limparHistorico,
    removerConversa,
    removerTodasConversasJogador,
    configurarMaxMensagens,
    getEstatisticas
};