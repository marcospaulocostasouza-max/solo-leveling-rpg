const fs = require('fs');

const files = [
  'NPC_LORA/memory/Manual_Interpretacao_Lote1_01a30.md',
  'NPC_LORA/memory/Base_Conhecimento_Personagens_Lote02.md',
  'NPC_LORA/memory/Base_Conhecimento_Personagens_Lote03.md',
  'NPC_LORA/memory/Forma_de_Falar_Personagens.md'
];

// Busca por padrões alternativos para os personagens não encontrados
const alvos = [
  { nome: 'entidade_mae', padroes: [/Entidade/i, /M[ãa]e/i] },
  { nome: 'haanit', padroes: [/H['\u2019]aanit/i, /Haanit/i] },
  { nome: 'vide_o_corruptor', padroes: [/Vide/i, /Corruptor/i] }
];

for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    for (const alvo of alvos) {
      const match = alvo.padroes.some(p => p.test(line));
      if (match) {
        console.log(`${f} L${i+1}: ${line.trim().substring(0, 120)}`);
      }
    }
  }
}