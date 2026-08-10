/**
 * MEMORY MANAGER
 *
 * Gerencia memórias permanentes dos NPCs sobre cada jogador.
 *
 * Cada memória pertence exclusivamente a um NPC + um jogador.
 * Nunca mistura memórias de jogadores diferentes ou entre NPCs.
 *
 * Utiliza SQLite (banco já existente do projeto).
 * A tabela npc_memories é criada automaticamente se não existir.
 *
 * Este módulo NÃO conversa com o Ollama.
 * Este módulo NÃO monta prompts.
 * Este módulo NÃO interpreta conversas.
 * Ele apenas gerencia as memórias.
 *
 * Preparado para futuramente receber um Memory Engine que utilizará
 * IA para criar novas memórias automaticamente.
 */

const db = require("../core/database");

// =====================================
// CRIAÇÃO DA TABELA
// =====================================

/**
 * Cria a tabela npc_memories se não existir
 */
function criarTabela() {
    db.run(`
        CREATE TABLE IF NOT EXISTS npc_memories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            npcId TEXT NOT NULL,
            jogadorId TEXT NOT NULL,
            tipo TEXT DEFAULT 'geral',
            memoria TEXT NOT NULL,
            importancia INTEGER DEFAULT 5,
            dataCriacao TEXT DEFAULT (datetime('now')),
            ultimaLembranca TEXT,
            quantidadeLembrancas INTEGER DEFAULT 0
        )
    `);
}

// Criar tabela ao carregar o módulo
criarTabela();

// =====================================
// FUNÇÕES DE GERENCIAMENTO
// =====================================

/**
 * Salva uma nova memória para um NPC sobre um jogador
 *
 * @param {string} npcId - ID do NPC
 * @param {string} jogadorId - ID do jogador
 * @param {string} memoria - Conteúdo da memória
 * @param {string} tipo - Tipo da memória (ex: "conversa", "evento", "favor", "observacao")
 * @param {number} importancia - Importância de 1 a 10
 * @returns {Promise<number|null>} ID da memória criada ou null em erro
 */
function salvarMemoria(npcId, jogadorId, memoria, tipo = "geral", importancia = 5) {
    return new Promise((resolve) => {
        // Validar parâmetros
        if (!npcId || !jogadorId || !memoria) {
            resolve(null);
            return;
        }

        // Validar importância (1 a 10)
        const imp = Math.max(1, Math.min(10, parseInt(importancia) || 5));

        db.run(
            `INSERT INTO npc_memories (npcId, jogadorId, tipo, memoria, importancia, dataCriacao)
             VALUES (?, ?, ?, ?, ?, datetime('now'))`,
            [npcId, jogadorId, tipo, memoria, imp],
            function (err) {
                if (err) {
                    console.error("[MEMORY] Erro ao salvar memória:", err.message);
                    resolve(null);
                } else {
                    resolve(this.lastID);
                }
            }
        );
    });
}

/**
 * Busca todas as memórias de um NPC sobre um jogador
 * Ordenadas por importância (maior primeiro) e data mais recente
 *
 * @param {string} npcId - ID do NPC
 * @param {string} jogadorId - ID do jogador
 * @param {number} limite - Limite de resultados (opcional)
 * @returns {Promise<Array>} Lista de memórias
 */
function buscarMemorias(npcId, jogadorId, limite = null) {
    return new Promise((resolve) => {
        let sql = `
            SELECT * FROM npc_memories
            WHERE npcId = ? AND jogadorId = ?
            ORDER BY importancia DESC, dataCriacao DESC
        `;
        const params = [npcId, jogadorId];

        if (limite) {
            sql += ` LIMIT ?`;
            params.push(limite);
        }

        db.all(sql, params, (err, rows) => {
            if (err) {
                console.error("[MEMORY] Erro ao buscar memórias:", err.message);
                resolve([]);
            } else {
                resolve(rows || []);
            }
        });
    });
}

/**
 * Busca apenas memórias importantes (importância >= 7)
 *
 * @param {string} npcId - ID do NPC
 * @param {string} jogadorId - ID do jogador
 * @param {number} importanciaMinima - Importância mínima (padrão 7)
 * @returns {Promise<Array>} Lista de memórias importantes
 */
