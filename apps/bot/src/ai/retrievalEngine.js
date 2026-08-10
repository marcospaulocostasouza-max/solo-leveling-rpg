/** Deterministic, local retrieval. No embeddings or model calls. */
const STOP = new Set(['para','como','com','uma','que','dos','das','por','não','sua','seu','sobre','isso','esta','esse','você','mais','the','and']);
const TOPIC_SECTIONS = {
  combate: ['knowledge', 'sceneExamples', 'values', 'interpretation'], luta: ['knowledge', 'sceneExamples'],
  trauma: ['traumas', 'history', 'interpretation'], passado: ['history', 'traumas', 'relationships'],
  infância: ['history', 'traumas'], relacionamento: ['relationships', 'values', 'dialogExamples'],
  amor: ['relationships', 'dialogExamples'], emoção: ['personality', 'interpretation', 'dialogExamples'],
  fé: ['values', 'speech', 'dialogExamples'], conhecimento: ['knowledge', 'history']
};
function terms(text) { return new Set((String(text).toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) || []).filter(word => !STOP.has(word))); }
function retrieve(profile, message, limit = 5) {
  const query = terms(message); const wanted = new Set();
  for (const [term, sections] of Object.entries(TOPIC_SECTIONS)) if (query.has(term)) sections.forEach(section => wanted.add(section));
  const selected = profile.chunks.filter(chunk => !['dialogExamples', 'sceneExamples'].includes(chunk.section)).map(chunk => {
    const words = terms(chunk.text); let score = 0;
    for (const word of query) if (words.has(word)) score += 3;
    if (wanted.has(chunk.section)) score += 4;
    if (!wanted.size && ['knowledge', 'traumas', 'relationships'].includes(chunk.section)) score -= 1;
    return { ...chunk, score };
  }).filter(item => item.score > 0).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).slice(0, limit);
  return selected.map(item => ({ section: item.section, source: item.source, text: item.text.slice(0, 900), score: item.score }));
}
module.exports = { retrieve };
