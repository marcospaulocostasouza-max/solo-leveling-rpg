/**
 * MOOD MANAGER
 *
 * Responsável por armazenar e recuperar o humor permanente (mood) de cada NPC.
 *
 * O humor representa o estado psicológico de longo prazo do personagem.
 * Ele NÃO representa emoções momentâneas (responsabilidade do EmotionEngine).
 *
 * Utiliza SQLite (banco já existente do projeto).
 * A tabela npc_moods é criada automaticamente se não existir.
 *
 * Este módulo NÃO utiliza IA.
 * Este módulo NÃO decide mudanças.
 * Este módulo NÃO interpreta conversas.
 * Ele apenas gerencia o armazenamento.
 *
 * Preparado para integração futura com um MoodEngine.
 */

const db = require("../core/database");

// =====================================
// CRIAÇÃO DA TABELA
// =====================================

/**
 * Cria a tabela npc_moods se não existir
 */
function criarTabela() {
    db.run(`
        CREATE TABLE IF NOT EXISTS npc_moods (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            npcId TEXT UNIQUE NOT NULL,
            mood TEXT NOT NULL,
            intensidade INTEGER DEFAULT 50,
            motivo TEXT,
            ultimaAtualizacao TEXT DEFAULT (datetime('now'))
        )
    `);
}

// Criar tabela ao carregar o módulo (com serialize para garantir)
let tabelaPronta = false;
db.serialize(() => {
    criarTabela();
    tabelaPronta = true;
});

/**
 * Garante que a tabela existe antes de executar operações
 */
function garantirTabela() {
    return new Promise((resolve) => {
        if (tabelaPronta) {
            resolve();
            return;
        }
        db.run(`
            CREATE TABLE IF NOT EXISTS npc_moods (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                npcId TEXT UNIQUE NOT NULL,
                mood TEXT NOT NULL,
                intensidade INTEGER DEFAULT 50,
                motivo TEXT,
                ultimaAtualizacao TEXT DEFAULT (datetime('now'))
            )
        `, () => {
            tabelaPronta = true;
            resolve();
        });
    });
}

// =====================================
// FUNÇÕES DE GERENCIAMENTO
// =====================================

/**
 * Obtém o mood de um NPC
 *
 * @param {string} npcId - ID do NPC
 * @returns {Promise<Object|null>} Mood do NPC ou null
 */
async function obterMood(npcId) {
    await garantirTabela();
    return new Promise((resolve) => {
        db.get(
            `SELECT * FROM npc_moods WHERE npcId = ?`,
            [npcId],
            (err, row) => {
                if (err) {
                    console.error("[MOOD] Erro ao obter mood:", err.message);
                    resolve(null);
                } else {
                    resolve(row || null);
                }
            }
        );
    });
}

/**
 * Salva um novo mood para um NPC
 * Se já existir, substitui
 *
 * @param {string} npcId - ID do NPC
 * @param {Object} mood - Objeto com mood, intensidade e motivo
 * @returns {Promise<Object|null>} Mood salvo ou null em erro
 */
async function salvarMood(npcId, mood) {
    await garantirTabela();
    return new Promise((resolve) => {
        if (!npcId || !mood || !mood.mood) {
            resolve(null);
            return;
        }

        const intensidade = Math.max(0, Math.min(100, parseInt(mood.intensidade) || 50));
        const motivo = mood.motivo || "";

        db.run(
            `INSERT OR REPLACE INTO npc_moods (npcId, mood, intensidade, motivo, ultimaAtualizacao)
             VALUES (?, ?, ?, ?, datetime('now'))`,
            [npcId, mood.mood, intensidade, motivo],
            async (err) => {
                if (err) {
                    console.error("[MOOD] Erro ao salvar mood:", err.message);
                    resolve(null);
                } else {
                    const salvo = await obterMood(npcId);
                    resolve(salvo);
                }
            }
        );
    });
}

/**
 * Atualiza o mood de um NPC
 *
 * @param {string} npcId - ID do NPC
 * @param {Object} mood - Objeto com mood, intensidade e motivo
 * @returns {Promise<Object|null>} Mood atualizado ou null em erro
 */
async function atualizarMood(npcId, mood) {
    await garantirTabela();
    return new Promise((resolve) => {
        if (!npcId || !mood || !mood.mood) {
            resolve(null);
            return;
        }

        const intensidade = Math.max(0, Math.min(100, parseInt(mood.intensidade) || 50));
        const motivo = mood.motivo || "";

        db.run(
            `UPDATE npc_moods SET mood = ?, intensidade = ?, motivo = ?, ultimaAtualizacao = datetime('now')
             WHERE npcId = ?`,
            [mood.mood, intensidade, motivo, npcId],
            async (err) => {
                if (err) {
                    console.error("[MOOD] Erro ao atualizar mood:", err.message);
                    resolve(null);
                } else {
                    const atualizado = await obterMood(npcId);
                    resolve(atualizado);
                }
            }
        );
    });
}

/**
 * Reseta o mood de um NPC para o padrão
 *
 * @param {string} npcId - ID do NPC
 * @returns {Promise<Object|null>} Mood resetado ou null em erro
 */
async function resetarMood(npcId) {
    await garantirTabela();
    return new Promise((resolve) => {
        db.run(
            `UPDATE npc_moods SET mood = 'sereno', intensidade = 50, motivo = 'Mood resetado.', ultimaAtualizacao = datetime('now')
             WHERE npcId = ?`,
            [npcId],
            async (err) => {
                if (err) {
                    console.error("[MOOD] Erro ao resetar mood:", err.message);
                    resolve(null);
                } else {
                    const resetado = await obterMood(npcId);
                    resolve(resetado);
                }
            }
        );
    });
}

/**
 * Lista todos os moods cadastrados
 *
 * @returns {Promise<Array>} Lista de moods
 */
async function listarMoods() {
    await garantirTabela();
    return new Promise((resolve) => {
        db.all(
            `SELECT * FROM npc_moods ORDER BY ultimaAtualizacao DESC`,
            [],
            (err, rows) => {
                if (err) {
                    console.error("[MOOD] Erro ao listar moods:", err.message);
                    resolve([]);
                } else {
                    resolve(rows || []);
                }
            }
        );
    });
}

/**
 * Verifica se um NPC possui mood cadastrado
 *
 * @param {string} npcId - ID do NPC
 * @returns {Promise<boolean>} true se existe
 */
async function existeMood(npcId) {
    await garantirTabela();
    return new Promise((resolve) => {
        db.get(`SELECT id FROM npc_moods WHERE npcId = ?`, [npcId], (err, row) => {
            if (err) {
                console.error("[MOOD] Erro ao verificar mood:", err.message);
                resolve(false);
            } else {
                resolve(Boolean(row));
            }
        });
    });
}

module.exports = {
    obterMood,
    salvarMood,
    atualizarMood,
    resetarMood,
    listarMoods,
    existeMood
};