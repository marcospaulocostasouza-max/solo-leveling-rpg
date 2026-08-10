/*
 * SISTEMA DE DUNGEONS
 * 
 * Gerencia exploração de dungeons, andares e recompensas.
 */

const db = require("../core/database");

class DungeonSystem {
    
    static async entrarDungeon(jogadorId, dungeonId) {
        return new Promise((resolve) => {
            db.get("SELECT * FROM dungeons WHERE id = ?", [dungeonId], (err, dungeon) => {
                if (!dungeon) return resolve({ erro: "Dungeon não encontrada." });
                
                db.get("SELECT * FROM jogador_dungeons WHERE jogador_id = ? AND dungeon_id = ? AND status = 'ativa'",
                    [jogadorId, dungeonId], (err, ativa) => {
                        if (ativa) return resolve({ erro: "Você já está nesta dungeon." });
                        
                        db.run("INSERT INTO jogador_dungeons (jogador_id, dungeon_id, status, progresso, data) VALUES (?, ?, 'ativa', 1, datetime('now'))",
                            [jogadorId, dungeonId]);
                        
                        resolve({ sucesso: true, dungeon });
                    });
            });
        });
    }
    
    static async progressoDungeon(jogadorId, dungeonId) {
        return new Promise((resolve) => {
            db.get("SELECT * FROM jogador_dungeons WHERE jogador_id = ? AND dungeon_id = ?",
                [jogadorId, dungeonId], (err, progresso) => {
                    resolve(progresso || null);
                });
        });
    }
    
    static async listarDungeons() {
        return new Promise((resolve) => {
            db.all("SELECT * FROM dungeons ORDER BY rank ASC, andar ASC", [], (err, dungeons) => {
                resolve(dungeons || []);
            });
        });
    }
}

module.exports = DungeonSystem;