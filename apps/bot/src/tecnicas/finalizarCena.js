/**
 * SISTEMA DE FINALIZAÇÃO DE CENAS
 * 
 * Gerencia o encerramento de cenas de batalha, dungeons e eventos.
 */

const db = require("../core/database");

module.exports = {
    /**
     * Finaliza uma cena ativa para o jogador
     */
    finalizarCena: async (jogadorId, tipo) => {
        return new Promise((resolve) => {
            if (tipo === "batalha") {
                // Limpar batalha ativa
                resolve({ sucesso: true, mensagem: "Batalha finalizada." });
            } else if (tipo === "dungeon") {
                db.run(
                    "UPDATE jogador_dungeons SET status = 'completa' WHERE jogador_id = ? AND status = 'ativa'",
                    [jogadorId]
                );
                resolve({ sucesso: true, mensagem: "Dungeon finalizada." });
            } else {
                resolve({ sucesso: true, mensagem: "Cena finalizada." });
            }
        });
    }
};