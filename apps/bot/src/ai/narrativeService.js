const ContextEngine = require('./contextEngine');
const NarrativeCore = require('./narrativeCore');
const Memory = require('./memoryEngine');
const Metrics = require('./metrics');
const { ollamaService } = require('../ia/ollamaService');
const { MODEL_CONFIG } = require('../ia/modelConfig');

// Engines de estado reaproveitados do fluxo antigo (npcServiceV2). A pipeline
// nova não os chamava ainda, então emoção/relacionamento/mood ficavam
// congelados para qualquer NPC migrado para cá.
const EmotionEngine = require('../ia/emotionEngine');
const RelationshipEngine = require('../ia/relationshipEngine');
const MoodEngine = require('../ia/moodEngine');
const EmotionManager = require('../npc/emotionManager');
const MoodManager = require('../npc/moodManager');
const RelationshipManager = require('../npc/relationshipManager');

// Os engines de estado esperam histórico no formato {papel, conteudo}
// (jogador/npc). A pipeline nova guarda o histórico como {role, content}
// (player/npc). Este adaptador converte um formato no outro.
function historicoParaEngines(recent) {
  return (recent || []).map(item => ({
    papel: item.role === 'player' ? 'jogador' : 'npc',
    conteudo: item.content
  }));
}

// Os engines de estado esperam um NPC no formato antigo (JSON com
// nome/personalidade/historia). O profile novo (dataset .md) usa
// name/sections.personality/sections.history. Este adaptador converte.
function npcParaEngines(profile) {
  return {
    nome: profile.name,
    personalidade: profile.sections?.personality || '',
    historia: profile.sections?.history || ''
  };
}

// Atualiza emoção, relacionamento e mood em background, sem bloquear a
// resposta ao jogador. Mesmo comportamento que existia em npcServiceV2,
// adaptado para o formato de contexto da pipeline nova.
function atualizarEstadoBackground(context, playerId, message) {
  const npcParaEngine = npcParaEngines(context.npc);
  const historico = historicoParaEngines(context.recent);
  const npcId = context.npc.id;

  Promise.all([
    EmotionEngine.analisarConversa(
      npcParaEngine, context.player, historico, context.memories,
      context.relationship, context.state.emotion, message
    ).then(async resultado => {
      if (resultado && resultado.emocao) {
        await EmotionManager.definirEmocaoNPC(npcId, resultado);
        console.log(`[NARRATIVE] Emoção atualizada: ${resultado.emocao}`);
      }
    }).catch(erro => console.error('[NARRATIVE] Erro EmotionEngine:', erro.message)),

    MoodEngine.analisarMood(
      npcParaEngine, context.player, context.state.mood, context.state.emotion,
      context.memories, context.relationship, historico, null
    ).then(async resultado => {
      if (resultado && resultado.mudou) {
        await MoodManager.salvarMood(npcId, resultado);
        console.log(`[NARRATIVE] Mood atualizado: ${resultado.mood}`);
      }
    }).catch(erro => console.error('[NARRATIVE] Erro MoodEngine:', erro.message))
  ]);
}

async function converse(npcId, playerId, message) {
  const started = Date.now();
  const context = await ContextEngine.build({ npcId, playerId, message });
  const retrievalMs = Date.now() - started - context.metrics.contextMs;
  const promptStarted = Date.now();
  const prompt = NarrativeCore.build(context);
  const promptMs = Date.now() - promptStarted;
  const pipelineMs = Date.now() - started;
  const result = await ollamaService.gerarResposta(prompt.prompt, { num_ctx: MODEL_CONFIG.num_ctx, num_predict: 900 });
  const thinkingUsado = result.metricas?.thinking ?? false;
  const response = result.texto || 'Não consegui continuar a cena neste momento.';
  Memory.addRecent(context.npc.id, playerId, 'player', message);
  Memory.addRecent(context.npc.id, playerId, 'npc', response);
  Memory.captureExplicit(context.npc.id, playerId, message).catch(error => console.error('[AI] Memory persistence:', error.message));
  atualizarEstadoBackground(context, playerId, message);
  Metrics.report({ npcId: context.npc.id, context, prompt, retrievalMs, promptMs, pipelineMs, qwenMs: result.metricas?.tempo || 0, totalMs: Date.now() - started, outputTokens: result.metricas?.tokens || 0, thinking: thinkingUsado });
  return response;
}
module.exports = { converse };
