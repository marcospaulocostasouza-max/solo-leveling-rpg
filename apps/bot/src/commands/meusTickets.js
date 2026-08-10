const MessageService = require("../core/messageService");

/*
 * COMANDO: !meus tickets
 * 
 * Exibe todos os tickets do jogador (disponíveis, em produção, concluídos).
 */

const JogadorCore = require("../core/jogadorCore");
const TicketSystem = require("../systems/ticketSystem");

module.exports = async (msg) => {
    try {
        const numero = msg.author || msg.from;
        
        // Buscar jogador
        const jogador = await JogadorCore.buscarPorNumero(numero);
        if (!jogador) {
            return MessageService.send({ message: msg, text: "*✖ Você precisa ter uma ficha aprovada primeiro.*" });
        }

        // Buscar todos os tickets
        const tickets = await TicketSystem.getTickets(jogador.id);

        if (tickets.length === 0) {
            return MessageService.send({ message: msg, text: `
*═══ SEUS TICKETS ═══*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*Você não possui tickets.*

_Complete os 5 usos de uma Dungeon Instanciada para ganhar um ticket._
_Use *!Desejar* para tentar obter uma chave de dungeon._

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` });
        }

        // Buscar posição na fila
        const fila = await TicketSystem.getPosicaoFila(jogador.id);

        let mensagem = `*═══ SEUS TICKETS ═══*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;

        const statusLabels = {
            "disponivel": "✅ Disponível",
            "em_producao": "🔧 Em Produção",
            "concluido": "✅ Concluído"
        };

        tickets.forEach((ticket, i) => {
            const tipo = ticket.tipo === "item_unico" ? "Item Único" : "Técnica Única";
            const status = statusLabels[ticket.status] || ticket.status;
            const data = new Date(ticket.data_obtencao).toLocaleDateString("pt-BR");
            mensagem += `*${i + 1}.* ${ticket.nome}\n`;
            mensagem += `> Tipo: ${tipo}\n`;
            mensagem += `> Status: ${status}\n`;
            mensagem += `> Obtido em: ${data}\n\n`;
        });

        if (fila) {
            mensagem += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
            mensagem += `*Posição na fila de avaliação:* *${fila.posicao}*\n`;
            mensagem += `_Sua posição será reduzida conforme os itens/técnicas forem finalizados._\n\n`;
        }

        mensagem += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
_Para usar um ticket disponível:_
*!usar ticket item* - Para Item Único
*!usar ticket tecnica* - Para Técnica Única`;

        return MessageService.send({ message: msg, text: mensagem });

    } catch (error) {
        console.error("Erro no comando !meus tickets:", error);
        return MessageService.send({ message: msg, text: "*✖ Erro ao buscar tickets. Tente novamente.*" });
    }
};