function buscarMemoriasImportantes(npcId, jogadorId, importanciaMinima = 7) {
    return new Promise((resolve) => {
        db.all(
            `SELECT * FROM npc_memories
             WHERE npcId = ? AND jogadorId = ? AND importancia >= ?
             ORDER BY importancia DESC, dataCriacao DESC`,
            [npcId, jogadorId, importanciaMinima],
            (err, rows) => {
                if (err) {
                    console.error("[MEMORY] Erro ao buscar memórias importantes:", err.message);
                    resolve([]);
                } else {
                    resolve(rows || []);
                }
            }
        );
    });
}

/**
 * Atualiza a importância de uma memória
 *
 * @param {number} memoriaId - ID da memória
 * @param {number} novaImportancia - Nova importância (1 a 10)
 * @returns {Promise<boolean>} true se atualizado
 */
function atualizarImportancia(memoriaId, novaImportancia) {
    return new Promise((resolve) => {
        const imp = Math.max(1, Math.min(10, parseInt(novaImportancia) || 5));

        db.run(
            `UPDATE npc_memories SET importancia = ? WHERE id = ?`,
            [imp, memoriaId],
            (err) => {
                if (err) {
                    console.error("[MEMORY] Erro ao atualizar importância:", err.message);
                    resolve(false);
                } else {
                    resolve(true);
                }
            }
        );
    });
}

/**
 * Registra que o NPC lembrou de uma memória
 * Atualiza ultimaLembranca e incrementa quantidadeLembrancas
 *
 * @param {number} memoriaId - ID da memória
 * @returns {Promise<boolean>} true se registrado
 */
function registrarLembranca(memoriaId) {
    return new Promise((resolve) => {
        db.run(
            `UPDATE npc_memories
             SET ultimaLembranca = datetime('now'),
                 quantidadeLembrancas = quantidadeLembrancas + 1
             WHERE id = ?`,
            [memoriaId],
            (err) => {
                if (err) {
                    console.error("[MEMORY] Erro ao registrar lembrança:", err.message);
                    resolve(false);
                } else {
                    resolve(true);
                }
            }
        );
    });
}

/**
 * Remove uma memória pelo ID
 *
 * @param {number} memoriaId - ID da memória
 * @returns {Promise<boolean>} true se removido
 */
function removerMemoria(memoriaId) {
    return new Promise((resolve) => {
        db.run(`DELETE FROM npc_memories WHERE id = ?`, [memoriaId], (err) => {
            if (err) {
                console.error("[MEMORY] Erro ao remover memória:", err.message);
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });
}

/**
 * Limpa todas as memórias de um NPC sobre um jogador
 *
 * @param {string} npcId - ID do NPC
 * @param {string} jogadorId - ID do jogador
 * @returns {Promise<boolean>} true se limpo
 */
function limparMemorias(npcId, jogadorId) {
    return new Promise((resolve) => {
        db.run(
            `DELETE FROM npc_memories WHERE npcId = ? AND jogadorId = ?`,
            [npcId, jogadorId],
            (err) => {
                if (err) {
                    console.error("[MEMORY] Erro ao limpar memórias:", err.message);
                    resolve(false);
                } else {
                    resolve(true);
                }
            }
        );
    });
}

/**
 * Lista todas as memórias de um NPC (de todos os jogadores)
 * Útil para administração e debug
 *
 * @param {string} npcId - ID do NPC
 * @returns {Promise<Array>} Lista de memórias
 */
function listarMemorias(npcId) {
    return new Promise((resolve) => {
        db.all(
            `SELECT * FROM npc_memories
             WHERE npcId = ?
             ORDER BY importancia DESC, dataCriacao DESC`,
            [npcId],
            (err, rows) => {
                if (err) {
                    console.error("[MEMORY] Erro ao listar memórias:", err.message);
                    resolve([]);
                } else {
                    resolve(rows || []);
                }
            }
        );
    });
}

/**
 * Verifica se uma memória existe pelo ID
 *
 * @param {number} memoriaId - ID da memória
 * @returns {Promise<boolean>} true se existe
 */
function existeMemoria(memoriaId) {
    return new Promise((resolve) => {
        db.get(`SELECT id FROM npc_memories WHERE id = ?`, [memoriaId], (err, row) => {
            if (err) {
                console.error("[MEMORY] Erro ao verificar memória:", err.message);
                resolve(false);
            } else {
                resolve(Boolean(row));
            }
        });
    });
}

module.exports = {
    salvarMemoria,
    buscarMemorias,
    buscarMemoriasImportantes,
    atualizarImportancia,
    registrarLembranca,
    removerMemoria,
    limparMemorias,
    listarMemorias,
    existeMemoria
};