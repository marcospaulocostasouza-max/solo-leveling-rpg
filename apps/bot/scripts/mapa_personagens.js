const fs = require('fs');
const path = require('path');

// Lista as pastas do dataset (personagens)
const datasetDir = 'NPC_LORA/dataset';
const pastas = fs.readdirSync(datasetDir, { withFileTypes: true })
  .filter(d => d.isDirectory() && d.name !== '_TEMPLATE')
  .map(d => d.name)
  .sort();

// Função para normalizar nome de personagem para formato de pasta
function normalizarParaPasta(nome) {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

// Lê os 4 arquivos de memória
const files = [
  'NPC_LORA/memory/Manual_Interpretacao_Lote1_01a30.md',
  'NPC_LORA/memory/Base_Conhecimento_Personagens_Lote02.md',
  'NPC_LORA/memory/Base_Conhecimento_Personagens_Lote03.md',
  'NPC_LORA/memory/Forma_de_Falar_Personagens.md'
];

const conteudos = {};
for (const f of files) {
  conteudos[f] = fs.readFileSync(f, 'utf8').split('\n');
}

// Procura cada personagem nos arquivos
console.log('=== MAPA DE PERSONAGENS NOS ARQUIVOS ===\n');

for (const pasta of pastas) {
  const nomeNorm = pasta;
  let encontrado = false;
  let ocorrencias = [];
  
  for (const f of files) {
    const lines = conteudos[f];
    const nomeDisplay = pasta.split('_').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // Procura padrão: ## Nome (com espaços, sem acentos necessariamente)
      if (line.startsWith('## ')) {
        const resto = line.substring(3).trim();
        // Remove rótulos de seção
        if (/^\d+\./.test(resto)) continue;
        // Verifica se o nome corresponde
        const norm = normalizarParaPasta(resto.split('[')[0].split('(')[0].trim());
        if (norm === nomeNorm) {
          ocorrencias.push({ arquivo: path.basename(f), linha: i + 1, texto: line });
          encontrado = true;
        }
      }
    }
  }
  
  if (!encontrado) {
    console.log(`${pasta}: NAO ENCONTRADO`);
  } else {
    for (const o of ocorrencias) {
      console.log(`${pasta}: ${o.arquivo}:L${o.linha} -> ${o.texto}`);
    }
  }
}