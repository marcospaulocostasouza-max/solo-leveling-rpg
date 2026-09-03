/**
 * Teste automatizado do sistema de Técnicas e Estilos de Luta.
 * Valida compra, maestria, proficiência, persistência e mais.
 */

// =====================================
// TESTE 1: Validação de compra
// =====================================
function testarCompatibilidade() {
    console.log("\n=== TESTE: COMPATIBILIDADE DE PROFICIÊNCIA ===");

    const { normalizar, compativel } = require("../apps/bot/src/systems/techniquePurchaseSystem");

    const casos = [
        // [jogador, tecnica, esperado]
        // Personagem com Adagas compra técnica de Adagas → OK
        [{ estilo_luta: "Proficiência em Adagas", classe: "Assassino" }, { categoria: "Proficiencia", classe: "Adagas" }, true],
        // Personagem com Facas compra técnica de Adagas → FALSE (são estilos diferentes)
        [{ estilo_luta: "Proficiência em Facas", classe: "Ranger" }, { categoria: "Proficiencia", classe: "Adagas" }, false],
        // Personagem com Facas compra técnica de Facas → OK
        [{ estilo_luta: "Facas", classe: "Ranger" }, { categoria: "Proficiencia", classe: "Facas" }, true],
        // Personagem antigo com Arremessos compra técnica de Facas → OK (compat legado)
        [{ estilo_luta: "Proficiência em Arremessos", classe: "Assassino" }, { categoria: "Proficiencia", classe: "Facas" }, true],
        // Personagem com Pistolas compra técnica de Pistolas → OK
        [{ estilo_luta: "Proficiência em Pistolas", classe: "Ranger" }, { categoria: "Proficiencia", classe: "Pistolas" }, true],
        // Personagem com Pistolas compra técnica de Escopetas → FALSE
        [{ estilo_luta: "Proficiência em Pistolas", classe: "Ranger" }, { categoria: "Proficiencia", classe: "Escopetas" }, false],
        // Personagem com Espadas Pesadas compra técnica de Espadas → FALSE
        [{ estilo_luta: "Espadas Pesadas", classe: "Lutador" }, { categoria: "Proficiencia", classe: "Espadas" }, false],
        // Personagem com Espadas Pesadas compra técnica de Espadas Pesadas → OK
        [{ estilo_luta: "Espadas Pesadas", classe: "Lutador" }, { categoria: "Proficiencia", classe: "Espadas Pesadas" }, true],
        // Assassino compra técnica de classe Assassino → OK
        [{ estilo_luta: "Nenhum", classe: "Assassino" }, { categoria: "Inicial", classe: "Assassino" }, true],
        // Lutador compra técnica de Assassino → FALSE
        [{ estilo_luta: "Nenhum", classe: "Lutador" }, { categoria: "Inicial", classe: "Assassino" }, false],
        // Personagem com estilo luta nulo compra técnica de proficiência → FALSE
        [{ estilo_luta: null, classe: "Ranger" }, { categoria: "Proficiencia", classe: "Adagas" }, false],
        // Múltiplas proficiências separadas por vírgula
        [{ estilo_luta: "Adagas, Facas", classe: "Assassino" }, { categoria: "Proficiencia", classe: "Facas" }, true],
        [{ estilo_luta: "Adagas, Facas", classe: "Assassino" }, { categoria: "Proficiencia", classe: "Katanas" }, false],
        // Personagem com Pistolas compra técnica de Fuzis → FALSE (categorias diferentes)
        [{ estilo_luta: "Proficiência em Pistolas", classe: "Ranger" }, { categoria: "Proficiencia", classe: "Fuzis" }, false],
        // Classe avançada
        [{ estilo_luta: "Nenhum", classe: "Paladino", classe_avancada: "Hrymir" }, { categoria: "Avancada", classe: "Hrymir" }, true]
    ];

    let passou = 0;
    let falhou = 0;
    for (const [jogador, tecnica, esperado] of casos) {
        const resultado = compativel(jogador, tecnica);
        const status = resultado === esperado ? "OK" : "FALHOU";
        if (status === "OK") passou++;
        else {
            falhou++;
            console.log(`  ✗ ${status}: estilo="${jogador.estilo_luta || 'null'}" classe_tec="${tecnica.classe}" => ${resultado} (esperado ${esperado})`);
        }
    }
    console.log(`  Resultado: ${passou}/${casos.length} passaram, ${falhou} falharam`);
    if (falhou > 0) console.log("  ✗ ALGUNS TESTES FALHARAM!");
    return falhou === 0;
}

