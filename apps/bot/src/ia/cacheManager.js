/**
 * CACHE MANAGER
 *
 * Sistema de cache para módulos que não precisam recalcular
 * informações permanentes a cada mensagem.
 *
 * Módulos com cache:
 * - Emotion Engine (estado emocional)
 * - Mood Engine (humor permanente)
 * - Relationship Engine (relacionamento)
 * - Personality (personalidade do NPC)
 * - Objectives (objetivos do NPC)
 *
 * O cache é invalidado apenas quando há mudança real.
 * Cada entrada possui TTL configurável.
 */

class CacheManager {
    constructor() {
        this.cache = new Map();
        this.config = {
            // TTLs em milissegundos
            emotion: 5 * 60 * 1000,      // 5 minutos
            mood: 30 * 60 * 1000,        // 30 minutos
            relationship: 10 * 60 * 1000, // 10 minutos
            personality: 24 * 60 * 60 * 1000, // 24 horas
            objectives: 24 * 60 * 60 * 1000,  // 24 horas
            npc: 24 * 60 * 60 * 1000,    // 24 horas
            jogador: 10 * 60 * 1000      // 10 minutos
        };
        this.maxEntries = 500;
    }

    /**
     * Gera uma chave de cache
     * @param {string} tipo - Tipo de dado (emotion, mood, relationship, etc.)
     * @param {string} npcId - ID do NPC
     * @param {string} jogadorId - ID do jogador (opcional)
     * @returns {string} Chave de cache
     */
    gerarChave(tipo, npcId, jogadorId = null) {
        return `${tipo}:${npcId}${jogadorId ? `:${jogadorId}` : ''}`;
    }

    /**
     * Obtém um valor do cache
     * @param {string} chave - Chave do cache
     * @returns {*} Valor em cache ou null
     */
    obter(chave) {
        const item = this.cache.get(chave);
        if (!item) return null;

        // Verificar TTL
        if (Date.now() - item.timestamp > item.ttl) {
            this.cache.delete(chave);
            return null;
        }

        return item.valor;
    }

    /**
     * Salva um valor no cache
     * @param {string} chave - Chave do cache
     * @param {*} valor - Valor a ser cacheado
     * @param {number} ttl - TTL em ms (opcional, usa padrão do tipo)
     */
    salvar(chave, valor, ttl = null) {
        // Limpar cache se exceder limite
        if (this.cache.size >= this.maxEntries) {
            this._limparExcedente();
        }

        const tipo = chave.split(':')[0];
        const ttlFinal = ttl || this.config[tipo] || 5 * 60 * 1000;

        this.cache.set(chave, {
            valor: valor,
            timestamp: Date.now(),
            ttl: ttlFinal
        });
    }

    /**
     * Remove uma entrada do cache
     * @param {string} chave - Chave do cache
     */
    remover(chave) {
        this.cache.delete(chave);
    }

    /**
     * Invalida todas as entradas de um tipo para um NPC
     * @param {string} tipo - Tipo de dado
     * @param {string} npcId - ID do NPC
     */
    invalidarNPC(tipo, npcId) {
        const prefixo = `${tipo}:${npcId}`;
        for (const chave of this.cache.keys()) {
            if (chave.startsWith(prefixo)) {
                this.cache.delete(chave);
            }
        }
    }

    /**
     * Invalida todas as entradas de um NPC (todos os tipos)
     * @param {string} npcId - ID do NPC
     */
    invalidarTudoNPC(npcId) {
        for (const chave of this.cache.keys()) {
            if (chave.includes(`:${npcId}`)) {
                this.cache.delete(chave);
            }
        }
    }

    /**
     * Invalida todas as entradas de um jogador
     * @param {string} jogadorId - ID do jogador
     */
    invalidarJogador(jogadorId) {
        for (const chave of this.cache.keys()) {
            if (chave.endsWith(`:${jogadorId}`)) {
                this.cache.delete(chave);
            }
        }
    }

    /**
     * Limpa o cache completamente
     */
    limpar() {
        this.cache.clear();
    }

    /**
     * Obtém estatísticas do cache
     * @returns {Object} Estatísticas
     */
    getEstatisticas() {
        const tipos = {};
        let total = 0;

        for (const [chave, item] of this.cache) {
            const tipo = chave.split(':')[0];
            tipos[tipo] = (tipos[tipo] || 0) + 1;
            total++;
        }

        return {
            totalEntradas: total,
            tipos: tipos,
            maxEntradas: this.maxEntries
        };
    }

    /**
     * Limpa entradas expiradas e as mais antigas
     * @private
     */
    _limparExcedente() {
        const agora = Date.now();
        const entradas = [];

        for (const [chave, item] of this.cache) {
            // Remover expiradas
            if (agora - item.timestamp > item.ttl) {
                this.cache.delete(chave);
                continue;
            }
            entradas.push({ chave, timestamp: item.timestamp });
        }

        // Se ainda exceder, remover as mais antigas
        if (this.cache.size >= this.maxEntries) {
            entradas.sort((a, b) => a.timestamp - b.timestamp);
            const excedente = this.cache.size - this.maxEntries + 10;
            for (let i = 0; i < excedente && i < entradas.length; i++) {
                this.cache.delete(entradas[i].chave);
            }
        }
    }
}

// Instância singleton
const cacheManager = new CacheManager();

module.exports = {
    CacheManager,
    cacheManager
};