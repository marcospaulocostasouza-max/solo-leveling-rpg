"use strict";

const database = require("../../../../packages/database");
const { provider } = require("../../../../packages/database/config");

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

module.exports = { ATRIBUTOS, garantirEstrutura, criarConjunto, associarItem, configurarEstagio, getProgressoConjuntos, getConjuntosAtivos, calcularBonusConjuntos, getBonusConjunto };
