/* Smoke tests for the new architecture. Does not contact Ollama. */
const assert = require('assert');
const NPCDatabase = require('../src/ai/npcDatabase');
const Retrieval = require('../src/ai/retrievalEngine');
const Narrative = require('../src/ai/narrativeCore');

const cases = [
  ['cumprimento', 'Olá, Ophilia. Como está?'],
  ['conversa simples', 'O templo parece tranquilo hoje.'],
  ['conversa longa', 'Quero conversar sobre as pessoas que você já ajudou e sobre como a fé a sustenta em dias difíceis.'],
  ['emoção', 'Eu estou com medo e não sei se consigo continuar.'],
  ['trauma', 'Você se lembra da perda de sua família quando era criança?'],
  ['relacionamento', 'Eu confio em você e quero proteger este vínculo.'],
  ['conhecimento', 'O que você sabe sobre curar ferimentos em uma dungeon?'],
  ['combate', 'Uma criatura atacou o grupo. Como você age no combate?'],
  ['cena longa', 'A chuva cai sobre Hallasan enquanto feridos chegam ao templo depois de uma dungeon desmoronar.'],
  ['memória', 'Lembre-se: prometi respeitar os Templos de Hallasan.']
];

const loaded = NPCDatabase.getNPC('ophilia');
assert(loaded.profile, 'Ophilia must load from the MD dataset');
for (const [name, message] of cases) {
  const retrieved = Retrieval.retrieve(loaded.profile, message);
  const prompt = Narrative.build({
    npc: loaded.profile, message, retrieved, memories: [], recent: [],
    state: { emotion: { emocao: 'calma', intensidade: 50 }, mood: { mood: 'sereno', intensidade: 50 } },
    relationship: { confianca: 0, respeito: 0, amizade: 0, carinho: 0, desconfianca: 0, medo: 0 }
  });
  assert(prompt.prompt.includes('PLAYER ACTION'), `${name}: missing player message`);
  assert(prompt.tokens <= prompt.limit, `${name}: context budget exceeded`);
  console.log(`${name}: input ~${prompt.tokens} tokens; retrieval ${retrieved.length}; sources ${retrieved.map(item => item.section).join(', ') || 'none'}`);
}
console.log('Ophilia architecture smoke tests passed.');
