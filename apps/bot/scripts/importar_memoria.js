#!/usr/bin/env node
'use strict';

/**
 * Importador reutilizável de memórias de NPC.
 *
 * Uso:
 *   node scripts/importar_memoria.js NPC_LORA/memory/E-CENAS.md
 *   node scripts/importar_memoria.js NPC_LORA/memory/CENAS2.md
 *
 * O formato é detectado pelo conteúdo: seções "PERSONAGEM>" ou blocos fenced.
 * Os textos importados são mantidos byte a byte como texto UTF-8; o importador
 * apenas acrescenta uma quebra de linha separadora entre blocos já existentes.
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DATASET_DIR = path.join(PROJECT_ROOT, 'NPC_LORA', 'dataset');
const MEMORY_DIR = path.join(PROJECT_ROOT, 'NPC_LORA', 'memory');
const REPORT_PATH = path.join(PROJECT_ROOT, 'RELATORIO_IMPORTACAO.txt');
const GENERAL_SCENES_PATH = path.join(MEMORY_DIR, 'CENAS_GERAIS.md');
const GENERAL_REPORT_PATH = path.join(PROJECT_ROOT, 'RELATORIO_CENAS_GERAIS.txt');
const DIALOG_FILE = '17_dialog_examples.md';
const SCENE_FILE = '18_scene_examples.md';

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[“”"'`´]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function unique(values) {
  return [...new Set(values.map(value => String(value || '').trim()).filter(Boolean))];
}

function lineValue(text, label) {
  const expression = new RegExp(`^\\s*${label}\\s*:\\s*(.+)$`, 'imu');
  const match = text.match(expression);
  return match ? match[1].trim() : '';
}

// O catálogo vem dos dados que acompanham cada dataset, não do nome do arquivo
// importado. Assim NPCs novos entram automaticamente quando suas pastas existirem.
function loadNpcCatalog() {
  const entries = fs.readdirSync(DATASET_DIR, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && entry.name !== '_TEMPLATE');

  return entries.map(entry => {
    const folder = entry.name;
    const identityPath = path.join(DATASET_DIR, folder, '01_identity.md');
    const identity = fs.existsSync(identityPath) ? fs.readFileSync(identityPath, 'utf8') : '';
    const identityLines = identity.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    const explicitName = lineValue(identity, 'Nome');
    // Em estruturas antigas, a primeira linha é o nome e não há "Nome:".
    const fullName = explicitName || identityLines[0] || folder.replace(/_/g, ' ');
    const title = lineValue(identity, 'T[íi]tulo');
    const base = lineValue(identity, 'Base(?: original)?');
    const aliases = [fullName, title, folder.replace(/_/g, ' ')];

    // "Base: Nome (Obra)" costuma conter o alias canônico do personagem.
    if (base) aliases.push(base.replace(/\s*\(.+$/, '').trim());
    // Títulos após vírgula são aliases usuais: "Vide, o Corruptor".
    const commaAlias = fullName.split(',')[0].trim();
    if (commaAlias && commaAlias !== fullName) aliases.push(commaAlias);

    const nameWords = normalize(fullName).split(' ').filter(word => word.length >= 3);
    const firstName = nameWords[0];
    const surname = nameWords.length > 1 ? nameWords[nameWords.length - 1] : '';
    if (firstName) aliases.push(firstName);
    if (surname) aliases.push(surname);

    return {
      folder,
      fullName,
      title,
      aliases: unique(aliases),
      normalizedAliases: unique(aliases.map(normalize)).filter(alias => alias.length >= 3),
      firstName,
      surname
    };
  });
}

function containsAlias(normalizedText, normalizedAlias) {
  return (` ${normalizedText} `).includes(` ${normalizedAlias} `);
}

/**
 * Retorna todos os NPCs citados. Nomes completos/títulos têm prioridade;
 * primeiro nome e sobrenome só são usados quando não causam ambiguidade.
 */
function findNpcs(text, catalog) {
  const normalizedText = normalize(text);
  const found = new Map();

  for (const npc of catalog) {
    const matched = npc.normalizedAliases.find(alias => containsAlias(normalizedText, alias));
    if (matched) found.set(npc.folder, npc);
  }

  return [...found.values()];
}

function isDialogBlock(text) {
  // Travessão, inclusive arquivos UTF-8 que porventura tenham sido salvos
  // como mojibake ("â€”"), é o marcador usado pelas memórias de diálogo.
  return text.includes('—') || text.includes('â€”');
}

