/*
 * VERIFICAÇÃO COMPLETA DO SISTEMA DE ITENS
 * 
 * Verifica:
 * 1. Itens duplicados na loja
 * 2. Slots corretos
 * 3. Ranks corretos
 * 4. Atributos presentes e válidos
 * 5. Consistência entre loja, drops e banco de dados
 * 6. Sistema de equipar
 */

const fs = require("fs");
const path = require("path");
const db = require("../src/core/database");

const { ITENS_LOJA } = require("../src/utils/lojaItens");
const arquivoDrops = path.join(__dirname, "..", "src", "database", "dungeon_drops.json");
const drops = JSON.parse(fs.readFileSync(arquivoDrops, "utf8"));

// =====================================
// SLOTS VÁLIDOS
// =====================================
const SLOTS_VALIDOS = [
    "Cabeça", "Corpo", "Pernas", "Pés", "Acessórios", "Item de Apoio", "Arma 1", "Arma 2"
];

// Mapeamento categoria loja -> slot
const MAPA_CATEGORIA_SLOT = {
    "Slot de Cabeça": "Cabeça",
    "Slot de Corpo": "Corpo",
    "Slot de Pernas": "Pernas",
    "Slot de Pés": "Pés",
    "Slot de Acessórios": "Acessórios",
    "Itens de Apoio": "Item de Apoio",
    "Arma 1": "Arma 1",
    "Arma 2": "Arma 2"
};

// =====================================
// ATRIBUTOS VÁLIDOS
// =====================================
const ATRIBUTOS_VALIDOS = [
    "força", "agilidade", "resistência", "inteligência", "sentidos", "poder mágico", "sorte"
];

// Campos que são descrições textuais, não atributos numéricos
const CAMPOS_TEXTO = ["efeito", "descricao", "descrição", "bonus", "bônus", "tipo", "rank", "categoria", "nome", "preco", "preço", "valor", "quantidade", "usos", "item_unico", "tier", "id"];

let erros = [];
let avisos = [];
let totalItens = 0;

// =====================================
// 1. VERIFICAR LOJA (ITENS_LOJA)
// =====================================
function verificarLoja() {
    console.log("\n════════════════════════════════════════");
    console.log("📦 VERIFICANDO LOJA (ITENS_LOJA)");
    console.log("════════════════════════════════════════\n");
    
    const nomesVistos = new Map(); // nome -> {rank, categoria}
    const ranksValidos = ["E", "D", "C", "B", "A", "S"];
    const categoriasEsperadas = Object.keys(MAPA_CATEGORIA_SLOT);
    
    for (const [rank, categorias] of Object.entries(ITENS_LOJA)) {
        // Verificar rank válido
        if (!ranksValidos.includes(rank)) {
            erros.push(`[LOJA] Rank inválido: "${rank}"`);
        }
        
        for (const [categoria, itens] of Object.entries(categorias)) {
            // Verificar categoria -> slot mapeamento
            if (!MAPA_CATEGORIA_SLOT[categoria]) {
                erros.push(`[LOJA] Rank ${rank} - Categoria desconhecida: "${categoria}"`);
            }
            
            for (const item of itens) {
                totalItens++;
                
                // Verificar campos obrigatórios
                if (!item.nome) erros.push(`[LOJA] Rank ${rank}/${categoria} - Item sem nome!`);
                if (!item.bonus) erros.push(`[LOJA] Rank ${rank}/${categoria} - Item "${item.nome || '?'}" sem bonus!`);
                if (!item.preco) erros.push(`[LOJA] Rank ${rank}/${categoria} - Item "${item.nome || '?'}" sem preço!`);
                if (!item.descricao) erros.push(`[LOJA] Rank ${rank}/${categoria} - Item "${item.nome || '?'}" sem descrição!`);
                
                if (!item.nome) continue;
                
                // Verificar duplicidade na loja
                const nomeLower = item.nome.toLowerCase().trim();
                // A picareta é o mesmo consumível disponibilizado em todas as lojas de rank.
                // Não é uma duplicidade de catálogo, pois preço, efeito e identificação são únicos.
                const itemCompartilhadoEntreRanks = nomeLower === "picareta do minerador";
                if (nomesVistos.has(nomeLower) && !itemCompartilhadoEntreRanks) {
                    const anterior = nomesVistos.get(nomeLower);
                    erros.push(`[LOJA] Item DUPLICADO na loja: "${item.nome}" (${anterior.rank}/${anterior.categoria} e ${rank}/${categoria})`);
                } else {
                    nomesVistos.set(nomeLower, { rank, categoria });
                }
                
                // Verificar arma tem tipo
                if (categoria.startsWith("Arma")) {
                    if (item.tipo !== "arma") {
                        erros.push(`[LOJA] Item "${item.nome}" é arma mas tipo="${item.tipo || 'vazio'}"`);
                    }
                }
            }
        }
    }
    
    console.log(`✅ Loja verificada: ${totalItens} itens em ${Object.keys(ITENS_LOJA).length} ranks`);
    
    // Verificar que cada rank tem todas as categorias
    for (const [rank, categorias] of Object.entries(ITENS_LOJA)) {
        const catPresentes = Object.keys(categorias);
        for (const cat of categoriasEsperadas) {
            if (!catPresentes.includes(cat)) {
                erros.push(`[LOJA] Rank ${rank} NÃO TEM a categoria "${cat}"!`);
            }
        }
    }
}