// =====================================
// TESTE 2: Curva de Maestria
// =====================================
function testarMaestria() {
    console.log("\n=== TESTE: CURVA DE MAESTRIA ===");

    const { SISTEMA_MAESTRIA } = require("../apps/bot/src/tecnicas/sistemaMaestria");

    const esperado = [10, 20, 40, 70, 110, 160, 230, 320, 450, 650];
    let passou = 0;
    let falhou = 0;

    for (let i = 1; i <= esperado.length; i++) {
        const custo = SISTEMA_MAESTRIA.calcularCusto(i, "Classe");
        if (custo === esperado[i - 1]) passou++;
        else {
            falhou++;
            console.log(`  ✗ Técnica ${i}: custo ${custo} (esperado ${esperado[i - 1]})`);
        }
    }

    // Verificar progressão pós-10 (deve ser linear controlado, não exponencial)
    const custo11 = SISTEMA_MAESTRIA.calcularCusto(11, "Classe");
    const custo12 = SISTEMA_MAESTRIA.calcularCusto(12, "Classe");
    console.log(`  Custo 11ª técnica: ${custo11} (esperado: 900, passo 250)`);
    console.log(`  Custo 12ª técnica: ${custo12} (esperado: 1150)`);
    if (custo11 === 900 && custo12 === 1150) passou += 2;
    else falhou += 2;

    console.log(`  Resultado: ${passou}/${esperado.length + 2} passaram, ${falhou} falharam`);
    return falhou === 0;
}

// =====================================
// TESTE 3: Contagem de estilos e técnicas
// =====================================
function testarContagens() {
    console.log("\n=== TESTE: CONTAGEM DE ESTILOS E TÉCNICAS ===");

    const { listarEstilos, getTecnicasEstilo } = require("../apps/bot/src/tecnicas/estilos");

    const estilos = listarEstilos();
    let totalTecnicas = 0;
    let problemas = [];

    if (estilos.length !== 47) {
        problemas.push(`Esperado 47 estilos, encontrado ${estilos.length}`);
    }

    for (const estilo of estilos) {
        const mod = getTecnicasEstilo(estilo.chave);
        if (!mod) {
            problemas.push(`Estilo ${estilo.nome} sem módulo`);
            continue;
        }
        let contagem = 0;
        if (mod.tecnicaInicial && mod.tecnicaInicial.nome) contagem++;
        if (Array.isArray(mod.tecnicas)) {
            contagem += mod.tecnicas.filter(t => t && t.nome).length;
        }
        totalTecnicas += contagem;
        if (contagem !== 9) {
            problemas.push(`Estilo ${estilo.nome}: ${contagem} técnicas (esperado 9)`);
        }
    }

    if (totalTecnicas !== 423) {
        problemas.push(`Esperado 423 técnicas, encontrado ${totalTecnicas}`);
    }

    if (problemas.length === 0) {
        console.log(`  OK: 47 estilos, 423 técnicas, 9 por estilo`);
        return true;
    }

    for (const p of problemas) console.log(`  ✗ ${p}`);
    return false;
}

// =====================================
// TESTE 4: Duplicidade de nomes e slugs
// =====================================
function testarDuplicidade() {
    console.log("\n=== TESTE: DUPLICIDADE DE NOMES E SLUGS ===");

    const { listarEstilos, getTecnicasEstilo } = require("../apps/bot/src/tecnicas/estilos");

    const nomes = new Map();
    const slugs = new Map();
    let duplicados = 0;

    for (const estilo of listarEstilos()) {
        const mod = getTecnicasEstilo(estilo.chave);
        if (!mod) continue;
        const tecs = [];
        if (mod.tecnicaInicial && mod.tecnicaInicial.nome) tecs.push(mod.tecnicaInicial);
        if (Array.isArray(mod.tecnicas)) tecs.push(...mod.tecnicas.filter(t => t && t.nome));
        for (const t of tecs) {
            const n = String(t.nome).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
            const s = n.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
            if (nomes.has(n)) {
                duplicados++;
                console.log(`  ✗ Nome duplicado: ${t.nome} (${nomes.get(n)} vs ${estilo.nome})`);
            }
            nomes.set(n, estilo.nome);
            if (slugs.has(s)) {
                duplicados++;
                console.log(`  ✗ Slug duplicado: ${t.nome} (slug=${s})`);
            }
            slugs.set(s, estilo.nome);
        }
    }

    if (duplicados === 0) {
        console.log("  OK: Nenhuma duplicidade encontrada");
        return true;
    }
    return false;
}

