/**
 * CONTEXT MANAGER V2
 *
 * Responsável por reunir todas as informações necessárias antes
 * da IA gerar uma resposta, utilizando cache e busca por relevância.
 *
 * Integrações:
 * - NPCManager (busca NPC)
 * - ConversationManager (busca histórico)
 * - JogadorCore (busca jogador)
 * - MemorySearch (busca memórias relevantes)
 * - EmotionManager (estado emocional)
 * - MoodManager (humor permanente)
 * - RelationshipManager (relacionamento)
 * - CacheManager (cache de dados permanentes)
 */

const NPCManager = require("../npc/npcManager");
const { runtimeDatabase } = require("../runtime/RuntimeDatabase");
const ConversationManager = require("../npc/conversationManager");
const JogadorCore = require("../core/jogadorCore");
const EmotionManager = require("../npc/emotionManager");
const MoodManager = require("../npc/moodManager");
const RelationshipManager = require("../npc/relationshipManager");
const { buscarMemoriasRelevantes } = require("./memorySearch");
const { cacheManager } = require("./cacheManager");
const { PerformanceProfiler } = require("../utils/performanceProfiler");

/**
 * Obtém o contexto completo para a IA gerar uma resposta
 *
 * @param {string} npcId - ID do NPC
 * @param {string} jogadorId - ID do jogador (número do WhatsApp)
 * @param {string} mensagem - Mensagem do jogador
 * @returns {Promise<Object>} Contexto completo
 */