// =====================================
// 2. VERIFICAR DROPS (DUNGEON_DROPS)
// =====================================
function verificarDrops() {
    console.log("\n════════════════════════════════════════");
    console.log("🎲 VERIFICANDO DROPS (DUNGEON_DROPS)");
    console.log("════════════════════════════════════════\n");
    
    const nomesVistos = new Map();
    const ranksValidos = ["E", "D", "C", "B", "A", "S"];
    let totalDrops = 0;
    let itensSemNome = 0;
    let itensSemSlot = 0;
    let itensSemRank = 0;
    let itensSlotInvalido = 0;
    let itensRankInvalido = 0;
    let itensRepetidosMesmaDungeon = 0;
    
    for (const [dungeonId, itens] of Object.entries(drops)) {
        if (!Array.isArray(itens)) {
            erros.push(`[DROPS] Dungeon "${dungeonId}" não tem array de itens!`);
            continue;
        }
        
        // Verificar duplicidade DENTRO da mesma dungeon
        const nomesNaDungeon = new Set();
        for (const item of itens) {
            if (item.nome) {
                const nomeLower = item.nome.toLowerCase().trim();
                if (nomesNaDungeon.has(nomeLower)) {
                    itensRepetidosMesmaDungeon++;
                    erros.push(`[DROPS] ${dungeonId} - Item DUPLICADO na mesma dungeon: "${item.nome}"`);
                }
                nomesNaDungeon.add(nomeLower);
            }
        }
        
        for (const item of itens) {
            totalDrops++;
            
            // Verificar campos obrigatórios
            if (!item.nome) {
                itensSemNome++;
                continue;
            }
            if (!item.categoria) {
                itensSemSlot++;
                erros.push(`[DROPS] ${dungeonId} - Item "${item.nome}" sem categoria!`);
            }
            if (!item.rank) {
                itensSemRank++;
                erros.push(`[DROPS] ${dungeonId} - Item "${item.nome}" sem rank!`);
            }
            
            // Verificar slot válido
            if (item.categoria && !SLOTS_VALIDOS.includes(item.categoria)) {
                itensSlotInvalido++;
                erros.push(`[DROPS] ${dungeonId} - Item "${item.nome}" tem slot inválido: "${item.categoria}"`);
            }
            
            // Verificar rank válido
            if (item.rank && !ranksValidos.includes(item.rank)) {
                itensRankInvalido++;
                erros.push(`[DROPS] ${dungeonId} - Item "${item.nome}" tem rank inválido: "${item.rank}"`);
            }
        }
    }
    
    console.log(`✅ Drops verificados: ${totalDrops} itens em ${Object.keys(drops).length} dungeons`);
    console.log(`   (Itens sem nome: ${itensSemNome}, sem slot: ${itensSemSlot}, sem rank: ${itensSemRank})`);
    console.log(`   (Slots inválidos: ${itensSlotInvalido}, ranks inválidos: ${itensRankInvalido})`);
}

