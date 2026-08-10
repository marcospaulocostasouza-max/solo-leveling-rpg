/**
 * GERADOR DE CATÁLOGO DE FORJA
 * 
 * Gera o catálogo completo de itens forjados:
 * 1. Ligas (Material × Material)
 * 2. Itens Forjados (Material × Núcleo)
 * 
 * Regras:
 * - Preço = (custo dos materiais) + 60% de taxa do ferreiro
 * - Rank do item = maior rank entre os dois materiais
 * - Petricita excluída (sem preço definido)
 * - Nenhum nome se repete no catálogo
 */

const fs = require("fs");
const path = require("path");

// =====================================
// MATERIAIS DA LOJA DE MATERIAIS
// =====================================

const METAIS = [
    { nome: "Couro", rank: "E", preco: 20000, tipo: "metal", atributo: "Agilidade" },
    { nome: "Latão", rank: "E", preco: 20000, tipo: "metal", atributo: "Resistência" },
    { nome: "Ferro", rank: "D", preco: 35000, tipo: "metal", atributo: "Resistência" },
    { nome: "Cobre", rank: "D", preco: 35000, tipo: "metal", atributo: "Inteligência" },
    { nome: "Aço", rank: "C", preco: 50000, tipo: "metal", atributo: "Força" },
    { nome: "Ouro", rank: "C", preco: 50000, tipo: "metal", atributo: "Poder Mágico" },
    { nome: "Arenito", rank: "C", preco: 50000, tipo: "metal", atributo: "Agilidade" },
    { nome: "Malaquita", rank: "C", preco: 50000, tipo: "metal", atributo: "Inteligência" },
    { nome: "Jade", rank: "C", preco: 50000, tipo: "metal", atributo: "Resistência", atributoSecundario: "Sorte" },
    { nome: "Mithril", rank: "B", preco: 570000, tipo: "metal", atributo: "Agilidade" },
    { nome: "Adamantium", rank: "B", preco: 570000, tipo: "metal", atributo: "Resistência" },
    { nome: "Oricalco", rank: "B", preco: 570000, tipo: "metal", atributo: "Poder Mágico" },
    { nome: "Aço Rúnico", rank: "B", preco: 570000, tipo: "metal", atributo: "Força" },
    { nome: "Vidro de Dragão", rank: "B", preco: 570000, tipo: "metal", atributo: "Poder Mágico" },
    { nome: "Relicário", rank: "A", preco: 1000000, tipo: "metal", atributo: "Poder Mágico" },
    { nome: "Ébano", rank: "A", preco: 1000000, tipo: "metal", atributo: "Resistência" },
    { nome: "Mármore Negro", rank: "A", preco: 1000000, tipo: "metal", atributo: "Resistência" },
    { nome: "Gelo Verdadeiro", rank: "S", preco: 5000000, tipo: "metal", atributo: "Poder Mágico" },
    { nome: "Hexita", rank: "S", preco: 5000000, tipo: "metal", atributo: "Poder Mágico" },
    { nome: "Cristais Elementais", rank: "S", preco: 5000000, tipo: "metal", atributo: "Poder Mágico" },
    { nome: "Cristais da Natureza", rank: "S", preco: 5000000, tipo: "metal", atributo: "Poder Mágico" },
    { nome: "Cristais Espirituais", rank: "S", preco: 5000000, tipo: "metal", atributo: "Poder Mágico" },
    { nome: "Tadenita", rank: "S", preco: 5000000, tipo: "metal", atributo: "Poder Mágico" },
    { nome: "Eternium", rank: "S", preco: 10000000, tipo: "metal", atributo: "Resistência" }
];

const MADEIRAS = [
    { nome: "Teixo", rank: "C", preco: 80000, tipo: "madeira", atributo: "Resistência" },
    { nome: "Grande Macieira", rank: "C", preco: 80000, tipo: "madeira", atributo: "Poder Mágico" },
    { nome: "Madeira de Lei", rank: "C", preco: 80000, tipo: "madeira", atributo: "Poder Mágico" },
    { nome: "Árvore Mallorn", rank: "B", preco: 570000, tipo: "madeira", atributo: "Resistência" },
    { nome: "Madeira de Bosmeri", rank: "B", preco: 570000, tipo: "madeira", atributo: "Agilidade" },
    { nome: "Cerne", rank: "S", preco: 5000000, tipo: "madeira", atributo: "Resistência" },
    { nome: "Yggdrasil", rank: "S", preco: 5000000, tipo: "madeira", atributo: "Resistência" },
    { nome: "Árvore do Tesouro Adão", rank: "S", preco: 5000000, tipo: "madeira", atributo: "Força" }
];

