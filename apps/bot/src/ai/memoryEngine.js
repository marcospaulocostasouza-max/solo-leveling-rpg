/** Persistent memory + bounded temporary conversation context. */
const MemoryManager = require('../npc/memoryManager');
const { analisarCena, textoObservavelParaAnalise } = require('../npc/sceneParser');
const recent = new Map();
const MAX_RECENT = 6;
function key(npcId, playerId) { return `${npcId}:${playerId}`; }
function addRecent(npcId, playerId, role, content) {
  const messages = recent.get(key(npcId, playerId)) || [];
  messages.push({ role, content: String(content).slice(0, 1200) });
  recent.set(key(npcId, playerId), messages.slice(-MAX_RECENT));
}
function getRecent(npcId, playerId) { return recent.get(key(npcId, playerId)) || []; }
function words(text) { return new Set((String(text).toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) || [])); }
async function retrieve(npcId, playerId, message, limit = 4) {
  const all = await MemoryManager.buscarMemorias(npcId, playerId);
  const query = words(message);
  const ranked = all.map(memory => ({ memory, score: Number(memory.importancia || 0) * 2 + [...words(memory.memoria)].filter(word => query.has(word)).length * 5 }))
    .sort((a, b) => b.score - a.score).slice(0, limit).map(item => item.memory);
  Promise.all(ranked.map(item => MemoryManager.registrarLembranca(item.id))).catch(() => {});
  return ranked;
}
// Saving is deterministic and opt-in: explicit promises, secrets, facts and requests to remember.
async function captureExplicit(npcId, playerId, message) {
  const text = textoObservavelParaAnalise(message);
  const explicit = /\b(lembre|memorize|prometo|promessa|segredo|nunca conte|meu nome é|me chamo|eu sou)\b/i.test(text);
  if (!explicit || text.length < 12) return null;
  const type = /segredo|nunca conte/i.test(text) ? 'segredo' : /prometo|promessa/i.test(text) ? 'promessa' : 'fato';
  return MemoryManager.salvarMemoria(npcId, playerId, text.slice(0, 900), type, type === 'segredo' || type === 'promessa' ? 9 : 7);
}

// Registra o que o NPC efetivamente percebeu ao fim da cena. Pensamentos
// privados nunca entram nesta memoria nem influenciam encontros futuros.
async function captureScene(npcId, playerId, historico) {
  const eventos = (historico || [])
    .filter(item => item && (item.papel === 'jogador' || item.role === 'player'))
    .flatMap(item => {
      const cena = analisarCena(item.conteudo || item.content);
      const partes = [];
      if (cena.acoes.length) partes.push(`acoes: ${cena.acoes.join(' | ')}`);
      if (cena.falas.length) partes.push(`falas: ${cena.falas.join(' | ')}`);
      return partes;
    });

  if (!eventos.length) return null;
  const memoria = `Cena com o jogador: ${eventos.join(' — ')}`.slice(0, 900);
  const existentes = await MemoryManager.buscarMemorias(npcId, playerId);
  if (existentes.some(item => item.memoria === memoria)) return null;
  return MemoryManager.salvarMemoria(npcId, playerId, memoria, 'interacao', 6);
}

module.exports = { addRecent, getRecent, retrieve, captureExplicit, captureScene };
