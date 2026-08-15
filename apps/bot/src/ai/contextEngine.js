const NPCDatabase = require('./npcDatabase');
const { retrieve: retrieveNPC } = require('./retrievalEngine');
const Memory = require('./memoryEngine');
const JogadorCore = require('../core/jogadorCore');
const EmotionManager = require('../npc/emotionManager');
const MoodManager = require('../npc/moodManager');
const RelationshipManager = require('../npc/relationshipManager');

async function build({ npcId, playerId, message }) {
  const started = Date.now();
  const loaded = NPCDatabase.getNPC(npcId);
  if (!loaded.profile) throw new Error(`NPC source not found: ${npcId}`);
  const id = loaded.profile.id;
  const [player, emotion, mood, relationship, memories] = await Promise.all([
    JogadorCore.buscarPorNumero(playerId), EmotionManager.obterEmocao(id, playerId), MoodManager.obterMood(id),
    RelationshipManager.obterRelacionamento(id, playerId), Memory.retrieve(id, playerId, message)
  ]);
  const retrieved = retrieveNPC(loaded.profile, message, 5);
  return {
    npc: loaded.profile, player, message, memories, retrieved, recent: Memory.getRecent(id, playerId),
    state: { emotion: emotion || { emocao: 'calma', intensidade: 50 }, mood: mood || { mood: 'sereno', intensidade: 50 } },
    relationship: relationship || { vinculo: 0, hostilidade: 0 },
    metrics: { npcCache: loaded.cacheHit ? 'hit' : 'miss', contextMs: Date.now() - started, sourceFiles: loaded.profile.files.map(file => file.replace(process.cwd() + require('path').sep, '')) }
  };
}
module.exports = { build };
