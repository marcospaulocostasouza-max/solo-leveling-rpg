const fs = require('fs');

const files = [
  'NPC_LORA/memory/Manual_Interpretacao_Lote1_01a30.md',
  'NPC_LORA/memory/Base_Conhecimento_Personagens_Lote02.md',
  'NPC_LORA/memory/Base_Conhecimento_Personagens_Lote03.md',
  'NPC_LORA/memory/Forma_de_Falar_Personagens.md'
];

for (const f of files) {
  const c = fs.readFileSync(f, 'utf8');
  const lines = c.split('\n');
  console.log('=== ' + f + ' ===');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Linhas que parecem cabeçalho de personagem
    if (/^##\s+\S/.test(line) && !/^##\s+\d+\./.test(line)) {
      if (!/ÍNDICE|BASE DE|PERSONAGENS|FORMA DE FALAR|Octopath Traveler|Manual de/.test(line)) {
        console.log('  L' + i + ': ' + line);
      }
    }
  }
  console.log();
}