function isSectionHeader(line) {
  const normalized = normalize(line);
  if (normalized.includes('dialogos')) return 'dialog';
  if (normalized.includes('cenas narrativas') || normalized === 'cenas') return 'scene';
  return null;
}

function isNpcSectionStart(line) {
  const trimmed = line.trim();
  // Há memórias antigas tanto com "PERSONAGEM>" quanto com
  // "PERSONAGEM: pasta:" e "\# 1. Nome".
  return /^PERSONAGEM\s*[>:]/iu.test(trimmed)
    || /^\\?#\s*\d+\.\s*\p{Lu}/u.test(trimmed)
    || /^\p{Lu}[\p{L}.]+(?:\s+\p{Lu}[\p{L}.]+){0,3}\s*[—-]/u.test(trimmed);
}

function isSceneBeginning(line) {
  if (/^\s*\d+\.\s+\S/u.test(line)) return true;
  // Alguns arquivos legados trazem cenas sem numeração, iniciadas pelo nome.
  return /^\s*\p{Lu}[\p{L}'-]*(?:\s+\p{Lu}[\p{L}'.-]*)?\s+(?:caminhava|sentad[oa]|diante|ajoelhad[oa]|confrontad[oa]|no meio|com|ao ver|ao ouvir|ao constatar|ao receber|ao notar|ao sentir|distribuindo|treinando|inspecionando|compartilhando|verificando|observando|movendo|ajustando|limpando|utilizando|percebendo)/iu.test(line);
}

function block(startLine, endLine, content, kind) {
  return { startLine, endLine, content, kind };
}

function extractFencedBlocks(source) {
  const blocks = [];
  const fence = /(^|\n)([ \t]*```[^\n]*\n)([\s\S]*?)(?:\n[ \t]*```)(?=\n|$)/g;
  let match;
  while ((match = fence.exec(source)) !== null) {
    const before = source.slice(0, match.index + (match[1] ? 1 : 0));
    const startLine = before.split('\n').length + 1;
    const content = match[3];
    const endLine = startLine + content.split('\n').length - 1;
    if (content.trim()) blocks.push(block(startLine, endLine, content, isDialogBlock(content) ? 'dialog' : 'scene'));
  }
  return blocks;
}

function extractCharacterSections(source) {
  const lines = source.split(/\r?\n/);
  const starts = [];
  for (let index = 0; index < lines.length; index += 1) {
    // Evita confundir uma fala/cena que contenha "Nome —" com uma nova seção:
    // um cabeçalho válido é seguido pelo cabeçalho de diálogos em até 10 linhas.
    const nextLines = lines.slice(index + 1, index + 11);
    if (isNpcSectionStart(lines[index]) && nextLines.some(line => isSectionHeader(line) === 'dialog')) starts.push(index);
  }
  if (!starts.length) return [];

  const blocks = [];
  for (let sectionIndex = 0; sectionIndex < starts.length; sectionIndex += 1) {
    const start = starts[sectionIndex];
    const end = sectionIndex + 1 < starts.length ? starts[sectionIndex + 1] : lines.length;
    const ownerText = lines[start];
    let kind = null;
    let current = [];
    let currentStart = 0;

    const flush = () => {
      // Cabeçalhos e espaços entre entradas não são conteúdo de exemplo.
      if (kind && current.some(line => line.trim())) {
        const extracted = block(currentStart + 1, currentStart + current.length, current.join('\n'), kind);
        extracted.ownerText = ownerText;
        blocks.push(extracted);
      }
      current = [];
    };

    for (let lineIndex = start; lineIndex < end; lineIndex += 1) {
      const line = lines[lineIndex];
      const headerKind = isSectionHeader(line);
      if (headerKind) {
        flush();
        kind = headerKind;
        currentStart = lineIndex + 1;
        continue;
      }
      if (!kind) continue;

      // Cada item numerado inicia um novo exemplo. Para diálogos, o título
      // "1. (Contexto)" pertence ao bloco e é preservado integralmente.
      const beginsDialog = kind === 'dialog' && /^\s*\d+\.\s*\(.+\)\s*$/u.test(line);
      const beginsScene = kind === 'scene' && isSceneBeginning(line);
      if ((beginsDialog || beginsScene) && current.some(value => value.trim())) {
        flush();
        currentStart = lineIndex;
      }
      current.push(line);
    }
    flush();
  }
  return blocks;
}

function extractBlocks(source) {
  const sections = extractCharacterSections(source);
  if (sections.length) return { format: 'seções PERSONAGEM>', blocks: sections };
  const fenced = extractFencedBlocks(source);
  if (fenced.length) return { format: 'blocos cercados por ```', blocks: fenced };
  return { format: 'não reconhecido', blocks: [] };
}

