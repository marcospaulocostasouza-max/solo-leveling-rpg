#!/usr/bin/env node
'use strict';

/**
 * Gera um dataset JSONL conversacional para fine-tuning a partir de NPC_LORA.
 *
 * Este gerador nunca altera os arquivos-fonte. O conteúdo de cada exemplo é
 * copiado literalmente; a única informação acrescentada é a mensagem system
 * exigida pelo formato de treinamento. Execute com:
 *   node scripts/gerar_dataset_jsonl.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const NPC_ROOT = path.join(ROOT, 'NPC_LORA');
const DATASET_ROOT = path.join(NPC_ROOT, 'dataset');
const TRAINING_ROOT = path.join(NPC_ROOT, 'training');
const OUTPUT = path.join(TRAINING_ROOT, 'dataset.jsonl');
const REPORT = path.join(ROOT, 'RELATORIO_DATASET.txt');
const MAX_EXAMPLE_CHARS = 12000;

const SECTIONS = [
  '01_identity.md', '02_summary.md', '03_history.md', '04_personality.md',
  '05_interpretation.md', '06_speech.md', '07_values.md', '08_likes.md',
  '09_dislikes.md', '10_traumas.md', '11_relationships.md', '12_goals.md',
  '13_knowledge.md', '14_curiosities.md', '15_narrative_gaps.md',
  '16_absolute_rules.md', '17_dialog_examples.md', '18_scene_examples.md'
];
const EXAMPLE_SECTIONS = new Set(['17_dialog_examples.md', '18_scene_examples.md']);

function readUtf8(file) {
  const buffer = fs.readFileSync(file);
  // BOM UTF-16 e NULs caracterizam uma codificação incompatível com UTF-8.
  if ((buffer[0] === 0xff && buffer[1] === 0xfe) || (buffer[0] === 0xfe && buffer[1] === 0xff) || buffer.includes(0)) {
    throw new Error('codificação não UTF-8');
  }
  const value = buffer.toString('utf8');
  if (value.includes('\uFFFD')) throw new Error('possível corrupção de codificação UTF-8');
  return value;
}

function lineValue(content, label) {
  const found = content.match(new RegExp(`^\\s*${label}\\s*:\\s*(.+)$`, 'imu'));
  return found ? found[1].trim() : '';
}

function npcName(folder, identity) {
  const declared = lineValue(identity, 'Nome');
  if (declared) return declared;
  return identity.split(/\r?\n/).map(line => line.trim()).find(Boolean) || folder.replace(/_/g, ' ');
}

function normalizeName(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function numberedStarts(content) {
  const starts = [];
  // Aceita tanto "1." quanto "1\\." de arquivos antigos, mas só usa linhas
  // iniciadas por numeração: isso evita quebrar diálogos e cenas internamente.
  const expression = /^\s*\d+\\?\.\s+(?:\(|\S)/gmu;
  let match;
  while ((match = expression.exec(content)) !== null) starts.push(match.index);
  return starts;
}

function splitAtNaturalBoundaries(content) {
  if (content.length <= MAX_EXAMPLE_CHARS) return [content];
  const pieces = [];
  let remaining = content;
  while (remaining.length > MAX_EXAMPLE_CHARS) {
    const window = remaining.slice(0, MAX_EXAMPLE_CHARS);
    let cut = window.lastIndexOf('\n\n');
    if (cut >= Math.floor(MAX_EXAMPLE_CHARS * 0.5)) {
      // A quebra entre parágrafos pertence ao trecho anterior e é preservada.
      cut += 2;
    } else {
      const sentence = /[.!?](?:[”"'»)]*)\s+/gu;
      let found = null;
      let match;
      while ((match = sentence.exec(window)) !== null) found = match;
      if (found && found.index >= Math.floor(MAX_EXAMPLE_CHARS * 0.5)) cut = found.index + found[0].length;
    }
    // Um parágrafo/frase maior que o limite continua inteiro para nunca cortar texto.
    if (!cut) break;
    pieces.push(remaining.slice(0, cut));
    remaining = remaining.slice(cut);
  }
  pieces.push(remaining);
  return pieces;
}

function splitExamples(content, section) {
  if (!EXAMPLE_SECTIONS.has(section)) return splitAtNaturalBoundaries(content);
  const starts = numberedStarts(content);
  if (!starts.length) return splitAtNaturalBoundaries(content);

  const blocks = [];
  // Texto anterior à primeira entrada (por exemplo, cabeçalho ou material
  // legado) também é exportado sem sofrer nenhuma alteração.
  if (starts[0] > 0) blocks.push(content.slice(0, starts[0]));
  for (let index = 0; index < starts.length; index += 1) {
    const end = index + 1 < starts.length ? starts[index + 1] : content.length;
    blocks.push(content.slice(starts[index], end));
  }
  return blocks.flatMap(splitAtNaturalBoundaries).filter(block => block.length > 0);
}

function listNpcFolders() {
  return fs.readdirSync(DATASET_ROOT, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && entry.name !== '_TEMPLATE')
    .map(entry => entry.name)
    .sort((left, right) => left.localeCompare(right));
}

function validateRuntimeIds(folders, errors, ignored) {
  const dataDir = path.join(ROOT, 'src', 'npc', 'data');
  if (!fs.existsSync(dataDir)) return;
  const datasetByName = new Map();
  for (const folder of folders) {
    try {
      const identity = readUtf8(path.join(DATASET_ROOT, folder, '01_identity.md'));
      datasetByName.set(normalizeName(npcName(folder, identity)), folder);
    } catch (_) { /* A validação principal do arquivo registra esse erro depois. */ }
  }
  const ids = new Map();
  for (const entry of fs.readdirSync(dataDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
    const file = path.join(dataDir, entry.name);
    try {
      const json = JSON.parse(readUtf8(file));
      if (!json.id) { errors.push(`${path.relative(ROOT, file)}: id ausente`); continue; }
      const files = ids.get(json.id) || [];
      files.push(file);
      ids.set(json.id, files);
      if (!folders.includes(json.id)) {
        const matchingDataset = datasetByName.get(normalizeName(json.nome));
        if (matchingDataset) {
          ignored.push(`${path.relative(ROOT, file)}: id legado "${json.id}" associado por nome ao dataset ${matchingDataset}`);
        } else {
          ignored.push(`${path.relative(ROOT, file)}: JSON de runtime sem dataset de treinamento correspondente (${json.id})`);
        }
      }
    } catch (error) {
      errors.push(`${path.relative(ROOT, file)}: JSON inválido (${error.message})`);
    }
  }
  for (const [id, files] of ids) if (files.length > 1) errors.push(`id de NPC duplicado "${id}": ${files.map(file => path.basename(file)).join(', ')}`);
}

