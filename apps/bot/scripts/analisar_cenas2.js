const fs = require('fs');
const path = require('path');

const content = fs.readFileSync('NPC_LORA/memory/Cenas.md', 'utf8');
const lines = content.split('\n');

// Lista as pastas do dataset
const datasetDir = 'NPC_LORA/dataset';
const pastas = fs.readdirSync(datasetDir, { withFileTypes: true })
  .filter(d => d.isDirectory() && d.name !== '_TEMPLATE')
  .map(d => d.name)
  .sort();

// Normaliza nome para pasta
function normalizarParaPasta(nome) {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['\u2019,]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

// Encontra todos os cabeçalhos de personagem
const cabecalhos = [];
for (let i = 0; i < lines.length; i++) {
  const t = lines[i].trim();
  if (/^[A-ZÀ-Ý][A-Za-zÀ-ÿ'\- ]+ — ["""]/.test(t) && t.length < 120) {
    const nome = t.split(' — ')[0].trim();
    const nomeNorm = normalizarParaPasta(nome);
    cabecalhos.push({ linha: i, nome, nomeNorm, texto: t });
  }
}

console.log('=== CABEÇALHOS ENCONTRADOS ===');
const nomesEncontrados = new Set();
for (const c of cabecalhos) {
  console.log(`L${c.linha+1}: ${c.nome} -> ${c.nomeNorm} ${pastas.includes(c.nomeNorm) ? 'OK' : 'NAO_ENCONTRADO'}`);
  nomesEncontrados.add(c.nomeNorm);
}

console.log('\n=== PERSONAGENS FALTANTES ===');
for (const p of pastas) {
  if (!nomesEncontrados.has(p)) {
    console.log(' ', p);
  }
}

// Verifica seções internas (# 1 — DIÁLOGOS, # 2 — CENAS, etc)
console.log('\n=== SEÇÕES INTERNAS ===');
const secoes = new Set();
for (let i = 0; i < lines.length; i++) {
  const t = lines[i].trim();
  if (/^#\s+\d+\s*—\s+/i.test(t) || /^#\s+\d+\.\s+/i.test(t)) {
    secoes.add(`L${i+1}: ${t.substring(0, 80)}`);
  }
}
for (const s of secoes) {
  console.log(' ', s);
}

// Conta seções únicas
const secoesUnicas = [...secoes].map(s => s.split(': ')[1].split(' — ')[0].trim());
console.log('\nTotal seções únicas:', new Set(secoesUnicas).size);