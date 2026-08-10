/**
 * MISSION MANAGER
 *
 * Módulo central responsável por gerenciar todas as missões do jogo.
 *
 * Este módulo NÃO utiliza IA.
 * Ele apenas armazena, recupera e controla o estado das missões.
 *
 * Tabelas SQLite:
 * - missions: definição das missões
 * - player_missions: progresso dos jogadores nas missões
 *
 * Status: disponivel, em_andamento, concluida, falhou, cancelada
 * Categorias: principal, secundaria, guilda, associacao, cacada,
 *   exploracao, investigacao, evento, diaria, semanal, oculta
 */

const db = require("../core/database");

let tabelasProntas = false;

function criarTabelas() {
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS missions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            npcId TEXT,
            nome TEXT NOT NULL,
            descricao TEXT,
            categoria TEXT DEFAULT 'secundaria',
            rank TEXT DEFAULT 'E',
            nivelMinimo INTEGER DEFAULT 1,
            repetivel INTEGER DEFAULT 0,
            tempoLimite TEXT,
            proximaMissao INTEGER,
            requisitos TEXT,
            objetivos TEXT,
            recompensas TEXT,
            status TEXT DEFAULT 'disponivel',
            ativo INTEGER DEFAULT 1
        )`);
        db.run(`CREATE TABLE IF NOT EXISTS player_missions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            jogadorId TEXT NOT NULL,
            missionId INTEGER NOT NULL,
            status TEXT DEFAULT 'em_andamento',
            progresso TEXT,
            dataInicio TEXT DEFAULT (datetime('now')),
            dataConclusao TEXT,
            UNIQUE(jogadorId, missionId)
        )`);
        tabelasProntas = true;
    });
}

criarTabelas();

function garantirTabelas() {
    return new Promise((resolve) => {
        if (tabelasProntas) { resolve(); return; }
        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS missions (id INTEGER PRIMARY KEY AUTOINCREMENT, npcId TEXT, nome TEXT NOT NULL, descricao TEXT, categoria TEXT DEFAULT 'secundaria', rank TEXT DEFAULT 'E', nivelMinimo INTEGER DEFAULT 1, repetivel INTEGER DEFAULT 0, tempoLimite TEXT, proximaMissao INTEGER, requisitos TEXT, objetivos TEXT, recompensas TEXT, status TEXT DEFAULT 'disponivel', ativo INTEGER DEFAULT 1)`);
            db.run(`CREATE TABLE IF NOT EXISTS player_missions (id INTEGER PRIMARY KEY AUTOINCREMENT, jogadorId TEXT NOT NULL, missionId INTEGER NOT NULL, status TEXT DEFAULT 'em_andamento', progresso TEXT, dataInicio TEXT DEFAULT (datetime('now')), dataConclusao TEXT, UNIQUE(jogadorId, missionId))`);
            tabelasProntas = true;
            resolve();
        });
    });
}

