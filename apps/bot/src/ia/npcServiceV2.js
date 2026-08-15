/**
 * NPC SERVICE V2 - ARQUITETURA HÍBRIDA
 *
 * Fluxo de execução:
 *
 * Mensagem do jogador
 *         │
 *         ▼
 * Intent Analyzer
 *         │
 *         ▼
 * Context Manager
 *         │
 *         ▼
 * Executar em paralelo (Promise.all):
 *   • Emotion Engine
 *   • Relationship Engine
 *   • Mood Engine
 *   • Mission Engine
 *   • Context Optimizer
 *         │
 *         ▼
 * Prompt Builder
 *         │
 *         ▼
 * LLM
 *         │
 *         ▼
 * Salvar memória em background
 *
 * Nenhum módulo independente espera outro terminar.
 */

const { obterContexto } = require("./contextManagerV2");
const { construirPrompt } = require("./promptBuilderV2");
const { ollamaService } = require("./ollamaService");
const { MODEL_CONFIG } = require("./modelConfig");
const ConversationManager = require("../npc/conversationManager");
const { formatarMensagem } = require("../utils/messageFormatter");
const { PerformanceProfiler } = require("../utils/performanceProfiler");
const { cacheManager } = require("./cacheManager");
const { carregarContextoOphilia, montarContextoParaCena } = require("./ophiliaContextCache");

// =====================================
// MÓDULOS DE ANÁLISE
// =====================================
const { intentAnalyzer } = require("./intentAnalyzer");
const { complexityAnalyzer } = require("./complexityAnalyzer");
const { thinkingDecisionEngine } = require("./thinkingDecisionEngine");
const { thinkingPerformanceLogger } = require("./thinkingPerformanceLogger");

// =====================================
// ENGINES (executados em background)
// =====================================
const EmotionEngine = require("./emotionEngine");
const RelationshipEngine = require("./relationshipEngine");
const MoodEngine = require("./moodEngine");
const MissionEngine = require("./missionEngine");
const MemoryEngine = require("./memoryEngine");

// =====================================
// MANAGERS (persistência)
// =====================================
const EmotionManager = require("../npc/emotionManager");
const MoodManager = require("../npc/moodManager");
const RelationshipManager = require("../npc/relationshipManager");
const MemoryManager = require("../npc/memoryManager");

/**
 * Executa os engines em background
 *
 * IMPORTANTE: Os engines Emotion, Relationship e Mood fazem chamadas
 * ao Ollama para ANALISAR e ATUALIZAR estado. Essas atualizações são
 * para PRÓXIMAS conversas, não para a resposta atual.
 *
 * Portanto, executamos em background sem bloquear a resposta.
 *
 * @param {Object} contexto - Contexto completo
 * @param {string} mensagem - Mensagem do jogador
 * @param {string} npcId - ID do NPC
 * @param {string} jogadorId - ID do jogador
 */
function executarEnginesBackground(contexto, mensagem, npcId, jogadorId) {
    const { npc, jogador, historico, memorias, estadoEmocional, mood, relacionamento } = contexto;

    // Executar todos os engines em paralelo (sem await - background)
    Promise.all([
        // Emotion Engine
        EmotionEngine.analisarConversa(
            npc, jogador, historico, memorias, relacionamento, estadoEmocional, mensagem
        ).then(async resultado => {
            if (resultado && resultado.emocao) {
                await EmotionManager.salvarEmocao(npcId, jogadorId, resultado);
                cacheManager.remover(cacheManager.gerarChave('emotion', npcId, jogadorId));
                console.log(`[NPC_V2] Emoção atualizada: ${resultado.emocao}`);
            }
        }).catch(err => {
            console.error("[NPC_V2] Erro EmotionEngine:", err.message);
        }),

        // Mood Engine
        MoodEngine.analisarMood(
            npc, jogador, mood, estadoEmocional, memorias, relacionamento, historico, null
        ).then(async resultado => {
            if (resultado && resultado.mudou) {
                await MoodManager.salvarMood(npcId, resultado);
                cacheManager.remover(cacheManager.gerarChave('mood', npcId));
                console.log(`[NPC_V2] Mood atualizado: ${resultado.mood}`);
            }
        }).catch(err => {
            console.error("[NPC_V2] Erro MoodEngine:", err.message);
        }),

        // Mission Engine
        MissionEngine.avaliarMissoes({
            npc, jogador, relacionamento, mood, estadoEmocional, memorias, historico
        }).then(resultado => {
            if (resultado && resultado.oferecerMissao) {
                console.log(`[NPC_V2] Missão disponível: ${resultado.missaoNome}`);
            }
        }).catch(err => {
            console.error("[NPC_V2] Erro MissionEngine:", err.message);
        })
    ]);
}

