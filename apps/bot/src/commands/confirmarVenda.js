const MessageService = require("../core/messageService");

/*
 * COMANDO: !confirmar venda
 * 
 * Confirma a venda pendente de um item.
 * O valor da venda é adicionado diretamente na conta do jogador.
 */

const VendaSystem = require("../systems/vendaSystem");
const EconomySystem = require("../systems/economySystem");
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
*═══ CONFIRMAÇÃO DE VENDA ═══*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*❌ Nenhuma venda pendente*

Você não tem nenhuma venda pendente para confirmar.

_Use *!vender <item>* para iniciar uma venda._

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` });
        }

        // Verificar se a venda é recente (últimos 5 minutos)
        const dataVenda = new Date(vendaPendente.data);
        const agora = new Date();
        const diferencaMinutos = (agora - dataVenda) / (1000 * 60);

        if (diferencaMinutos > 5) {
            // Venda expirada
            await new Promise((resolve) => {
                db.run(
                    "DELETE FROM vendas_pendentes WHERE jogador_id = ?",
                    [jogador.id],
                    () => resolve()
                );
            });

            return MessageService.send({ message: msg, text: `
*═══ CONFIRMAÇÃO DE VENDA ═══*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*❌ Venda expirada*

A venda de ${vendaPendente.quantidade}x ${vendaPendente.item_nome} expirou.
Inicie uma nova venda com *!vender <item>*.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` });
        }

        // Processar a venda
        const resultadoVenda = await VendaSystem.venderItem(
            jogador.id,
            vendaPendente.item_nome,
            vendaPendente.quantidade
        );

        if (!resultadoVenda.sucesso) {
            // Remover venda pendente em caso de erro
            await new Promise((resolve) => {
                db.run(
                    "DELETE FROM vendas_pendentes WHERE jogador_id = ?",
                    [jogador.id],
                    () => resolve()
                );
            });

            return MessageService.send({ message: msg, text: `
*═══ ERRO NA VENDA ═══*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*❌ Erro*

${resultadoVenda.erro}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` });
        }

        // Obter novo saldo
        const saldoNovo = await EconomySystem.getSaldo(jogador.id);

        // Remover venda pendente
        await new Promise((resolve) => {
            db.run(
                "DELETE FROM vendas_pendentes WHERE jogador_id = ?",
                [jogador.id],
                () => resolve()
            );
        });

        // Formatar mensagem de sucesso
        const mensagem = VendaSystem.formatarMensagemSucesso(resultadoVenda, saldoNovo);

        await MessageService.send({ message: msg, text: mensagem });

    } catch (error) {
        console.error("Erro no comando !confirmar venda:", error);
        return MessageService.send({ message: msg, text: `
*═══ ERRO ═══*
_Ocorreu um erro ao confirmar a venda.
_Tente novamente mais tarde._` });
    }
};