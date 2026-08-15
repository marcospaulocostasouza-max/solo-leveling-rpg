/**
 * EMOTION MANAGER
 *
 * Gerencia o estado emocional momentâneo de cada NPC com cada jogador.
 *
 * Diferente do Mood (permanente), a Emotion é momentânea e muda
 * a cada conversa.
 *
 * Utiliza SQLite (banco já existente do projeto).
 * A tabela npc_emotions é criada automaticamente se não existir.
 *
 * Este módulo NÃO utiliza IA.
 * Este módulo NÃO decide mudanças.
 * Ele apenas gerencia o armazenamento.
 */

const db = require("../core/database");
const { provider } = require("../../../../packages/database/config");
const DURACAO_MINIMA_HORAS = 10;
const normalizar = (valor = "") => String(valor).normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

// =====================================
// CRIAÇÃO DA TABELA
// =====================================

/**
 * Cria a tabela npc_emotions se não existir
 */
function criarTabela() {
    const colunaId = provider === "postgres" ? "BIGSERIAL PRIMARY KEY" : "INTEGER PRIMARY KEY AUTOINCREMENT";
    db.run(`
        CREATE TABLE IF NOT EXISTS npc_emotions (
            id ${colunaId},
            "npcId" TEXT NOT NULL,
            "jogadorId" TEXT NOT NULL,
            emocao TEXT NOT NULL,
            intensidade INTEGER DEFAULT 50,
            motivo TEXT,
            "ultimaAtualizacao" TEXT DEFAULT (datetime('now')),
            UNIQUE("npcId", "jogadorId")
        )
    `);
    db.run(`
        CREATE TABLE IF NOT EXISTS npc_scene_emotions (
            "npcId" TEXT PRIMARY KEY,
            emocao TEXT NOT NULL,
            intensidade INTEGER DEFAULT 50,
            motivo TEXT,
            "iniciadaEm" TEXT DEFAULT (datetime('now')),
            "bloqueadaAte" TEXT NOT NULL,
            "ultimaAtualizacao" TEXT DEFAULT (datetime('now'))
        )
    `);
}

// Criar tabela ao carregar o módulo
criarTabela();

function obterEmocaoNPC(npcId) {
    return new Promise((resolve) => db.get(
        'SELECT * FROM npc_scene_emotions WHERE "npcId" = ?', [npcId],
        (err, row) => resolve(err ? null : row || null)
    ));
}

async function definirEmocaoNPC(npcId, emocao) {
    if (!npcId || !emocao || !emocao.emocao) return null;
    const atual = await obterEmocaoNPC(npcId);
    const proxima = normalizar(emocao.emocao);
    const bloqueadaAte = atual?.bloqueadaAte;
    const bloqueadaTimestamp = bloqueadaAte ? Date.parse(/[zZ]$|[+-]\d\d:\d\d$/.test(bloqueadaAte) ? bloqueadaAte : `${bloqueadaAte}Z`) : 0;
    if (atual && bloqueadaTimestamp > Date.now()) {
        // A emoção é estável por no mínimo dez horas. Uma análise nova pode
        // explicar o contexto, mas não substitui o estado antes desse prazo.
        return { ...atual, alterada: false, bloqueada: normalizar(atual.emocao) !== proxima };
    }
    const intensidade = Math.max(0, Math.min(100, parseInt(emocao.intensidade) || 50));
    const agora = new Date();
    const bloqueio = new Date(agora.getTime() + DURACAO_MINIMA_HORAS * 60 * 60 * 1000);
    await new Promise((resolve) => db.run(`INSERT INTO npc_scene_emotions
        ("npcId", emocao, intensidade, motivo, "iniciadaEm", "bloqueadaAte", "ultimaAtualizacao")
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT("npcId") DO UPDATE SET emocao = excluded.emocao, intensidade = excluded.intensidade,
        motivo = excluded.motivo, "iniciadaEm" = excluded."iniciadaEm", "bloqueadaAte" = excluded."bloqueadaAte",
        "ultimaAtualizacao" = excluded."ultimaAtualizacao"`, [npcId, emocao.emocao, intensidade, emocao.motivo || "", agora.toISOString(), bloqueio.toISOString(), agora.toISOString()], () => resolve()));
    return obterEmocaoNPC(npcId);
}

// =====================================
// FUNÇÕES DE GERENCIAMENTO
// =====================================

/**
 * Obtém o estado emocional de um NPC com um jogador
 *
 * @param {string} npcId - ID do NPC
 * @param {string} jogadorId - ID do jogador
 * @returns {Promise<Object|null>} Estado emocional ou null
 */
function obterEmocao(npcId, jogadorId) {
    return new Promise((resolve) => {
        db.get(
            `SELECT * FROM npc_emotions WHERE "npcId" = ? AND "jogadorId" = ?`,
            [npcId, jogadorId],
            (err, row) => {
                if (err) {
                    console.error("[EMOTION] Erro ao obter emoção:", err.message);
                    resolve(null);
                } else {
                    resolve(row || null);
                }
            }
        );
    });
}