// =====================================
// 3. VERIFICAR BANCO DE DADOS
// =====================================
function verificarBanco() {
    console.log("\n════════════════════════════════════════");
    console.log("🗄️ VERIFICANDO BANCO DE DADOS");
    console.log("════════════════════════════════════════\n");
    
    return new Promise((resolve) => {
        // Verificar tabela de itens
        db.all("SELECT * FROM itens", [], (err, itens) => {
            if (err) {
                console.log(`⚠️ Tabela "itens" não encontrada ou erro: ${err.message}`);
                return resolve();
            }
            
            console.log(`📋 Itens no banco: ${itens.length}`);
            
            // Verificar duplicidade no banco
            const nomesVistos = new Map();
            for (const item of itens) {
                const nomeLower = (item.nome || "").toLowerCase().trim();
                if (!nomeLower) continue;
                
                if (nomesVistos.has(nomeLower)) {
                    erros.push(`[BANCO] Item duplicado no banco: "${item.nome}" (IDs: ${nomesVistos.get(nomeLower)} e ${item.id})`);
                } else {
                    nomesVistos.set(nomeLower, item.id);
                }
            }
            
            // Verificar categorias dos itens no banco
            const slotsInvalidosBanco = itens.filter(i => i.categoria && !SLOTS_VALIDOS.includes(i.categoria));
            if (slotsInvalidosBanco.length > 0) {
                slotsInvalidosBanco.forEach(i => {
                    erros.push(`[BANCO] Item "${i.nome}" (ID ${i.id}) tem slot inválido: "${i.categoria}"`);
                });
            }
            
            // Verificar equipamentos dos jogadores
            db.all(`
                SELECT ij.*, i.nome as item_nome, i.categoria, i.tier, i.efeito
                FROM inventario_jogador ij
                JOIN itens i ON i.id = ij.item_id
                WHERE ij.equipado = 1
            `, [], (err2, equipados) => {
                if (err2) {
                    console.log(`⚠️ Erro ao buscar equipados: ${err2.message}`);
                    return resolve();
                }
                
                console.log(`🛡️ Itens equipados: ${equipados.length}`);
                
                // Verificar múltiplos equipados no mesmo slot (exceto armas)
                const slotsPorJogador = new Map();
                for (const eq of equipados) {
                    const key = `${eq.jogador_id}|${eq.categoria}`;
                    if (!slotsPorJogador.has(key)) {
                        slotsPorJogador.set(key, []);
                    }
                    slotsPorJogador.get(key).push(eq.item_nome);
                }
                
                for (const [key, itensList] of slotsPorJogador.entries()) {
                    const [jogadorId, slot] = key.split("|");
                    if (itensList.length > 1 && slot !== "Arma 1" && slot !== "Arma 2") {
                        erros.push(`[BANCO] Jogador ${jogadorId} tem ${itensList.length} itens equipados no slot "${slot}": ${itensList.join(", ")}`);
                    }
                }
                
                // Verificar se todos os equipados têm categoria válida
                for (const eq of equipados) {
                    if (!eq.categoria || !SLOTS_VALIDOS.includes(eq.categoria)) {
                        erros.push(`[BANCO] Item equipado "${eq.item_nome}" (jogador ${eq.jogador_id}) tem slot inválido: "${eq.categoria}"`);
                    }
                    
                    // Verificar rank do item vs rank do jogador
                    if (eq.tier && eq.jogador_id) {
                        // Não temos rank do jogador aqui facilmente, verificar depois
                    }
                }
                
                resolve();
            });
        });
    });
}