/**
 * Salva memórias em background (extração + persistência)
 *
 * @param {Object} contexto - Contexto completo
 * @param {string} mensagem - Mensagem do jogador
 * @param {string} resposta - Resposta do NPC
 * @param {string} npcId - ID do NPC
 * @param {string} jogadorId - ID do jogador
 */
async function salvarMemoriasBackground(contexto, mensagem, resposta, npcId, jogadorId) {
    try {
        const { npc, jogador, historico } = contexto;

        // Extrair memórias da conversa
        const novasMemorias = await MemoryEngine.analisarConversa(npc, jogador, historico);

        // Salvar cada memória
        for (const memoria of novasMemorias) {
            await MemoryManager.salvarMemoria(
                npcId, jogadorId, memoria.memoria, memoria.tipo, memoria.importancia
            );
        }

        console.log(`[NPC_V2] ${novasMemorias.length} memórias salvas em background`);
    } catch (error) {
        console.error("[NPC_V2] Erro ao salvar memórias em background:", error.message);
    }
}

/**
 * Conduz uma conversa com um NPC
 *
 * @param {string} npcId - ID do NPC
 * @param {string} jogadorId - ID do jogador (número do WhatsApp)
 * @param {string} mensagem - Mensagem do jogador
 * @returns {Promise<string>} Resposta do NPC
 */
