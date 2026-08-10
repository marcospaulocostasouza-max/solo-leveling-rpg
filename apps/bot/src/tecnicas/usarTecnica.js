/**
 * SISTEMA DE USO DE TÉCNICAS EM BATALHA
 * 
 * Gerencia a execução de técnicas durante combates.
 */

const db = require("../core/database");

module.exports = {
    /**
     * Usa uma técnica em batalha
     */
    usarTecnica: async (jogadorId, tecnicaNome) => {
        return new Promise((resolve) => {
            db.get(
                `SELECT t.*, jt.nivel FROM tecnicas t
                 LEFT JOIN jogador_tecnicas jt ON t.id = jt.tecnica_id AND jt.jogador_id = ?
                 WHERE LOWER(t.nome) = LOWER(?)`,
                [jogadorId, tecnicaNome],
                (err, tecnica) => {
                    if (!tecnica) return resolve({ erro: "Técnica não encontrada." });
                    resolve({
                        sucesso: true,
                        nome: tecnica.nome,
                        custoMana: tecnica.custo_mana,
                        cooldown: tecnica.cooldown,
                        nivel: tecnica.nivel || 1,
                        tipo: tecnica.tipo,
                        descricao: tecnica.descricao
                    });
                }
            );
        });
    }
};