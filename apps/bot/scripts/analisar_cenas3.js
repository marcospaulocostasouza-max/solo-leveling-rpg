const fs = require('fs');

const content = fs.readFileSync('NPC_LORA/memory/Cenas.md', 'utf8');
const lines = content.split('\n');

// Procura padrões de seção: # 1 — DIÁLOGOS, # 2 — CENAS, etc
// O # pode estar escapado como \#
console.log('=== SEÇÕES INTERNAS (padrão # N —) ===');
const secoes = [];
for (let i = 0; i < lines.length; i++) {
  const t = lines[i].trim();
  // Padrão: \# 1 — DIÁLOGOS ou # 1 — DIÁLOGOS
  if (/^\\?#\s+\d+\s*—\s+/i.test(t)) {
    secoes.push({ linha: i, texto: t });
  }
}
for (const s of secoes) {
  console.log(`L${s.linha+1}: ${s.texto.substring(0, 80)}`);
}
console.log('Total seções:', secoes.length);

// Conta seções únicas
const unicas = new Set();
for (const s of secoes) {
  unicas.add(s.texto.split('—')[1]?.trim() || s.texto);
}
console.log('Seções únicas:', unicas.size);
for (const u of unicas) {
  console.log('  ', u);
}

// Verifica "Onette" — pode ser Arcanette
console.log('\n=== VERIFICAÇÃO ONETTE ===');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Onette') && i < 12250) {
    console.log(`L${i+1}: ${lines[i].substring(0, 100)}`);
  }
}

// Verifica os últimos cabeçalhos para entender o final do arquivo
console.log('\n=== ÚLTIMAS LINHAS DO ARQUIVO ===');
const ultimas = lines.slice(-20);
for (let i = 0; i < ultimas.length; i++) {
  console.log(`L${lines.length - 20 + i + 1}: ${ultimas[i].substring(0, 100)}`);
}