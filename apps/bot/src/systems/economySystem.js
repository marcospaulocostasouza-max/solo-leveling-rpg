/*
 * SISTEMA DE ECONOMIA
 * 
 * Gerencia a moeda do jogo (Won), loja e transações.
 */

const db = require("../core/database");

class EconomySystem {
    
    static async getSaldo(jogadorId) {
        return new Promise((resolve) => {
            db.get("SELECT won FROM jogadores WHERE id = ?", [jogadorId], (err, row) => {
                resolve(row ? row.won : 0);
            });
        });
    }
    
    static async adicionarWon(jogadorId, valor, motivo) {
        return new Promise((resolve) => {
            db.run("UPDATE jogadores SET won = won + ? WHERE id = ?", [valor, jogadorId]);
            db.run("INSERT INTO transacoes (jogador_id, valor, tipo, motivo, data) VALUES (?, ?, 'ganho', ?, datetime('now'))",
                [jogadorId, valor, motivo]);
            resolve(true);
        });
    }
    
    static async removerWon(jogadorId, valor, motivo) {
        return new Promise((resolve) => {
            db.get("SELECT won FROM jogadores WHERE id = ?", [jogadorId], (err, row) => {
                if (!row || row.won < valor) {
                    resolve(false);
                    return;
                }
                db.run("UPDATE jogadores SET won = won - ? WHERE id = ?", [valor, jogadorId]);
                db.run("INSERT INTO transacoes (jogador_id, valor, tipo, motivo, data) VALUES (?, ?, 'gasto', ?, datetime('now'))",
                    [jogadorId, valor, motivo]);
                resolve(true);
            });
        });
    }
    
    static async comprarItem(jogadorId, itemId, preco) {
        const saldo = await this.getSaldo(jogadorId);
        if (saldo < preco) return { erro: "Saldo insuficiente!" };
        
        await this.removerWon(jogadorId, preco, `Compra do item #${itemId}`);
        return { sucesso: true };
    }
}

module.exports = EconomySystem;