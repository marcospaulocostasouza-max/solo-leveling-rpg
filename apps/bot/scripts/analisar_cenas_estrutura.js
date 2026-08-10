const fs = require('fs');
const path = require('path');

const cenasPath = path.join(__dirname, '..', 'NPC_LORA', 'memory', 'Cenas.md');
const content = fs.readFileSync(cenasPath, 'utf8');
const lines = content.split('\n');

console.log('=== ANÁLISE DA ESTRUTURA DO Cenas.md ===');
console.log(`Total de linhas: ${lines.length}`);
console.log('');

// Padrões de personagem: "Nome — "Título""
const personagemRegex = /^([A-Za-zÀ-ú]+(?:\s+[A-Za-zÀ-ú]+)*)\s+—\s+"(.+)"\s*$/;

// Padrões de seção: "\# 1 — DIÁLOGOS", "\# 2 — CENAS NARRATIVAS", etc.
const secaoRegex = /^\\?#\s+(\d+)\s+—\s+(.+)$/;

let personagens = [];
let secoes = [];
let currentPersonagem = null;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Verificar se é um personagem
    const pm = line.match(personagemRegex);
    if (pm) {
        currentPersonagem = pm[1].trim();
        personagens.push({ nome: currentPersonagem, linha: i + 1 });
        continue;
    }
    
    // Verificar se é uma seção
    const sm = line.match(secaoRegex);
    if (sm) {
        secoes.push({ secao: sm[2].trim(), numero: sm[1], linha: i + 1, personagem: currentPersonagem });
        continue;
    }
}

console.log('=== PERSONAGENS ENCONTRADOS ===');
personagens.forEach(p => console.log(`  Linha ${p.linha}: ${p.nome}`));
console.log(`Total: ${personagens.length}`);
console.log('');

console.log('=== SEÇÕES ENCONTRADAS (primeiras 40) ===');
secoes.slice(0, 40).forEach(s => console.log(`  Linha ${s.linha}: [${s.numero}] ${s.secao} (personagem: ${s.personagem})`));
console.log(`Total: ${secoes.length}`);
console.log('');

// Verificar seções por personagem
console.log('=== SEÇÕES POR PERSONAGEM ===');
const secoesPorPersonagem = {};
secoes.forEach(s => {
    if (!secoesPorPersonagem[s.personagem]) secoesPorPersonagem[s.personagem] = [];
    secoesPorPersonagem[s.personagem].push(`${s.numero}:${s.secao}`);
});
Object.keys(secoesPorPersonagem).forEach(p => {
    console.log(`  ${p}: ${secoesPorPersonagem[p].join(', ')}`);
});