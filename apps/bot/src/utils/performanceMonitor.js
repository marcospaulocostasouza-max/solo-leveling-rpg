/**
 * PERFORMANCE MONITOR
 *
 * Sistema de monitoramento de desempenho para o fluxo de conversa com NPCs.
 * Registra o tempo de cada etapa para identificar gargalos e medir otimizações.
 *
 * Uso:
 * const monitor = new PerformanceMonitor();
 * monitor.inicio('ContextManager');
 * // ... código ...
 * monitor.fim('ContextManager');
 * monitor.exibirRelatorio();
 */

class PerformanceMonitor {
    constructor() {
        this.marcos = {};
        this.tempos = {};
        this.dados = {};
    }

    /**
     * Marca o início de uma etapa
     * @param {string} nome - Nome da etapa
     */
    inicio(nome) {
        this.marcos[nome] = Date.now();
    }

    /**
     * Marca o fim de uma etapa
     * @param {string} nome - Nome da etapa
     * @param {Object} dadosExtras - Dados adicionais para registrar
     */
    fim(nome, dadosExtras = {}) {
        if (!this.marcos[nome]) {
            console.warn(`[PerformanceMonitor] Marco ${nome} não foi iniciado`);
            return;
        }

        const tempo = Date.now() - this.marcos[nome];
        this.tempos[nome] = tempo;
        this.dados[nome] = dadosExtras;

        delete this.marcos[nome];
    }

    /**
     * Inicia o tempo total do processo
     */
    inicioTotal() {
        this._inicioTotalTimestamp = Date.now();
    }

    /**
     * Finaliza o tempo total do processo
     */
    fimTotal() {
        this._fimTotalTimestamp = Date.now();
    }

    /**
     * Calcula o tempo total
     * @returns {number} Tempo total em ms
     */
    getTempoTotal() {
        if (!this._inicioTotalTimestamp || !this._fimTotalTimestamp) {
            return 0;
        }
        return this._fimTotalTimestamp - this._inicioTotalTimestamp;
    }

    /**
     * Gera o relatório de desempenho
     * @returns {string} Relatório formatado
     */
    gerarRelatorio() {
        const linhas = [];
        
        linhas.push('==============================');
        linhas.push('PERFORMANCE');
        linhas.push('==============================');
        linhas.push('');

        // Ordem de exibição dos módulos
        const ordem = [
            'ContextManager',
            'MemoryEngine',
            'RelationshipEngine',
            'EmotionEngine',
            'ContextOptimizer',
            'IntentAnalyzer',
            'ComplexityAnalyzer',
            'ThinkingDecision',
            'PromptBuilder',
            'Ollama',
            'MessageFormatter',
            'WhatsApp'
        ];

        // Exibir cada etapa na ordem definida
        ordem.forEach(nome => {
            if (this.tempos[nome] !== undefined) {
                linhas.push(`${nome}: ${this.tempos[nome]} ms`);
                
                // Exibir dados extras se existirem
                if (this.dados[nome] && Object.keys(this.dados[nome]).length > 0) {
                    Object.entries(this.dados[nome]).forEach(([chave, valor]) => {
                        if (chave === 'Caracteres' || chave === 'Tokens estimados' || 
                            chave === 'Modelo' || chave === 'Tempo' || chave === 'Tokens gerados' ||
                            chave === 'Tamanho da resposta' || chave === 'Intenção' ||
                            chave === 'Confiança' || chave === 'Complexidade' ||
                            chave === 'Thinking' || chave === 'Motivo') {
                            linhas.push(`${chave}: ${valor}`);
                        }
                    });
                }
            }
        });

        // Tempo total
        linhas.push('');
        linhas.push(`TOTAL: ${this.getTempoTotal()} ms`);
        linhas.push('');

        return linhas.join('\n');
    }

    /**
     * Exibe o relatório no console
     */
    exibirRelatorio() {
        console.log('\n' + this.gerarRelatorio());
    }

    /**
     * Retorna os dados brutos para análise
     * @returns {Object} Dados de desempenho
     */
    getDados() {
        return {
            tempos: { ...this.tempos },
            dados: { ...this.dados },
            tempoTotal: this.getTempoTotal()
        };
    }

    /**
     * Reseta o monitor
     */
    reset() {
        this.marcos = {};
        this.tempos = {};
        this.dados = {};
        this._inicioTotalTimestamp = null;
        this._fimTotalTimestamp = null;
    }
}

// =====================================
// FUNÇÕES AUXILIARES PARA INTEGRAÇÃO
// =====================================

/**
 * Wrapper para medir tempo de uma função assíncrona
 * @param {Function} fn - Função a ser medida
 * @param {string} nome - Nome da etapa
 * @param {Object} dadosExtras - Dados adicionais
 * @returns {Function} Função wrappada
 */
function medirTempo(fn, nome, dadosExtras = {}) {
    return async (...args) => {
        const monitor = new PerformanceMonitor();
        monitor.inicio(nome);
        
        try {
            const resultado = await fn(...args);
            monitor.fim(nome, dadosExtras);
            return { resultado, monitor };
        } catch (erro) {
            monitor.fim(nome, { erro: erro.message });
            throw erro;
        }
    };
}

/**
 * Cria um decorator para medir tempo de funções
 * @param {string} nome - Nome da etapa
 * @param {Object} dadosExtras - Dados adicionais
 * @returns {Function} Decorator
 */
function medir(nome, dadosExtras = {}) {
    return (target, propertyKey, descriptor) => {
        const metodoOriginal = descriptor.value;
        
        descriptor.value = async (...args) => {
            const monitor = new PerformanceMonitor();
            monitor.inicio(nome);
            
            try {
                const resultado = await metodoOriginal.apply(target, args);
                monitor.fim(nome, dadosExtras);
                return { resultado, monitor };
            } catch (erro) {
                monitor.fim(nome, { erro: erro.message });
                throw erro;
            }
        };
        
        return descriptor;
    };
}

// =====================================
// EXPORTAÇÕES
// =====================================

module.exports = {
    PerformanceMonitor,
    medirTempo,
    medir
};