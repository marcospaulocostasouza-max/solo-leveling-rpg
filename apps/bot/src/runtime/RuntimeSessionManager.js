/**
 * RUNTIME SESSION MANAGER
 *
 * Gerencia sessões vivas em memória para conversas entre NPCs e jogadores.
 *
 * Cada conversa entre um NPC e um jogador tem uma sessão persistente em RAM.
 * Quando um jogador volta a conversar com o mesmo NPC, a sessão é reutilizada
 * sem reconstruir informações do zero.
 *
 * Estrutura da sessão:
 * {
 *     npcId,
 *     jogadorId,
 *     runtimeNPC,
 *     relacionamento,
 *     humor,
 *     estadoEmocional,
 *     memoriasRecentes,
 *     historicoCurto,
 *     contextoAtual,
 *     ultimaMensagem,
 *     ultimoAcesso,
 *     createdAt,
 *     updatedAt
 * }
 *
 * Funcionalidades:
 * - createSession()  - Cria uma nova sessão
 * - getSession()     - Obtém uma sessão existente
 * - updateSession()  - Atualiza campos da sessão
 * - clearSession()   - Remove uma sessão específica
 * - clearAll()       - Remove todas as sessões
 * - getStats()       - Estatísticas do gerenciador
 *
 * TTL configurável - sessões inativas são removidas automaticamente.
 */

const { runtimeDatabase } = require("./RuntimeDatabase");

// =====================================
// CONFIGURAÇÕES
// =====================================

// TTL padrão: 30 minutos de inatividade
const DEFAULT_TTL_MS = 30 * 60 * 1000;

class RuntimeSessionManager {
    constructor(config = {}) {
        this._sessoes = new Map(); // chave: `${npcId}:${jogadorId}`
        this._ttl = config.ttlMs || DEFAULT_TTL_MS;
        this._verificarIntervalo = config.verificarIntervaloMs || 5 * 60 * 1000; // 5 min
        this._tempoTotalRecuperacoes = 0;
        this._totalRecuperacoes = 0;
        this._totalCriacoes = 0;
        this._totalAtualizacoes = 0;
        this._totalExpiradas = 0;
        this._iniciarLimpezaAutomatica();
    }

    /**
     * Gera a chave da sessão
     */
    _gerarChave(npcId, jogadorId) {
        return `${npcId}:${jogadorId}`;
    }

    /**
     * Cria uma nova sessão
     *
     * @param {string} npcId - ID do NPC
     * @param {string} jogadorId - ID do jogador
     * @param {Object} [dadosIniciais] - Dados iniciais para preencher a sessão
     * @returns {Object} Sessão criada
     */
    createSession(npcId, jogadorId, dadosIniciais = {}) {
        const chave = this._gerarChave(npcId, jogadorId);

        // Obter runtimeNPC do RuntimeDatabase
        const runtimeNPC = runtimeDatabase.getRuntimeNPC(npcId) || null;

        const agora = new Date().toISOString();
        const sessao = {
            npcId,
            jogadorId,
            runtimeNPC,
            relacionamento: dadosIniciais.relacionamento || null,
            humor: dadosIniciais.humor || null,
            estadoEmocional: dadosIniciais.estadoEmocional || null,
            memoriasRecentes: dadosIniciais.memoriasRecentes || [],
            historicoCurto: dadosIniciais.historicoCurto || [],
            contextoAtual: dadosIniciais.contextoAtual || null,
            ultimaMensagem: dadosIniciais.ultimaMensagem || null,
            ultimoAcesso: agora,
            createdAt: agora,
            updatedAt: agora
        };

        this._sessoes.set(chave, sessao);
        this._totalCriacoes++;

        return sessao;
    }

    /**
     * Obtém uma sessão existente
     * Se a sessão existir, atualiza ultimoAcesso
     *
     * @param {string} npcId - ID do NPC
     * @param {string} jogadorId - ID do jogador
     * @returns {Object|null} Sessão ou null se não existir
     */
    getSession(npcId, jogadorId) {
        const chave = this._gerarChave(npcId, jogadorId);
        const sessao = this._sessoes.get(chave);

        if (!sessao) {
            return null;
        }

        // Verificar TTL
        if (this._estaExpirada(sessao)) {
            this._sessoes.delete(chave);
            this._totalExpiradas++;
            return null;
        }

        // Medir tempo de recuperação
        const inicio = process.hrtime.bigint();
        sessao.ultimoAcesso = new Date().toISOString();
        const fim = process.hrtime.bigint();
        const tempoMs = Number(fim - inicio) / 1e6;
        this._tempoTotalRecuperacoes += tempoMs;
        this._totalRecuperacoes++;

        return sessao;
    }