function appendUnique(destination, content, cache) {
  const current = cache.get(destination) || '';
  if (current.includes(content)) return false;
  const separator = current && !current.endsWith('\n') ? '\n\n' : (current ? '\n' : '');
  cache.set(destination, current + separator + content);
  return true;
}

// Blocos sem dono seguro nunca entram em um dataset de NPC. Eles permanecem
// intactos neste arquivo de triagem, com origem e intervalo de linhas para
// uma futura classificação humana. A deduplicação usa o texto exato do bloco.
function archiveUnidentifiedBlocks(origin, items, dryRun) {
  const current = fs.existsSync(GENERAL_SCENES_PATH) ? fs.readFileSync(GENERAL_SCENES_PATH, 'utf8') : '';
  let next = current;
  let archived = 0;
  let ignored = 0;

  for (const item of items) {
    const header = [
      '====================================================',
      'BLOCO NÃO IDENTIFICADO',
      'Origem:',
      origin,
      'Linha inicial:',
      String(item.startLine),
      'Linha final:',
      String(item.endLine),
      '====================================================',
      ''
    ].join('\n');
    // A proveniência faz parte da identidade: blocos de linhas diferentes
    // continuam registrados mesmo que possuam o mesmo texto narrativo.
    const record = header + item.content;
    if (current.includes(record) || next.includes(record)) {
      ignored += 1;
      continue;
    }
    next += (next && !next.endsWith('\n') ? '\n' : '') + (next ? '\n' : '') + record + '\n';
    archived += 1;
  }

  if (!dryRun && archived) fs.writeFileSync(GENERAL_SCENES_PATH, next, 'utf8');
  return { archived, ignored };
}

function generalScenesReport() {
  if (!fs.existsSync(GENERAL_SCENES_PATH)) return { count: 0, entries: [] };
  const content = fs.readFileSync(GENERAL_SCENES_PATH, 'utf8');
  const expression = /^=+\r?\nBLOCO NÃO IDENTIFICADO\r?\nOrigem:\r?\n(.+)\r?\nLinha inicial:\r?\n(\d+)\r?\nLinha final:\r?\n(\d+)\r?\n=+$/gmu;
  const entries = [];
  let match;
  while ((match = expression.exec(content)) !== null) {
    entries.push({ origin: match[1], startLine: Number(match[2]), endLine: Number(match[3]) });
  }
  return { count: entries.length, entries };
}

function writeGeneralScenesReport() {
  const general = generalScenesReport();
  const details = general.entries.map(entry => [
    `Origem: ${entry.origin}`,
    `Linhas: ${entry.startLine}-${entry.endLine}`,
    'Motivo: nenhum NPC pôde ser identificado com segurança por nome, sobrenome, título, aliases e contexto textual.'
  ].join('\n'));
  const report = [
    'RELATÓRIO DE CENAS GERAIS',
    '==========================',
    `Quantidade de blocos enviados para CENAS_GERAIS.md: ${general.count}`,
    '',
    details.length ? details.map((detail, index) => `Bloco ${index + 1}\n${detail}`).join('\n\n') : 'Nenhum bloco arquivado.'
  ].join('\n');
  fs.writeFileSync(GENERAL_REPORT_PATH, report, 'utf8');
  return general;
}

function reportList(title, values) {
  return `${title}: ${values.length}\n${values.length ? values.map(value => `- ${value}`).join('\n') : '- Nenhum'}\n`;
}

