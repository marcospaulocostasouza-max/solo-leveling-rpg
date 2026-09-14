/** Persistent memory + bounded temporary conversation context. */
const MemoryManager = require('../npc/memoryManager');
const {canonicalId}=require('../npc/npcIdentity');
async function loadMemories(npcId,playerId) {
  const canonical=canonicalId(npcId);
  const ids=canonical==='ophilia_clement'?['ophilia_clement','ophilia']:[canonical];
  return (await Promise.all(ids.map(id=>MemoryManager.buscarMemorias(id,playerId)))).flat();
}
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
async function retrieve(npcId, playerId, message, limit = 8) {
  const all = await loadMemories(npcId, playerId);
  const ranked = require('./memoryContinuity').rankMemories(all,message,limit);
  Promise.all(ranked.map(item => MemoryManager.registrarLembranca(item.id))).catch(() => {});
  return ranked;
}
// Saving is deterministic and opt-in: explicit promises, secrets, facts and requests to remember.
async function captureExplicit(npcId, playerId, message) {
  const text = textoObservavelParaAnalise(message);
  const explicit = /\b(lembre|memorize|prometo|promessa|segredo|nunca conte|meu nome é|me chamo|eu sou)\b/i.test(text);
  if (!explicit || text.length < 12) return null;
  const type = /segredo|nunca conte/i.test(text) ? 'segredo' : /prometo|promessa/i.test(text) ? 'promessa' : 'fato';
  return MemoryManager.salvarMemoria(canonicalId(npcId), playerId, text.slice(0, 900), type, type === 'segredo' || type === 'promessa' ? 9 : 7);
}

// Registra o que o NPC efetivamente percebeu ao fim da cena. Pensamentos
// privados nunca entram nesta memoria nem influenciam encontros futuros.
async function captureScene(npcId, playerId, historico) {
  const eventos = (historico || [])
    .filter(item => item && ['jogador','npc','player'].includes(item.papel || item.role))
    .flatMap(item => {
      const cena = analisarCena(item.conteudo || item.content);
      const actor=(item.papel || item.role)==='npc'?'NPC':'jogador';
      const partes = [];
      for (const action of cena.acoes) partes.push(`Ação observada do ${actor}: ${action}`);
      for (const speech of cena.falas) partes.push(`Fala do ${actor}, não comprova fatos sobre terceiros: ${speech}`);
      return partes;
    });

  if (!eventos.length) return null;
  const existentes = await loadMemories(npcId, playerId);
  const saved=[];
  for (const event of eventos) {
    // Fragmenta cenas extensas em vez de perder tudo depois dos primeiros 900 caracteres.
    for(let offset=0;offset<event.length;offset+=750) {
      const memoria=`Cena com o interlocutor; trecho ${Math.floor(offset/750)+1}: ${event.slice(offset,offset+750)}`;
      if(existentes.some(item=>item.memoria===memoria)) continue;
      const id=await MemoryManager.salvarMemoria(canonicalId(npcId),playerId,memoria,'interacao',6);
      if(id) {saved.push(id);existentes.push({memoria});}
    }
  }
  return saved;
}

module.exports = { addRecent, getRecent, retrieve, captureExplicit, captureScene };
