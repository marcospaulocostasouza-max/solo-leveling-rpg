"use strict";

const fs = require("fs");
const path = require("path");
const { PDFParse } = require("../apps/bot/node_modules/pdf-parse");
const database = require("../packages/database");
const Sets = require("../apps/bot/src/systems/equipmentSetService");
const { nomeConjuntoUnico, nomeItemUnico } = require("./equipment-catalog-naming");

const PDF_PADRAO = "C:/Users/Marcos/Downloads/catalogo_150_conjuntos_corrigido_atributos_rpg.pdf";
const ATRIBUTOS = {
    "Força": "forca", "Resistência": "resistencia", "Velocidade": "velocidade",
    "Sentidos": "sentidos", "Inteligência": "inteligencia", "Poder Mágico": "poder_magico"
};
const SLOTS = {
    "Cabeça": "Cabeça", "Corpo": "Corpo", "Acessório": "Acessórios", "Item de Apoio": "Item de Apoio",
    "Pernas": "Pernas", "Pés": "Pés", "Arma 1FP": "Arma 1", "Arma 2FP": "Arma 2"
};

function limparPaginas(texto) {
    return texto.replace(/Solo Leveling RPG — Catálogo de 150 Conjuntos Página \d+\n/g, "")
        .replace(/-- \d+ of \d+ --/g, "")
        .replace(/Poder\s*\n\s*Mágico/g, "Poder Mágico");
}

function parseAtributos(texto) {
    const valores = { forca: 0, resistencia: 0, velocidade: 0, sentidos: 0, inteligencia: 0, poder_magico: 0 };
    const regex = /\+(\d+)\s+(Força|Resistência|Velocidade|Sentidos|Inteligência|Poder Mágico)/g;
    let match;
    while ((match = regex.exec(texto)) !== null) valores[ATRIBUTOS[match[2]]] = Number(match[1]);
    return valores;
}

function parseCatalogo(textoOriginal) {
    const texto = limparPaginas(textoOriginal);
    const cabecalhos = [...texto.matchAll(/(?:^|\n)(\d{2,3})\. ([^\n]+)\nDescrição do conjunto:/g)];
    const conjuntos = [];
    for (let i = 0; i < cabecalhos.length; i++) {
        const numeroCatalogo = Number(cabecalhos[i][1]);
        const rank = i < 50 ? "D" : i < 100 ? "C" : "B";
        const nomeBase = cabecalhos[i][2].trim();
        const nome = nomeConjuntoUnico(nomeBase, rank, i % 50);
        const inicio = cabecalhos[i].index;
        const fim = cabecalhos[i + 1]?.index ?? texto.length;
        const bloco = texto.slice(inicio, fim);
        const descricao = (bloco.match(/Descrição do conjunto:\s*([\s\S]*?)\nFoco principal:/) || [])[1]?.replace(/\s+/g, " ").trim();
        const tabela = ((bloco.match(/Item Slot Atributos Fixos\n([\s\S]*?)\nDescrição individual dos itens:/) || [])[1] || "")
            .replace(/\n\s*(Força|Resistência|Velocidade|Sentidos|Inteligência|Poder Mágico)\b/g, " $1");
        const itens = tabela.split("\n").map(linha => linha.trim()).filter(Boolean).map(linha => {
            const match = linha.match(/^(.*?)\s+(Arma 1FP|Arma 2FP|Item de Apoio|Acessório|Cabeça|Corpo|Pernas|Pés)\s+(.+)$/);
            if (!match) throw new Error(`Linha de item nao reconhecida no conjunto ${numeroCatalogo} Rank ${rank}: ${linha}`);
            const slotOriginal = match[2];
            const atributos = parseAtributos(match[3]);
            const nomeItemBase = match[1].trim();
            return { nome: nomeItemUnico(nomeItemBase, rank), nomeBase: nomeItemBase, slot: SLOTS[slotOriginal], slotOriginal, atributos };
        });
        const bonusBloco = (bloco.match(/Bônus do conjunto:\n([\s\S]*?)$/) || [])[1] || "";
        const estagios = [...bonusBloco.matchAll(/(\d+) peças:\s*([^\n]+)/g)].map(match => ({ requiredPieces: Number(match[1]), ...parseAtributos(match[2]) }));
        conjuntos.push({ numero: i + 1, numeroCatalogo, nome, nomeBase, descricao, rank, itens, estagios });
    }
    validarCatalogo(conjuntos);
    return conjuntos;
}

function validarCatalogo(conjuntos) {
    if (conjuntos.length !== 150) throw new Error(`Esperados 150 conjuntos; encontrados ${conjuntos.length}.`);
    const nomesConjuntos = new Set(); const nomesItens = new Set();
    for (const conjunto of conjuntos) {
        if (nomesConjuntos.has(conjunto.nome)) throw new Error(`Conjunto duplicado: ${conjunto.nome}`);
        nomesConjuntos.add(conjunto.nome);
        if (conjunto.itens.length < 2 || conjunto.itens.length > 5) throw new Error(`${conjunto.nome} possui ${conjunto.itens.length} itens.`);
        if (!conjunto.estagios.length || conjunto.estagios.some(estagio => estagio.requiredPieces > conjunto.itens.length)) throw new Error(`Estagios invalidos em ${conjunto.nome}.`);
        for (const item of conjunto.itens) {
            if (!Object.values(SLOTS).includes(item.slot)) throw new Error(`Slot invalido: ${item.slotOriginal}`);
            if (nomesItens.has(item.nome)) throw new Error(`Nome de item duplicado no catalogo: ${item.nome}`);
            nomesItens.add(item.nome);
        }
    }
    return true;
}

