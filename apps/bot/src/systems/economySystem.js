/*
 * SISTEMA DE ECONOMIA
 * 
 * Gerencia a moeda do jogo (Won), loja e transações.
 */

const db = require("../core/database");
const { transaction } = require("../../../../packages/database");

class EconomySystem {
    
    static async getSaldo(jogadorId) {
        return new Promise((resolve) => {
            db.get("SELECT won FROM jogadores WHERE id = ?", [jogadorId], (err, row) => {
                resolve(row ? row.won : 0);
            });
        });
    }
    
    static async adicionarWon(jogadorId, valor, motivo) {
        try {
            await transaction(async query => {
                const credito = await query.run("UPDATE jogadores SET won = won + ? WHERE id = ?", [valor, jogadorId]);
                if (credito.changes !== 1) throw new Error("Jogador não encontrado.");
                await query.run("INSERT INTO transacoes (jogador_id, valor, tipo, motivo, data) VALUES (?, ?, 'ganho', ?, datetime('now'))", [jogadorId, valor, motivo]);
            });
            return true;
        } catch (error) {
            console.error("[ECONOMIA] Falha ao creditar Wons:", error.message);
            return false;
        }
    }
    
    static async removerWon(jogadorId, valor, motivo) {
        try {
            await transaction(async query => {
                const debito = await query.run("UPDATE jogadores SET won = won - ? WHERE id = ? AND won >= ?", [valor, jogadorId, valor]);
                if (debito.changes !== 1) throw new Error("Saldo insuficiente.");
                await query.run("INSERT INTO transacoes (jogador_id, valor, tipo, motivo, data) VALUES (?, ?, 'gasto', ?, datetime('now'))", [jogadorId, valor, motivo]);
            });
            return true;
        } catch (error) {
            if (error.message !== "Saldo insuficiente.") console.error("[ECONOMIA] Falha ao debitar Wons:", error.message);
            return false;
        }
    }
    
    static async comprarItem(jogadorId, itemId, preco) {
        const saldo = await this.getSaldo(jogadorId);
        if (saldo < preco) return { erro: "Saldo insuficiente!" };
        
        await this.removerWon(jogadorId, preco, `Compra do item #${itemId}`);
        return { sucesso: true };
    }
}

module.exports = EconomySystem;