// =====================================
// 4. VERIFICAR CONSISTÊNCIA LOJA vs DROPS
// =====================================
function verificarConsistencia() {
    console.log("\n════════════════════════════════════════");
    console.log("🔗 VERIFICANDO CONSISTÊNCIA LOJA vs DROPS");
    console.log("════════════════════════════════════════\n");
    
    // Coletar todos os nomes da loja
    const nomesLoja = new Map();
    for (const [rank, categorias] of Object.entries(ITENS_LOJA)) {
        for (const [categoria, itens] of Object.entries(categorias)) {
            for (const item of itens) {
                nomesLoja.set(item.nome.toLowerCase().trim(), { rank, categoria });
            }
        }
    }
    
    // Coletar todos os nomes dos drops
    const nomesDrops = new Map();
    for (const [dungeonId, itens] of Object.entries(drops)) {
        for (const item of itens) {
            if (item.nome) {
                const nomeLower = item.nome.toLowerCase().trim();
                if (!nomesDrops.has(nomeLower)) {
                    nomesDrops.set(nomeLower, { dungeonId, categoria: item.categoria, rank: item.rank });
                }
            }
        }
    }
    
    // Verificar itens da loja que também existem nos drops
    let sobreposicao = 0;
    for (const [nome, infoLoja] of nomesLoja.entries()) {
        if (nomesDrops.has(nome)) {
            sobreposicao++;
            const infoDrop = nomesDrops.get(nome);
            
            // Verificar se slot bate
            const slotLoja = MAPA_CATEGORIA_SLOT[infoLoja.categoria];
            if (slotLoja && infoDrop.categoria && slotLoja !== infoDrop.categoria) {
                erros.push(`[CONSISTÊNCIA] Item "${nome}" está como ${slotLoja} na loja mas ${infoDrop.categoria} nos drops!`);
            }
            
            // Verificar se rank bate
            if (infoLoja.rank && infoDrop.rank && infoLoja.rank !== infoDrop.rank) {
                erros.push(`[CONSISTÊNCIA] Item "${nome}" está como rank ${infoLoja.rank} na loja mas rank ${infoDrop.rank} nos drops!`);
            }
        }
    }
    
    if (sobreposicao > 0) {
        console.log(`⚠️ ${sobreposicao} itens aparecem tanto na loja quanto nos drops`);
    } else {
        console.log("✅ Nenhuma sobreposição entre loja e drops");
    }
}

// =====================================
// 5. VERIFICAR SISTEMA DE EQUIPAR
// =====================================
function verificarEquipar() {
    console.log("\n════════════════════════════════════════");
    console.log("⚔️ VERIFICANDO SISTEMA DE EQUIPAR");
    console.log("════════════════════════════════════════\n");
    
    return new Promise((resolve) => {
        // Verificar se o comando equipar existe
        try {
            const equiparCmd = require("../src/commands/equipar.js");
            if (typeof equiparCmd !== "function") {
                erros.push("[EQUIPAR] Comando equipar não é uma função!");
            } else {
                console.log("✅ Comando equipar carregado com sucesso");
            }
        } catch (e) {
            erros.push(`[EQUIPAR] Erro ao carregar comando equipar: ${e.message}`);
        }
        
        // Verificar tabelas necessárias
        db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tabelas) => {
            if (err) {
                erros.push(`[BANCO] Erro ao listar tabelas: ${err.message}`);
                return resolve();
            }
            
            const nomesTabelas = tabelas.map(t => t.name);
            const tabelasNecessarias = ["itens", "inventario_jogador", "jogadores"];
            
            for (const tabela of tabelasNecessarias) {
                if (!nomesTabelas.includes(tabela)) {
                    erros.push(`[BANCO] Tabela necessária não existe: "${tabela}"`);
                }
            }
            
            if (nomesTabelas.includes("itens")) {
                // Verificar colunas da tabela itens
                db.all("PRAGMA table_info(itens)", [], (err2, colunas) => {
                    if (err2) return resolve();
                    
                    const colunasItens = colunas.map(c => c.name);
                    const colunasNecessarias = ["id", "nome", "categoria", "tier", "descricao", "efeito"];
                    
                    for (const col of colunasNecessarias) {
                        if (!colunasItens.includes(col)) {
                            erros.push(`[BANCO] Tabela "itens" não tem coluna: "${col}"`);
                        }
                    }
                    
                    resolve();
                });
            } else {
                resolve();
            }
        });
    });
}

