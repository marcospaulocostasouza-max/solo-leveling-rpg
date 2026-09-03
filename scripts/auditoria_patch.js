/**
 * Auditoria temporária do patch de Técnicas e Estilos de Luta.
 * Verifica integridade, cobertura de comandos e aliases.
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "apps", "bot", "src");
const { estilos, listarEstilos, getTecnicasEstilo } = require(path.join(root, "tecnicas", "estilos"));
const { resolverConsultaClasse } = require(path.join(root, "commands", "tecnicasClasse"));

const estiloCatalogo = listarEstilos();
console.log("=== AUDITORIA DO PATCH ===\n");

// ---- 1. Estilos ----
console.log(`[1] Total estilos registrados: ${estiloCatalogo.length}`);

let totalTecnicas = 0;
const colTecnicas = [];
for (const estilo of estiloCatalogo) {
    const mod = getTecnicasEstilo(estilo.chave);
    if (!mod) { console.log(`    MISSING MOD: ${estilo.chave}`); continue; }
    const tecs = [];
    if (mod.tecnicaInicial && mod.tecnicaInicial.nome) tecs.push(mod.tecnicaInicial);
    if (Array.isArray(mod.tecnicas)) tecs.push(...mod.tecnicas.filter(t => t && t.nome));
    totalTecnicas += tecs.length;
    colTecnicas.push({ chave: estilo.chave, nome: estilo.nome, total: tecs.length });
}
console.log(`[2] Total técnicas de estilo: ${totalTecnicas}`);
const incompletos = colTecnicas.filter(c => c.total !== 9);
console.log(`[3] Estilos sem 9 técnicas: ${incompletos.length}`);
if (incompletos.length) console.log(JSON.stringify(incompletos, null, 2));

// ---- 2. Duplicidades ----
const nomes = new Map();
const slugs = new Map();
let dupNomes = 0, dupSlugs = 0;
for (const estilo of estiloCatalogo) {
    const mod = getTecnicasEstilo(estilo.chave);
    if (!mod) continue;
    const tecs = [];
    if (mod.tecnicaInicial && mod.tecnicaInicial.nome) tecs.push(mod.tecnicaInicial);
    if (Array.isArray(mod.tecnicas)) tecs.push(...mod.tecnicas.filter(t => t && t.nome));
    for (const t of tecs) {
        const n = String(t.nome).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
        const s = n.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
        if (nomes.has(n)) { dupNomes++; console.log(`    NOME DUP: ${t.nome} (${nomes.get(n)} vs ${estilo.nome})`); }
        else nomes.set(n, estilo.nome);
        if (slugs.has(s)) { dupSlugs++; console.log(`    SLUG DUP: ${t.nome} slug=${s}`); }
        else slugs.set(s, estilo.nome);
    }
}
console.log(`[4] Nomes duplicados: ${dupNomes}`);
console.log(`[5] Slugs duplicados: ${dupSlugs}`);

// ---- 3. Arquivos na pasta ----
const dirEstilos = path.join(root, "tecnicas", "estilos");
const arquivos = fs.readdirSync(dirEstilos).filter(f => f.endsWith(".js") && f !== "index.js");
const orfaos = arquivos.filter(f => !estilos[path.basename(f, ".js")]);
console.log(`[6] Arquivos na pasta estilos: ${arquivos.length}`);
console.log(`[7] Arquivos órfãos (sem registro): ${JSON.stringify(orfaos)}`);

// ---- 4. Comandos no commandHandler ----
const commandHandlerContent = fs.readFileSync(path.join(root, "core", "commandHandler.js"), "utf8");
const faltando = [];
for (const estilo of estiloCatalogo) {
    const k = estilo.chave;
    const comandoGeral = "!" + k;
    const comandoEspacos = "!" + k.replace(/_/g, " ");
    const existe = commandHandlerContent.includes(comandoGeral) || commandHandlerContent.includes(comandoEspacos);
    if (!existe) faltando.push({ chave: k, nome: estilo.nome });
}
console.log(`[8] Estilos sem comando direto no commandHandler: ${faltando.length}`);
if (faltando.length) console.log(JSON.stringify(faltando, null, 2));

// ---- 5. Chaves no tecnicasClasse ----
const tecClasseContent = fs.readFileSync(path.join(root, "commands", "tecnicasClasse.js"), "utf8");
const semAlias = [];
for (const estilo of estiloCatalogo) {
    const k = estilo.chave;
    const kNorm = k.replace(/_/g, "");
    let encontrado = false;
    // verificar forma simples
    if (tecClasseContent.includes(`"${k.replace(/_/g, " ")}"`)) encontrado = true;
    if (tecClasseContent.includes(`"${k}"`)) encontrado = true;
    if (!encontrado) semAlias.push({ chave: k, nome: estilo.nome });
}
console.log(`[9] Estilos sem chave no tecnicasClasse: ${semAlias.length}`);
if (semAlias.length) console.log(JSON.stringify(semAlias, null, 2));

// ---- 6. Técnicas gerais ----
for (const nome of ["lutador", "assassino", "ranger"]) {
    try {
        const mod = require(path.join(root, "tecnicas", "iniciais", nome));
        let total = 0;
        if (mod.tecnicaInicial && mod.tecnicaInicial.nome) total++;
        if (Array.isArray(mod.tecnicas)) total += mod.tecnicas.filter(t => t && t.nome).length;
        console.log(`[10] Técnicas gerais ${nome}: ${total}`);
    } catch (e) {
        console.log(`[10] ERRO carregar ${nome}: ${e.message}`);
    }
}

// ---- 7. Custo Maestria ----
const { SISTEMA_MAESTRIA } = require(path.join(root, "tecnicas", "sistemaMaestria"));
const custos = [];
for (let i = 1; i <= 10; i++) custos.push(SISTEMA_MAESTRIA.calcularCusto(i, "Classe"));
console.log(`[11] Curva de Maestria (1-10): ${JSON.stringify(custos)}`);
const temExponencial = custos.some((c, i) => i > 0 && c === custos[i - 1] * 2);
console.log(`[12] Progressão exponencial (dobro): ${temExponencial}`);

// ---- 8. Aliases normalizarEstiloLuta ----
const { obterEstiloCanonico } = require(path.join(root, "utils", "normalizarEstiloLuta"));
const testesAlias = [
    ["Proficiência em Facas", "Proficiência em Facas"],
    ["Proficiência em Adagas", "Proficiência em Adagas"],
    ["Proficiência em Arremessos", "Proficiência em Facas"],
    ["Proficiência em Pistolas", "Proficiência em Pistolas"],
    ["Proficiência em Escopetas", "Proficiência em Escopetas"],
    ["Proficiência em Fuzis", "Proficiência em Fuzis"],
    ["Proficiência em Rifles de Precisão", "Proficiência em Rifles de Precisão"],
    ["Proficiência em Armas de Fogo", "NULL"],
    ["Facas", "Proficiência em Facas"],
    ["Adagas", "Proficiência em Adagas"],
    ["Pistola", "Proficiência em Pistolas"],
    ["Fuzil", "Proficiência em Fuzis"],
    ["Escopeta", "Proficiência em Escopetas"],
    ["Sniper", "Proficiência em Rifles de Precisão"],
    ["Arremesso", "Proficiência em Facas"]
];
console.log("\n[13] Testes de canonicalização de estilo:");
for (const [entrada, esperado] of testesAlias) {
    const resultado = obterEstiloCanonico(entrada);
    console.log(`    ${entrada.padEnd(45)} => ${(resultado || "NULL").padEnd(35)} (esperado: ${esperado})`);
}

// ---- 9. Loja e slots ----
const { ITENS_LOJA } = require(path.join(root, "utils", "lojaItens"));
const InventorySystem = require(path.join(root, "systems", "inventorySystem"));
let totalItens = 0;
let probSlots = 0;
let escudos = [];
for (const [rank, categorias] of Object.entries(ITENS_LOJA)) {
    for (const [categoria, itens] of Object.entries(categorias)) {
        for (const item of itens) {
            totalItens++;
            const fakeItem = { ...item, categoria };
            const slot = InventorySystem.getSlotDoItem(fakeItem);
            if (String(item.nome || "").toLowerCase().includes("escudo")) {
                escudos.push({ nome: item.nome, categoria, slot });
            }
            if ((categoria.includes("Cabeça") && slot !== "Cabeça") ||
                (categoria.includes("Corpo") && slot !== "Corpo") ||
                (categoria.includes("Pernas") && slot !== "Pernas") ||
                (categoria.includes("Pés") && slot !== "Pés") ||
                (categoria.includes("Acess") && slot !== "Acessórios") ||
                (categoria.includes("Apoio") && slot !== "Item de Apoio") ||
                (categoria.includes("Arma 1") && slot !== "Arma 1") ||
                (categoria.includes("Arma 2") && slot !== "Arma 2")) {
                probSlots++;
                console.log(`    SLOT PROBLEMA: ${item.nome} (${categoria}) -> ${slot}`);
            }
        }
    }
}
console.log(`[14] Total itens loja: ${totalItens}`);
console.log(`[15] Problemas de slot: ${probSlots}`);
console.log(`[16] Escudos encontrados: ${escudos.length}`);

// ---- 10. Imports quebrados ----
console.log(`\n[17] Verificação de imports (modo estático)`);
const { registrarSistemas } = require(path.join(root, "core", "registrarSistemas"));
console.log("    registrarSistemas carregado OK");
console.log("");

console.log("=== FIM DA AUDITORIA ===");