async function extrairPdf(caminho) {
    const parser = new PDFParse({ data: fs.readFileSync(caminho) });
    try { return (await parser.getText()).text; } finally { await parser.destroy(); }
}

function flagsDoSlot(slot) {
    return { arma: slot === "Arma 1" || slot === "Arma 2" ? 1 : 0, armadura: ["Cabeça", "Corpo", "Pernas", "Pés"].includes(slot) ? 1 : 0, acessorio: slot === "Acessórios" ? 1 : 0 };
}

async function importar(conjuntos) {
    await Sets.garantirEstrutura();
    return database.transaction(async query => {
        let itensCriados = 0; let itensAtualizados = 0;
        for (const conjunto of conjuntos) {
            let set = await query.get("SELECT * FROM equipment_sets WHERE nome = ?", [conjunto.nome]);
            if (!set) {
                const sql = "INSERT INTO equipment_sets (nome, descricao, rank, ativo) VALUES (?, ?, ?, 1)";
                const criado = await query.run(require("../packages/database/config").provider === "postgres" ? `${sql} RETURNING id` : sql, [conjunto.nome, conjunto.descricao, conjunto.rank]);
                set = { id: Number(criado.lastID) };
            } else await query.run("UPDATE equipment_sets SET descricao = ?, rank = ?, ativo = 1, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?", [conjunto.descricao, conjunto.rank, set.id]);
            for (const item of conjunto.itens) {
                const existentes = await query.all("SELECT id FROM itens WHERE nome = ?", [item.nome]);
                if (existentes.length > 1) throw new Error(`Mais de um item existente com o nome ${item.nome}.`);
                const flags = flagsDoSlot(item.slot);
                const params = [item.slot, conjunto.rank, `${item.nome} pertence ao conjunto ${conjunto.nome}.`, flags.arma, flags.armadura, flags.acessorio,
                    item.atributos.forca, item.atributos.resistencia, item.atributos.velocidade, item.atributos.sentidos, item.atributos.inteligencia, item.atributos.poder_magico];
                let itemId;
                if (existentes[0]) {
                    itemId = Number(existentes[0].id); itensAtualizados++;
                    await query.run("UPDATE itens SET categoria=?, slot=?, tier=?, descricao=?, arma=?, armadura=?, acessorio=?, consumivel=0, forca_bonus=?, resistencia_bonus=?, velocidade_bonus=?, sentidos_bonus=?, inteligencia_bonus=?, poder_magico_bonus=? WHERE id=?", [item.slot, ...params, itemId]);
                } else {
                    const sql = "INSERT INTO itens (nome, categoria, slot, tier, descricao, arma, armadura, acessorio, consumivel, forca_bonus, resistencia_bonus, velocidade_bonus, sentidos_bonus, inteligencia_bonus, poder_magico_bonus) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)";
                    const criado = await query.run(require("../packages/database/config").provider === "postgres" ? `${sql} RETURNING id` : sql, [item.nome, item.slot, ...params]);
                    itemId = Number(criado.lastID); itensCriados++;
                }
                await query.run("INSERT INTO equipment_set_items (set_id, item_id) VALUES (?, ?) ON CONFLICT(item_id) DO UPDATE SET set_id = excluded.set_id", [set.id, itemId]);
            }
            await query.run("DELETE FROM equipment_set_bonuses WHERE set_id = ?", [set.id]);
            for (const estagio of conjunto.estagios) await query.run("INSERT INTO equipment_set_bonuses (set_id, required_pieces, forca, resistencia, velocidade, sentidos, inteligencia, poder_magico) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [set.id, estagio.requiredPieces, estagio.forca, estagio.resistencia, estagio.velocidade, estagio.sentidos, estagio.inteligencia, estagio.poder_magico]);
        }
        return { conjuntos: conjuntos.length, itensCriados, itensAtualizados, itensTotal: conjuntos.reduce((soma, conjunto) => soma + conjunto.itens.length, 0) };
    });
}

async function main() {
    const caminho = path.resolve(process.argv.find(arg => arg.toLowerCase().endsWith(".pdf")) || PDF_PADRAO);
    const conjuntos = parseCatalogo(await extrairPdf(caminho));
    const resumo = { conjuntos: conjuntos.length, itens: conjuntos.reduce((soma, conjunto) => soma + conjunto.itens.length, 0), ranks: Object.fromEntries(["D", "C", "B"].map(rank => [rank, conjuntos.filter(item => item.rank === rank).length])) };
    if (process.argv.includes("--dry-run")) { console.log(JSON.stringify(resumo, null, 2)); return; }
    console.log(JSON.stringify(await importar(conjuntos), null, 2));
}

if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { parseAtributos, parseCatalogo, validarCatalogo, extrairPdf, importar };
