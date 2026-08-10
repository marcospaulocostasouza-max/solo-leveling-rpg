/**
 * RUNTIME DATABASE
 * 
 * Camada de infraestrutura responsável por manter TODOS os NPCs
 * compilados em memória durante toda a execução do sistema.
 * 
 * Esta camada funciona PARALELAMENTE ao sistema atual.
 * NÃO altera nenhum fluxo existente.
 * NÃO substitui o NPCManager.
 * Apenas mantém uma cópia compilada de todos os NPCs em memória.
 * 
 * Funcionalidades:
 * - initialize()     - Inicializa o banco de dados em memória
 * - getNPC(id)       - Busca um NPC pelo ID (Runtime Object)
 * - getRuntimeNPC(id) - Busca um NPC compilado via RuntimeCompiler
 * - getAllNPCs()     - Retorna todos os NPCs
 * - reloadNPC(id)    - Recarrega um NPC específico do disco
 * - reloadAll()      - Recarrega todos os NPCs do disco
 * - stats()          - Estatísticas do runtime database
 */

const fs = require("fs");
const path = require("path");
const NPCManager = require("../npc/npcManager");
const { compileNPC, compararNPC } = require("./RuntimeCompiler");

// =====================================
// CONFIGURAÇÕES
// =====================================

const DATA_DIR = path.join(__dirname, "..", "npc", "data");

class RuntimeDatabase {
    constructor() {
        this._db = new Map();          // id → Runtime Object
        this._runtimeNPCs = new Map(); // id → Runtime NPC compilado via RuntimeCompiler
        this._inicializado = false;
        this._tempoInicializacao = 0;  // ms
        this._memoriaInicial = 0;      // bytes (heapUsed antes)
        this._memoriaFinal = 0;        // bytes (heapUsed depois)
        this._totalRecarregamentos = 0;
        this._ultimaInicializacao = null;
        // Estatísticas de consulta
        this._totalConsultas = 0;
        this._totalFallbacks = 0;
        this._tempoTotalConsultas = 0; // ms
        this._consultasPorNPC = new Map(); // id → { consultas, fallbacks }
    }

    /**
     * Inicializa o Runtime Database
     * Carrega todos os NPCs do NPCManager e cria Runtime Objects
     * 
     * @returns {Object} Resultado da inicialização
     */
    initialize() {
        const inicio = process.hrtime.bigint();
        const memoriaAntes = process.memoryUsage().heapUsed;

        try {
            // Obter todos os NPCs do NPCManager (já carregados em memória)
            const npcs = NPCManager.listarNPCs();

            if (!npcs || npcs.length === 0) {
                console.warn("[RuntimeDB] Nenhum NPC encontrado no NPCManager.");
                return { sucesso: false, quantidade: 0 };
            }

            // Criar Runtime Object para cada NPC
            for (const npc of npcs) {
                if (!npc || !npc.id) continue;
                
                // Compilar NPC via RuntimeCompiler
                const runtimeNPC = compileNPC(npc);
                this._runtimeNPCs.set(npc.id, runtimeNPC);
                
                // Armazenar Runtime Object completo (com dados brutos)
                this._db.set(npc.id, this._criarRuntimeObject(npc, runtimeNPC));
            }

            const fim = process.hrtime.bigint();
            const tempoMs = Number(fim - inicio) / 1e6;
            const memoriaDepois = process.memoryUsage().heapUsed;

            this._inicializado = true;
            this._tempoInicializacao = tempoMs;
            this._memoriaInicial = memoriaAntes;
            this._memoriaFinal = memoriaDepois;
            this._ultimaInicializacao = new Date().toISOString();

            console.log(`[RuntimeDB] ${this._db.size} NPCs compilados em memória (${tempoMs.toFixed(2)} ms, ${this._formatarBytes(memoriaDepois - memoriaAntes)})`);

            return {
                sucesso: true,
                quantidade: this._db.size,
                tempoMs: tempoMs,
                memoriaBytes: memoriaDepois - memoriaAntes
            };
        } catch (erro) {
            console.error("[RuntimeDB] Erro ao inicializar:", erro.message);
            return { sucesso: false, erro: erro.message };
        }
    }

    /**
     * Busca um NPC pelo ID
     * 
     * @param {string} id - ID do NPC
     * @returns {Object|null} Runtime Object do NPC ou null
     */
    getNPC(id) {
        if (!id) return null;
        return this._db.get(id) || null;
    }