// =====================================
// TESTE 5: Imports e módulos
// =====================================
function testarImports() {
    console.log("\n=== TESTE: IMPORTS E MÓDULOS ===");

    try {
        require("../apps/bot/src/tecnicas/estilos");
        require("../apps/bot/src/core/registrarSistemas");
        require("../apps/bot/src/tecnicas/sistemaMaestria");
        require("../apps/bot/src/systems/techniquePurchaseSystem");
        require("../apps/bot/src/systems/maestriaSystem");
        require("../apps/bot/src/utils/normalizarEstiloLuta");
        require("../apps/bot/src/utils/normalizarClasse");
        require("../apps/bot/src/utils/lojaItens");
        require("../apps/bot/src/systems/inventorySystem");
        require("../apps/bot/src/commands/tecnicasClasse");
        require("../apps/bot/src/commands/comprarTecnica");
        require("../apps/bot/src/commands/minhasTecnicas");
        require("../apps/bot/src/commands/tecnicas");
        require("../apps/bot/src/commands/tecnica");
        require("../apps/bot/src/commands/tecnicasEstiloLuta");
        require("../apps/bot/src/commands/estilosLuta");
        console.log("  OK: Todos os módulos carregados sem erro");
        return true;
    } catch (erro) {
        console.log(`  ✗ Erro ao carregar módulo: ${erro.message}`);
        return false;
    }
}

// =====================================
// TESTE 6: Loja e slots
// =====================================
function testarLoja() {
    console.log("\n=== TESTE: LOJA E SLOTS ===");

    const { ITENS_LOJA } = require("../apps/bot/src/utils/lojaItens");
    const InventorySystem = require("../apps/bot/src/systems/inventorySystem");

    let totalItens = 0;
    let problemas = [];

    for (const [rank, categorias] of Object.entries(ITENS_LOJA)) {
        for (const [categoria, itens] of Object.entries(categorias)) {
            for (const item of itens) {
                totalItens++;
                const slot = InventorySystem.getSlotDoItem({ ...item, categoria });
                if ((categoria.includes("Cabeça") && slot !== "Cabeça") ||
                    (categoria.includes("Corpo") && slot !== "Corpo") ||
                    (categoria.includes("Pernas") && slot !== "Pernas") ||
                    (categoria.includes("Pés") && slot !== "Pés") ||
                    (categoria.includes("Acess") && slot !== "Acessórios") ||
                    (categoria.includes("Apoio") && slot !== "Item de Apoio") ||
                    (categoria.includes("Arma 1") && slot !== "Arma 1") ||
                    (categoria.includes("Arma 2") && slot !== "Arma 2")) {
                    problemas.push(`${item.nome} (${categoria}) => ${slot}`);
                }
            }
        }
    }

    if (totalItens !== 486) problemas.push(`Esperado 486 itens, encontrado ${totalItens}`);
    if (problemas.length > 0) {
        for (const p of problemas) console.log(`  ✗ ${p}`);
        return false;
    }
    console.log(`  OK: ${totalItens} itens, todos com slot válido`);
    return true;
}

// =====================================
// TESTE 7: Escudo não cai em Pés
// =====================================
function testarEscudos() {
    console.log("\n=== TESTE: ESCUDOS NÃO CAEM EM PÉS ===");

    // Simular item de escudo
    const InventorySystem = require("../apps/bot/src/systems/inventorySystem");

    const escudoItem = { nome: "Escudo de Madeira", categoria: "Escudo", escudo: 1 };
    const slot = InventorySystem.getSlotDoItem(escudoItem);
    console.log(`  Escudo com categoria "Escudo" => slot: ${slot}`);
    
    if (slot === "Pés") {
        console.log("  ✗ Escudo caiu em Pés!");
        return false;
    }
    if (slot === "Arma 1" || slot === "Arma 2") {
        console.log(`  OK: Escudo cai no slot de arma correto (${slot})`);
        return true;
    }
    console.log(`  OK: Escudo cai no slot ${slot}`);
    return true;
}

// =====================================
// TESTE 8: Arma 1 e Arma 2
// =====================================
function testarArmasDuplas() {
    console.log("\n=== TESTE: ARMAS DUPLAS (ARMA 1 E ARMA 2) ===");

    const InventorySystem = require("../apps/bot/src/systems/inventorySystem");

    const arma1 = { nome: "Espada", categoria: "Arma 1", arma: 1, descricao: "[1-FP]" };
    const arma2 = { nome: "Espadão", categoria: "Arma 2", arma: 1, descricao: "[2-FP]" };
    const escudo = { nome: "Escudo", categoria: "Escudo", escudo: 1 };

    const slot1 = InventorySystem.getSlotDoItem(arma1);
    const slot2 = InventorySystem.getSlotDoItem(arma2);
    const slotEscudo = InventorySystem.getSlotDoItem(escudo);

    if (slot1 !== "Arma 1") {
        console.log(`  ✗ Arma 1 caiu em ${slot1}`);
        return false;
    }
    if (slot2 !== "Arma 2") {
        console.log(`  ✗ Arma 2 caiu em ${slot2}`);
        return false;
    }
    if (slotEscudo !== "Arma 1") {
        console.log(`  ✗ Escudo caiu em ${slotEscudo} (esperado Arma 1)`);
        return false;
    }

    // Verificar capacidades
    const caps = InventorySystem.SLOT_CAPACIDADE;
    if (caps["Arma 1"] !== 2) {
        console.log(`  ✗ Arma 1 deve ter 2 slots, tem ${caps["Arma 1"]}`);
        return false;
    }
    if (caps["Arma 2"] !== 1) {
        console.log(`  ✗ Arma 2 deve ter 1 slot, tem ${caps["Arma 2"]}`);
        return false;
    }

    console.log("  OK: Arma 1 → 2 slots, Arma 2 → 1 slot, Escudo → Arma 1");
    return true;
}

