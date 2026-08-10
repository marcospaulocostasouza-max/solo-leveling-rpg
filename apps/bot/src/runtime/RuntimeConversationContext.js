/**
 * RUNTIME CONVERSATION CONTEXT
 *
 * Mantém um contexto incremental em memória para cada conversa.
 *
 * Cada conversa possui um contexto vivo que é construído uma vez
 * e depois apenas atualizado com as diferenças (delta) entre mensagens.
 *
 * Princípio:
 * - Primeira conversa: montar o contexto completo normalmente
 * - Após isso: NUNCA mais reconstruir tudo
 * - Sempre reutilizar o runtimePrompt existente
 * - Apenas atualizar: última mensagem, última resposta, humor, emoção,
 *   novas memórias, resumo do histórico
 *
 * NUNCA reconstruir:
 * - personalidade
 * - forma de falar
 * - aparência
 * - objetivos
 * - regras
 * Esses dados já existem dentro do promptBase.
 *
 * Estrutura:
 * {
 *     npcId,
 *     jogadorId,
 *     runtimePrompt,      // Prompt completo montado (reutilizado)
 *     promptBase,         // Prompt base permanente do NPC
 *     resumoHistorico,    // Resumo do histórico recente
 *     memoriasAtivas,     // Memórias relevantes ativas
 *     humorAtual,         // Humor atual do NPC
 *     emocaoAtual,        // Emoção atual do NPC
 *     relacionamentoAtual,// Relacionamento com o jogador
 *     contextoCena,       // Contexto da cena (local, horário, clima)
 *     ultimaResposta,     // Última resposta do NPC
 *     ultimaMensagem,     // Última mensagem do jogador
 *     updatedAt           // Data de última atualização
 * }
 *
 * Funcionalidades:
 * - createContext()  - Cria um novo contexto de conversa
 * - getContext()      - Obtém um contexto existente
 * - updateContext()   - Atualiza campos do contexto (delta)
 * - resetContext()    - Reseta o contexto (mantém promptBase)
 * - destroyContext()  - Remove o contexto completamente
 * - stats()           - Estatísticas do gerenciador
 */

const { runtimeDatabase } = require("./RuntimeDatabase");
const { estimarTokens } = require("../ia/tokenBudget");

// =====================================
// CONFIGURAÇÕES
// =====================================

const DEFAULT_TTL_MS = 30 * 60 * 1000; // 30 minutos

class RuntimeConversationContext {
    constructor(config = {}) {
        this._contextos = new Map(); // chave: `${npcId}:${jogadorId}`
        this._ttl = config.ttlMs || DEFAULT_TTL_MS;
        this._totalCriacoes = 0;
        this._totalAtualizacoes = 0;
        this._totalResets = 0;
        this._totalDestruicoes = 0;
        this._totalExpirados = 0;
        this._tempoTotalRecuperacao = 0;
        this._totalRecuperacoes = 0;
        // Estatísticas de delta
        this._totalTokensReaproveitados = 0;
        this._totalTokensReconstruidos = 0;
        this._totalTokensAdicionados = 0;
        this._totalReconstrucoesEliminadas = 0;
    }

    /**
     * Gera a chave do contexto
     */
    _gerarChave(npcId, jogadorId) {
        return `${npcId}:${jogadorId}`;
    }

    /**
     * Cria um novo contexto de conversa
     *
     * @param {string} npcId - ID do NPC
     * @param {string} jogadorId - ID do jogador
     * @param {Object} [dadosIniciais] - Dados iniciais
     * @returns {Object} Contexto criado
     */
    createContext(npcId, jogadorId, dadosIniciais = {}) {
        const chave = this._gerarChave(npcId, jogadorId);

        // Obter promptBase do RuntimeDatabase
        const runtimeNPC = runtimeDatabase.getRuntimeNPC(npcId);
        const promptBase = (runtimeNPC && runtimeNPC.promptBase) || null;

        const agora = new Date().toISOString();

        const contexto = {
            npcId,
            jogadorId,
            runtimePrompt: dadosIniciais.runtimePrompt || null,
            promptBase: promptBase,
            resumoHistorico: dadosIniciais.resumoHistorico || [],
            memoriasAtivas: dadosIniciais.memoriasAtivas || [],
            humorAtual: dadosIniciais.humorAtual || null,
            emocaoAtual: dadosIniciais.emocaoAtual || null,
            relacionamentoAtual: dadosIniciais.relacionamentoAtual || null,
            contextoCena: dadosIniciais.contextoCena || null,
            ultimaResposta: dadosIniciais.ultimaResposta || null,
            ultimaMensagem: dadosIniciais.ultimaMensagem || null,
            updatedAt: agora,
            createdAt: agora
        };

        this._contextos.set(chave, contexto);
        this._totalCriacoes++;

        // Se foi fornecido runtimePrompt, contar tokens reaproveitados
        if (contexto.runtimePrompt) {
            const tokens = estimarTokens(contexto.runtimePrompt);
            this._totalTokensReaproveitados += tokens;
        }

        return contexto;
    }

