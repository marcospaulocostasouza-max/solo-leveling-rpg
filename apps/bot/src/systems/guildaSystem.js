/*
 * SISTEMA DE GUILDAS
 * 
 * Gerencia criação, membros, guerras e evolução das guildas.
 */

const db = require("../core/database");

class GuildaSystem {
    
    static async criarGuilda(nome, liderId, liderNome) {
        return new Promise((resolve) => {
            db.get("SELECT id FROM guildas WHERE nome = ?", [nome], (err, existe) => {
                if (existe) return resolve({ erro: "Já existe uma guilda com este nome." });
                
                db.run("INSERT INTO guildas (nome, lider, membros, criada) VALUES (?, ?, 1, 1)", [nome, liderNome], function(err) {
                    if (err) return resolve({ erro: "Erro ao criar guilda." });
                    
                    db.run("INSERT INTO guilda_membros (guilda_id, jogador_id, cargo, data_entrada) VALUES (?, ?, 'Líder', datetime('now'))",
                        [this.lastID, liderId]);
                    
                    resolve({ sucesso: true, guildaId: this.lastID });
                });
            });
        });
    }
    
    static async entrarGuilda(jogadorId, guildaId) {
        return new Promise((resolve) => {
            db.get("SELECT * FROM guilda_membros WHERE jogador_id = ?", [jogadorId], (err, membro) => {
                if (membro) return resolve({ erro: "Você já pertence a uma guilda." });
                
                db.get("SELECT * FROM guildas WHERE id = ?", [guildaId], (err, guilda) => {
                    if (!guilda) return resolve({ erro: "Guilda não encontrada." });
                    
                    db.run("INSERT INTO guilda_membros (guilda_id, jogador_id, cargo, data_entrada) VALUES (?, ?, 'Membro', datetime('now'))",
                        [guildaId, jogadorId]);
                    db.run("UPDATE guildas SET membros = membros + 1 WHERE id = ?", [guildaId]);
                    
                    resolve({ sucesso: true, guilda: guilda.nome });
                });
            });
        });
    }
    
    static async sairGuilda(jogadorId) {
        return new Promise((resolve) => {
            db.get("SELECT gm.*, g.nome, g.lider FROM guilda_membros gm JOIN guildas g ON gm.guilda_id = g.id WHERE gm.jogador_id = ?",
                [jogadorId], (err, membro) => {
                    if (!membro) return resolve({ erro: "Você não pertence a nenhuma guilda." });
                    
                    if (membro.cargo === "Líder") {
                        return resolve({ erro: "Como líder, transfira o cargo ou dissolva a guilda." });
                    }
                    
                    db.run("DELETE FROM guilda_membros WHERE jogador_id = ?", [jogadorId]);
                    db.run("UPDATE guildas SET membros = membros - 1 WHERE id = ?", [membro.guilda_id]);
                    
                    resolve({ sucesso: true, guilda: membro.nome });
                }
            );
        });
    }
    
    static async infoGuilda(guildaId) {
        return new Promise((resolve) => {
            db.get("SELECT * FROM guildas WHERE id = ?", [guildaId], (err, guilda) => {
                if (!guilda) return resolve(null);
                
                db.all("SELECT * FROM guilda_membros WHERE guilda_id = ? ORDER BY cargo ASC", [guildaId], (err, membros) => {
                    resolve({ ...guilda, membrosLista: membros || [] });
                });
            });
        });
    }
}

module.exports = GuildaSystem;