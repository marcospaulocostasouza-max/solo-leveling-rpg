const MessageService = require("../core/messageService");

/*
 * COMANDO: !vender <nome do item>
 * 
 * Inicia o processo de venda de um item do inventário.
 * Mostra os detalhes da venda e aguarda confirmação.
 */

const db = require("../core/database");
const database = require('../../../../packages/database');
const VendaSystem = require("../systems/vendaSystem");
const EconomySystem = require("../systems/economySystem");
const JogadorCore = require("../core/jogadorCore");

module.exports = async (msg) => {
    try {
        const numero = msg.author || msg.from;
        const texto = msg.body.trim();
        
        // Extrair nome do item (tudo depois de !vender)
        const args = texto.slice(8).trim(); // Remove "!vender "
        
        if (!args) {
            return MessageService.send({ message: msg, text: `
*═══ VENDA DE ITENS ═══*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*Uso:* !vender <nome do item>

*Exemplos:*
- !vender Espada
- !vender Cristal
- !vender Poção

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` });
        }

        // Buscar jogador
        const jogador = await JogadorCore.buscarPorNumero(numero);
        if (!jogador) {
            return MessageService.send({ message: msg, text: `
*═══ ERRO ═══*
_Jogador não encontrado. Use !ficha primeiro._` });
        }

        // Obter informações do item
        const infoVenda = await VendaSystem.getInfoVenda(jogador.id, args);
        
        if (!infoVenda) {
            return MessageService.send({ message: msg, text: `
*═══ VENDA DE ITENS ═══*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*❌ Item não encontrado*

O item "${args}" não foi encontrado no seu inventário.

_Dica: Use !inventario para ver seus itens._

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` });
        }

        // Formatar mensagem de confirmação
        const saldoAtual = Number(await EconomySystem.getSaldo(jogador.id));
        const mensagem = VendaSystem.formatarMensagemVenda(
            {
                sucesso: true,
                item: infoVenda.item,
                quantidade: infoVenda.quantidade,
                valorUnitario: infoVenda.valorUnitario,
                valorTotal: infoVenda.valorTotal,
                tipo: infoVenda.tipo
            },
            saldoAtual
        );

        // Armazenar dados da venda pendente no banco
        await database.transaction(async query => {
            await query.get(`SELECT id FROM jogadores WHERE id=?${require('../../../../packages/database/config').provider === 'postgres' ? ' FOR UPDATE' : ''}`, [jogador.id]);
            await query.run('DELETE FROM vendas_pendentes WHERE jogador_id=?', [jogador.id]);
            await query.run('INSERT INTO vendas_pendentes(jogador_id,item_nome,quantidade,valor_total,tipo,data) VALUES(?,?,?,?,?,?)', [jogador.id,infoVenda.item,infoVenda.quantidade,infoVenda.valorTotal,infoVenda.tipo,new Date().toISOString()]);
        });

        await MessageService.send({ message: msg, text: mensagem });

    } catch (error) {
        console.error("Erro no comando !vender:", error);
        return MessageService.send({ message: msg, text: `
*═══ ERRO ═══*
_${error.message}_` });
    }
};