    /**
     * Obtém um contexto existente
     *
     * @param {string} npcId - ID do NPC
     * @param {string} jogadorId - ID do jogador
     * @returns {Object|null} Contexto ou null
     */
    getContext(npcId, jogadorId) {
        const chave = this._gerarChave(npcId, jogadorId);
        const contexto = this._contextos.get(chave);

        if (!contexto) {
            return null;
        }

        // Verificar TTL
        if (this._estaExpirado(contexto)) {
            this._contextos.delete(chave);
            this._totalExpirados++;
            return null;
        }

        // Medir tempo de recuperação
        const inicio = process.hrtime.bigint();
        contexto.updatedAt = new Date().toISOString();
        const fim = process.hrtime.bigint();
        const tempoMs = Number(fim - inicio) / 1e6;
        this._tempoTotalRecuperacao += tempoMs;
        this._totalRecuperacoes++;

        return contexto;
    }

    /**
     * Atualiza campos do contexto (delta)
     * Apenas atualiza campos dinâmicos, nunca reconstrói permanentes
     *
     * @param {string} npcId - ID do NPC
     * @param {string} jogadorId - ID do jogador
     * @param {Object} campos - Campos a atualizar
     * @returns {Object} Contexto atualizado
     */
    updateContext(npcId, jogadorId, campos = {}) {
        let contexto = this.getContext(npcId, jogadorId);

        if (!contexto) {
            contexto = this.createContext(npcId, jogadorId);
        }

        // Campos dinâmicos permitidos (NUNCA reconstruir permanentes)
        const camposDinamicos = [
            'runtimePrompt',
            'resumoHistorico',
            'memoriasAtivas',
            'humorAtual',
            'emocaoAtual',
            'relacionamentoAtual',
            'contextoCena',
            'ultimaResposta',
            'ultimaMensagem'
        ];

        let tokensAdicionados = 0;
        let tokensReaproveitados = 0;

        for (const campo of camposDinamicos) {
            if (campos[campo] !== undefined) {
                // Calcular delta de tokens
                const valorAntigo = contexto[campo];
                const valorNovo = campos[campo];

                if (typeof valorNovo === 'string') {
                    const tokensAntigos = valorAntigo ? estimarTokens(valorAntigo) : 0;
                    const tokensNovos = estimarTokens(valorNovo);

                    if (valorAntigo && valorNovo.includes(valorAntigo.substring(0, Math.min(100, valorAntigo.length)))) {
                        // Reaproveitamento parcial
                        tokensReaproveitados += tokensAntigos;
                        tokensAdicionados += (tokensNovos - tokensAntigos);
                    } else {
                        tokensAdicionados += tokensNovos;
                    }
                }

                contexto[campo] = campos[campo];
            }
        }

        contexto.updatedAt = new Date().toISOString();
        this._totalAtualizacoes++;
        this._totalTokensAdicionados += tokensAdicionados;
        this._totalTokensReaproveitados += tokensReaproveitados;
        this._totalReconstrucoesEliminadas++;

        // Modo DEBUG
        if (process.env.RUNTIME_DEBUG) {
            this._exibirDebug(contexto, campos, tokensAdicionados, tokensReaproveitados);
        }

        return contexto;
    }

    /**
     * Reseta o contexto mantendo o promptBase
     *
     * @param {string} npcId - ID do NPC
     * @param {string} jogadorId - ID do jogador
     * @returns {Object} Contexto resetado
     */
    resetContext(npcId, jogadorId) {
        const chave = this._gerarChave(npcId, jogadorId);
        const contexto = this._contextos.get(chave);

        if (!contexto) {
            return this.createContext(npcId, jogadorId);
        }

        // Manter apenas promptBase e IDs
        const promptBase = contexto.promptBase;
        this._contextos.delete(chave);
        this._totalResets++;

        const novoContexto = this.createContext(npcId, jogadorId, { promptBase });
        // Sobrescrever promptBase se já existia
        novoContexto.promptBase = promptBase || novoContexto.promptBase;

        return novoContexto;
    }

