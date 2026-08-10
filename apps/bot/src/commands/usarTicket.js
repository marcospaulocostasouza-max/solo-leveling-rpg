const MessageService = require("../core/messageService");

/*
 * COMANDO: !usar ticket
 * 
 * Usa um ticket de Item Único ou Técnica Única.
 * O ticket entra na fila de avaliação.
 * 
 * Uso:
 * !usar ticket - Lista tickets disponíveis
 * !usar ticket item - Usa ticket de Item Único
 * !usar ticket tecnica - Usa ticket de Técnica Única
 * !usar ticket técnica - Usa ticket de Técnica Única
 */

const JogadorCore = require("../core/jogadorCore");
const TicketSystem = require("../systems/ticketSystem");

module.exports = async (msg) => {
    try {
        const numero = msg.author || msg.from;
        const texto = msg.body.trim().toLowerCase();

        // Buscar jogador
        const jogador = await JogadorCore.buscarPorNumero(numero);
        if (!jogador) {
            return MessageService.send({ message: msg, text: "*✖ Você precisa ter uma ficha aprovada primeiro.*" });
        }

        // Buscar tickets disponíveis
        const tickets = await TicketSystem.getTicketsDisponiveis(jogador.id);

        if (tickets.length === 0) {
            return MessageService.send({ message: msg, text: `
*═══ USAR TICKET ═══*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*Você não possui tickets disponíveis.*

_Complete os 5 usos de uma Dungeon Instanciada para ganhar um ticket._
_Use *!meus tickets* para ver todos os seus tickets._

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` });
        }

        // Verificar se é um pedido de uso específico
        const args = texto.replace("!usar ticket", "").trim();

        // Se não especificou o tipo, listar tickets disponíveis
        if (!args) {
            let mensagem = `*═══ SEUS TICKETS DISPONÍVEIS ═══*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;
            tickets.forEach((ticket, i) => {
                const tipo = ticket.tipo === "item_unico" ? "Item Único" : "Técnica Única";
                mensagem += `*${i + 1}.* ${ticket.nome} (${tipo})\n`;
            });

            mensagem += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
_Para usar um ticket:_
*!usar ticket item* - Para Item Único
*!usar ticket tecnica* - Para Técnica Única`;

            return MessageService.send({ message: msg, text: mensagem });
        }

        // Determinar o tipo de ticket a usar
        let tipoDesejado = null;
        if (args.includes("item")) {
            tipoDesejado = "item_unico";
        } else if (args.includes("tecnic") || args.includes("técnic")) {
            tipoDesejado = "tecnica_unica";
        } else {
            return MessageService.send({ message: msg, text: `
*═══ USAR TICKET ═══*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*Tipo inválido!*

Use:
*!usar ticket item* - Para Item Único
*!usar ticket tecnica* - Para Técnica Única

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` });
        }

        // Buscar ticket do tipo desejado
        const ticket = tickets.find(t => t.tipo === tipoDesejado);

        if (!ticket) {
            return MessageService.send({ message: msg, text: `
*═══ USAR TICKET ═══*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*Você não possui um ticket de ${tipoDesejado === "item_unico" ? "Item Único" : "Técnica Única"} disponível.*

_Use *!usar ticket* para ver seus tickets disponíveis._

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` });
        }

        // Usar o ticket
        const resultado = await TicketSystem.usarTicket(jogador.id, ticket.id);

        if (resultado.erro) {
            return MessageService.send({ message: msg, text: `*✖ ${resultado.erro}*` });
        }

        // Formatar mensagem de sucesso
        const mensagem = TicketSystem.formatarMensagemUso(resultado);
        return MessageService.send({ message: msg, text: mensagem });

    } catch (error) {
        console.error("Erro no comando !usar ticket:", error);
        return MessageService.send({ message: msg, text: "*✖ Erro ao usar ticket. Tente novamente.*" });
    }
};