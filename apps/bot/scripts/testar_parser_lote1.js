const fs = require('fs');

// Lê o Lote1
const content = fs.readFileSync('NPC_LORA/memory/Manual_Interpretacao_Lote1_01a30.md', 'utf8');
const lines = content.split('\n');

// Ophilia começa na linha 9 (index 8) e Cyrus começa na linha 187 (index 186)
const inicioOphilia = 8;
const inicioCyrus = 186;

// Extrai o bloco do Ophilia
const bloco = lines.slice(inicioOphilia, inicioCyrus);

console.log('=== BLOCO OPHILIA (Lote1) ===');
console.log('Total linhas:', bloco.length);
console.log();

// Detecta seções
const secoes = [];
const secMarkers = [
  { nome: 'cabecalho', regex: /^##\s+[^0-9]/, inicioImediato: true },
  { nome: 'identidade', regex: /^##\s+1\.\s+Identidade/i },
  { nome: 'resumo', regex: /^-\s+Resumo do Personagem/i },
  { nome: 'historia', regex: /^##\s+3\.\s+Hist[óo]ria/i },
  { nome: 'personalidade', regex: /^##\s+4\.\s+Personalidade/i },
  { nome: 'interpretacao', regex: /^-\s+Forma de Interpreta[çc][ãa]o/i },
  { nome: 'falar', regex: /^-\s+Forma de Falar/i },
  { nome: 'valores', regex: /^##\s+7\.\s+Valores/i },
  { nome: 'gostos', regex: /^##\s+8\.\s+Gostos/i },
  { nome: 'desgostos', regex: /^##\s+9\.\s+Desgostos/i },
  { nome: 'traumas', regex: /^##\s+10\.\s+Traumas/i },
  { nome: 'relacionamentos', regex: /^##\s+11\.\s+Relacionamentos/i },
  { nome: 'objetivos', regex: /^##\s+12\.\s+Objetivos/i },
  { nome: 'conhecimentos', regex: /^##\s+13\.\s+Conhecimentos/i },
  { nome: 'curiosidades', regex: /^##\s+14\.\s+Curiosidades/i },
  { nome: 'lacunas', regex: /^##\s+15\.\s+Lacunas/i },
  { nome: 'regras', regex: /^-\s+Regras Absolutas/i }
];

for (let i = 0; i < bloco.length; i++) {
  const line = bloco[i].trim();
  for (const sec of secMarkers) {
    if (sec.regex.test(line)) {
      secoes.push({ nome: sec.nome, linha: i, texto: line });
      break;
    }
  }
}

console.log('Seções detectadas:');
for (const s of secoes) {
  console.log(`  L${s.linha}: ${s.nome} -> ${s.texto.substring(0, 60)}`);
}

// Extrai o conteúdo de cada seção
console.log('\n=== CONTEÚDO DAS SEÇÕES ===');
for (let i = 0; i < secoes.length; i++) {
  const sec = secoes[i];
  const fim = i < secoes.length - 1 ? secoes[i + 1].linha : bloco.length;
  const conteudoLinhas = bloco.slice(sec.linha, fim);
  
  // Remove a primeira linha (o marcador) e linhas de rodapé
  let corpo = conteudoLinhas.slice(1).filter(l => {
    const t = l.trim();
    return !/^Manual de Interpretação de PersonagensPágina \d+$/.test(t) &&
           !/^Base de Conhecimento de Personagens/.test(t) &&
           !/^Forma de Falar — Base de Interpretação de PersonagensPágina \d+$/.test(t);
  });
  
  // Limpa: remove ##, junta linhas quebradas
  let limpo = [];
  for (const l of corpo) {
    let t = l.trim();
    t = t.replace(/^##\s+/, '');
    if (t === '•') t = '• ';
    if (t.length === 0) continue;
    limpo.push(t);
  }
  
  console.log(`\n--- ${sec.nome} (${limpo.length} linhas) ---`);
  for (let j = 0; j < Math.min(3, limpo.length); j++) {
    console.log(`  ${limpo[j].substring(0, 100)}`);
  }
  if (limpo.length > 3) {
    console.log(`  ... mais ${limpo.length - 3} linhas`);
  }
}