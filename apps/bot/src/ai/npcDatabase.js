/**
 * NPC Database
 *
 * Fonte de verdade: NPC_LORA/dataset/<id>/*.md.
 * JSONs existentes sao somente dados suplementares de compatibilidade. Este
 * modulo nunca os altera e mantem perfis/indexes em memoria por processo.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const DATASET_ROOT = path.join(ROOT, 'NPC_LORA', 'dataset');
const JSON_ROOTS = [path.join(ROOT, 'src', 'npc', 'data'), path.join(ROOT, 'src', 'missions', 'data')];
const SECTION_FILES = {
  identity: '01_identity.md', summary: '02_summary.md', history: '03_history.md',
  personality: '04_personality.md', interpretation: '05_interpretation.md', speech: '06_speech.md',
  values: '07_values.md', likes: '08_likes.md', dislikes: '09_dislikes.md',
  traumas: '10_traumas.md', relationships: '11_relationships.md', goals: '12_goals.md',
  knowledge: '13_knowledge.md', curiosities: '14_curiosities.md', gaps: '15_narrative_gaps.md',
  rules: '16_absolute_rules.md', dialogExamples: '17_dialog_examples.md', sceneExamples: '18_scene_examples.md'
};
const ALIASES = { ophilia: 'ophilia_clement', ophilia_clement: 'ophilia_clement' };
const cache = new Map();

function canonicalId(id) { return ALIASES[String(id || '').toLowerCase()] || String(id || '').toLowerCase(); }
function read(file) { return fs.existsSync(file) ? fs.readFileSync(file, 'utf8').trim() : ''; }
function fingerprint(files) { return files.filter(fs.existsSync).map(file => { const s = fs.statSync(file); return `${file}:${s.size}:${s.mtimeMs}`; }).join('|'); }
function splitChunks(text, section, source) {
  return text.split(/\n\s*\n|(?=---\s+)/).map(value => value.trim()).filter(value => value.length >= 40)
    .map((text, index) => ({ id: `${section}:${index}`, section, source, text }));
}
function loadJsonCandidates(id) {
  const candidates = [];
  for (const root of JSON_ROOTS) {
    for (const name of [id, id === 'ophilia_clement' ? 'ophilia' : null].filter(Boolean)) {
      const file = path.join(root, `${name}.json`);
      if (fs.existsSync(file)) { try { candidates.push({ file, data: JSON.parse(read(file)) }); } catch (_) {} }
    }
  }
  return candidates;
}
function compact(text, chars) { return String(text || '').replace(/\s+/g, ' ').trim().slice(0, chars); }
function buildCore(sections, json) {
  const factual = [
    ['Identidade', sections.identity], ['Resumo', sections.summary], ['Personalidade', sections.personality],
    ['Interpretação', sections.interpretation], ['Fala', sections.speech], ['Valores', sections.values], ['Regras', sections.rules]
  ].map(([name, value]) => value ? `${name}: ${compact(value, 700)}` : '').filter(Boolean);
  if (!factual.length && json) factual.push(`Identidade: ${json.nome || 'NPC'}. ${compact(json.personalidade, 700)} ${compact(json.formaFalar, 500)}`);
  return factual.join('\n');
}

function buildProfile(id) {
  const canonical = canonicalId(id);
  const dir = path.join(DATASET_ROOT, canonical);
  const mdFiles = Object.values(SECTION_FILES).map(name => path.join(dir, name));
  const jsonSources = loadJsonCandidates(canonical);
  const files = [...mdFiles, ...jsonSources.map(item => item.file)];
  const signature = fingerprint(files);
  const existing = cache.get(canonical);
  if (existing && existing.signature === signature) return { profile: existing, cacheHit: true };
  if (!fs.existsSync(dir)) return { profile: null, cacheHit: false };

  const sections = Object.fromEntries(Object.entries(SECTION_FILES).map(([key, file]) => [key, read(path.join(dir, file))]));
  const json = jsonSources.find(item => item.data.id === 'ophilia')?.data || jsonSources[0]?.data || null;
  const chunks = Object.entries(sections).flatMap(([section, text]) => splitChunks(text, section, path.join(dir, SECTION_FILES[section])));
  const profile = {
    id: canonical,
    displayId: json?.id || canonical,
    name: json?.nome || compact(sections.identity, 120) || canonical,
    dir, signature, files: files.filter(fs.existsSync), json, sections, chunks,
    core: buildCore(sections, json), loadedAt: new Date().toISOString()
  };
  cache.set(canonical, profile);
  return { profile, cacheHit: false };
}

function getNPC(id) { return buildProfile(id); }
function listNPCs() { return fs.existsSync(DATASET_ROOT) ? fs.readdirSync(DATASET_ROOT, { withFileTypes: true }).filter(item => item.isDirectory()).map(item => item.name).sort() : []; }
function invalidate(id) { cache.delete(canonicalId(id)); }

module.exports = { canonicalId, getNPC, listNPCs, invalidate, SECTION_FILES };
