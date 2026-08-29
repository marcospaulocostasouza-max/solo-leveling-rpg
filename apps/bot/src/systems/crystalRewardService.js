"use strict";

const database = require("../../../../packages/database");
const config = require("../config/crystalRewards");

const ORIGENS = Object.freeze({
    DUNGEON: "DUNGEON",
    DUNGEON_SEMANAL: "DUNGEON_SEMANAL",
    DUNGEON_AUTONARRADA: "DUNGEON_AUTONARRADA",
    TREINO_DIARIO_CAIXA: "TREINO_DIARIO_CAIXA",
    MISSAO: "MISSAO",
    EVENTO: "EVENTO",
    BOSS: "BOSS",
    RECOMPENSA_ESPECIAL: "RECOMPENSA_ESPECIAL",
    ADMIN: "ADMIN"
});
const RANKS = new Set(["E", "D", "C", "B", "A", "S"]);

function quantidadeConfigurada(valor) {
    if (valor == null || valor === 0) return 0;
    const quantidade = Number(valor);
    if (!Number.isSafeInteger(quantidade) || quantidade < 0) throw new Error("Recompensa de Cristais configurada com valor invalido.");
    return quantidade;
}

function porRank(fonte, rank) {
    const real = String(rank || "").toUpperCase();
    if (!RANKS.has(real)) throw new Error(`Rank de atividade invalido: ${rank}`);
    return quantidadeConfigurada(config[fonte]?.[real]);
}

async function conceder({ jogadorId, quantidade, origem, referencia, contexto, query = null }) {
    const valor = quantidadeConfigurada(quantidade);
    if (valor === 0) return { sucesso: true, configurada: false, duplicada: false, quantidade: 0 };
    if (!Object.values(ORIGENS).includes(origem)) throw new Error(`Origem de Cristais invalida: ${origem}`);
    const resultado = query
        ? await database.adicionarCristaisIdempotenteComQuery(query, jogadorId, valor, origem, referencia, contexto)
        : await database.adicionarCristaisIdempotente(jogadorId, valor, origem, referencia, contexto);
    return { configurada: true, ...resultado };
}

async function concederDungeonAutonarrada(jogadorId, ficha) {
    return conceder({
        jogadorId,
        quantidade: porRank("dungeonAutonarrada", ficha.dungeon_rank),
        origem: ORIGENS.DUNGEON_AUTONARRADA,
        referencia: `ficha_dungeon:${ficha.id}`,
        contexto: JSON.stringify({ dungeon: ficha.dungeon_nome, rank: ficha.dungeon_rank })
    });
}

async function concederDungeonSemanal(jogadorId, conclusaoId, rank, contexto = null) {
    return conceder({ jogadorId, quantidade: porRank("dungeonSemanal", rank), origem: ORIGENS.DUNGEON_SEMANAL,
        referencia: `dungeon_semanal:${conclusaoId}`, contexto });
}

async function concederMissao(jogadorId, conclusaoId, quantidade, contexto = null) {
    return conceder({ jogadorId, quantidade, origem: ORIGENS.MISSAO, referencia: `missao:${conclusaoId}`, contexto });
}

async function concederEvento(jogadorId, eventRewardId, quantidade = config.evento, contexto = null) {
    return conceder({ jogadorId, quantidade, origem: ORIGENS.EVENTO, referencia: `evento:${eventRewardId}`, contexto });
}

async function concederBoss(jogadorId, bossKillId, rank, quantidade = null, contexto = null) {
    const valor = quantidade == null ? porRank("boss", rank) : quantidade;
    return conceder({ jogadorId, quantidade: valor, origem: ORIGENS.BOSS, referencia: `boss:${bossKillId}`, contexto });
}

async function concederAdmin(jogadorId, quantidade, referencia, contexto = null) {
    return conceder({ jogadorId, quantidade, origem: ORIGENS.ADMIN, referencia: `admin:${referencia}`, contexto });
}

module.exports = { ORIGENS, quantidadeConfigurada, porRank, conceder, concederDungeonAutonarrada,
    concederDungeonSemanal, concederMissao, concederEvento, concederBoss, concederAdmin };
