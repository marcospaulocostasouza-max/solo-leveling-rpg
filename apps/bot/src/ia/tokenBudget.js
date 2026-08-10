/**
 * TOKEN BUDGET MANAGER
 *
 * Sistema de limite máximo de contexto para o prompt.
 *
 * Distribuição padrão:
 * - Sistema: 8%
 * - NPC: 15%
 * - Cena: 30%
 * - Memórias: 20%
 * - Relacionamentos: 10%
 * - Missão: 10%
 * - Jogador: 7%
 *
 * Quando ultrapassar o limite, resume automaticamente os blocos
 * menos importantes. Nunca corta a cena atual.
 */

// =====================================
// CONFIGURAÇÃO DO BUDGET
// =====================================

const { MODEL_CONFIG } = require('./modelConfig');

const BUDGET_PADRAO = {
    maxTokens: MODEL_CONFIG.num_ctx || 4096, // Contexto do modelo (num_ctx)
    distribuicao: {
        sistema: 0.08,        // 8%
        npc: 0.15,            // 15%
        cena: 0.30,           // 30%
        memorias: 0.20,       // 20%
        relacionamentos: 0.10, // 10%
        missao: 0.10,         // 10%
        jogador: 0.07         // 7%
    },
    // Ordem de prioridade para resumo (menos importante primeiro)
    ordemResumo: [
        'relacionamentos',
        'jogador',
        'missao',
        'memorias',
        'npc',
        'sistema',
        'cena' // Nunca cortar a cena
    ]
};

/**
 * Calcula o orçamento de tokens para cada bloco
 *
 * @param {number} maxTokens - Total de tokens disponíveis
 * @returns {Object} Orçamento por bloco
 */
function calcularOrcamento(maxTokens = BUDGET_PADRAO.maxTokens) {
    const orcamento = {};
    for (const [bloco, percentual] of Object.entries(BUDGET_PADRAO.distribuicao)) {
        orcamento[bloco] = Math.floor(maxTokens * percentual);
    }
    return orcamento;
}

/**
 * Estima tokens de um texto
 *
 * @param {string} texto - Texto para estimar
 * @returns {number} Estimativa de tokens
 */
function estimarTokens(texto) {
    if (!texto) return 0;
    return Math.ceil(texto.length / 4);
}

/**
 * Resume um texto para caber no orçamento
 *
 * @param {string} texto - Texto original
 * @param {number} maxTokens - Máximo de tokens permitidos
 * @returns {string} Texto resumido
 */
function resumirParaOrcamento(texto, maxTokens) {
    if (!texto) return '';
    if (estimarTokens(texto) <= maxTokens) return texto;

    // Calcular máximo de caracteres
    const maxChars = maxTokens * 4;

    // Tentar cortar na primeira frase
    const primeiraFrase = texto.split('.')[0];
    if (primeiraFrase.length <= maxChars) {
        return primeiraFrase + '.';
    }

    // Cortar no meio
    const cortado = texto.substring(0, maxChars);
    const ultimoPonto = cortado.lastIndexOf('.');
    if (ultimoPonto > maxChars * 0.7) {
        return cortado.substring(0, ultimoPonto + 1);
    }

    return cortado + '...';
}

/**
 * Aplica o token budget aos blocos do prompt
 *
 * @param {Object} blocos - Blocos do prompt (nome → conteúdo)
 * @param {number} maxTokens - Total de tokens disponíveis
 * @returns {Object} Blocos ajustados ao orçamento
 */
function aplicarTokenBudget(blocos, maxTokens = BUDGET_PADRAO.maxTokens) {
    const orcamento = calcularOrcamento(maxTokens);
    const resultado = {};
    const metricas = {};

    // Primeira passada: verificar quais blocos excedem
    const excedentes = [];
    let totalTokens = 0;

    for (const [bloco, conteudo] of Object.entries(blocos)) {
        const tokens = estimarTokens(conteudo);
        totalTokens += tokens;
        metricas[bloco] = { tokens, orcamento: orcamento[bloco] || 0 };

        if (tokens > (orcamento[bloco] || 0)) {
            excedentes.push(bloco);
        }
    }

    // Se não excedeu o total, retornar como está
    if (totalTokens <= maxTokens) {
        return { blocos, metricas, resumido: false };
    }

    // Resumir blocos excedentes (menos importantes primeiro)
    const ordemResumo = BUDGET_PADRAO.ordemResumo;
    const excedentesOrdenados = excedentes.sort((a, b) => {
        return ordemResumo.indexOf(a) - ordemResumo.indexOf(b);
    });

    let resumido = false;
    for (const bloco of excedentesOrdenados) {
        // Nunca resumir a cena
        if (bloco === 'cena') continue;

        const conteudo = blocos[bloco];
        const tokensAtual = estimarTokens(conteudo);
        const orcamentoBloco = orcamento[bloco] || 0;

        if (tokensAtual > orcamentoBloco) {
            resultado[bloco] = resumirParaOrcamento(conteudo, orcamentoBloco);
            metricas[bloco].resumido = true;
            metricas[bloco].tokensAntes = tokensAtual;
            metricas[bloco].tokensDepois = estimarTokens(resultado[bloco]);
            resumido = true;
        } else {
            resultado[bloco] = conteudo;
        }
    }

    // Copiar blocos não excedentes
    for (const [bloco, conteudo] of Object.entries(blocos)) {
        if (!resultado[bloco]) {
            resultado[bloco] = conteudo;
        }
    }

    return { blocos: resultado, metricas, resumido };
}

module.exports = {
    aplicarTokenBudget,
    calcularOrcamento,
    estimarTokens,
    resumirParaOrcamento,
    BUDGET_PADRAO
};