/**
 * ==========================================================
 * THINKING PERFORMANCE LOGGER
 * ==========================================================
 *
 * Registra métricas de desempenho do sistema de thinking dinâmico.
 *
 * Formato do log:
 *
 * Intent: [categoria]
 * Complexidade: [pontuação/100]
 * Thinking: [true/false]
 * Tempo de decisão: [X] ms
 * Tempo do Ollama: [X] ms
 * Tempo total: [X] ms
 *
 * Princípios SOLID:
 * - Single Responsibility: apenas registra métricas
 * - Open/Closed: novos dados via extensão
 */

const fs = require('fs');
const path = require('path');

// ==========================================================
// THINKING PERFORMANCE LOGGER
// ==========================================================

class ThinkingPerformanceLogger {
    constructor() {
        this.historico = [];
        this.maxHistorico = 100;
        this.arquivoLog = path.join(__dirname, 'thinking-performace.log');
        this.ativo = true;
        this._carregarConfiguracao();
    }

    /**
     * Registra o resultado de uma análise de thinking
     *
     * @param {Object} dados - Dados da análise
     * @param {string} dados.jogadorId - ID do jogador
     * @param {string} dados.npcId - ID do NPC
     * @param {string} dados.categoria - Categoria detectada
     * @param {number} dados.complexidade - Pontuação de complexidade (0-100)
     * @param {string} dados.classificacao - Classificação da complexidade
     * @param {boolean} dados.thinking - Decisão de thinking
     * @param {string} dados.motivo - Motivo da decisão
     * @param {number} dados.tempoDecisao - Tempo da decisão em ms
     * @param {number} dados.tempoOllama - Tempo do Ollama em ms
     * @param {number} dados.tempoTotal - Tempo total em ms
     * @param {number} dados.pontuacao - Pontuação composta
     */
    registrar(dados = {}) {
        if (!this.ativo) return;

        const registro = {
            timestamp: new Date().toISOString(),
            jogadorId: dados.jogadorId || 'unknown',
            npcId: dados.npcId || 'unknown',
            categoria: dados.categoria || 'conversaCasual',
            complexidade: dados.complexidade || 0,
            classificacao: dados.classificacao || 'Simples',
            thinking: dados.thinking || false,
            motivo: dados.motivo || '',
            tempoDecisao: dados.tempoDecisao || 0,
            tempoOllama: dados.tempoOllama || 0,
            tempoTotal: dados.tempoTotal || 0,
            pontuacao: dados.pontuacao || 0
        };

        // Guardar no histórico em memória
        this.historico.push(registro);
        if (this.historico.length > this.maxHistorico) {
            this.historico.shift();
        }

        // Escrever no arquivo de log
        this._escreverArquivo(registro);

        // Exibir no console
        this._exibirConsole(registro);
    }

    /**
     * Escreve o registro em arquivo de log
     *
     * @param {Object} registro - Registro formatado
     * @private
     */
    _escreverArquivo(registro) {
        try {
            const linha = [
                `[${registro.timestamp}]`,
                `Jogador: ${registro.jogadorId}`,
                `NPC: ${registro.npcId}`,
                `Intent: ${registro.categoria}`,
                `Complexidade: ${registro.complexidade}/100 (${registro.classificacao})`,
                `Thinking: ${registro.thinking}`,
                `Motivo: ${registro.motivo}`,
                `Tempo de decisão: ${registro.tempoDecisao} ms`,
                `Tempo do Ollama: ${registro.tempoOllama} ms`,
                `Tempo total: ${registro.tempoTotal} ms`,
                '---'
            ].join('\n');

            fs.appendFileSync(this.arquivoLog, linha + '\n');
        } catch (erro) {
            console.warn('[ThinkingLogger] Erro ao escrever arquivo:', erro.message);
        }
    }

    /**
     * Exibe o registro no console de forma formatada
     *
     * @param {Object} registro - Registro formatado
     * @private
     */
    _exibirConsole(registro) {
        const icone = registro.thinking ? '🧠' : '⚡';

        console.log(`\n${icone} THINKING PERFORMANCE`);
        console.log('═══════════════════════════════');
        console.log(`Intent: ${registro.categoria}`);
        console.log(`Complexidade: ${registro.complexidade}/100 (${registro.classificacao})`);
        console.log(`Thinking: ${registro.thinking}`);
        console.log(`Motivo: ${registro.motivo}`);
        console.log(`Tempo de decisão: ${registro.tempoDecisao} ms`);
        console.log(`Tempo do Ollama: ${registro.tempoOllama} ms`);
        console.log(`Tempo total: ${registro.tempoTotal} ms`);
        console.log('═══════════════════════════════\n');
    }

    /**
     * Gera estatísticas agregadas
     *
     * @returns {Object} Estatísticas de desempenho
     */
    getEstatisticas() {
        const total = this.historico.length;
        if (total === 0) return { total: 0 };

        let thinkingCount = 0;
        let rapidoCount = 0;
        let somaComplexidade = 0;
        let somaTempoDecisao = 0;
        let somaTempoOllama = 0;
        let somaTempoTotal = 0;

        for (const registro of this.historico) {
            if (registro.thinking) {
                thinkingCount++;
            } else {
                rapidoCount++;
            }

            somaComplexidade += registro.complexidade;
            somaTempoDecisao += registro.tempoDecisao;
            somaTempoOllama += registro.tempoOllama;
            somaTempoTotal += registro.tempoTotal;
        }

        return {
            total: total,
            thinking: thinkingCount,
            rapido: rapidoCount,
            percentualThinking: Math.round((thinkingCount / total) * 100),
            percentualRapido: Math.round((rapidoCount / total) * 100),
            complexidadeMedia: Math.round(somaComplexidade / total),
            tempoDecisaoMedio: Math.round(somaTempoDecisao / total),
            tempoOllamaMedio: Math.round(somaTempoOllama / total),
            tempoTotalMedio: Math.round(somaTempoTotal / total)
        };
    }

    /**
     * Carrega configuração externa
     *
     * @private
     */
    _carregarConfiguracao() {
        try {
            const configPath = path.join(__dirname, 'thinking-config.json');
            if (fs.existsSync(configPath)) {
                const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
                if (config.performance && config.performance.logAtivo !== undefined) {
                    this.ativo = config.performance.logAtivo;
                }
            }
        } catch (erro) {
            // Mantém configuração padrão
        }
    }
}

// Instância singleton
const thinkingPerformanceLogger = new ThinkingPerformanceLogger();

module.exports = {
    ThinkingPerformanceLogger,
    thinkingPerformanceLogger
};