    /**
     * Retorna um Runtime NPC compilado pelo ID
     * Mede o tempo da consulta e registra estatísticas
     * 
     * @param {string} id - ID do NPC
     * @returns {Object|null} Runtime NPC compilado ou null
     */
    getRuntimeNPC(id) {
        if (!id) return null;

        const inicio = process.hrtime.bigint();
        const resultado = this._runtimeNPCs.get(id) || null;
        const fim = process.hrtime.bigint();
        const tempoMs = Number(fim - inicio) / 1e6;

        // Registrar estatísticas
        this._totalConsultas++;
        this._tempoTotalConsultas += tempoMs;

        if (!this._consultasPorNPC.has(id)) {
            this._consultasPorNPC.set(id, { consultas: 0, fallbacks: 0 });
        }
        const stats = this._consultasPorNPC.get(id);
        stats.consultas++;

        if (!resultado) {
            stats.fallbacks++;
            this._totalFallbacks++;
        }

        return resultado;
    }

    /**
     * Retorna estatísticas de consulta do Runtime Database
     * 
     * @returns {Object} Estatísticas de consulta
     */
    getConsultaStats() {
        return {
            totalConsultas: this._totalConsultas,
            totalFallbacks: this._totalFallbacks,
            tempoMedioConsultaMs: this._totalConsultas > 0 ? (this._tempoTotalConsultas / this._totalConsultas) : 0,
            tempoTotalConsultasMs: this._tempoTotalConsultas,
            consultasPorNPC: Object.fromEntries(this._consultasPorNPC)
        };
    }

    /**
     * Retorna todos os NPCs compilados
     * 
     * @returns {Object[]} Array de Runtime Objects
     */
    getAllNPCs() {
        return Array.from(this._db.values());
    }

    /**
     * Retorna todos os Runtime NPCs compilados
     * 
     * @returns {Object[]} Array de Runtime NPCs
     */
    getAllRuntimeNPCs() {
        return Array.from(this._runtimeNPCs.values());
    }

    /**
     * Recarrega um NPC específico do disco
     * 
     * @param {string} id - ID do NPC
     * @returns {Object} Resultado do recarregamento
     */
    reloadNPC(id) {
        try {
            const caminho = path.join(DATA_DIR, `${id}.json`);
            if (!fs.existsSync(caminho)) {
                return { sucesso: false, erro: `Arquivo ${id}.json não encontrado.` };
            }

            const dados = JSON.parse(fs.readFileSync(caminho, "utf8"));
            if (!dados.id) {
                return { sucesso: false, erro: `NPC ${id} não possui campo "id".` };
            }

            // Atualizar também no NPCManager (para manter consistência)
            NPCManager.salvarNPC(dados);

            // Compilar e atualizar no Runtime Database
            const runtimeNPC = compileNPC(dados);
            this._runtimeNPCs.set(dados.id, runtimeNPC);
            this._db.set(dados.id, this._criarRuntimeObject(dados, runtimeNPC));
            this._totalRecarregamentos++;

            return { sucesso: true, id: dados.id };
        } catch (erro) {
            console.error(`[RuntimeDB] Erro ao recarregar NPC ${id}:`, erro.message);
            return { sucesso: false, erro: erro.message };
        }
    }

    /**
     * Recarrega todos os NPCs do disco
     * 
     * @returns {Object} Resultado do recarregamento
     */
    reloadAll() {
        const inicio = process.hrtime.bigint();

        try {
            // Recarregar todos do NPCManager (que lê do disco)
            NPCManager.carregarTodosNPCs();

            // Limpar e reconstruir o Runtime Database
            this._db.clear();
            this._runtimeNPCs.clear();
            const npcs = NPCManager.listarNPCs();

            for (const npc of npcs) {
                if (!npc || !npc.id) continue;
                
                const runtimeNPC = compileNPC(npc);
                this._runtimeNPCs.set(npc.id, runtimeNPC);
                this._db.set(npc.id, this._criarRuntimeObject(npc, runtimeNPC));
            }

            const fim = process.hrtime.bigint();
            const tempoMs = Number(fim - inicio) / 1e6;

            this._totalRecarregamentos++;

            console.log(`[RuntimeDB] ${this._db.size} NPCs recarregados (${tempoMs.toFixed(2)} ms)`);

            return {
                sucesso: true,
                quantidade: this._db.size,
                tempoMs: tempoMs
            };
        } catch (erro) {
            console.error("[RuntimeDB] Erro ao recarregar todos:", erro.message);
            return { sucesso: false, erro: erro.message };
        }
    }

