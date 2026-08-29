"use strict";

const db = require("../../../../packages/database");
const { provider } = require("../../../../packages/database/config");
const CrystalRewardService = require("./crystalRewardService");
let ready;

async function ensure() {
    if (!ready) ready = db.run(provider === "postgres"
        ? "CREATE TABLE IF NOT EXISTS dungeons_semanais (id BIGSERIAL PRIMARY KEY,dados TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'rascunho',criado_por TEXT,data_criacao TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,data_liberacao TIMESTAMPTZ)"
        : "CREATE TABLE IF NOT EXISTS dungeons_semanais (id INTEGER PRIMARY KEY AUTOINCREMENT,dados TEXT NOT NULL,status TEXT DEFAULT 'rascunho',criado_por TEXT,data_criacao TEXT DEFAULT CURRENT_TIMESTAMP,data_liberacao TEXT)");
    return ready;
}

// Ponto de integração para o futuro fluxo real de conclusão semanal.
// Não cria conclusão, elegibilidade, participação ou recompensa paralela.
async function concederCristaisConclusao(jogadorId, conclusaoId, rank, contexto = null) {
    return CrystalRewardService.concederDungeonSemanal(jogadorId, conclusaoId, rank, contexto);
}

module.exports = { ensure, db, concederCristaisConclusao };
