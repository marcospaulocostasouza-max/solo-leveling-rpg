/**
 * CONTEXT MANAGER
 *
 * Responsável por reunir todas as informações necessárias antes
 * da IA gerar uma resposta.
 *
 * Este módulo NÃO conversa com o Ollama.
 * Este módulo NÃO monta prompts.
 * Ele apenas coleta os dados necessários para o PromptBuilder.
 *
 * Integrações atuais:
 * - NPCManager (busca NPC)
 * - ConversationManager (busca histórico)
 * - JogadorCore (busca jogador)
 * - MemoryManager (busca memórias de longo prazo)
 *
 * Sistemas futuros (valores padrão por enquanto):
 * - Favorabilidade
 * - Estado emocional
 * - Missão atual
 * - Mundo
 */

const NPCManager = require("../npc/npcManager");
const ConversationManager = require("../npc/conversationManager");
const MemoryManager = require("../npc/memoryManager");
const JogadorCore = require("../core/jogadorCore");
const { PerformanceProfiler } = require("../utils/performanceProfiler");

/**
 * Obtém o contexto completo para a IA gerar uma resposta
 *
 * @param {string} npcId - ID do NPC
 * @param {string} jogadorId - ID do jogador (número do WhatsApp)
 * @returns {Promise<Object>} Contexto completo
 */
async function obterContexto(npcId, jogadorId) {
    const profiler = new PerformanceProfiler();
    
    try {
        // =====================================
        // 1. BUSCAR NPC
        // =====================================
        profiler.inicio('Busca NPC');
        const npc = NPCManager.carregarNPC(npcId);
        profiler.fim('Busca NPC', {
            'NPC': npc ? npc.nome : 'não encontrado',
            'Tamanho JSON': npc ? JSON.stringify(npc).length : 0
        });

        // =====================================
        // 2. BUSCAR JOGADOR
        // =====================================
        profiler.inicio('Busca Jogador');
        const jogador = await JogadorCore.buscarPorNumero(jogadorId);
        profiler.fim('Busca Jogador', {
            'Jogador': jogador ? jogador.nome : 'não encontrado'
        });

        // =====================================
        // 3. BUSCAR HISTÓRICO DA CONVERSA
        // =====================================
        profiler.inicio('Busca Histórico');
        const historico = ConversationManager.obterHistorico(jogadorId, npcId);
        profiler.fim('Busca Histórico', {
            'Mensagens': historico ? historico.length : 0,
            'Caracteres': historico ? JSON.stringify(historico).length : 0
        });

        // =====================================
        // 4. BUSCAR MEMÓRIAS DE LONGO PRAZO
        // =====================================
        profiler.inicio('Busca Memórias');
        let memorias = [];
        try {
            const memoriasDB = await MemoryManager.buscarMemorias(npcId, jogadorId, 5);
            // Converter formato do banco para formato esperado pelo PromptBuilder
            memorias = memoriasDB.map(m => ({
                resumo: m.memoria,
                tipo: m.tipo,
                importancia: m.importancia,
                dataCriacao: m.dataCriacao
            }));
        } catch (err) {
            console.error("[CONTEXT] Erro ao buscar memórias:", err.message);
            memorias = [];
        }
        profiler.fim('Busca Memórias', {
            'Memórias': memorias.length,
            'Caracteres': JSON.stringify(memorias).length
        });

        // =====================================
        // 5. MONTAR CONTEXTO COMPLETO
        // =====================================
        profiler.inicio('Montar Contexto');
        const contexto = {
            // NPC encontrado (ou null se não existir)
            npc: npc,

            // Jogador encontrado (ou null se não existir)
            jogador: jogador,

            // Histórico da conversa entre jogador e NPC
            historico: historico,

            // Memórias de longo prazo do NPC sobre o jogador
            memorias: memorias,

            // =====================================
            // SISTEMAS FUTUROS (valores padrão)
            // =====================================

            // Nível de favorabilidade do NPC com o jogador
            // TODO: Conectar com sistema de favorabilidade
            favorabilidade: {
                nivel: 0,
                titulo: "Desconhecido"
            },

            // Estado emocional atual do NPC
            // TODO: Conectar com sistema de emoções
            estadoEmocional: {
                humor: "Neutro"
            },

            // Missão atual do jogador com este NPC
            // TODO: Conectar com sistema de missões
            missaoAtual: null,

            // Informações do mundo (local, horário, clima)
            // TODO: Conectar com sistema de mundo
            mundo: {
                local: null,
                horario: null,
                clima: null
            }
        };
        profiler.fim('Montar Contexto', {
            'Tamanho total': JSON.stringify(contexto).length
        });

        // Exibir relatório de performance do ContextManager
        profiler.exibirRelatorio();

        return contexto;
    } catch (error) {
        console.error("[CONTEXT] Erro ao obter contexto:", error.message);

        // Retornar contexto mínimo em caso de erro
        return {
            npc: null,
            jogador: null,
            historico: [],
            memorias: [],
            favorabilidade: {
                nivel: 0,
                titulo: "Desconhecido"
            },
            estadoEmocional: {
                humor: "Neutro"
            },
            missaoAtual: null,
            mundo: {
                local: null,
                horario: null,
                clima: null
            }
        };
    }
}

module.exports = {
    obterContexto
};