"use strict";

const database = require("../../../../packages/database");
const { provider } = require("../../../../packages/database/config");
const { limiteDeAtributosConjunto, totalDeAtributos } = require("../config/equipmentSetLimits");

const ATRIBUTOS = Object.freeze(["forca", "resistencia", "velocidade", "sentidos", "inteligencia", "poder_magico"]);
const RANKS = new Set(["D", "C", "B", "A", "S"]);

function inteiroNaoNegativo(valor, campo) {
    const numero = Number(valor || 0);
    if (!Number.isSafeInteger(numero) || numero < 0) throw new Error(`${campo} deve ser um inteiro fixo nao negativo.`);
    return numero;
}

async function garantirEstrutura() { return database.ensureEquipmentSetSchema(); }

async function criarConjunto(dados) {
    await garantirEstrutura();
    const nome = String(dados?.nome || "").trim();
    const rank = String(dados?.rank || "").trim().toUpperCase();
    if (!nome) throw new Error("Nome do conjunto e obrigatorio.");
    if (!RANKS.has(rank)) throw new Error("Rank do conjunto deve ser D, C, B, A ou S.");
    const sql = "INSERT INTO equipment_sets (nome, descricao, rank, ativo) VALUES (?, ?, ?, ?)";
    const resultado = await database.run(provider === "postgres" ? `${sql} RETURNING id` : sql, [nome, dados.descricao || null, rank, dados.ativo === false ? 0 : 1]);
    return database.get("SELECT * FROM equipment_sets WHERE id = ?", [Number(resultado.lastID)]);
}

async function associarItem(conjuntoId, itemId) {
    await garantirEstrutura();
    const [conjunto, item] = await Promise.all([
        database.get("SELECT id FROM equipment_sets WHERE id = ?", [Number(conjuntoId)]),
        database.get("SELECT id FROM itens WHERE id = ?", [Number(itemId)])
    ]);
    if (!conjunto || !item) throw new Error("Conjunto ou item nao encontrado.");
    await database.run("INSERT INTO equipment_set_items (set_id, item_id) VALUES (?, ?) ON CONFLICT(item_id) DO UPDATE SET set_id = excluded.set_id", [conjunto.id, item.id]);
    return true;
}

async function configurarEstagio(conjuntoId, requiredPieces, valores = {}) {
    await garantirEstrutura();
    const pecas = Number(requiredPieces);
    if (!Number.isSafeInteger(pecas) || pecas < 2) throw new Error("O estagio exige pelo menos 2 pecas.");
    const bonus = Object.fromEntries(ATRIBUTOS.map(chave => [chave, inteiroNaoNegativo(valores[chave], chave)]));
    await database.run(`INSERT INTO equipment_set_bonuses
        (set_id, required_pieces, forca, resistencia, velocidade, sentidos, inteligencia, poder_magico, efeito_futuro)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(set_id, required_pieces) DO UPDATE SET forca=excluded.forca, resistencia=excluded.resistencia,
        velocidade=excluded.velocidade, sentidos=excluded.sentidos, inteligencia=excluded.inteligencia,
        poder_magico=excluded.poder_magico, efeito_futuro=excluded.efeito_futuro`,
    [Number(conjuntoId), pecas, ...ATRIBUTOS.map(chave => bonus[chave]), valores.efeitoFuturo || null]);
    return true;
}

async function getProgressoConjuntos(playerId) { await garantirEstrutura(); return database.getEquipmentSetProgress(playerId); }
async function getConjuntosAtivos(playerId) { return (await getProgressoConjuntos(playerId)).filter(item => item.estagioAtivo); }
async function calcularBonusConjuntos(playerId) { await garantirEstrutura(); return (await database.calculateEquipmentSetBonus(playerId)).bonus; }
async function getBonusConjunto(playerId, conjuntoId) { return (await getProgressoConjuntos(playerId)).find(item => Number(item.id) === Number(conjuntoId)) || null; }

