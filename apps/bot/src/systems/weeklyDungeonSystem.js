"use strict";

const db = require("../../../../packages/database");
const { provider } = require("../../../../packages/database/config");
const CrystalRewardService = require("./crystalRewardService");
const SETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000;
let ready;

async function ensure() {
    if (!ready) ready = (async () => {
        await db.run(provider === "postgres"
            ? "CREATE TABLE IF NOT EXISTS dungeons_semanais (id BIGSERIAL PRIMARY KEY,dados TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'rascunho',criado_por TEXT,data_criacao TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,data_liberacao TIMESTAMPTZ,data_expiracao TIMESTAMPTZ)"
            : "CREATE TABLE IF NOT EXISTS dungeons_semanais (id INTEGER PRIMARY KEY AUTOINCREMENT,dados TEXT NOT NULL,status TEXT DEFAULT 'rascunho',criado_por TEXT,data_criacao TEXT DEFAULT CURRENT_TIMESTAMP,data_liberacao TEXT,data_expiracao TEXT)");
        try {
            await db.run(provider === "postgres"
                ? "ALTER TABLE dungeons_semanais ADD COLUMN IF NOT EXISTS data_expiracao TIMESTAMPTZ"
                : "ALTER TABLE dungeons_semanais ADD COLUMN data_expiracao TEXT");
        } catch (error) {
            if (!/duplicate column|already exists/i.test(String(error.message || ""))) throw error;
        }
        await db.run(provider === "postgres"
            ? "UPDATE dungeons_semanais SET data_expiracao=COALESCE(data_liberacao,data_criacao) + INTERVAL '7 days' WHERE status='liberada' AND data_expiracao IS NULL"
            : "UPDATE dungeons_semanais SET data_expiracao=datetime(COALESCE(data_liberacao,data_criacao), '+7 days') WHERE status='liberada' AND data_expiracao IS NULL");
    })();
    return ready;
}

async function encerrarExpiradas(executor = db) {
    await ensure();
    return executor.run(provider === "postgres"
        ? "UPDATE dungeons_semanais SET status='encerrada' WHERE status='liberada' AND data_expiracao IS NOT NULL AND data_expiracao <= CURRENT_TIMESTAMP"
        : "UPDATE dungeons_semanais SET status='encerrada' WHERE status='liberada' AND data_expiracao IS NOT NULL AND datetime(data_expiracao) <= datetime('now')");
}

async function liberar(actor, dados) {
    await ensure();
    const inicio = new Date();
    const fim = new Date(inicio.getTime() + SETE_DIAS_MS);
    const dungeon = { ...dados, duracao: "7 dias", inicioEm: inicio.toISOString(), fimEm: fim.toISOString() };
    await db.transaction(async q => {
        await encerrarExpiradas(q);
        await q.run("UPDATE dungeons_semanais SET status='encerrada' WHERE status='liberada'");
        await q.run("INSERT INTO dungeons_semanais(dados,status,criado_por,data_criacao,data_liberacao,data_expiracao) VALUES(?,'liberada',?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,?)", [JSON.stringify(dungeon), actor, fim.toISOString()]);
    });
    return dungeon;
}

async function obterAtiva() {
    await ensure();
    await encerrarExpiradas();
    return db.get("SELECT dados,data_liberacao,data_expiracao FROM dungeons_semanais WHERE status='liberada' ORDER BY id DESC LIMIT 1");
}

// Ponto de integração para o futuro fluxo real de conclusão semanal.
// Não cria conclusão, elegibilidade, participação ou recompensa paralela.
async function concederCristaisConclusao(jogadorId, conclusaoId, rank, contexto = null) {
    return CrystalRewardService.concederDungeonSemanal(jogadorId, conclusaoId, rank, contexto);
}

module.exports = { ensure, db, liberar, obterAtiva, encerrarExpiradas, concederCristaisConclusao, SETE_DIAS_MS };