    /**
     * Atualiza campos da sessão
     * Se a sessão não existir, cria uma nova
     *
     * @param {string} npcId - ID do NPC
     * @param {string} jogadorId - ID do jogador
     * @param {Object} campos - Campos a atualizar
     * @returns {Object} Sessão atualizada
     */
    updateSession(npcId, jogadorId, campos = {}) {
        let sessao = this.getSession(npcId, jogadorId);

        if (!sessao) {
            sessao = this.createSession(npcId, jogadorId);
        }

        // Atualizar campos permitidos
        const camposPermitidos = [
            'relacionamento',
            'humor',
            'estadoEmocional',
            'memoriasRecentes',
            'historicoCurto',
            'contextoAtual',
            'ultimaMensagem'
        ];

        for (const campo of camposPermitidos) {
            if (campos[campo] !== undefined) {
                sessao[campo] = campos[campo];
            }
        }

        sessao.ultimoAcesso = new Date().toISOString();
        sessao.updatedAt = new Date().toISOString();
        this._totalAtualizacoes++;

        return sessao;
    }

    /**
     * Remove uma sessão específica
     *
     * @param {string} npcId - ID do NPC
     * @param {string} jogadorId - ID do jogador
     * @returns {boolean} true se removeu, false se não existia
     */
    clearSession(npcId, jogadorId) {
        const chave = this._gerarChave(npcId, jogadorId);
        return this._sessoes.delete(chave);
    }

    /**
     * Remove todas as sessões
     */
    clearAll() {
        this._sessoes.clear();
    }

    /**
     * Retorna estatísticas do gerenciador de sessões
     *
     * @returns {Object} Estatísticas completas
     */
    getStats() {
        const memoriaAtual = process.memoryUsage().heapUsed;
        let totalCaracteres = 0;
        let maiorSessao = null;
        let maiorTamanho = 0;

        for (const [chave, sessao] of this._sessoes) {
            const tamanho = JSON.stringify(sessao).length;
            totalCaracteres += tamanho;
            if (tamanho > maiorTamanho) {
                maiorTamanho = tamanho;
                maiorSessao = chave;
            }
        }

        return {
            sessoesAtivas: this._sessoes.size,
            totalCriacoes: this._totalCriacoes,
            totalRecuperacoes: this._totalRecuperacoes,
            totalAtualizacoes: this._totalAtualizacoes,
            totalExpiradas: this._totalExpiradas,
            tempoMedioRecuperacaoMs: this._totalRecuperacoes > 0 ? (this._tempoTotalRecuperacoes / this._totalRecuperacoes) : 0,
            tempoTotalRecuperacoesMs: this._tempoTotalRecuperacoes,
            ttlMs: this._ttl,
            memoriaHeapAtual: this._formatarBytes(memoriaAtual),
            totalCaracteresDados: totalCaracteres,
            maiorSessao: maiorSessao,
            maiorSessaoBytes: maiorTamanho,
            chaves: Array.from(this._sessoes.keys())
        };
    }

    /**
     * Verifica se uma sessão está expirada pelo TTL
     *
     * @param {Object} sessao - Sessão a verificar
     * @returns {boolean} true se expirada
     */
    _estaExpirada(sessao) {
        const ultimoAcesso = new Date(sessao.ultimoAcesso).getTime();
        const agora = Date.now();
        return (agora - ultimoAcesso) > this._ttl;
    }

    /**
     * Remove sessões expiradas
     *
     * @returns {number} Quantidade de sessões removidas
     */
    limparExpiradas() {
        let removidas = 0;
        for (const [chave, sessao] of this._sessoes) {
            if (this._estaExpirada(sessao)) {
                this._sessoes.delete(chave);
                this._totalExpiradas++;
                removidas++;
            }
        }
        if (removidas > 0) {
            console.log(`[RuntimeSession] ${removidas} sessão(ões) expirada(s) removida(s)`);
        }
        return removidas;
    }

    /**
     * Inicia a limpeza automática de sessões expiradas
     */
    _iniciarLimpezaAutomatica() {
        setInterval(() => {
            this.limparExpiradas();
        }, this._verificarIntervalo);
    }

    /**
     * Formata bytes para exibição legível
     *
     * @param {number} bytes - Valor em bytes
     * @returns {string} Valor formatado
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

const runtimeSessionManager = new RuntimeSessionManager();

module.exports = {
    RuntimeSessionManager,
    runtimeSessionManager
};