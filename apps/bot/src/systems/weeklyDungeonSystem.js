"use strict";

const db = require("../../../../packages/database");
const { provider } = require("../../../../packages/database/config");
const CrystalRewardService = require("./crystalRewardService");
const SETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000;
let ready;

async function ensure() {
    if (!ready) ready = (async () => {
        await db.ensureCrystalSchema();
        await db.run(provider === "postgres"
            ? "CREATE TABLE IF NOT EXISTS dungeons_semanais (id BIGSERIAL PRIMARY KEY,dados TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'rascunho',criado_por TEXT,data_criacao TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,data_liberacao TIMESTAMPTZ,data_expiracao TIMESTAMPTZ)"
            : "CREATE TABLE IF NOT EXISTS dungeons_semanais (id INTEGER PRIMARY KEY AUTOINCREMENT,dados TEXT NOT NULL,status TEXT DEFAULT 'rascunho',criado_por TEXT,data_criacao TEXT DEFAULT CURRENT_TIMESTAMP,data_liberacao TEXT,data_expiracao TEXT)");
        await db.run(provider === "postgres"
            ? "CREATE TABLE IF NOT EXISTS conclusoes_dungeon_semanal (id BIGSERIAL PRIMARY KEY,dungeon_id BIGINT NOT NULL,jogador_id BIGINT NOT NULL,status TEXT NOT NULL DEFAULT 'pendente',recompensa_xp BIGINT NOT NULL DEFAULT 0,recompensa_won BIGINT NOT NULL DEFAULT 0,solicitada_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,concluida_em TIMESTAMPTZ,aprovada_por TEXT,UNIQUE(dungeon_id,jogador_id))"
            : "CREATE TABLE IF NOT EXISTS conclusoes_dungeon_semanal (id INTEGER PRIMARY KEY AUTOINCREMENT,dungeon_id INTEGER NOT NULL,jogador_id INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'pendente',recompensa_xp INTEGER NOT NULL DEFAULT 0,recompensa_won INTEGER NOT NULL DEFAULT 0,solicitada_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,concluida_em TEXT,aprovada_por TEXT,UNIQUE(dungeon_id,jogador_id))");
        for (const [column, definition] of [["status", "TEXT NOT NULL DEFAULT 'pendente'"], ["solicitada_em", "TEXT"], ["aprovada_por", "TEXT"]]) {
            if (provider === "postgres") await db.run(`ALTER TABLE conclusoes_dungeon_semanal ADD COLUMN IF NOT EXISTS ${column} ${definition}`);
            else { try { await db.run(`ALTER TABLE conclusoes_dungeon_semanal ADD COLUMN ${column} ${definition}`); } catch (error) { if (!/duplicate column/i.test(String(error.message))) throw error; } }
        }
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

function itensDaRecompensa(valor) {
    if (!valor || /^nenhum$/i.test(String(valor).trim())) return [];
    return String(valor).split(/[,;\n]/).map(item => item.trim()).filter(Boolean);
}

// A ADM registra a conclusao diretamente para a dungeon semanal ativa.
async function aprovarConclusao(jogadorId, aprovadoPor) {
    await ensure();
    const resultado = await db.transaction(async query => {
        const player = await query.get(provider === "postgres" ? "SELECT id FROM jogadores WHERE id=? FOR UPDATE" : "SELECT id FROM jogadores WHERE id=?", [jogadorId]);
        if (!player) throw new Error("Jogador nao encontrado.");
        await encerrarExpiradas(query);
        const dungeon = await query.get("SELECT * FROM dungeons_semanais WHERE status='liberada' ORDER BY id DESC LIMIT 1");
        if (!dungeon) throw new Error("Nao ha Dungeon semanal ativa para aprovar.");
        await query.run("INSERT INTO conclusoes_dungeon_semanal(dungeon_id,jogador_id,status) VALUES(?,?,'pendente') ON CONFLICT DO NOTHING", [dungeon.id, jogadorId]);
        const conclusao = await query.get("SELECT * FROM conclusoes_dungeon_semanal WHERE dungeon_id=? AND jogador_id=?", [dungeon.id, jogadorId]);
        if (conclusao.status === "aprovada") throw new Error("Este jogador ja recebeu os premios desta Dungeon semanal.");
        if (conclusao.status !== "pendente") throw new Error("O registro desta Dungeon semanal nao permite aprovacao.");
        const dados = JSON.parse(dungeon.dados || "{}");
        const xp = Math.max(0, Number(dados.xp) || 0), won = Math.max(0, Number(dados.won) || 0);
        await query.run("UPDATE jogadores SET experiencia=experiencia+?,won=won+? WHERE id=?", [xp, won, jogadorId]);
        await query.run("INSERT INTO experiencia_historico(jogador_id,quantidade,motivo,data) VALUES(?,?,?,CURRENT_TIMESTAMP)", [jogadorId, xp, `Dungeon semanal: ${dados.nome || dungeon.id}`]);
        await query.run("INSERT INTO transacoes(jogador_id,valor,tipo,motivo,data) VALUES(?,?,'ganho',?,CURRENT_TIMESTAMP)", [jogadorId, won, `Dungeon semanal: ${dados.nome || dungeon.id}`]);
        const itens = [];
        for (const nome of itensDaRecompensa(dados.itens)) {
            const item = await query.get("SELECT id,nome FROM itens WHERE LOWER(nome)=LOWER(?)", [nome]);
            if (!item) continue;
            const inv = await query.get("SELECT id FROM inventario_jogador WHERE jogador_id=? AND item_id=?", [jogadorId, item.id]);
            if (inv) await query.run("UPDATE inventario_jogador SET quantidade=quantidade+1 WHERE id=?", [inv.id]);
            else await query.run("INSERT INTO inventario_jogador(jogador_id,item_id,quantidade,equipado) VALUES(?,?,1,0)", [jogadorId, item.id]);
            itens.push(item.nome);
        }
        const cristais = await CrystalRewardService.conceder({ jogadorId, quantidade: CrystalRewardService.porRank("dungeonSemanal", dados.rank), origem: CrystalRewardService.ORIGENS.DUNGEON_SEMANAL, referencia: `dungeon_semanal:${dungeon.id}`, contexto: JSON.stringify({ dungeon: dados.nome || dungeon.id, rank: dados.rank }), query });
        await query.run("UPDATE conclusoes_dungeon_semanal SET status='aprovada',recompensa_xp=?,recompensa_won=?,concluida_em=CURRENT_TIMESTAMP,aprovada_por=? WHERE id=? AND status='pendente'", [xp, won, aprovadoPor, conclusao.id]);
        return { duplicada: false, dados, dungeonId: dungeon.id, xp, won, itens, cristais: cristais.quantidade || 0 };
    });
    if (!resultado.duplicada) {
        try { await require("./levelSystem").verificarProgressao(jogadorId); }
        catch (error) { console.error("[DUNGEON-WEEKLY] Recalculo de nivel pendente:", error.message); }
    }
    return resultado;
}

// Ponto de integração para o futuro fluxo real de conclusão semanal.
// Não cria conclusão, elegibilidade, participação ou recompensa paralela.
async function concederCristaisConclusao(jogadorId, conclusaoId, rank, contexto = null) {
    return CrystalRewardService.concederDungeonSemanal(jogadorId, conclusaoId, rank, contexto);
}

module.exports = { ensure, db, liberar, obterAtiva, encerrarExpiradas, aprovarConclusao, concederCristaisConclusao, SETE_DIAS_MS };
