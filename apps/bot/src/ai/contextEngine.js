const NPCDatabase = require('./npcDatabase');
const { retrieve: retrieveNPC } = require('./retrievalEngine');
const Memory = require('./memoryEngine');
const JogadorCore = require('../core/jogadorCore');
const EmotionManager = require('../npc/emotionManager');
const MoodManager = require('../npc/moodManager');
const RelationshipManager = require('../npc/relationshipManager');
const ConversationManager = require('../npc/conversationManager');
const { textoVisivelParaContexto } = require('../npc/sceneParser');

function historicoCanonico(npcId, playerId) {
  const conversa = ConversationManager.obterHistorico(playerId, npcId);
  if (conversa.length) {
    return conversa.map(item => ({
      role: item.papel === 'jogador' ? 'player' : 'npc',
      content: item.conteudo
    }));
  }
  return Memory.getRecent(npcId, playerId);
}

async function build({ npcId, playerId, message }) {
  const started = Date.now();
  const loaded = NPCDatabase.getNPC(npcId);
  if (!loaded.profile) throw new Error(`NPC source not found: ${npcId}`);
  const id = loaded.profile.id;
  const mensagemVisivel = textoVisivelParaContexto(message);
  const [player, emotion, mood, relationship, memories] = await Promise.all([
    JogadorCore.buscarPorNumero(playerId), EmotionManager.obterEmocao(id, playerId), MoodManager.obterMood(id),
    RelationshipManager.obterRelacionamento(npcId, playerId), Memory.retrieve(id, playerId, mensagemVisivel)
  ]);
  const retrieved = retrieveNPC(loaded.profile, mensagemVisivel, 5);
  let quests = [];
  if (player) {
    try {
      quests = (await require('../systems/questSystem').listarMissoes(player.id))
        .filter(m => NPCDatabase.canonicalId(m.npc_id) === id)
        .map(m => ({ nome: m.nome, descricao: m.descricao, objetivo: m.objetivo_texto, rank: m.rank, status: m.status }));
    } catch (error) {
      // Uma migração pendente não pode impedir uma conversa com o NPC.
      console.error('[QUEST] Contexto de missões indisponível:', error.message);
    }
  }
  return {
    npc: loaded.profile, player, quests, message, messageVisible: mensagemVisivel, memories, retrieved, recent: historicoCanonico(id, playerId),
    state: { emotion: emotion || { emocao: 'calma', intensidade: 50 }, mood: mood || { mood: 'sereno', intensidade: 50 } },
    relationship: relationship || { vinculo: 0, hostilidade: 0 },
    metrics: { npcCache: loaded.cacheHit ? 'hit' : 'miss', contextMs: Date.now() - started, sourceFiles: loaded.profile.files.map(file => file.replace(process.cwd() + require('path').sep, '')) }
  };
}
module.exports = { build };
