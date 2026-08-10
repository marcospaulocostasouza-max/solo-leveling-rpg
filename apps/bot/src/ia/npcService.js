/**
 * NPC SERVICE
 *
 * Camada de serviço que orquestra o fluxo completo de conversa com NPC.
 *
 * Fluxo inteligente de análise:
 *
 * Mensagem do Jogador
 *         │
 *         ▼
 * ContextManager
 *         │
 *         ▼
 * RelationshipEngine
 *         │
 *         ▼
 * EmotionEngine
 *         │
 *         ▼
 * Intent Analyzer (NOVO)
 *         │
 *         ▼
 * Complexity Analyzer (NOVO)
 *         │
 *         ▼
 * Thinking Decision Engine (NOVO)
 *         │
 *         ▼
 * PromptBuilder
 *         │
 *         ▼
 * Ollama (think=true ou think=false)
 *
 * Este módulo coordena todos os outros módulos sem duplicar lógica.
 */

const { obterContexto } = require("./contextManager");
const { otimizarContexto } = require("./contextOptimizer");
const { construirPrompt } = require("./promptBuilder");
const { ollamaService } = require("./ollamaService");
const { MODEL_CONFIG } = require("./modelConfig");
const ConversationManager = require("../npc/conversationManager");
const { formatarMensagem } = require("../utils/messageFormatter");
const { PerformanceProfiler } = require("../utils/performanceProfiler");