async function conversarComNPC(npcId, jogadorId, mensagem) {
    const profiler = new PerformanceProfiler();
    const tempoInicioTotal = Date.now();
    
    try {
        profiler.inicioTotal();
        let decisaoThinking;

        // =====================================
        // 1. ANALISAR INTENÇÃO
        // =====================================
        profiler.inicio('Intent Analyzer');
        const analiseIntencao = intentAnalyzer.analisar(mensagem);
        profiler.fim('Intent Analyzer', {
            'Intenção': analiseIntencao.categoria,
            'Confiança': `${analiseIntencao.confianca}%`
        });

        // =====================================
        // 2. BUSCAR CONTEXTO COMPLETO
        // =====================================
        profiler.inicio('Context Manager');
        const contexto = await obterContexto(npcId, jogadorId, mensagem);
        if (npcId === 'ophilia') {
            const contextoOphilia = carregarContextoOphilia();
            const contextoDaCena = montarContextoParaCena(contextoOphilia, mensagem);
            contexto.ophiliaContextoOficial = contextoDaCena.contexto;
            profiler.dados['Ophilia Context'] = {
                'Arquivos': contextoOphilia.arquivos.length,
                'Caracteres em cache': contextoOphilia.contexto.length,
                'Caracteres enviados': contextoDaCena.contexto.length,
                'Exemplos selecionados': contextoDaCena.exemplosSelecionados,
                'Cena atual (caracteres)': mensagem.length
            };
        }
        profiler.fim('Context Manager', {
            'NPC': contexto.npc ? contexto.npc.nome : 'não encontrado',
            'Histórico': contexto.historico ? contexto.historico.length : 0,
            'Memórias': contexto.memorias ? contexto.memorias.length : 0
        });

        // =====================================
        // 3. ANALISAR COMPLEXIDADE
        // =====================================
        profiler.inicio('Complexity Analyzer');
        const analiseComplexidade = complexityAnalyzer.analisar(mensagem, {
            historico: contexto.historico
        });
        profiler.fim('Complexity Analyzer', {
            'Complexidade': `${analiseComplexidade.pontuacao}/100 (${analiseComplexidade.classificacao})`
        });

        // =====================================
        // 4. DECIDIR MODO THINKING (adaptativo)
        // =====================================
        profiler.inicio('Thinking Decision');
        decisaoThinking = thinkingDecisionEngine.decidir({
            mensagem: mensagem,
            analiseIntencao: analiseIntencao,
            analiseComplexidade: analiseComplexidade,
            jogadorId: jogadorId,
            npcId: npcId,
            historico: contexto.historico
        });
        // Durante o teste controlado (OLLAMA_THINKING=false), a Ophilia também
        // usa think=false. Para reativar o thinking, basta mudar OLLAMA_THINKING
        // para true no modelConfig.js.
        if (npcId === 'ophilia') {
            decisaoThinking = {
                ...decisaoThinking,
                thinking: false,
                motivo: 'Teste controlado: Qwen3 sem Thinking ativo (OLLAMA_THINKING=false)',
                modo: 'rapido'
            };
        }
        profiler.fim('Thinking Decision', {
            'Thinking': decisaoThinking.thinking ? 'true' : 'false',
            'Motivo': decisaoThinking.motivo
        });

        // =====================================
        // 5. EXECUTAR ENGINES EM BACKGROUND
        // =====================================
        // Os engines Emotion, Relationship e Mood fazem chamadas ao Ollama
        // para ATUALIZAR estado para PRÓXIMAS conversas.
        // Executamos em background SEM bloquear a resposta atual.
        profiler.inicio('Engines Background (init)');
        if (npcId !== 'ophilia') {
            executarEnginesBackground(contexto, mensagem, npcId, jogadorId);
        }
        profiler.fim('Engines Background (init)', {
            'Status': npcId === 'ophilia'
                ? 'desativado no teste controlado da Ophilia'
                : 'iniciado em background'
        });

        // =====================================
        // 6. CONSTRUIR PROMPT
        // =====================================
        profiler.inicio('Prompt Builder');
        const promptResultado = construirPrompt(contexto, mensagem);
        const prompt = promptResultado.prompt;
        const metricasPrompt = promptResultado.metricas || {};
        profiler.fim('Prompt Builder', {
            'Caracteres': prompt.length,
            'Tokens estimados': Math.floor(prompt.length / 4),
            'Partes': Object.keys(metricasPrompt).length
        });

        profiler.dados['PromptParts'] = metricasPrompt;

        // Salvar prompt em modo DEBUG
        profiler.salvarPromptDebug(prompt, {
            npcId: npcId,
            jogadorId: jogadorId,
            thinking: decisaoThinking.thinking
        });

        // =====================================
        // 7. ENVIAR PARA OLLAMA
        // =====================================
        profiler.inicio('LLM');
        // num_predict dinâmico: calculado em construirPrompt() a partir do
        // tamanho da mensagem (curta/média/longa), em vez do teto fixo de
        // MODEL_CONFIG.num_predict. Cai no valor fixo apenas se, por algum
        // motivo, a métrica não vier no resultado do prompt.
        const numPredictDinamico = metricasPrompt._numPredictSugerido ?? MODEL_CONFIG.num_predict;
        const resultadoIA = await ollamaService.gerarResposta(prompt, {
            thinking: decisaoThinking.thinking,
            num_predict: numPredictDinamico
        });
        
        const metricasOllama = resultadoIA.metricas || {};
        profiler.fim('LLM', {
            'Modelo': MODEL_CONFIG.model,
            'Thinking': decisaoThinking.thinking ? 'true' : 'false',
            'num_predict': numPredictDinamico,
            'TTFT': metricasOllama.tempoTTFT || 0,
            'Tempo de geração': metricasOllama.tempoGeracao || 0,
            'Tokens gerados': metricasOllama.tokens || 0,
            'Velocidade': metricasOllama.velocidade ? `${metricasOllama.velocidade} tok/s` : '0 tok/s'
        });
        
        const resposta = resultadoIA.texto;

        if (!resposta) {
            profiler.fimTotal();
            profiler.exibirRelatorio();
            return "Não consegui responder no momento.";
        }

        // =====================================
        // 8. SALVAR MENSAGENS NO HISTÓRICO
        // =====================================
        profiler.inicio('Conversation Manager');
        ConversationManager.adicionarMensagem(jogadorId, npcId, "jogador", mensagem);
        ConversationManager.adicionarMensagem(jogadorId, npcId, "npc", resposta);
        profiler.fim('Conversation Manager');

        // =====================================
        // 9. FORMATAR RESPOSTA
        // =====================================
        profiler.inicio('Message Formatter');
        const respostaFormatada = formatarMensagem(contexto.npc, resposta);
        profiler.fim('Message Formatter', {
            'Tamanho': respostaFormatada.length
        });

        profiler.fimTotal();
        profiler.exibirRelatorio();

        // =====================================
        // 10. SALVAR MEMÓRIAS EM BACKGROUND
        // =====================================
        // Não bloqueia a resposta - executa em background
        if (npcId !== 'ophilia') {
            salvarMemoriasBackground(contexto, mensagem, resposta, npcId, jogadorId);
        }

        // =====================================
        // 11. REGISTRAR LOG DE PERFORMANCE
        // =====================================
        thinkingPerformanceLogger.registrar({
            jogadorId: jogadorId,
            npcId: npcId,
            categoria: analiseIntencao.categoria,
            complexidade: analiseComplexidade.pontuacao,
            classificacao: analiseComplexidade.classificacao,
            thinking: decisaoThinking.thinking,
            motivo: decisaoThinking.motivo,
            tempoDecisao: decisaoThinking.tempoDecisao,
            tempoOllama: resultadoIA.metricas?.tempo || 0,
            tempoTotal: Date.now() - tempoInicioTotal,
            pontuacao: decisaoThinking.pontuacao
        });

        return respostaFormatada;

    } catch (error) {
        console.error("[NPC_SERVICE_V2] Erro ao conversar com NPC:", error.message);
        profiler.fimTotal();
        profiler.exibirRelatorio();
        return "Ocorreu um erro durante a conversa. Tente novamente.";
    }
}

module.exports = {
    conversarComNPC
};
