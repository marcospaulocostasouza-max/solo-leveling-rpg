#!/usr/bin/env node
'use strict';

/* Auditoria estrutural repetível do projeto NPC_LORA.
 * Executa duas passagens: a primeira pode importar blocos ausentes e remover
 * somente exemplos idênticos; a segunda confirma que as correções não criaram
 * novos problemas. Conteúdo narrativo nunca é reescrito por este arquivo. */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const NPC_ROOT = path.join(ROOT, 'NPC_LORA');
const DATASET = path.join(NPC_ROOT, 'dataset');
const REPORT = path.join(ROOT, 'RELATORIO_CHECKUP_FINAL.txt');
const REQUIRED = [
  '01_identity.md','02_summary.md','03_history.md','04_personality.md','05_interpretation.md','06_speech.md',
  '07_values.md','08_likes.md','09_dislikes.md','10_traumas.md','11_relationships.md','12_goals.md',
  '13_knowledge.md','14_curiosities.md','15_narrative_gaps.md','16_absolute_rules.md','17_dialog_examples.md','18_scene_examples.md'
];
const SKIP = new Set(['node_modules', '.git', '.wwebjs_auth', '.wwebjs_cache']);

function walk(dir, predicate = () => true) {
  const result = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(item.name)) continue;
    const full = path.join(dir, item.name);
    if (item.isDirectory()) result.push(...walk(full, predicate));
    else if (predicate(full)) result.push(full);
  }
  return result;
}
function rel(file) { return path.relative(ROOT, file).replace(/\\/g, '/'); }
function text(file) { return fs.readFileSync(file, 'utf8'); }
function isTitleOnly(value) { return value.trim().split(/\r?\n/).filter(Boolean).length <= 2; }
function exampleBlocks(value) {
  // Só reconhece exemplos explicitamente numerados; não fragmenta prosa livre.
  const lines = value.split(/\r?\n/); const blocks = []; let current = [];
  const flush = () => { if (current.length) blocks.push(current.join('\n')); current = []; };
  for (const line of lines) {
    if (/^\s*\d+\\?\.\s+(?:\(|\S)/u.test(line) && current.some(x => x.trim())) flush();
    current.push(line);
  }
  flush();
  return blocks;
}
function removeExactDuplicateExamples(file) {
  const original = text(file); const blocks = exampleBlocks(original);
  if (blocks.length < 2) return 0;
  const seen = new Set(); const output = []; let removed = 0;
  for (const block of blocks) {
    const key = block.trim();
    if (key && seen.has(key)) { removed += 1; continue; }
    if (key) seen.add(key);
    output.push(block);
  }
  if (removed) fs.writeFileSync(file, output.join('\n'), 'utf8');
  return removed;
}
function newState() {
  return { files: 0, npcs: [], incomplete: [], empty: [], missing: [], small: [], duplicateBlocks: [], json: [], script: [], encoding: [], inconsistencies: [], corrected: 0, removed: 0, memory: [], memoryDetails: [] };
}
function auditDatasets(state, fix) {
  const dirs = fs.readdirSync(DATASET, { withFileTypes: true }).filter(x => x.isDirectory() && x.name !== '_TEMPLATE');
  for (const dir of dirs) {
    const folder = path.join(DATASET, dir.name); let complete = true;
    for (const required of REQUIRED) {
      const file = path.join(folder, required);
      if (!fs.existsSync(file)) { state.missing.push(`${dir.name}/${required}`); complete = false; continue; }
      state.files += 1; const content = text(file);
      if (!content.trim()) { state.empty.push(`${dir.name}/${required}`); complete = false; }
      else if (isTitleOnly(content)) { state.small.push(`${dir.name}/${required}: somente título`); complete = false; }
      else if (content.trim().length < 40) { state.small.push(`${dir.name}/${required}: conteúdo muito pequeno`); complete = false; }
      if (content.includes('\uFFFD')) { state.encoding.push(rel(file)); complete = false; }
      if (fix && (required === '17_dialog_examples.md' || required === '18_scene_examples.md')) {
        const removed = removeExactDuplicateExamples(file);
        if (removed) { state.duplicateBlocks.push(`${dir.name}/${required}: ${removed}`); state.removed += removed; state.corrected += removed; }
      }
    }
    if (complete) state.npcs.push(dir.name); else state.incomplete.push(dir.name);
  }
  return dirs.map(x => x.name);
}
function auditJson(state, datasetIds) {
  const jsonFiles = walk(ROOT, file => file.endsWith('.json'));
  const ids = new Map();
  for (const file of jsonFiles) {
    state.files += 1; let value;
    try { value = JSON.parse(text(file)); } catch (error) { state.json.push(`${rel(file)}: JSON inválido (${error.message})`); continue; }
    if (text(file).includes('\uFFFD')) state.encoding.push(rel(file));
    // Os NPCs de runtime têm o esquema abaixo. Outros JSONs (itens, missões,
    // configurações) são validados como JSON mas não recebem campos de NPC.
    if (/^src[\\/]npc[\\/]data[\\/]/i.test(path.relative(ROOT, file))) {
      const required = ['id','nome','classe','rank','elemento','atributos','equipamentos','tecnicas'];
      for (const key of required) if (value[key] === undefined || value[key] === null || value[key] === '') state.json.push(`${rel(file)}: campo obrigatório ausente (${key})`);
      if (value.id) {
        if (!datasetIds.includes(value.id) && value.id !== 'vysache' && value.id !== 'ophilia') state.inconsistencies.push(`${rel(file)}: id sem dataset correspondente (${value.id})`);
        const list = ids.get(value.id) || []; list.push(rel(file)); ids.set(value.id, list);
      }
    }
  }
  for (const [id, files] of ids) if (files.length > 1) state.json.push(`id de NPC duplicado "${id}": ${files.join(', ')}`);
  return jsonFiles.length;
}
function auditScripts(state) {
  for (const file of walk(ROOT, file => file.endsWith('.js') && !file.includes(`${path.sep}node_modules${path.sep}`))) {
    state.files += 1;
    const check = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8', timeout: 30000 });
    if (check.status !== 0) state.script.push(`${rel(file)}: ${String(check.stderr || check.stdout).trim()}`);
  }
}
function auditMemory(state, fix) {
  for (const file of ['Cenas.md', 'CENAS2.md', 'E-CENAS.md']) {
    const source = path.join(NPC_ROOT, 'memory', file);
    if (!fs.existsSync(source)) { state.memory.push(`${file}: inexistente`); continue; }
    state.files += 1;
    const command = [path.join(ROOT, 'scripts', 'importar_memoria.js'), source];
    if (!fix) command.push('--dry-run');
    const run = spawnSync(process.execPath, command, { cwd: ROOT, encoding: 'utf8', timeout: 120000 });
    const report = fs.existsSync(path.join(ROOT, 'RELATORIO_IMPORTACAO.txt')) ? text(path.join(ROOT, 'RELATORIO_IMPORTACAO.txt')) : '';
    const copied = /Quantidade de blocos copiados:\s*(\d+)/u.exec(report);
    const unidentified = /Quantidade de blocos sem associação segura:\s*(\d+)/u.exec(report);
    if (!report || (!copied && run.status !== 0)) state.memory.push(`${file}: falha técnica no importador (${String(run.stderr || run.stdout).trim()})`);
    else {
      const pending = copied ? Number(copied[1]) : 0;
      const unmatched = unidentified ? Number(unidentified[1]) : 0;
      state.memory.push(`${file}: ${pending} bloco(s) pendente(s); ${unmatched} bloco(s) preservado(s) em CENAS_GERAIS`);
      if (unmatched) {
        const lines = report.split(/\r?\n/).filter(line => line.startsWith('- Bloco sem NPC identificado'));
        state.memoryDetails.push(...lines.map(line => `${file}: ${line.slice(2)} — preservado em CENAS_GERAIS.md`));
      }
      if (fix && pending > 0) state.corrected += pending;
    }
  }
}
function runPass(fix) {
  const state = newState();
  const ids = auditDatasets(state, fix);
  auditJson(state, ids); auditScripts(state); auditMemory(state, fix);
  return state;
}
function list(title, values) { return `${title} (${values.length})\n${values.length ? values.map(x => `- ${x}`).join('\n') : '- Nenhum'}\n`; }

const first = runPass(true);
const second = runPass(false);
const blockers = [...second.missing, ...second.empty, ...second.small, ...second.json, ...second.script, ...second.encoding, ...second.memory.filter(x => x.includes(': inexistente') || x.includes(': falha técnica'))];
const report = [
  'RELATÓRIO FINAL — CHECKUP GERAL NPC_LORA', '============================================',
  `Total de NPCs: ${first.npcs.length + first.incomplete.length}`,
  `Total de datasets: ${first.npcs.length + first.incomplete.length}`,
  `Total de JSON: ${auditJson(newState(), fs.readdirSync(DATASET))}`,
  `Total de arquivos analisados (2ª passagem): ${second.files}`,
  `Total de problemas encontrados (1ª passagem): ${first.missing.length + first.empty.length + first.small.length + first.json.length + first.script.length + first.encoding.length + first.inconsistencies.length}`,
  `Total de problemas corrigidos: ${first.corrected}`,
  `Duplicatas removidas: ${first.removed}`,
  '', list('NPCs completos', second.npcs), list('NPCs incompletos', second.incomplete),
  list('Arquivos vazios', second.empty), list('Arquivos inexistentes', second.missing),
  list('Blocos de memória (importados ou preservados)', second.memory), list('Inconsistências encontradas', second.inconsistencies),
  list('Blocos preservados sem associação segura (linhas exatas)', second.memoryDetails),
  list('Problemas restantes', blockers),
  'PROJETO PRONTO PARA TREINAMENTO DA LORA?', blockers.length ? 'NÃO' : 'SIM',
  blockers.length ? '\nImpedimentos listados em "Problemas restantes".' : '\nSegunda verificação concluída sem impedimentos estruturais.'
].join('\n');
fs.writeFileSync(REPORT, report, 'utf8');
console.log(`Checkup concluído. Relatório: ${REPORT}`);