// =====================================
// NOVOS MÓDULOS DE THINKING DINÂMICO
// =====================================
const { intentAnalyzer } = require("./intentAnalyzer");
const { complexityAnalyzer } = require("./complexityAnalyzer");
const { thinkingDecisionEngine } = require("./thinkingDecisionEngine");
const { thinkingPerformanceLogger } = require("./thinkingPerformanceLogger");

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
        // 1. RECEBIMENTO DA MENSAGEM
        // =====================================
        profiler.inicio('Recebimento da Mensagem');
        // A mensagem já foi recebida pelo npcConversa.js
        // Aqui apenas registramos o início do processamento
        profiler.fim('Recebimento da Mensagem', {
            'Tamanho': mensagem.length,
            'Caracteres': mensagem.length
        });

        // =====================================
        // 2. BUSCAR CONTEXTO COMPLETO
        // =====================================
        profiler.inicio('ContextManager');
        const contexto = await obterContexto(npcId, jogadorId);
        profiler.fim('ContextManager', {
            'NPC': contexto.npc ? contexto.npc.nome : 'não encontrado',
            'Histórico': contexto.historico ? contexto.historico.length : 0,
            'Memórias': contexto.memorias ? contexto.memorias.length : 0
        });

        // =====================================
        // 3. OTIMIZAR CONTEXTO
        // =====================================
        profiler.inicio('ContextOptimizer');
        const contextoOtimizado = otimizarContexto(contexto, mensagem);
        profiler.fim('ContextOptimizer', {
            'Tamanho antes': JSON.stringify(contexto).length,
            'Tamanho depois': JSON.stringify(contextoOtimizado).length
        });

        // =====================================
        // 4. ANALISAR INTENÇÃO (NOVO)
        // =====================================
        profiler.inicio('IntentAnalyzer');
        const analiseIntencao = intentAnalyzer.analisar(mensagem);
        profiler.fim('IntentAnalyzer', {
            'Intenção': analiseIntencao.categoria,
            'Confiança': `${analiseIntencao.confianca}%`
        });

        // =====================================
        // 5. ANALISAR COMPLEXIDADE (NOVO)
        // =====================================
        profiler.inicio('ComplexityAnalyzer');
        const analiseComplexidade = complexityAnalyzer.analisar(mensagem, {
            historico: contextoOtimizado.historico
        });
        profiler.fim('ComplexityAnalyzer', {
            'Complexidade': `${analiseComplexidade.pontuacao}/100 (${analiseComplexidade.classificacao})`
        });

        // =====================================
        // 6. DECIDIR MODO THINKING (NOVO)
        // =====================================
        profiler.inicio('ThinkingDecision');
        decisaoThinking = thinkingDecisionEngine.decidir({
            mensagem: mensagem,
            analiseIntencao: analiseIntencao,
            analiseComplexidade: analiseComplexidade,
            jogadorId: jogadorId,
            npcId: npcId,
            historico: contextoOtimizado.historico
        });
        profiler.fim('ThinkingDecision', {
            'Thinking': decisaoThinking.thinking ? 'true' : 'false',
            'Motivo': decisaoThinking.motivo
        });

        // =====================================
        // 7. CONSTRUIR PROMPT
        // =====================================
        profiler.inicio('PromptBuilder');
        const promptResultado = construirPrompt(contextoOtimizado, mensagem);
        const prompt = promptResultado.prompt;
        
        // Extrair métricas das partes do prompt
        const metricasPrompt = promptResultado.metricas || {};
        profiler.fim('PromptBuilder', {
            'Caracteres': prompt.length,
            'Tokens estimados': Math.floor(prompt.length / 4),
            'Partes': Object.keys(metricasPrompt).length
        });

        // Registrar tamanho de cada parte do prompt
        profiler.dados['PromptParts'] = metricasPrompt;

        // Salvar prompt completo em modo DEBUG
        profiler.salvarPromptDebug(prompt, {
            npcId: npcId,
            jogadorId: jogadorId,
            thinking: decisaoThinking.thinking
        });

        // =====================================
        // 8. ENVIAR PARA OLLAMA (COM THINKING)
        // =====================================
        profiler.inicio('Ollama');
        const resultadoIA = await ollamaService.gerarResposta(prompt, {
            thinking: decisaoThinking.thinking
        });
        
        const metricasOllama = resultadoIA.metricas || {};
        profiler.fim('Ollama', {
            'Modelo': MODEL_CONFIG.model,
            'Thinking': decisaoThinking.thinking ? 'true' : 'false',
            'TTFT': metricasOllama.tempoTTFT || 0,
            'Tempo de geração': metricasOllama.tempoGeracao || 0,
            'Tokens gerados': metricasOllama.tokens || 0,
            'Velocidade': metricasOllama.velocidade ? `${metricasOllama.velocidade} tok/s` : '0 tok/s',
            'Prompt chars': prompt.length,
            'Prompt tokens': Math.floor(prompt.length / 4)
        });
        
        const resposta = resultadoIA.texto;

        if (!resposta) {
            profiler.fimTotal();
            profiler.exibirRelatorio();

            // Registrar log de performance
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

            return "Não consegui responder no momento.";
        }

        // =====================================
        // 9. SALVAR MENSAGENS NO HISTÓRICO
        // =====================================
        profiler.inicio('ConversationManager');
        ConversationManager.adicionarMensagem(jogadorId, npcId, "jogador", mensagem);
        ConversationManager.adicionarMensagem(jogadorId, npcId, "npc", resposta);
        profiler.fim('ConversationManager');

        // =====================================
        // 10. FORMATAR RESPOSTA COM MOLDURA
        // =====================================
        profiler.inicio('MessageFormatter');
        const respostaFormatada = formatarMensagem(contexto.npc, resposta);
        profiler.fim('MessageFormatter', {
            'Tamanho': respostaFormatada.length
        });

        // =====================================
        // 11. ENVIAR PARA WHATSAPP
        // =====================================
        profiler.inicio('WhatsApp');
        // O envio real para WhatsApp é feito pelo npcConversa.js
        // Aqui apenas marcamos o tempo da formatação final
        profiler.fim('WhatsApp', {
            'Tamanho da resposta': `${respostaFormatada.length} caracteres`
        });

        profiler.fimTotal();
        
        // Exibir relatório de desempenho
        profiler.exibirRelatorio();

        // =====================================
        // 12. REGISTRAR LOG DE PERFORMANCE (NOVO)
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
        console.error("[NPC_SERVICE] Erro ao conversar com NPC:", error.message);
        profiler.fimTotal();
        profiler.exibirRelatorio();
        return "Ocorreu um erro durante a conversa. Tente novamente.";
    }
}

module.exports = {
    conversarComNPC
};