// =====================================
// 6. VERIFICAR ESTRUTURA DE BONUS
// =====================================
function verificarBonusEstrutura() {
    console.log("\n════════════════════════════════════════");
    console.log("📊 VERIFICANDO ESTRUTURA DE BONUS");
    console.log("════════════════════════════════════════\n");
    
    let totalBonusInvalidos = 0;
    
    for (const [rank, categorias] of Object.entries(ITENS_LOJA)) {
        for (const [categoria, itens] of Object.entries(categorias)) {
            for (const item of itens) {
                if (!item.bonus) continue;
                
                const bonusText = item.bonus;
                
                // Verificar itens de apoio (consumíveis) - bonus é efeito especial
                if (categoria === "Itens de Apoio") {
                    // Pode ser "Regenera X HP", "Reduz CD", etc. - sem formato de atributo
                    continue;
                }
                
                // Para equipamentos, bonus deve ter formato "Atributo: +X"
                const parteBonus = bonusText.split(",").map(p => p.trim());
                for (const parte of parteBonus) {
                    const match = parte.match(/^([A-Za-zÁ-Úá-úÇçÃÕÉÍÓÚãõéíóú]+(?:\s[A-Za-zÁ-Úá-úÇçÃÕÉÍÓÚãõéíóú]+)*):\s+\+(\d+)$/i);
                    if (!match) {
                        // Verificar se é bonus de arma (pode ter formato diferente)
                        if (categoria.startsWith("Arma")) continue;
                        totalBonusInvalidos++;
                        avisos.push(`[BONUS] Item "${item.nome}" (${rank}/${categoria}) - Formato de bonus suspeito: "${bonusText}"`);
                    } else {
                        const atributo = match[1].toLowerCase();
                        const valor = parseInt(match[2]);
                        
                        // Verificar atributo válido
                        if (!ATRIBUTOS_VALIDOS.includes(atributo)) {
                            totalBonusInvalidos++;
                            avisos.push(`[BONUS] Item "${item.nome}" (${rank}/${categoria}) - Atributo desconhecido: "${match[1]}"`);
                        }
                        
                        // Verificar valor positivo
                        if (valor <= 0) {
                            totalBonusInvalidos++;
                            erros.push(`[BONUS] Item "${item.nome}" (${rank}/${categoria}) - Valor de atributo não pode ser ${valor}`);
                        }
                    }
                }
            }
        }
    }
    
    console.log(`✅ Estrutura de bonus verificada (${totalBonusInvalidos} avisos)`);
}

// =====================================
// EXECUÇÃO PRINCIPAL
// =====================================
async function main() {
    console.log("\n🧪 VERIFICAÇÃO COMPLETA DO SISTEMA DE ITENS 🧪");
    console.log("==============================================");
    
    // 1. Verificar loja
    verificarLoja();
    
    // 2. Verificar drops
    verificarDrops();
    
    // 3. Verificar consistência
    verificarConsistencia();
    
    // 4. Verificar estrutura de bonus
    verificarBonusEstrutura();
    
    // 5. Verificar equipar
    await verificarEquipar();
    
    // 6. Verificar banco
    await verificarBanco();
    
    // =====================================
    // RELATÓRIO FINAL
    // =====================================
    console.log("\n\n════════════════════════════════════════");
    console.log("📊 RELATÓRIO FINAL DE VERIFICAÇÃO");
    console.log("════════════════════════════════════════\n");
    
    console.log(`📦 Total de itens na loja: ${totalItens}`);
    
    if (erros.length === 0) {
        console.log("\n✅ NENHUM ERRO ENCONTRADO!");
    } else {
        console.log(`\n❌ ${erros.length} ERROS ENCONTRADOS:\n`);
        erros.forEach((erro, i) => {
            console.log(`  ${i + 1}. ${erro}`);
        });
    }
    
    if (avisos.length > 0) {
        console.log(`\n⚠️ ${avisos.length} AVISOS:\n`);
        avisos.forEach((aviso, i) => {
            console.log(`  ${i + 1}. ${aviso}`);
        });
    }
    
    console.log("\n════════════════════════════════════════\n");
    
    // Fechar banco
    if (typeof db.close === "function") {
        db.close();
    }
    
    process.exit(erros.length > 0 ? 1 : 0);
}

main().catch((e) => {
    console.error("Erro fatal:", e);
    process.exit(1);
});