/**
 * Salva o estado emocional de um NPC com um jogador
 * Se já existir, substitui
 *
 * @param {string} npcId - ID do NPC
 * @param {string} jogadorId - ID do jogador
 * @param {Object} emocao - Objeto com emocao, intensidade e motivo
 * @returns {Promise<Object|null>} Estado emocional salvo ou null em erro
 */
function salvarEmocao(npcId, jogadorId, emocao) {
    return new Promise((resolve) => {
        if (!npcId || !jogadorId || !emocao || !emocao.emocao) {
            resolve(null);
            return;
        }

        const intensidade = Math.max(0, Math.min(100, parseInt(emocao.intensidade) || 50));
        const motivo = emocao.motivo || "";

        db.run(
            `INSERT INTO npc_emotions ("npcId", "jogadorId", emocao, intensidade, motivo, "ultimaAtualizacao")
             VALUES (?, ?, ?, ?, ?, datetime('now'))
             ON CONFLICT("npcId", "jogadorId") DO UPDATE SET emocao = excluded.emocao, intensidade = excluded.intensidade, motivo = excluded.motivo, "ultimaAtualizacao" = excluded."ultimaAtualizacao"`,
            [npcId, jogadorId, emocao.emocao, intensidade, motivo],
            async (err) => {
                if (err) {
                    console.error("[EMOTION] Erro ao salvar emoção:", err.message);
                    resolve(null);
                } else {
                    const salvo = await obterEmocao(npcId, jogadorId);
                    resolve(salvo);
                }
            }
        );
    });
}

/**
 * Atualiza o estado emocional de um NPC com um jogador
 *
 * @param {string} npcId - ID do NPC
 * @param {string} jogadorId - ID do jogador
 * @param {Object} emocao - Objeto com emocao, intensidade e motivo
 * @returns {Promise<Object|null>} Estado emocional atualizado ou null em erro
 */
function atualizarEmocao(npcId, jogadorId, emocao) {
    return new Promise((resolve) => {
        if (!npcId || !jogadorId || !emocao || !emocao.emocao) {
            resolve(null);
            return;
        }

        const intensidade = Math.max(0, Math.min(100, parseInt(emocao.intensidade) || 50));
        const motivo = emocao.motivo || "";

        db.run(
            `UPDATE npc_emotions SET emocao = ?, intensidade = ?, motivo = ?, "ultimaAtualizacao" = datetime('now')
             WHERE "npcId" = ? AND "jogadorId" = ?`,
            [emocao.emocao, intensidade, motivo, npcId, jogadorId],
            async (err) => {
                if (err) {
                    console.error("[EMOTION] Erro ao atualizar emoção:", err.message);
                    resolve(null);
                } else {
                    const atualizado = await obterEmocao(npcId, jogadorId);
                    resolve(atualizado);
                }
            }
        );
    });
}

/**
 * Reseta o estado emocional de um NPC com um jogador
 *
 * @param {string} npcId - ID do NPC
 * @param {string} jogadorId - ID do jogador
 * @returns {Promise<Object|null>} Estado emocional resetado ou null em erro
 */
function resetarEmocao(npcId, jogadorId) {
    return new Promise((resolve) => {
        db.run(
            `UPDATE npc_emotions SET emocao = 'calmo', intensidade = 50, motivo = 'Emoção resetada.', "ultimaAtualizacao" = datetime('now')
             WHERE "npcId" = ? AND "jogadorId" = ?`,
            [npcId, jogadorId],
            async (err) => {
                if (err) {
                    console.error("[EMOTION] Erro ao resetar emoção:", err.message);
                    resolve(null);
                } else {
                    const resetado = await obterEmocao(npcId, jogadorId);
                    resolve(resetado);
                }
            }
        );
    });
}

/**
 * Lista todos os estados emocionais de um NPC
 *
 * @param {string} npcId - ID do NPC
 * @returns {Promise<Array>} Lista de estados emocionais
 */
function listarEmocoes(npcId) {
    return new Promise((resolve) => {
        db.all(
            `SELECT * FROM npc_emotions WHERE "npcId" = ? ORDER BY "ultimaAtualizacao" DESC`,
            [npcId],
            (err, rows) => {
                if (err) {
                    console.error("[EMOTION] Erro ao listar emoções:", err.message);
                    resolve([]);
                } else {
                    resolve(rows || []);
                }
            }
        );
    });
}

module.exports = {
    DURACAO_MINIMA_HORAS,
    obterEmocaoNPC,
    definirEmocaoNPC,
    obterEmocao,
    salvarEmocao,
    atualizarEmocao,
    resetarEmocao,
    listarEmocoes
};