    /**
     * Remove completamente um contexto
     *
     * @param {string} npcId - ID do NPC
     * @param {string} jogadorId - ID do jogador
     * @returns {boolean} true se removeu
     */
    destroyContext(npcId, jogadorId) {
        const chave = this._gerarChave(npcId, jogadorId);
        const removido = this._contextos.delete(chave);
        if (removido) {
            this._totalDestruicoes++;
        }
        return removido;
    }

    /**
     * Retorna estatísticas do gerenciador
     *
     * @returns {Object} Estatísticas completas
     */
    stats() {
        const memoriaAtual = process.memoryUsage().heapUsed;
        let totalCaracteres = 0;
        let maiorContexto = null;
        let maiorTamanho = 0;

        for (const [chave, contexto] of this._contextos) {
            const tamanho = JSON.stringify(contexto).length;
            totalCaracteres += tamanho;
            if (tamanho > maiorTamanho) {
                maiorTamanho = tamanho;
                maiorContexto = chave;
            }
        }

        return {
            contextosAtivos: this._contextos.size,
            totalCriacoes: this._totalCriacoes,
            totalAtualizacoes: this._totalAtualizacoes,
            totalResets: this._totalResets,
            totalDestruicoes: this._totalDestruicoes,
            totalExpirados: this._totalExpirados,
            tempoMedioRecuperacaoMs: this._totalRecuperacoes > 0 ? (this._tempoTotalRecuperacao / this._totalRecuperacoes) : 0,
            tempoTotalRecuperacaoMs: this._tempoTotalRecuperacao,
            totalRecuperacoes: this._totalRecuperacoes,
            ttlMs: this._ttl,
            memoriaHeapAtual: this._formatarBytes(memoriaAtual),
            totalCaracteresDados: totalCaracteres,
            maiorContexto: maiorContexto,
            maiorContextoBytes: maiorTamanho,
            // Estatísticas de delta
            totalTokensReaproveitados: this._totalTokensReaproveitados,
            totalTokensReconstruidos: this._totalTokensReconstruidos,
            totalTokensAdicionados: this._totalTokensAdicionados,
            totalReconstrucoesEliminadas: this._totalReconstrucoesEliminadas,
            chaves: Array.from(this._contextos.keys())
        };
    }

    /**
     * Verifica se um contexto está expirado
     */
    _estaExpirado(contexto) {
        const updatedAt = new Date(contexto.updatedAt).getTime();
        const agora = Date.now();
        return (agora - updatedAt) > this._ttl;
    }

    /**
     * Exibe informações de debug
     */
    _exibirDebug(contexto, campos, tokensAdicionados, tokensReaproveitados) {
        console.log("");
        console.log("===== RUNTIME CONVERSATION DEBUG =====");

        if (contexto.runtimePrompt) {
            const tokensPrompt = estimarTokens(contexto.runtimePrompt);
            console.log(`Prompt anterior (reaproveitado): ${tokensPrompt} tokens`);
        } else {
            console.log(`Prompt anterior: NENHUM (primeira construção)`);
        }

        console.log(`Tokens adicionados (delta): ${tokensAdicionados}`);
        console.log(`Tokens reaproveitados: ${tokensReaproveitados}`);

        if (contexto.runtimePrompt) {
            const tokensTotal = estimarTokens(contexto.runtimePrompt);
            console.log(`Prompt atualizado: ${tokensTotal} tokens`);
            console.log(`Tokens reconstruídos: 0 (tudo reaproveitado)`);
        } else {
            console.log(`Prompt atualizado: N/A (aguardando primeira construção)`);
            console.log(`Tokens reconstruídos: ${tokensAdicionados}`);
        }

        console.log("======================================");
    }

    /**
     * Formata bytes
     */
    _formatarBytes(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
}

// =====================================
// SINGLETON
// =====================================

const runtimeConversationContext = new RuntimeConversationContext();

module.exports = {
    RuntimeConversationContext,
    runtimeConversationContext
};