async function criarMissao(missao) {
    await garantirTabelas();
    return new Promise((resolve) => {
        if (!missao || !missao.nome) { resolve(null); return; }
        db.run(
            `INSERT INTO missions (npcId, nome, descricao, categoria, rank, nivelMinimo, repetivel, tempoLimite, proximaMissao, requisitos, objetivos, recompensas, status, ativo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [missao.npcId || null, missao.nome, missao.descricao || "", missao.categoria || "secundaria", missao.rank || "E", missao.nivelMinimo || 1, missao.repetivel ? 1 : 0, missao.tempoLimite || null, missao.proximaMissao || null, missao.requisitos ? JSON.stringify(missao.requisitos) : null, missao.objetivos ? JSON.stringify(missao.objetivos) : null, missao.recompensas ? JSON.stringify(missao.recompensas) : null, missao.status || "disponivel", missao.ativo !== false ? 1 : 0],
            function (err) { if (err) { console.error("[MISSION] Erro ao criar missão:", err.message); resolve(null); } else { resolve(this.lastID); } }
        );
    });
}

async function editarMissao(missionId, dados) {
    await garantirTabelas();
    return new Promise((resolve) => {
        if (!missionId || !dados) { resolve(false); return; }
        const camposPermitidos = ["npcId", "nome", "descricao", "categoria", "rank", "nivelMinimo", "repetivel", "tempoLimite", "proximaMissao", "requisitos", "objetivos", "recompensas", "status", "ativo"];
        const sets = [];
        const params = [];
        for (const [campo, valor] of Object.entries(dados)) {
            if (camposPermitidos.includes(campo)) {
                if (["requisitos", "objetivos", "recompensas"].includes(campo) && typeof valor === "object") { sets.push(`${campo} = ?`); params.push(JSON.stringify(valor)); }
                else if (campo === "repetivel" || campo === "ativo") { sets.push(`${campo} = ?`); params.push(valor ? 1 : 0); }
                else { sets.push(`${campo} = ?`); params.push(valor); }
            }
        }
        if (sets.length === 0) { resolve(false); return; }
        params.push(missionId);
        db.run(`UPDATE missions SET ${sets.join(", ")} WHERE id = ?`, params, (err) => { if (err) { console.error("[MISSION] Erro ao editar:", err.message); resolve(false); } else { resolve(true); } });
    });
}

async function removerMissao(missionId) {
    await garantirTabelas();
    return new Promise((resolve) => {
        db.run(`DELETE FROM missions WHERE id = ?`, [missionId], (err) => {
            if (err) { console.error("[MISSION] Erro ao remover:", err.message); resolve(false); }
            else { db.run(`DELETE FROM player_missions WHERE missionId = ?`, [missionId]); resolve(true); }
        });
    });
}

async function buscarMissao(missionId) {
    await garantirTabelas();
    return new Promise((resolve) => {
        db.get(`SELECT * FROM missions WHERE id = ?`, [missionId], (err, row) => {
            if (err) { console.error("[MISSION] Erro ao buscar:", err.message); resolve(null); }
            else { resolve(row ? parseMissaoJSON(row) : null); }
        });
    });
}

async function listarMissoes(filtros = {}) {
    await garantirTabelas();
    return new Promise((resolve) => {
        let sql = `SELECT * FROM missions WHERE 1=1`;
        const params = [];
        if (filtros.categoria) { sql += ` AND categoria = ?`; params.push(filtros.categoria); }
        if (filtros.rank) { sql += ` AND rank = ?`; params.push(filtros.rank); }
        if (filtros.npcId) { sql += ` AND npcId = ?`; params.push(filtros.npcId); }
        if (filtros.status) { sql += ` AND status = ?`; params.push(filtros.status); }
        if (filtros.ativo !== undefined) { sql += ` AND ativo = ?`; params.push(filtros.ativo ? 1 : 0); }
        sql += ` ORDER BY id ASC`;
        db.all(sql, params, (err, rows) => {
            if (err) { console.error("[MISSION] Erro ao listar:", err.message); resolve([]); }
            else { resolve((rows || []).map(parseMissaoJSON)); }
        });
    });
}

async function listarMissoesNPC(npcId) { return listarMissoes({ npcId }); }

async function listarMissoesJogador(jogadorId, status = null) {
    await garantirTabelas();
    return new Promise((resolve) => {
        let sql = `SELECT m.*, pm.status as playerStatus, pm.progresso, pm.dataInicio, pm.dataConclusao FROM missions m INNER JOIN player_missions pm ON m.id = pm.missionId WHERE pm.jogadorId = ?`;
        const params = [jogadorId];
        if (status) { sql += ` AND pm.status = ?`; params.push(status); }
        sql += ` ORDER BY pm.dataInicio DESC`;
        db.all(sql, params, (err, rows) => {
            if (err) { console.error("[MISSION] Erro ao listar do jogador:", err.message); resolve([]); }
            else { resolve((rows || []).map(parseMissaoJSON)); }
        });
    });
}

async function iniciarMissao(jogadorId, missionId) {
    await garantirTabelas();
    return new Promise((resolve) => {
        db.run(`INSERT OR REPLACE INTO player_missions (jogadorId, missionId, status, progresso, dataInicio) VALUES (?, ?, 'em_andamento', '{}', datetime('now'))`, [jogadorId, missionId], (err) => { if (err) { console.error("[MISSION] Erro ao iniciar:", err.message); resolve(false); } else { resolve(true); } });
    });
}

async function concluirMissao(jogadorId, missionId) {
    await garantirTabelas();
    return new Promise((resolve) => {
        db.run(`UPDATE player_missions SET status = 'concluida', dataConclusao = datetime('now') WHERE jogadorId = ? AND missionId = ? AND status = 'em_andamento'`, [jogadorId, missionId], (err) => { if (err) { console.error("[MISSION] Erro ao concluir:", err.message); resolve(false); } else { resolve(true); } });
    });
}

async function cancelarMissao(jogadorId, missionId) {
    await garantirTabelas();
    return new Promise((resolve) => {
        db.run(`UPDATE player_missions SET status = 'cancelada' WHERE jogadorId = ? AND missionId = ? AND status = 'em_andamento'`, [jogadorId, missionId], (err) => { if (err) { console.error("[MISSION] Erro ao cancelar:", err.message); resolve(false); } else { resolve(true); } });
    });
}

async function atualizarProgresso(jogadorId, missionId, progresso) {
    await garantirTabelas();
    return new Promise((resolve) => {
        db.run(`UPDATE player_missions SET progresso = ? WHERE jogadorId = ? AND missionId = ? AND status = 'em_andamento'`, [JSON.stringify(progresso), jogadorId, missionId], (err) => { if (err) { console.error("[MISSION] Erro ao atualizar progresso:", err.message); resolve(false); } else { resolve(true); } });
    });
}

async function obterProgresso(jogadorId, missionId) {
    await garantirTabelas();
    return new Promise((resolve) => {
        db.get(`SELECT * FROM player_missions WHERE jogadorId = ? AND missionId = ?`, [jogadorId, missionId], (err, row) => { if (err) { console.error("[MISSION] Erro ao obter progresso:", err.message); resolve(null); } else { resolve(row ? parseProgressoJSON(row) : null); } });
    });
}

async function missaoAtiva(jogadorId, missionId) {
    await garantirTabelas();
    return new Promise((resolve) => {
        db.get(`SELECT id FROM player_missions WHERE jogadorId = ? AND missionId = ? AND status = 'em_andamento'`, [jogadorId, missionId], (err, row) => { resolve(Boolean(row)); });
    });
}

async function jaConcluiu(jogadorId, missionId) {
    await garantirTabelas();
    return new Promise((resolve) => {
        db.get(`SELECT id FROM player_missions WHERE jogadorId = ? AND missionId = ? AND status = 'concluida'`, [jogadorId, missionId], (err, row) => { resolve(Boolean(row)); });
    });
}

async function resetarMissao(jogadorId, missionId) {
    await garantirTabelas();
    return new Promise((resolve) => {
        db.run(`DELETE FROM player_missions WHERE jogadorId = ? AND missionId = ?`, [jogadorId, missionId], (err) => { if (err) { console.error("[MISSION] Erro ao resetar:", err.message); resolve(false); } else { resolve(true); } });
    });
}

function parseMissaoJSON(missao) {
    if (!missao) return null;
    const r = { ...missao };
    if (r.requisitos) { try { r.requisitos = JSON.parse(r.requisitos); } catch (e) { r.requisitos = null; } }
    if (r.objetivos) { try { r.objetivos = JSON.parse(r.objetivos); } catch (e) { r.objetivos = null; } }
    if (r.recompensas) { try { r.recompensas = JSON.parse(r.recompensas); } catch (e) { r.recompensas = null; } }
    r.repetivel = Boolean(r.repetivel);
    r.ativo = Boolean(r.ativo);
    return r;
}

function parseProgressoJSON(p) {
    if (!p) return null;
    const r = { ...p };
    if (r.progresso) { try { r.progresso = JSON.parse(r.progresso); } catch (e) { r.progresso = {}; } }
    return r;
}

module.exports = {
    criarMissao, editarMissao, removerMissao, buscarMissao,
    listarMissoes, listarMissoesNPC, listarMissoesJogador,
    iniciarMissao, concluirMissao, cancelarMissao,
    atualizarProgresso, obterProgresso, missaoAtiva, jaConcluiu, resetarMissao
};