const TODOS_MATERIAIS = [...METAIS, ...MADEIRAS];

// =====================================
// NÚCLEOS DE MONSTROS
// =====================================

const NUCLEOS = [
    { nome: "Branco", rank: "E", preco: 5000, cor: "Branco" },
    { nome: "Amarelo", rank: "D", preco: 7500, cor: "Amarelo" },
    { nome: "Verde", rank: "C", preco: 10000, cor: "Verde" },
    { nome: "Azul", rank: "B", preco: 15000, cor: "Azul" },
    { nome: "Vermelho", rank: "A", preco: 20000, cor: "Vermelho" },
    { nome: "Roxo", rank: "S", preco: 30000, cor: "Roxo" }
];

// =====================================
// VALORES DE ATRIBUTOS POR RANK
// =====================================

const VALORES_POR_RANK = {
    "E": { primario: 10, secundario: 7 },
    "D": { primario: 18, secundario: 13 },
    "C": { primario: 29, secundario: 20 },
    "B": { primario: 44, secundario: 31 },
    "A": { primario: 64, secundario: 44 },
    "S": { primario: 91, secundario: 63 }
};

const ORDEM_RANK = ["E", "D", "C", "B", "A", "S"];

// =====================================
// SLOTS E NOMES DE ITENS
// =====================================

const SLOTS = {
    "Cabeça": ["Elmo", "Coroa", "Capuz", "Diadema", "Máscara", "Tiara", "Turbante", "Viseira"],
    "Corpo": ["Peitoral", "Armadura", "Manto", "Couraça", "Cota de Malha", "Robe", "Sobretudo", "Colete"],
    "Pernas": ["Calça", "Grevas", "Saiote", "Perneira", "Calção", "Anqueiras", "Legging", "Culote"],
    "Pés": ["Botas", "Sandálias", "Coturnos", "Botins", "Solado", "Chinelos", "Borzeguins"],
    "Braços": ["Braceletes", "Manoplas", "Punhos", "Luvas", "Ganteletes", "Ombreiras", "Braçadeiras", "Cotoveleiras"],
    "Acessório": ["Anel", "Colar", "Brinco", "Bracelete", "Broche", "Amuleto", "Pingente", "Presilha"],
    "Arma 1": ["Adaga", "Espada Curta", "Machadinha", "Cetro", "Punhal", "Sabre", "Tonfa", "Florete"],
    "Arma 2": ["Espadão", "Lança", "Machado de Guerra", "Cajado Longo", "Arco", "Martelo", "Foice", "Alabarda"]
};

// =====================================
// VERBOS DE LIGA (Material × Material)
// =====================================

const VERBOS_LIGA = [
    "fundido com", "ligado a", "entrelaçado com", "forjado sobre",
    "revestido de", "amalgamado com", "cravejado com", "temperado com"
];

// =====================================
// GERADOR DE CATÁLOGO
// =====================================

function maiorRank(r1, r2) {
    return ORDEM_RANK.indexOf(r1) >= ORDEM_RANK.indexOf(r2) ? r1 : r2;
}

function calcularPrecoLiga(mat1, mat2) {
    return Math.floor((mat1.preco + mat2.preco) * 1.6);
}

function calcularPrecoNucleo(mat, nucleo) {
    return Math.floor((mat.preco + nucleo.preco) * 1.6);
}

function gerarLigas() {
    const ligas = [];
    const nomesUsados = new Set();

    for (const [slot, nomes] of Object.entries(SLOTS)) {
        for (let i = 0; i < TODOS_MATERIAIS.length; i++) {
            for (let j = i + 1; j < TODOS_MATERIAIS.length; j++) {
                const mat1 = TODOS_MATERIAIS[i];
                const mat2 = TODOS_MATERIAIS[j];

                const rank = maiorRank(mat1.rank, mat2.rank);
                const valores = VALORES_POR_RANK[rank];
                const preco = calcularPrecoLiga(mat1, mat2);

                // Determinar atributos
                const atr1 = mat1.atributo;
                const atr2 = mat2.atributo === mat1.atributo
                    ? (mat2.atributoSecundario || "Resistência")
                    : mat2.atributo;

                // Nome do item
                const verbo = VERBOS_LIGA[(i + j) % VERBOS_LIGA.length];
                const nomeBase = nomes[(i + j) % nomes.length];
                const nome = `${nomeBase} de ${mat1.nome} ${verbo} ${mat2.nome}`;

                if (nomesUsados.has(nome)) continue;
                nomesUsados.add(nome);

                ligas.push({
                    nome,
                    slot,
                    rank,
                    tipo: "liga",
                    material1: mat1.nome,
                    material2: mat2.nome,
                    tipoMaterial1: mat1.tipo,
                    tipoMaterial2: mat2.tipo,
                    atributo1: atr1,
                    valor1: valores.primario,
                    atributo2: atr2,
                    valor2: valores.secundario,
                    preco,
                    descricao: `Liga rara entre ${mat1.tipo} (${mat1.nome}) e ${mat2.tipo} (${mat2.nome}), unindo ${atr1.toLowerCase()} e ${atr2.toLowerCase()}.`
                });
            }
        }
    }

    return ligas;
}