// =====================================
// TESTE 9: Comandos e aliases
// =====================================
function testarComandos() {
    console.log("\n=== TESTE: COMANDOS E ALIASES ===");

    const fs = require("fs");
    const path = require("path");
    const { listarEstilos } = require("../apps/bot/src/tecnicas/estilos");

    const commandHandlerContent = fs.readFileSync(path.join(__dirname, "..", "apps", "bot", "src", "core", "commandHandler.js"), "utf8");
    const tecClasseContent = fs.readFileSync(path.join(__dirname, "..", "apps", "bot", "src", "commands", "tecnicasClasse.js"), "utf8");

    let problemas = [];
    const estilos = listarEstilos();

    for (const estilo of estilos) {
        const k = estilo.chave;
        const comandoGeral = "!" + k;
        const comandoEspacos = "!" + k.replace(/_/g, " ");
        const existeHandler = commandHandlerContent.includes(comandoGeral) || commandHandlerContent.includes(comandoEspacos);
        if (!existeHandler) problemas.push(`Estilo ${estilo.nome} (${k}) sem comando no commandHandler`);

        const chaveNoTecClasse = tecClasseContent.includes(`"${k.replace(/_/g, " ")}"`) || tecClasseContent.includes(`"${k}"`);
        if (!chaveNoTecClasse) problemas.push(`Estilo ${estilo.nome} (${k}) sem alias no tecnicasClasse`);
    }

    if (problemas.length > 0) {
        for (const p of problemas) console.log(`  ✗ ${p}`);
        return false;
    }
    console.log(`  OK: Todos os ${estilos.length} estilos têm comando e alias`);
    return true;
}

// =====================================
// TESTE 10: Técnicas gerais (máx 10 por classe)
// =====================================
function testarTecnicasGerais() {
    console.log("\n=== TESTE: TÉCNICAS GERAIS (MÁX 10) ===");

    let problemas = [];
    for (const nome of ["lutador", "assassino", "ranger"]) {
        const mod = require(`../apps/bot/src/tecnicas/iniciais/${nome}`);
        let total = 0;
        if (mod.tecnicaInicial && mod.tecnicaInicial.nome) total++;
        if (Array.isArray(mod.tecnicas)) total += mod.tecnicas.filter(t => t && t.nome).length;
        if (total > 10) problemas.push(`${nome}: ${total} técnicas (máx 10)`);
        console.log(`  ${nome}: ${total} técnicas`);
    }

    if (problemas.length > 0) {
        for (const p of problemas) console.log(`  ✗ ${p}`);
        return false;
    }
    console.log("  OK: Nenhuma classe excede 10 técnicas gerais");
    return true;
}

// =====================================
// RUNNER
// =====================================
const resultados = [
    ["Compatibilidade de proficiência", testarCompatibilidade()],
    ["Curva de Maestria", testarMaestria()],
    ["Contagem estilos/técnicas", testarContagens()],
    ["Duplicidade nomes/slugs", testarDuplicidade()],
    ["Imports e módulos", testarImports()],
    ["Loja e slots", testarLoja()],
    ["Escudos", testarEscudos()],
    ["Armas duplas", testarArmasDuplas()],
    ["Comandos e aliases", testarComandos()],
    ["Técnicas gerais", testarTecnicasGerais()]
];

console.log("\n\n========== RESUMO DOS TESTES ==========");
let totalPassou = 0;
for (const [nome, resultado] of resultados) {
    const status = resultado ? "✓ PASS" : "✗ FAIL";
    console.log(`  ${status} - ${nome}`);
    if (resultado) totalPassou++;
}
console.log(`\n${totalPassou}/${resultados.length} testes passaram`);
if (totalPassou !== resultados.length) {
    console.log("⚠ ALGUNS TESTES FALHARAM - INVESTIGAR ANTES DE PROSSEGUIR");
    process.exit(1);
} else {
    console.log("✓ TODOS OS TESTES PASSARAM");
}
