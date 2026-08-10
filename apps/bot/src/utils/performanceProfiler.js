/**
 * PERFORMANCE PROFILER - Diagnóstico Completo de Performance
 *
 * Sistema de profiling detalhado para o pipeline de geração de resposta.
 * Mede cada etapa individualmente, incluindo TTFT (Time To First Token),
 * velocidade de geração, e tamanho de cada parte do prompt.
 *
 * Uso:
 * const profiler = new PerformanceProfiler();
 * profiler.inicio('Etapa');
 * // ... código ...
 * profiler.fim('Etapa', { dados: 'extras' });
 * profiler.exibirRelatorio();
 */

const fs = require("fs");
const path = require("path");

class PerformanceProfiler {
    constructor() {
        this.marcos = {};
        this.tempos = {};
        this.dados = {};
        this.ordem = [];
        this._inicioTotal = null;
        this._fimTotal = null;
        this.debug = process.env.DEBUG === "true" || process.env.DEBUG === "1";
    }

    /**
     * Marca o início de uma etapa
     * @param {string} nome - Nome da etapa
     */
    inicio(nome) {
        this.marcos[nome] = Date.now();
        if (!this.ordem.includes(nome)) {
            this.ordem.push(nome);
        }
    }

    /**
     * Marca o fim de uma etapa
     * @param {string} nome - Nome da etapa
     * @param {Object} dadosExtras - Dados adicionais para registrar
     */
    fim(nome, dadosExtras = {}) {
        if (!this.marcos[nome]) {
            console.warn(`[PerformanceProfiler] Marco ${nome} não foi iniciado`);
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
        this._inicioTotal = Date.now();
    }

    /**
     * Finaliza o tempo total do processo
     */
    fimTotal() {
        this._fimTotal = Date.now();
    }

    /**
     * Calcula o tempo total
     * @returns {number} Tempo total em ms
     */
    getTempoTotal() {
        if (!this._inicioTotal || !this._fimTotal) {
            return 0;
        }
        return this._fimTotal - this._inicioTotal;
    }

    /**
     * Formata um tempo em ms para formato legível
     * @param {number} ms - Tempo em milissegundos
     * @returns {string} Tempo formatado
     */
    formatarTempo(ms) {
        if (ms < 1000) return `${ms} ms`;
        if (ms < 60000) return `${(ms / 1000).toFixed(2)} s`;
        return `${(ms / 60000).toFixed(2)} min`;
    }

    /**
     * Gera o relatório completo de performance
     * @returns {string} Relatório formatado
     */
    gerarRelatorio() {
        const linhas = [];
        const total = this.getTempoTotal();

        linhas.push("==========================================");
        linhas.push("  DIAGNÓSTICO COMPLETO DE PERFORMANCE");
        linhas.push("==========================================");
        linhas.push("");

        // =====================================
        // 1. PIPELINE COMPLETO
        // =====================================
        linhas.push("PIPELINE");
        linhas.push("--------");

        this.ordem.forEach(nome => {
            if (this.tempos[nome] !== undefined) {
                const tempo = this.tempos[nome];
                const pct = total > 0 ? ((tempo / total) * 100).toFixed(1) : "0.0";
                linhas.push(`  ${nome}: ${this.formatarTempo(tempo)} (${pct}%)`);

                // Exibir dados extras
                if (this.dados[nome] && Object.keys(this.dados[nome]).length > 0) {
                    Object.entries(this.dados[nome]).forEach(([chave, valor]) => {
                        linhas.push(`    ${chave}: ${valor}`);
                    });
                }
            }
        });

        linhas.push("");
        linhas.push(`  TOTAL: ${this.formatarTempo(total)}`);
        linhas.push("");

        // =====================================
        // 2. ANÁLISE DE GARGALO
        // =====================================
        linhas.push("ANÁLISE DE GARGALO");
        linhas.push("------------------");

        // Encontrar a etapa mais lenta
        let etapaMaisLenta = null;
        let tempoMaisLento = 0;
        this.ordem.forEach(nome => {
            if (this.tempos[nome] !== undefined && this.tempos[nome] > tempoMaisLento) {
                tempoMaisLento = this.tempos[nome];
                etapaMaisLenta = nome;
            }
        });

        if (etapaMaisLenta) {
            const pct = total > 0 ? ((tempoMaisLento / total) * 100).toFixed(1) : "0.0";
            linhas.push(`  ⚠️ Gargalo principal: ${etapaMaisLenta} (${this.formatarTempo(tempoMaisLento)} - ${pct}% do total)`);
        }

        // Análise específica do Ollama
        if (this.tempos['Ollama'] !== undefined) {
            const tempoOllama = this.tempos['Ollama'];
            const pctOllama = total > 0 ? ((tempoOllama / total) * 100).toFixed(1) : "0.0";
            linhas.push(`  🤖 Ollama consome ${pctOllama}% do tempo total (${this.formatarTempo(tempoOllama)})`);
        }

        // Análise do TTFT
        if (this.dados['Ollama'] && this.dados['Ollama']['TTFT'] !== undefined) {
            const ttft = this.dados['Ollama']['TTFT'];
            const geracao = this.dados['Ollama']['Tempo de geração'] || 0;
            const tempoOllama = this.tempos['Ollama'] || 0;

            linhas.push("");
            linhas.push("  ANÁLISE TTFT vs GERAÇÃO:");
            linhas.push(`    Tempo até chamar o Ollama: ${this.formatarTempo(this.tempos['PromptBuilder'] || 0)}`);
            linhas.push(`    TTFT: ${this.formatarTempo(ttft)}`);
            linhas.push(`    Geração: ${this.formatarTempo(geracao)}`);

            if (ttft > geracao) {
                linhas.push(`    ⚠️ TTFT é o gargalo! O modelo demora para começar a gerar.`);
                linhas.push(`    Causa provável: modelo grande, CPU lenta, ou contexto muito grande.`);
            } else {
                linhas.push(`    ✅ Geração é o gargalo! O modelo gera rápido mas produz muito texto.`);
                linhas.push(`    Causa provável: num_predict alto, resposta longa, ou modelo lento.`);
            }
        }

        linhas.push("");

        // =====================================
        // 3. TAMANHO DO PROMPT POR PARTE
        // =====================================
        if (this.dados['PromptParts']) {
            linhas.push("TAMANHO DO PROMPT POR PARTE");
            linhas.push("---------------------------");

            const partes = this.dados['PromptParts'];
            let totalChars = 0;
            let totalTokens = 0;

            Object.entries(partes).forEach(([nome, info]) => {
                const chars = info.caracteres || 0;
                const tokens = info.tokens || 0;
                totalChars += chars;
                totalTokens += tokens;
                linhas.push(`  ${nome}: ${chars} chars | ${tokens} tokens`);
            });

            linhas.push(`  ─────────────────────────────`);
            linhas.push(`  TOTAL: ${totalChars} chars | ${totalTokens} tokens`);
            linhas.push("");
        }

        // =====================================
        // 4. MÉTRICAS DO OLLAMA
        // =====================================
        if (this.dados['Ollama']) {
            const ollama = this.dados['Ollama'];
            linhas.push("MÉTRICAS DO OLLAMA");
            linhas.push("------------------");

            if (ollama['TTFT'] !== undefined) {
                linhas.push(`  TTFT (Time To First Token): ${this.formatarTempo(ollama['TTFT'])}`);
            }
            if (ollama['Tempo de geração'] !== undefined) {
                linhas.push(`  Tempo de geração: ${this.formatarTempo(ollama['Tempo de geração'])}`);
            }
            if (ollama['Tokens gerados'] !== undefined) {
                linhas.push(`  Tokens gerados: ${ollama['Tokens gerados']}`);
            }
            if (ollama['Velocidade'] !== undefined) {
                linhas.push(`  Velocidade: ${ollama['Velocidade']}`);
            }
            if (ollama['Modelo'] !== undefined) {
                linhas.push(`  Modelo: ${ollama['Modelo']}`);
            }
            if (ollama['Thinking'] !== undefined) {
                linhas.push(`  Thinking: ${ollama['Thinking']}`);
            }
            if (ollama['Prompt chars'] !== undefined) {
                linhas.push(`  Prompt: ${ollama['Prompt chars']} chars | ${ollama['Prompt tokens']} tokens`);
            }
            linhas.push("");
        }

        return linhas.join("\n");
    }

    /**
     * Exibe o relatório no console
     */
    exibirRelatorio() {
        console.log("\n" + this.gerarRelatorio());
    }

    /**
     * Salva o prompt completo em arquivo de log (modo DEBUG)
     * @param {string} prompt - Prompt completo
     * @param {Object} metadados - Metadados adicionais
     */
    salvarPromptDebug(prompt, metadados = {}) {
        if (!this.debug) return;

        try {
            const dirLog = path.join(__dirname, "..", "..", "logs");
            if (!fs.existsSync(dirLog)) {
                fs.mkdirSync(dirLog, { recursive: true });
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            const arquivo = path.join(dirLog, `prompt_${timestamp}.txt`);

            const conteudo = [
                "==========================================",
                "  PROMPT COMPLETO (DEBUG)",
                "==========================================",
                "",
                `Timestamp: ${new Date().toISOString()}`,
                `NPC: ${metadados.npcId || "desconhecido"}`,
                `Jogador: ${metadados.jogadorId || "desconhecido"}`,
                `Thinking: ${metadados.thinking || false}`,
                `Caracteres: ${prompt.length}`,
                `Tokens estimados: ${Math.floor(prompt.length / 4)}`,
                "",
                "==========================================",
                "  CONTEÚDO DO PROMPT",
                "==========================================",
                "",
                prompt,
                "",
                "==========================================",
                "  FIM DO PROMPT",
                "=========================================="
            ].join("\n");

            fs.writeFileSync(arquivo, conteudo, "utf8");
            console.log(`[PerformanceProfiler] 📝 Prompt salvo em: ${arquivo}`);
        } catch (erro) {
            console.error("[PerformanceProfiler] Erro ao salvar prompt:", erro.message);
        }
    }

    /**
     * Retorna os dados brutos para análise
     * @returns {Object} Dados de performance
     */
    getDados() {
        return {
            tempos: { ...this.tempos },
            dados: { ...this.dados },
            ordem: [...this.ordem],
            tempoTotal: this.getTempoTotal()
        };
    }

    /**
     * Reseta o profiler
     */
    reset() {
        this.marcos = {};
        this.tempos = {};
        this.dados = {};
        this.ordem = [];
        this._inicioTotal = null;
        this._fimTotal = null;
    }
}

module.exports = {
    PerformanceProfiler
};