function gerarForjadosNucleos() {
    const forjados = [];
    const nomesUsados = new Set();

    for (const [slot, nomes] of Object.entries(SLOTS)) {
        for (let i = 0; i < TODOS_MATERIAIS.length; i++) {
            const mat = TODOS_MATERIAIS[i];

            for (let n = 0; n < NUCLEOS.length; n++) {
                const nucleo = NUCLEOS[n];

                const rank = maiorRank(mat.rank, nucleo.rank);
                const valores = VALORES_POR_RANK[rank];
                const preco = calcularPrecoNucleo(mat, nucleo);

                // Atributos: material primário, núcleo secundário (Poder Mágico)
                const atr1 = mat.atributo;
                const atr2 = "Poder Mágico";

                // Nome do item
                const nomeBase = nomes[i % nomes.length];
                const nome = `${nomeBase} de ${mat.nome} do Núcleo ${nucleo.cor}`;

                if (nomesUsados.has(nome)) continue;
                nomesUsados.add(nome);

                forjados.push({
                    nome,
                    slot,
                    rank,
                    tipo: "forjado",
                    material: mat.nome,
                    tipoMaterial: mat.tipo,
                    nucleo: nucleo.nome,
                    nucleoCor: nucleo.cor,
                    nucleoRank: nucleo.rank,
                    atributo1: atr1,
                    valor1: valores.primario,
                    atributo2: atr2,
                    valor2: valores.secundario,
                    preco,
                    descricao: `Peça de ${mat.tipo} (${mat.nome}) temperada com um núcleo ${nucleo.cor.toLowerCase()} de Rank ${nucleo.rank}, unindo ${atr1.toLowerCase()} e ${atr2.toLowerCase()}.`
                });
            }
        }
    }

    return forjados;
}

// =====================================
// EXECUÇÃO
// =====================================

console.log("=== GERADOR DE CATÁLOGO DE FORJA ===\n");

const ligas = gerarLigas();
const forjados = gerarForjadosNucleos();

console.log(`Ligas geradas: ${ligas.length}`);
console.log(`Itens forjados (Materiais × Núcleos): ${forjados.length}`);
console.log(`Total de itens: ${ligas.length + forjados.length}`);

// Estatísticas por slot
console.log("\n--- Estatísticas por slot ---");
for (const slot of Object.keys(SLOTS)) {
    const ligasSlot = ligas.filter(l => l.slot === slot).length;
    const forjadosSlot = forjados.filter(f => f.slot === slot).length;
    console.log(`  ${slot}: ${ligasSlot} ligas + ${forjadosSlot} forjados = ${ligasSlot + forjadosSlot} itens`);
}

// Estatísticas por rank
console.log("\n--- Estatísticas por rank ---");
for (const rank of ORDEM_RANK) {
    const ligasRank = ligas.filter(l => l.rank === rank).length;
    const forjadosRank = forjados.filter(f => f.rank === rank).length;
    console.log(`  Rank ${rank}: ${ligasRank} ligas + ${forjadosRank} forjados = ${ligasRank + forjadosRank} itens`);
}

// Salvar catálogo
const catalogo = {
    ligas,
    forjados,
    total: ligas.length + forjados.length,
    materiais: TODOS_MATERIAIS.map(m => ({ nome: m.nome, rank: m.rank, preco: m.preco, tipo: m.tipo, atributo: m.atributo })),
    nucleos: NUCLEOS.map(n => ({ nome: n.nome, rank: n.rank, preco: n.preco, cor: n.cor }))
};

const caminhoSaida = path.join(__dirname, "..", "src", "database", "forja_catalogo.json");
fs.writeFileSync(caminhoSaida, JSON.stringify(catalogo, null, 2));
console.log(`\n✅ Catálogo salvo em: ${caminhoSaida}`);
console.log(`   Tamanho: ${(fs.statSync(caminhoSaida).size / 1024).toFixed(1)} KB`);
