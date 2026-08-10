/**
 * SCRIPT DE TESTE DO RUNTIME DATABASE
 * 
 * Inicializa o Runtime Database e gera relatório com:
 * - Quantidade de NPCs compilados
 * - Tamanho médio do promptBase
 * - Tempo de compilação
 * - Memória utilizada
 * - Comparação entre JSON original e Runtime Object
 * 
 * USO: node scripts/testar_runtime_database.js
 */

const { runtimeDatabase } = require("../src/runtime/RuntimeDatabase");
const NPCManager = require("../src/npc/npcManager");

console.log("=".repeat(80));
console.log("TESTE DO RUNTIME DATABASE - ETAPA 2 (COMPILER)");
console.log("=".repeat(80));
console.log("");

// =====================================
// 1. INICIALIZAR
// =====================================
console.log("[1] Inicializando Runtime Database com RuntimeCompiler...");
const resultado = runtimeDatabase.initialize();

console.log("");
console.log("Resultado da inicialização:");
console.log(JSON.stringify(resultado, null, 2));
console.log("");

// =====================================
// 2. TESTAR FUNÇÕES
// =====================================
console.log("-".repeat(80));
console.log("[2] Testando funções...");
console.log("");

// getNPC
const npcCyrus = runtimeDatabase.getNPC("cyrus_albright");
console.log(`getNPC("cyrus_albright"): ${npcCyrus ? npcCyrus._compilado.nome : "NÃO ENCONTRADO"}`);

// getRuntimeNPC
const runtimeCyrus = runtimeDatabase.getRuntimeNPC("cyrus_albright");
console.log(`getRuntimeNPC("cyrus_albright"): ${runtimeCyrus ? runtimeCyrus.nome : "NÃO ENCONTRADO"}`);

if (runtimeCyrus) {
    console.log("");
    console.log("Exemplo de Runtime NPC (Cyrus Albright):");
    console.log(JSON.stringify(runtimeCyrus, null, 2));
    console.log("");
    console.log("Exemplo de promptBase (início):");
    console.log(runtimeCyrus.promptBase.substring(0, 500) + "...");
    console.log("");
    console.log(`Tamanho do promptBase: ${runtimeCyrus.promptBase.length} caracteres`);
}

const npcInexistente = runtimeDatabase.getNPC("nao_existe");
console.log(`\ngetNPC("nao_existe"): ${npcInexistente ? "ENCONTRADO (ERRO)" : "null (correto)"}`);

// getAllNPCs / getAllRuntimeNPCs
const todos = runtimeDatabase.getAllNPCs();
const todosRuntime = runtimeDatabase.getAllRuntimeNPCs();
console.log(`getAllNPCs(): ${todos.length} NPCs`);
console.log(`getAllRuntimeNPCs(): ${todosRuntime.length} Runtime NPCs`);

// =====================================
// 3. COMPARAÇÃO JSON ORIGINAL vs RUNTIME OBJECT
// =====================================
console.log("");
console.log("-".repeat(80));
console.log("[3] Comparação JSON Original vs Runtime Object:");
console.log("");

// Comparação para alguns NPCs
const npcsParaComparar = ["cyrus_albright", "therion", "primrose_azelhart", "galdera", "vysache"];

for (const id of npcsParaComparar) {
    const comparacao = runtimeDatabase.compararNPC(id);
    if (comparacao) {
        console.log(`### ${comparacao.id}`);
        console.log(`  JSON Original: ${comparacao.tamanhoOriginalBytes} bytes`);
        console.log(`  Runtime Object: ${comparacao.tamanhoRuntimeBytes} bytes`);
        console.log(`  Redução: ${comparacao.reducaoBytes} bytes (${comparacao.reducaoPercentual}%)`);
        console.log(`  PromptBase: ${comparacao.tamanhoPromptBase} caracteres`);
        console.log(`  Campos permanentes: ${comparacao.camposPermanentes}`);
        console.log("");
    }
}

// =====================================
// 4. ESTATÍSTICAS COMPLETAS
// =====================================
console.log("-".repeat(80));
console.log("[4] Estatísticas completas:");
console.log("");

const stats = runtimeDatabase.stats();
console.log(JSON.stringify(stats, null, 2));

// =====================================
// 5. RELATÓRIO FINAL
// =====================================
console.log("");
console.log("=".repeat(80));
console.log("RELATÓRIO FINAL - ETAPA 2");
console.log("=".repeat(80));
console.log("");
console.log(`Quantidade de NPCs compilados: ${stats.quantidadeRuntimeNPCs}`);
console.log(`Tamanho médio do promptBase: ${stats.mediaPromptBaseCaracteres} caracteres`);
console.log(`Total de caracteres promptBase: ${stats.totalPromptBaseCaracteres}`);
console.log(`Tempo de compilação: ${stats.tempoInicializacaoMs.toFixed(2)} ms`);
console.log(`Memória utilizada: ${stats.memoriaUtilizada}`);
console.log(`Memória heap atual: ${stats.memoriaHeapAtual}`);
console.log(`Maior promptBase: ${stats.maiorPromptBaseNPC} (${stats.maiorPromptBaseBytes} bytes)`);