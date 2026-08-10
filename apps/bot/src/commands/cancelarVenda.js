const MessageService = require("../core/messageService");

/*
 * COMANDO: !cancelar venda
 * 
 * Cancela uma venda pendente.
 */

const JogadorCore = require("../core/jogadorCore");
const db = require("../core/database");

module.exports = async (msg) => {
    try {
        const numero = msg.author || msg.from;
        
        // Buscar jogador
        const jogador = await JogadorCore.buscarPorNumero(numero);
        if (!jogador) {
            return MessageService.send({ message: msg, text: `
*═══ ERRO ═══*
_Jogador não encontrado. Use !ficha primeiro._` });
        }

        // Buscar venda pendente
        const vendaPendente = await new Promise((resolve) => {
            db.get(
                `SELECT * FROM vendas_pendentes WHERE jogador_id = ? ORDER BY data DESC LIMIT 1`,
                [jogador.id],
                (err, row) => resolve(row || null)
            );
        });

        if (!vendaPendente) {
            return MessageService.send({ message: msg, text: `
*═══ CANCELAR VENDA ═══*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*❌ Nenhuma venda pendente*

Você não tem nenhuma venda pendente para cancelar.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` });
        }

        // Remover venda pendente
        await new Promise((resolve) => {
            db.run(
                "DELETE FROM vendas_pendentes WHERE jogador_id = ?",
                [jogador.id],
                () => resolve()
            );
        });

        await MessageService.send({ message: msg, text: `
*═══ VENDA CANCELADA ✅ ═══*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*Venda cancelada:* ${vendaPendente.quantidade}x ${vendaPendente.item_nome}

_O item permanece no seu inventário._

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` });

    } catch (error) {
        console.error("Erro no comando !cancelar venda:", error);
        return MessageService.send({ message: msg, text: `
*═══ ERRO ═══*
_Ocorreu um erro ao cancelar a venda.
_Tente novamente mais tarde._` });
    }
};