async function listarConjuntos() {
    await garantirEstrutura();
    return database.all(`SELECT * FROM equipment_sets WHERE ativo=1
        ORDER BY CASE rank WHEN 'D' THEN 1 WHEN 'C' THEN 2 WHEN 'B' THEN 3 WHEN 'A' THEN 4 WHEN 'S' THEN 5 ELSE 6 END, nome`);
}
async function detalharConjunto(conjuntoId) {
    await garantirEstrutura();
    const conjunto = await database.get("SELECT * FROM equipment_sets WHERE id=? AND ativo=1", [Number(conjuntoId)]);
    if (!conjunto) return null;
    const [itens, bonus] = await Promise.all([
        database.all("SELECT i.* FROM equipment_set_items esi JOIN itens i ON i.id=esi.item_id WHERE esi.set_id=? ORDER BY i.nome", [conjunto.id]),
        database.all("SELECT * FROM equipment_set_bonuses WHERE set_id=? ORDER BY required_pieces", [conjunto.id])
    ]);
    return { conjunto, itens, bonus };
}
async function listarItensRaros() {
    await garantirEstrutura();
    return database.all("SELECT i.* FROM banner_rare_items bri JOIN itens i ON i.id=bri.item_id WHERE bri.tipo='ITEM' ORDER BY i.nome");
}
async function criarConjuntoCompleto(dados) {
    await garantirEstrutura();
    const nome = String(dados?.nome || "").trim(); const rank = String(dados?.rank || "").toUpperCase();
    if (!nome || !RANKS.has(rank)) throw new Error("Nome e Rank D, C, B, A ou S são obrigatórios.");
    const itemIds = [...new Set((dados.itemIds || []).map(Number))];
    if (itemIds.length < 6) throw new Error("O conjunto precisa de pelo menos 6 Itens Raros distintos para possuir o estágio de 6 equipamentos.");
    const marcadores = itemIds.map(() => "?").join(",");
    const raros = await database.all(`SELECT item_id FROM banner_rare_items WHERE tipo='ITEM' AND item_id IN (${marcadores})`, itemIds);
    if (raros.length !== itemIds.length) throw new Error("Todos os itens do conjunto precisam pertencer ao catálogo de Itens Raros.");
    const itens = await database.all(`SELECT * FROM itens WHERE id IN (${marcadores})`, itemIds);
    const limite = limiteDeAtributosConjunto(rank);
    if (Number.isFinite(limite)) {
        const acimaDoLimite = itens
            .map(item => ({ nome: item.nome, total: totalDeAtributos(item) }))
            .filter(item => item.total > limite);
        if (acimaDoLimite.length) {
            throw new Error(`Peças de conjunto Rank ${rank} aceitam no máximo ${limite} atributos no total. Corrija: ${acimaDoLimite.map(item => `${item.nome} (${item.total})`).join(", ")}.`);
        }
    }
    if (await database.get("SELECT id FROM equipment_sets WHERE LOWER(nome)=LOWER(?)", [nome])) throw new Error("Já existe um conjunto com esse nome.");
    const setId = await database.transaction(async query => {
        const sql = "INSERT INTO equipment_sets (nome,descricao,rank,ativo) VALUES (?,?,?,1)";
        const criado = await query.run(provider === "postgres" ? `${sql} RETURNING id` : sql, [nome, dados.descricao || null, rank]);
        const setId = Number(criado.lastID);
        for (const itemId of itemIds) await query.run("INSERT INTO equipment_set_items (set_id,item_id) VALUES (?,?)", [setId, itemId]);
        for (const estagio of dados.estagios || []) {
            const pecas = Number(estagio.pecas); if (![2, 4, 6].includes(pecas)) throw new Error("Os estágios permitidos são 2, 4 e 6 equipamentos.");
            const bonus = Object.fromEntries(ATRIBUTOS.map(chave => [chave, inteiroNaoNegativo(estagio[chave], chave)]));
            await query.run(`INSERT INTO equipment_set_bonuses (set_id,required_pieces,forca,resistencia,velocidade,sentidos,inteligencia,poder_magico,efeito_futuro) VALUES (?,?,?,?,?,?,?,?,?)`, [setId, pecas, ...ATRIBUTOS.map(chave => bonus[chave]), estagio.descricao || null]);
        }
        if ((dados.estagios || []).length !== 3) throw new Error("Preencha os bônus de 2, 4 e 6 equipamentos.");
        return setId;
    });
    return detalharConjunto(setId);
}

module.exports = { ATRIBUTOS, garantirEstrutura, criarConjunto, associarItem, configurarEstagio, getProgressoConjuntos, getConjuntosAtivos, calcularBonusConjuntos, getBonusConjunto, listarConjuntos, detalharConjunto, listarItensRaros, criarConjuntoCompleto };
