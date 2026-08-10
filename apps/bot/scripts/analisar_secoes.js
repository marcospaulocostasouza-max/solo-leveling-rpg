const fs = require('fs');

const files = [
  'NPC_LORA/memory/Manual_Interpretacao_Lote1_01a30.md',
  'NPC_LORA/memory/Base_Conhecimento_Personagens_Lote02.md',
  'NPC_LORA/memory/Base_Conhecimento_Personagens_Lote03.md',
  'NPC_LORA/memory/Forma_de_Falar_Personagens.md'
];

// Padrões de seção nos documentos
const secoes = [
  /^##\s+1\.\s+Identidade/i,
  /^##\s+2\.\s+Resumo/i,
  /^##\s+3\.\s+História/i,
  /^##\s+4\.\s+Personalidade/i,
  /^##\s+5\.\s+Forma de Interpretação/i,
  /^##\s+6\.\s+Forma de Falar/i,
  /^##\s+7\.\s+Valores/i,
  /^##\s+8\.\s+Gostos/i,
  /^##\s+9\.\s+Desgostos/i,
  /^##\s+10\.\s+Traumas/i,
  /^##\s+11\.\s+Relacionamentos/i,
  /^##\s+12\.\s+Objetivos/i,
  /^##\s+13\.\s+Conhecimentos/i,
  /^##\s+14\.\s+Curiosidades/i,
  /^##\s+15\.\s+Lacunas/i,
  /^##\s+16\.\s+Regras/i,
  /^-\s+Resumo do Personagem/i,
  /^-\s+Forma de Interpretação/i,
  /^-\s+Forma de Falar/i,
  /^-\s+Regras Absolutas/i,
  /^##\s+1\.\s+Identidade/i,
];

// No Lote 2/3, o formato é diferente: o nome do personagem não tem ##
// Vamos ver os padrões de cada arquivo

for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  console.log('===== ' + f + ' =====');
  
  // Conta ocorrências de cada padrão de seção
  const contagem = {};
  const exemplos = {};
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    for (const sec of secoes) {
      if (sec.test(line)) {
        const key = sec.toString();
        if (!contagem[key]) {
          contagem[key] = 0;
          exemplos[key] = [];
        }
        contagem[key]++;
        if (exemplos[key].length < 3) {
          exemplos[key].push('L' + (i+1) + ': ' + line.substring(0, 80));
        }
      }
    }
  }
  
  for (const [key, count] of Object.entries(contagem)) {
    console.log(`  ${key}: ${count} ocorrências`);
    for (const ex of exemplos[key]) {
      console.log(`    ${ex}`);
    }
  }
  
  // Também mostra linhas que são apenas "- " (possíveis marcadores de seção)
  console.log('\n  --- Linhas "- ..." (possíveis seções sem ##): ---');
  let countDash = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (/^-\s+\S/.test(line) && /[A-Za-zÀ-ÿ]/.test(line) && line.length < 80 && !line.startsWith('- ' + '"')) {
      countDash++;
      if (countDash <= 5) console.log(`    L${i+1}: ${line}`);
    }
  }
  if (countDash > 5) console.log(`    ... e mais ${countDash - 5}`);
  console.log();
}