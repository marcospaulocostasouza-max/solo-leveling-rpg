const fs = require('fs');

const content = fs.readFileSync('NPC_LORA/memory/Cenas.md', 'utf8');
const lines = content.split('\n');

console.log('Total linhas:', lines.length);
console.log('Total bytes:', content.length);
console.log();

// Procura padrões de cabeçalho de personagem
// Ex: "Claude — \"O Fundador Sem Coração dos Corvos Negros\""
// Ex: "## Claude" ou "Claude —"
console.log('=== PADRÕES DE CABEÇALHO ===');
let count = 0;
for (let i = 0; i < lines.length; i++) {
  const t = lines[i].trim();
  
  // Padrão: Nome — "Título" (sem ##)
  if (/^[A-ZÀ-Ý][A-Za-zÀ-ÿ'\- ]+ — ["“”]/.test(t) && t.length < 120) {
    console.log(`L${i+1}: ${t.substring(0, 100)}`);
    count++;
  }
  // Padrão: ## Nome
  else if (/^##\s+[A-ZÀ-Ý]/.test(t) && !/^##\s+\d+\./.test(t) && t.length < 100) {
    console.log(`L${i+1}: ${t.substring(0, 100)}`);
    count++;
  }
}
console.log('\nTotal cabeçalhos encontrados:', count);