    /**
     * Retorna estatísticas do Runtime Database
     * 
     * @returns {Object} Estatísticas completas
     */
    stats() {
        const memoriaAtual = process.memoryUsage().heapUsed;
        const npcs = this.getAllNPCs();
        const runtimeNPCs = this.getAllRuntimeNPCs();
        
        // Calcular tamanho total dos dados
        let totalCaracteres = 0;
        let maiorNPC = null;
        let maiorTamanho = 0;
        let totalPromptBase = 0;
        let maiorPromptBase = 0;
        let maiorPromptNPC = null;

        for (const npc of npcs) {
            const tamanho = JSON.stringify(npc).length;
            totalCaracteres += tamanho;
            if (tamanho > maiorTamanho) {
                maiorTamanho = tamanho;
                maiorNPC = npc.id;
            }
        }

        for (const npc of runtimeNPCs) {
            const tamanhoPrompt = npc.promptBase ? npc.promptBase.length : 0;
            totalPromptBase += tamanhoPrompt;
            if (tamanhoPrompt > maiorPromptBase) {
                maiorPromptBase = tamanhoPrompt;
                maiorPromptNPC = npc.id;
            }
        }

        return {
            inicializado: this._inicializado,
            quantidadeNPCs: this._db.size,
            quantidadeRuntimeNPCs: this._runtimeNPCs.size,
            memoriaUtilizadaBytes: this._memoriaFinal - this._memoriaInicial,
            memoriaUtilizada: this._formatarBytes(this._memoriaFinal - this._memoriaInicial),
            memoriaHeapAtual: this._formatarBytes(memoriaAtual),
            tempoInicializacaoMs: this._tempoInicializacao,
            totalRecarregamentos: this._totalRecarregamentos,
            ultimaInicializacao: this._ultimaInicializacao,
            totalCaracteresDados: totalCaracteres,
            totalPromptBaseCaracteres: totalPromptBase,
            mediaPromptBaseCaracteres: runtimeNPCs.length > 0 ? Math.floor(totalPromptBase / runtimeNPCs.length) : 0,
            maiorNPC: maiorNPC,
            maiorNPCBytes: maiorTamanho,
            maiorPromptBaseNPC: maiorPromptNPC,
            maiorPromptBaseBytes: maiorPromptBase,
            ids: Array.from(this._db.keys())
        };
    }

    /**
     * Compara um NPC original com seu Runtime Object compilado
     * 
     * @param {string} id - ID do NPC
     * @returns {Object|null} Comparação ou null se não encontrado
     */
    compararNPC(id) {
        const npc = NPCManager.carregarNPC(id);
        const runtimeNPC = this.getRuntimeNPC(id);
        
        if (!npc || !runtimeNPC) return null;
        
        return compararNPC(npc, runtimeNPC);
    }

    /**
     * Cria um Runtime Object compilado para um NPC
     * Usa o RuntimeCompiler para gerar o Runtime NPC
     * 
     * @param {Object} npc - Dados brutos do NPC
     * @param {Object} [runtimeNPC] - Runtime NPC já compilado (opcional)
     * @returns {Object} Runtime Object compilado
     */
    _criarRuntimeObject(npc, runtimeNPC = null) {
        const compilado = runtimeNPC || compileNPC(npc);
        
        return {
            id: npc.id,
            nome: npc.nome,
            dadosBrutos: npc,
            runtimeNPC: compilado,
            // Campos de acesso rápido (compilados)
            _compilado: {
                nome: npc.nome,
                titulo: npc.titulo || null,
                papel: npc.papel || null,
                localizacao: npc.localizacao || null,
                classe: npc.classe || null,
                rank: npc.rank || null,
                nivel: npc.nivel || null,
                elemento: npc.elemento || null,
                personalidade: npc.personalidade || null,
                carregadoEm: new Date().toISOString()
            }
        };
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

const runtimeDatabase = new RuntimeDatabase();

module.exports = {
    RuntimeDatabase,
    runtimeDatabase
};