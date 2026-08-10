// Teste do cabeçalho de formatação para respostas de NPCs
const { formatarMensagem } = require("./src/utils/messageFormatter");
const NPCManager = require("./src/npc/npcManager");

// Testar com vários NPCs
const npcIds = ["ophilia_clement", "therion", "temenos_mistral", "stia_han", "bargello_yeon"];

for (const id of npcIds) {
    const npc = NPCManager.carregarNPC(id);
    if (!npc) {
        console.log(`[SKIP] NPC não encontrado: ${id}`);
        continue;
    }
    
    const resposta = "*Olá.*\n\n_Um pequeno teste de resposta._";
    const formatada = formatarMensagem(npc, resposta);
    
    console.log(`\n=== ${id} (nome: ${npc.nome}) ===`);
    console.log(formatada);
    console.log("=====================================");
}

// Teste final com a formatação padrão
console.log("\n\n=== VERIFICAÇÃO DO FORMATO EXIGIDO ===");
const npcTeste = { nome: "Ophilia Clement" };
const respostaTeste = "*Resposta de teste.*";
const resultado = formatarMensagem(npcTeste, respostaTeste);
console.log(resultado);

// Validação do formato esperado
const linhas = resultado.split("\n");
const topoOk = linhas[0] === "╔══════════════ ✦ ══════════════╗";
const nomeOk = linhas[1] === "      _*Ophilia Clement*_";
const baixoOk = linhas[2] === "╚══════════════ ✦ ══════════════╝";

console.log("\nResultado da validação:");
console.log(`  Topo: ${topoOk ? "✅" : "❌"} "${linhas[0]}"`);
console.log(`  Nome (com _*): ${nomeOk ? "✅" : "❌"} "${linhas[1]}"`);
console.log(`  Baixo: ${baixoOk ? "✅" : "❌"} "${linhas[2]}"`);
console.log(topoOk && nomeOk && baixoOk ? "\n✅ TODOS OS TESTES PASSARAM!" : "\n❌ TESTE FALHOU");