async function obterContexto(npcId, jogadorId, mensagem) {
    const profiler = new PerformanceProfiler();
    
    try {
        // =====================================
        // 1. BUSCAR NPC (RuntimeDatabase primeiro, NPCManager como fallback)
        // =====================================
        profiler.inicio('Busca NPC');
        const chaveNPC = cacheManager.gerarChave('npc', npcId);
        let npc = cacheManager.obter(chaveNPC);
        let promptBaseFromRuntime = null;
        
        if (!npc) {
            // Tentar RuntimeDatabase primeiro
            const runtimeNPC = runtimeDatabase.getRuntimeNPC(npcId);
            
            if (runtimeNPC && runtimeNPC.dadosBrutos) {
                // Usar dados brutos do Runtime Object (compatibilidade total)
                npc = runtimeNPC.dadosBrutos;
                // Capturar promptBase compilado
                promptBaseFromRuntime = runtimeNPC.promptBase || null;
            } else {
                // Fallback para NPCManager
                npc = NPCManager.carregarNPC(npcId);
            }
            
            if (npc) {
                cacheManager.salvar(chaveNPC, npc);
            }
        } else {
            // Se veio do cache, tentar obter promptBase do RuntimeDatabase
            const runtimeNPC = runtimeDatabase.getRuntimeNPC(npcId);
            if (runtimeNPC && runtimeNPC.promptBase) {
                promptBaseFromRuntime = runtimeNPC.promptBase;
            }
        }
        profiler.fim('Busca NPC', {
            'NPC': npc ? npc.nome : 'não encontrado',
            'Cache': npc ? 'hit' : 'miss',
            'Origem': npc ? 'runtime' : 'fallback'
        });

        // =====================================
        // 2. BUSCAR JOGADOR (com cache)
        // =====================================
        profiler.inicio('Busca Jogador');
        const chaveJogador = cacheManager.gerarChave('jogador', jogadorId);
        let jogador = cacheManager.obter(chaveJogador);
        
        if (!jogador) {
            jogador = await JogadorCore.buscarPorNumero(jogadorId);
            if (jogador) {
                cacheManager.salvar(chaveJogador, jogador);
            }
        }
        profiler.fim('Busca Jogador', {
            'Jogador': jogador ? jogador.nome : 'não encontrado',
            'Cache': jogador ? 'hit' : 'miss'
        });

        // =====================================
        // 3. BUSCAR HISTÓRICO DA CONVERSA
        // =====================================
        profiler.inicio('Busca Histórico');
        const historico = ConversationManager.obterHistorico(jogadorId, npcId);
        profiler.fim('Busca Histórico', {
            'Mensagens': historico ? historico.length : 0
        });

        // =====================================
        // 4. BUSCAR MEMÓRIAS RELEVANTES
        // =====================================
        profiler.inicio('Busca Memórias');
        let memorias = [];
        try {
            const memoriasDB = await buscarMemoriasRelevantes(npcId, jogadorId, mensagem, 5);
            memorias = memoriasDB.map(m => ({
                memoria: m.memoria,
                resumo: m.memoria,
                tipo: m.tipo,
                importancia: m.importancia,
                dataCriacao: m.dataCriacao
            }));
        } catch (err) {
            console.error("[CONTEXT_V2] Erro ao buscar memórias:", err.message);
            memorias = [];
        }
        profiler.fim('Busca Memórias', {
            'Memórias': memorias.length
        });

        // =====================================
        // 5. BUSCAR ESTADO EMOCIONAL (com cache)
        // =====================================
        profiler.inicio('Busca Emoção');
        const chaveEmocao = cacheManager.gerarChave('emotion', npcId);
        let estadoEmocional = cacheManager.obter(chaveEmocao);
        
        if (!estadoEmocional) {
            const emocaoDB = await EmotionManager.obterEmocaoNPC(npcId);
            if (emocaoDB) {
                estadoEmocional = {
                    emocao: emocaoDB.emocao,
                    intensidade: emocaoDB.intensidade,
                    motivo: emocaoDB.motivo
                };
                cacheManager.salvar(chaveEmocao, estadoEmocional);
            }
        }
        profiler.fim('Busca Emoção', {
            'Emoção': estadoEmocional ? estadoEmocional.emocao : 'neutro',
            'Cache': estadoEmocional ? 'hit' : 'miss'
        });

        // =====================================
        // 6. BUSCAR MOOD (com cache)
        // =====================================
        profiler.inicio('Busca Mood');
        const chaveMood = cacheManager.gerarChave('mood', npcId);
        let mood = cacheManager.obter(chaveMood);
        
        if (!mood) {
            const moodDB = await MoodManager.obterMood(npcId);
            if (moodDB) {
                mood = {
                    mood: moodDB.mood,
                    intensidade: moodDB.intensidade,
                    motivo: moodDB.motivo
                };
                cacheManager.salvar(chaveMood, mood);
            }
        }
        profiler.fim('Busca Mood', {
            'Mood': mood ? mood.mood : 'sereno',
            'Cache': mood ? 'hit' : 'miss'
        });

        // =====================================
        // 7. BUSCAR RELACIONAMENTO (com cache)
        // =====================================
        profiler.inicio('Busca Relacionamento');
        const chaveRel = cacheManager.gerarChave('relationship', npcId, jogadorId);
        let relacionamento = cacheManager.obter(chaveRel);
        
        if (!relacionamento) {
            relacionamento = await RelationshipManager.obterRelacionamento(npcId, jogadorId);
            if (relacionamento) {
                cacheManager.salvar(chaveRel, relacionamento);
            }
        }
        profiler.fim('Busca Relacionamento', {
            'Confiança': relacionamento ? relacionamento.confianca : 0,
            'Cache': relacionamento ? 'hit' : 'miss'
        });

        // =====================================
        // 8. MONTAR CONTEXTO COMPLETO
        // =====================================
        profiler.inicio('Montar Contexto');
        const contexto = {
            npc: npc,
            jogador: jogador,
            historico: historico,
            memorias: memorias,
            estadoEmocional: estadoEmocional || { emocao: 'calmo', intensidade: 50 },
            mood: mood || { mood: 'sereno', intensidade: 50 },
            relacionamento: relacionamento,
            favorabilidade: relacionamento ? {
                nivel: relacionamento.confianca || 0,
                titulo: relacionamento.confianca > 20 ? 'Confiança sólida' : 
                        relacionamento.confianca > 10 ? 'Confiança crescente' :
                        relacionamento.confianca > 0 ? 'Conhecidos' : 'Desconhecido'
            } : { nivel: 0, titulo: 'Desconhecido' },
            missaoAtual: null,
            mundo: {
                local: npc?.localizacao || null,
                horario: null,
                clima: null
            },
            // promptBase pré-compilado do RuntimeDatabase (se disponível)
            promptBase: promptBaseFromRuntime
        };
        profiler.fim('Montar Contexto', {
            'Tamanho total': JSON.stringify(contexto).length
        });

        profiler.exibirRelatorio();

        return contexto;
    } catch (error) {
        console.error("[CONTEXT_V2] Erro ao obter contexto:", error.message);
        return {
            npc: null,
            jogador: null,
            historico: [],
            memorias: [],
            estadoEmocional: { emocao: 'calmo', intensidade: 50 },
            mood: { mood: 'sereno', intensidade: 50 },
            relacionamento: null,
            favorabilidade: { nivel: 0, titulo: 'Desconhecido' },
            missaoAtual: null,
            mundo: { local: null, horario: null, clima: null }
        };
    }
}

module.exports = {
    obterContexto
};