function main() {
  const requestedPath = process.argv.slice(2).find(argument => argument !== '--dry-run');
  const dryRun = process.argv.includes('--dry-run');
  if (!requestedPath) throw new Error('Uso: node scripts/importar_memoria.js <arquivo-da-pasta-memory>');
  const sourcePath = path.resolve(process.cwd(), requestedPath);
  if (!fs.existsSync(sourcePath) || !fs.statSync(sourcePath).isFile()) throw new Error(`Arquivo não encontrado: ${sourcePath}`);

  const memoryDir = MEMORY_DIR;
  const relative = path.relative(memoryDir, sourcePath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('O arquivo informado deve estar dentro de NPC_LORA/memory.');
  if (sourcePath === GENERAL_SCENES_PATH) throw new Error('CENAS_GERAIS.md é um arquivo de preservação e não deve ser reimportado.');

  const source = fs.readFileSync(sourcePath, 'utf8');
  const catalog = loadNpcCatalog();
  if (!catalog.length) throw new Error(`Nenhuma pasta de NPC encontrada em ${DATASET_DIR}`);
  const extraction = extractBlocks(source);
  const destinationCache = new Map();
  const foundNpcs = new Set();
  const identifiedNpcs = new Set();
  const missingNpcs = new Set();
  const errors = [];
  let copied = 0;
  let duplicates = 0;
  let unidentifiedBlocks = 0;
  const unidentifiedItems = [];

  for (const item of extraction.blocks) {
    // Uma seção de personagem define explicitamente o dono até a próxima seção.
    // Em blocos fenced sem seção, todos os NPCs citados no próprio bloco recebem
    // a cópia (uma interação pode pertencer a mais de um dataset).
    const npcs = item.ownerText ? findNpcs(item.ownerText, catalog) : findNpcs(item.content, catalog);
    if (!npcs.length) {
      unidentifiedBlocks += 1;
      unidentifiedItems.push(item);
      missingNpcs.add(`Bloco sem NPC identificado (linhas ${item.startLine}-${item.endLine})`);
      continue;
    }
    for (const npc of npcs) {
      foundNpcs.add(npc.fullName);
      const folderPath = path.join(DATASET_DIR, npc.folder);
      const destination = path.join(folderPath, item.kind === 'dialog' ? DIALOG_FILE : SCENE_FILE);
      if (!fs.existsSync(folderPath)) {
        missingNpcs.add(`${npc.fullName} (pasta ausente: ${npc.folder})`);
        continue;
      }
      identifiedNpcs.add(npc.fullName);
      try {
        if (!destinationCache.has(destination)) destinationCache.set(destination, fs.existsSync(destination) ? fs.readFileSync(destination, 'utf8') : '');
        if (appendUnique(destination, item.content, destinationCache)) copied += 1;
        else duplicates += 1;
      } catch (error) {
        errors.push(`${npc.fullName}, linhas ${item.startLine}-${item.endLine}: ${error.message}`);
      }
    }
  }

  // Escreve cada destino somente uma vez, importante para milhares de blocos.
  if (!dryRun) {
    for (const [destination, content] of destinationCache) {
      try { fs.writeFileSync(destination, content, 'utf8'); }
      catch (error) { errors.push(`${destination}: ${error.message}`); }
    }
  }
  const archived = archiveUnidentifiedBlocks(path.basename(sourcePath), unidentifiedItems, dryRun);
  const general = dryRun ? generalScenesReport() : writeGeneralScenesReport();
  if (!extraction.blocks.length) errors.push('Nenhum bloco importável foi reconhecido. Use seções PERSONAGEM> ou blocos cercados por ```.' );

  const report = [
    'RELATÓRIO DE IMPORTAÇÃO DE MEMÓRIA',
    '==================================',
    `Arquivo importado: ${sourcePath}`,
    `Modo: ${dryRun ? 'simulação (nenhum dataset foi alterado)' : 'importação'}`,
    `Formato detectado: ${extraction.format}`,
    `Quantidade de blocos: ${extraction.blocks.length}`,
    `Quantidade de blocos copiados: ${copied}`,
    `Quantidade de duplicatas ignoradas: ${duplicates}`,
    `Quantidade de blocos sem associação segura: ${unidentifiedBlocks}`,
    `Quantidade de blocos arquivados em CENAS_GERAIS.md: ${archived.archived}`,
    `Quantidade de blocos já arquivados ignorados: ${archived.ignored}`,
    `Total atual de blocos em CENAS_GERAIS.md: ${general.count}`,
    '',
    reportList('NPCs encontrados', [...foundNpcs].sort()),
    reportList('NPCs identificados', [...identifiedNpcs].sort()),
    reportList('NPCs não encontrados', [...missingNpcs].sort()),
    reportList('Erros encontrados', errors)
  ].join('\n');
  fs.writeFileSync(REPORT_PATH, report, 'utf8');

  console.log(`Importação concluída: ${copied} copiado(s), ${duplicates} duplicata(s) ignorada(s), ${archived.archived} arquivado(s) em CENAS_GERAIS.`);
  console.log(`Relatório: ${REPORT_PATH}`);
  if (errors.length) process.exitCode = 2;
}

try { main(); }
catch (error) {
  console.error(`ERRO: ${error.message}`);
  try { fs.writeFileSync(REPORT_PATH, `RELATÓRIO DE IMPORTAÇÃO DE MEMÓRIA\n\nErros encontrados:\n- ${error.message}\n`, 'utf8'); } catch (_) { /* nada a fazer */ }
  process.exitCode = 1;
}