function estimateTokens(characters) {
  // Estimativa conservadora para português em tokenizadores BPE modernos.
  return Math.ceil(characters / 3.8);
}

function list(title, values) {
  return `${title} (${values.length})\n${values.length ? values.map(value => `- ${value}`).join('\n') : '- Nenhum'}\n`;
}

function main() {
  if (!fs.existsSync(DATASET_ROOT)) throw new Error(`Dataset não encontrado: ${DATASET_ROOT}`);
  const folders = listNpcFolders();
  const errors = [];
  const missing = [];
  const empty = [];
  const ignored = [];
  const perNpc = new Map();
  const perSection = new Map(SECTIONS.map(section => [section, 0]));
  const examples = [];
  const seen = new Set();
  let duplicates = 0;
  let sourceCharacters = 0;

  validateRuntimeIds(folders, errors, ignored);

  for (const folder of folders) {
    const npcDir = path.join(DATASET_ROOT, folder);
    const identityPath = path.join(npcDir, '01_identity.md');
    let identity = '';
    try { identity = readUtf8(identityPath); }
    catch (error) { errors.push(`${folder}/01_identity.md: ${error.message}`); }
    const name = npcName(folder, identity);
    let npcExamples = 0;

    for (const section of SECTIONS) {
      const file = path.join(npcDir, section);
      if (!fs.existsSync(file)) {
        missing.push(`${folder}/${section}`);
        continue;
      }
      let content;
      try { content = readUtf8(file); }
      catch (error) { errors.push(`${folder}/${section}: ${error.message}`); continue; }
      if (!content.length || !content.trim()) {
        empty.push(`${folder}/${section}`);
        continue;
      }

      const blocks = splitExamples(content, section);
      if (!blocks.length) {
        ignored.push(`${folder}/${section}: nenhum bloco reconhecido`);
        continue;
      }
      if (blocks.join('') !== content) {
        errors.push(`${folder}/${section}: a divisão não preservou integralmente o conteúdo`);
        continue;
      }
      for (const block of blocks) {
        // A chave inclui o NPC: um mesmo texto em NPCs diferentes pode ser um
        // fato válido de ambos e não deve ser removido por associação cruzada.
        const key = `${folder}\u0000${block}`;
        if (seen.has(key)) { duplicates += 1; continue; }
        seen.add(key);
        examples.push({
          messages: [
            { role: 'system', content: `Você é ${name}.` },
            { role: 'assistant', content: block }
          ]
        });
        sourceCharacters += block.length;
        npcExamples += 1;
        perSection.set(section, perSection.get(section) + 1);
      }
    }
    if (!npcExamples) errors.push(`${folder}: personagem sem exemplos exportáveis`);
    perNpc.set(folder, npcExamples);
  }

  if (missing.length || empty.length || errors.length) {
    errors.push('Exportação interrompida: corrija os problemas estruturais antes de gerar dataset.jsonl.');
  }

  let jsonl = '';
  if (!errors.length) {
    jsonl = examples.map(example => JSON.stringify(example)).join('\n') + (examples.length ? '\n' : '');
    // Validação integral do que será escrito, linha por linha.
    jsonl.split('\n').filter(Boolean).forEach((line, index) => {
      try { JSON.parse(line); }
      catch (error) { errors.push(`dataset.jsonl linha ${index + 1}: JSON inválido (${error.message})`); }
    });
  }

  if (!errors.length) {
    fs.mkdirSync(TRAINING_ROOT, { recursive: true });
    fs.writeFileSync(OUTPUT, jsonl, 'utf8');
  }

  const datasetBytes = !errors.length ? Buffer.byteLength(jsonl, 'utf8') : 0;
  const report = [
    'RELATÓRIO DE GERAÇÃO DE DATASET JSONL',
    '=====================================',
    `Total de NPCs: ${folders.length}`,
    `Total de exemplos: ${examples.length}`,
    `Total de linhas: ${errors.length ? 0 : examples.length}`,
    `Total de caracteres de conteúdo: ${sourceCharacters}`,
    `Estimativa de tokens: ${estimateTokens(sourceCharacters)}`,
    `Tamanho final do dataset: ${datasetBytes} bytes`,
    `Duplicatas idênticas removidas: ${duplicates}`,
    '',
    list('Exemplos por NPC', [...perNpc.entries()].map(([id, count]) => `${id}: ${count}`)),
    list('Exemplos por seção', SECTIONS.map(section => `${section}: ${perSection.get(section)}`)),
    list('Arquivos vazios', empty),
    list('Arquivos inexistentes', missing),
    list('Arquivos ignorados', ignored),
    list('Erros encontrados', errors),
    errors.length ? 'DATASET PRONTO PARA FINE-TUNING?\nNÃO' : 'DATASET PRONTO PARA FINE-TUNING?\nSIM'
  ].join('\n');
  fs.writeFileSync(REPORT, report, 'utf8');

  if (errors.length) {
    console.error(`Geração interrompida. Relatório: ${REPORT}`);
    process.exitCode = 1;
    return;
  }
  console.log(`Dataset gerado: ${OUTPUT}`);
  console.log(`${examples.length} exemplos; ${datasetBytes} bytes; relatório: ${REPORT}`);
}

try { main(); }
catch (error) {
  fs.writeFileSync(REPORT, `RELATÓRIO DE GERAÇÃO DE DATASET JSONL\n\nErros encontrados (1)\n- ${error.message}\n`, 'utf8');
  console.error(`ERRO: ${error.message}`);
  process.exitCode = 1;
}
