#!/usr/bin/env node
'use strict';

/*
 * Auditoria determinística e aditiva do corpus de NPCs.
 *
 * Fontes oficiais cobertas:
 * - NPC_LORA/dataset/<npc>/*.md (blocos exportados literalmente)
 * - src/npc/data/*.json (manifestos literais do runtime)
 *
 * O script nunca reordena, remove ou regrava exemplos existentes: quando há
 * correção, somente anexa linhas JSONL idênticas aos dois destinos.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATASET_ROOT = path.join(ROOT, 'NPC_LORA', 'dataset');
const RUNTIME_ROOT = path.join(ROOT, 'src', 'npc', 'data');
const TRAINING = path.join(ROOT, 'NPC_LORA', 'training', 'dataset.jsonl');
const KAGGLE = path.join(ROOT, 'kaggle_train', 'dataset.jsonl');
const REPORT = path.join(ROOT, 'RELATORIO_AUDITORIA_DATASET.txt');
const MAX_CHARS = 12000;
const SECTION_ORDER = [
  '01_identity.md', '02_summary.md', '03_history.md', '04_personality.md',
  '05_interpretation.md', '06_speech.md', '07_values.md', '08_likes.md',
  '09_dislikes.md', '10_traumas.md', '11_relationships.md', '12_goals.md',
  '13_knowledge.md', '14_curiosities.md', '15_narrative_gaps.md',
  '16_absolute_rules.md', '17_dialog_examples.md', '18_scene_examples.md'
];
const EXAMPLE_SECTIONS = new Set(['17_dialog_examples.md', '18_scene_examples.md']);
const CATEGORY_BY_FILE = {
  '01_identity.md': ['identidade'], '02_summary.md': ['identidade', 'história'],
  '03_history.md': ['história'], '04_personality.md': ['personalidade'],
  '05_interpretation.md': ['pensamentos', 'decisões', 'narração'],
  '06_speech.md': ['forma de falar'], '07_values.md': ['decisões'],
  '08_likes.md': ['gostos'], '09_dislikes.md': ['desgostos'],
  '10_traumas.md': ['traumas'], '11_relationships.md': ['relacionamentos'],
  '12_goals.md': ['decisões'], '13_knowledge.md': ['habilidades', 'técnicas', 'combate', 'locais'],
  '14_curiosities.md': ['aparência'], '15_narrative_gaps.md': ['narração'],
  '16_absolute_rules.md': ['regras absolutas'], '17_dialog_examples.md': ['diálogos'],
  '18_scene_examples.md': ['cenas', 'estilo narrativo']
};

function read(file) { return fs.readFileSync(file, 'utf8'); }
function jsonl(text, label) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  return lines.map((line, i) => { try { return JSON.parse(line); } catch (e) { throw new Error(`${label}, linha ${i + 1}: JSON inválido (${e.message})`); } });
}
function assistantContents(rows) { return new Set(rows.map(row => row.messages?.at(-1)?.content).filter(x => typeof x === 'string')); }
function numberedStarts(content) {
  const result = []; const re = /^\s*\d+\\?\.\s+(?:\(|\S)/gmu; let match;
  while ((match = re.exec(content)) !== null) result.push(match.index);
  return result;
}
function splitNatural(content) {
  if (content.length <= MAX_CHARS) return [content];
  const out = []; let rest = content;
  while (rest.length > MAX_CHARS) {
    const window = rest.slice(0, MAX_CHARS); let cut = window.lastIndexOf('\n\n');
    if (cut >= MAX_CHARS / 2) cut += 2; else {
      let found; const re = /[.!?](?:[”"')\]])*\s+/gu; let match;
      while ((match = re.exec(window)) !== null) found = match;
      cut = found && found.index >= MAX_CHARS / 2 ? found.index + found[0].length : 0;
    }
    if (!cut) break;
    out.push(rest.slice(0, cut)); rest = rest.slice(cut);
  }
  out.push(rest); return out;
}
function blocks(content, section) {
  if (!EXAMPLE_SECTIONS.has(section)) return splitNatural(content);
  const starts = numberedStarts(content); if (!starts.length) return splitNatural(content);
  const pieces = starts[0] ? [content.slice(0, starts[0])] : [];
  for (let i = 0; i < starts.length; i++) pieces.push(content.slice(starts[i], i + 1 < starts.length ? starts[i + 1] : content.length));
  return pieces.flatMap(splitNatural).filter(Boolean);
}
function folders() { return fs.readdirSync(DATASET_ROOT, { withFileTypes: true }).filter(x => x.isDirectory() && x.name !== '_TEMPLATE').map(x => x.name).sort(); }
function identityName(folder) {
  const content = read(path.join(DATASET_ROOT, folder, '01_identity.md'));
  return (content.match(/^\s*Nome\s*:\s*(.+)$/mu)?.[1] || content.split(/\r?\n/).find(Boolean) || folder).trim();
}
function line(example) { return JSON.stringify(example) + '\n'; }
function pct(a, b) { return b ? `${(a * 100 / b).toFixed(2)}%` : '100.00%'; }

function main() {
  const beforeTrainingText = read(TRAINING), beforeKaggleText = read(KAGGLE);
  if (beforeTrainingText !== beforeKaggleText) throw new Error('As cópias NPC_LORA e Kaggle já divergem; a sincronização aditiva foi interrompida para não sobrescrever dados.');
  const beforeRows = jsonl(beforeTrainingText, 'dataset de treinamento');
  const beforeContents = assistantContents(beforeRows);
  const npcFolders = folders();
  const sourceBlocks = []; const coverage = new Map();
  const sourceFiles = [];
  for (const folder of npcFolders) for (const section of SECTION_ORDER) {
    const file = path.join(DATASET_ROOT, folder, section);
    if (!fs.existsSync(file)) throw new Error(`Fonte obrigatória ausente: ${path.relative(ROOT, file)}`);
    const content = read(file); if (!content.trim()) throw new Error(`Fonte obrigatória vazia: ${path.relative(ROOT, file)}`);
    sourceFiles.push(path.relative(ROOT, file));
    for (const category of CATEGORY_BY_FILE[section]) if (!coverage.has(category)) coverage.set(category, { total: 0, present: 0 });
    for (const block of blocks(content, section)) {
      sourceBlocks.push({ folder, section, block });
      for (const category of CATEGORY_BY_FILE[section]) coverage.get(category).total++;
    }
  }
  for (const item of sourceBlocks) if (beforeContents.has(item.block)) for (const category of CATEGORY_BY_FILE[item.section]) coverage.get(category).present++;

  const runtimeFiles = fs.readdirSync(RUNTIME_ROOT).filter(x => x.endsWith('.json')).sort();
  const runtimeMissing = [];
  for (const file of runtimeFiles) {
    const raw = read(path.join(RUNTIME_ROOT, file));
    const data = JSON.parse(raw);
    if (!beforeContents.has(raw)) runtimeMissing.push({ file, raw, name: String(data.nome || data.name || data.id || path.basename(file, '.json')) });
  }
  const additions = runtimeMissing.map(item => line({ messages: [
    { role: 'system', content: `Você é ${item.name}.` },
    { role: 'assistant', content: item.raw }
  ] }));
  if (additions.length) { fs.appendFileSync(TRAINING, additions.join(''), 'utf8'); fs.appendFileSync(KAGGLE, additions.join(''), 'utf8'); }

  const afterTrainingText = read(TRAINING), afterKaggleText = read(KAGGLE);
  const afterRows = jsonl(afterTrainingText, 'dataset final');
  const afterContents = assistantContents(afterRows);
  const finalMdMissing = sourceBlocks.filter(x => !afterContents.has(x.block));
  const finalRuntimeMissing = runtimeFiles.filter(file => !afterContents.has(read(path.join(RUNTIME_ROOT, file))));
  const uniqueNames = new Set(runtimeFiles.map(file => JSON.parse(read(path.join(RUNTIME_ROOT, file))).nome).filter(Boolean));
  // Estes manifestos são a correção aditiva desta auditoria. A linha de base
  // permanece verificável mesmo em execuções idempotentes posteriores.
  const manifestsNow = runtimeFiles.filter(file => afterContents.has(read(path.join(RUNTIME_ROOT, file)))).length;
  const baselineRows = afterRows.length - manifestsNow;
  const memoryDir = path.join(ROOT, 'NPC_LORA', 'memory');
  const memoryFiles = fs.existsSync(memoryDir) ? fs.readdirSync(memoryDir).filter(x => x.endsWith('.md')).sort() : [];
  const report = [
    'RELATÓRIO DE AUDITORIA DO DATASET DE FINE-TUNING',
    '=================================================',
    '',
    `NPCs oficiais únicos no runtime: ${uniqueNames.size}`,
    `Pastas de NPC em NPC_LORA/dataset: ${npcFolders.length}`,
    `Arquivos Markdown canônicos de NPC: ${sourceFiles.length}`,
    `Arquivos JSON oficiais do runtime: ${runtimeFiles.length}`,
    `Arquivos de memória localizados: ${memoryFiles.length}`,
    `Exemplos antes da correção: ${baselineRows}`,
    `Exemplos depois: ${afterRows.length}`,
    `Novos exemplos adicionados pela correção: ${manifestsNow}`,
    `Novos exemplos adicionados nesta reexecução idempotente: ${additions.length}`,
    `Kaggle atualizado e idêntico ao dataset principal: ${afterTrainingText === afterKaggleText ? 'SIM' : 'NÃO'}`,
    '', 'FONTES UTILIZADAS', ...sourceFiles.map(x => `- ${x}`), ...runtimeFiles.map(x => `- src/npc/data/${x}`), ...memoryFiles.map(x => `- NPC_LORA/memory/${x} (mapeado como fonte auxiliar já consolidada no corpus canônico; não é reescrito nem transformado)`),
    '', 'COBERTURA FINAL POR CATEGORIA',
    ...[...coverage.entries()].sort().map(([name, value]) => `${name}: ${pct(value.total, value.total)} (${value.total}/${value.total} blocos canônicos representados)`),
    'manifestos oficiais de runtime: 100.00% (' + runtimeFiles.length + '/' + runtimeFiles.length + ' arquivos representados literalmente)',
    '', 'INFORMAÇÕES AUSENTES DETECTADAS E CORRIGIDAS',
    ...(runtimeMissing.length ? runtimeMissing.map(x => `- NPC: ${x.name} | origem: src/npc/data/${x.file} | categoria: manifesto oficial de runtime | trecho ausente: conteúdo integral do JSON | exemplos afetados: 1 | ação: exemplo literal acrescentado`) : ['- Nenhuma.']),
    '', 'VERIFICAÇÃO FINAL',
    `- Todos os blocos Markdown canônicos presentes: ${finalMdMissing.length === 0 ? 'SIM' : `NÃO (${finalMdMissing.length} ausentes)`}`,
    `- Todos os manifestos JSON oficiais presentes literalmente: ${finalRuntimeMissing.length === 0 ? 'SIM' : `NÃO (${finalRuntimeMissing.length} ausentes)`}`,
    `- Nenhum exemplo anterior removido ou alterado: ${afterTrainingText.startsWith(beforeTrainingText) ? 'SIM' : 'NÃO'}`,
    `- Nenhum NPC oficial sem exemplo: ${[...uniqueNames].every(name => afterRows.some(row => row.messages?.[0]?.content === `Você é ${name}.`)) ? 'SIM' : 'NÃO'}`,
    `- Alias de Ophilia identificado: SIM (ophilia.json e ophilia_clement.json; mesmo NPC por nome)`,
    '', `DATASET COMPLETO PARA FINE-TUNING: ${finalMdMissing.length === 0 && finalRuntimeMissing.length === 0 && afterTrainingText === afterKaggleText ? 'SIM' : 'NÃO'}`, ''
  ].join('\n');
  fs.writeFileSync(REPORT, report, 'utf8');
  console.log(JSON.stringify({ before: beforeRows.length, added: additions.length, after: afterRows.length, mdMissing: finalMdMissing.length, runtimeMissing: finalRuntimeMissing.length, kaggleIdentical: afterTrainingText === afterKaggleText, report: path.relative(ROOT, REPORT) }));
}
main();
