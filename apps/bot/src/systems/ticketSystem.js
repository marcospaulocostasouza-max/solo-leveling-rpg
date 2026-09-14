/*
 * SISTEMA DE TICKETS DE ITEM/TÉCNICA ÚNICA
 * 
 * Gerencia:
 * - Sorteio 50/50 ao finalizar 5 usos da dungeon
 * - Ticket de Item Único ou Técnica Única
 * - Fila de avaliação
 * - Uso de tickets (!usar ticket)
 */

const db = require("../core/database");
const JogadorCore = require("../core/jogadorCore");

const sharedDatabase = require('../../../../packages/database');
const queueService = require('./ticketQueueService').createService(sharedDatabase,require('../../../../packages/database/config').provider);

class TicketSystem {

    /**
     * Sorteia um ticket 50/50 ao finalizar os 5 usos da dungeon
     * Retorna o tipo de ticket sorteado
     */
    static async sortearTicket(jogadorId) {
        const sorteio = Math.random() < 0.5;
        const tipo = sorteio ? "item_unico" : "tecnica_unica";
        const nome = sorteio ? "Ticket de Item Único" : "Ticket de Técnica Única";
        const agora = new Date().toISOString();

        // Criar ticket no banco
        const ticketId = await new Promise((resolve) => {
            db.run(
                `INSERT INTO tickets_unicos (jogador_id, tipo, nome, status, data_obtencao) 
                 VALUES (?, ?, ?, 'disponivel', ?)`,
                [jogadorId, tipo, nome, agora],
                function(err) {
                    resolve(this.lastID);
                }
            );
        });

        return {
            sucesso: true,
            ticketId,
            tipo,
            nome
        };
    }

    /**
     * Busca tickets disponíveis do jogador
     */
    static async getTicketsDisponiveis(jogadorId) {
        return new Promise((resolve,reject) => {
            db.all(
                "SELECT * FROM tickets_unicos WHERE jogador_id = ? AND status = 'disponivel'",
                [jogadorId],
                (err, rows) => err ? reject(err) : resolve(rows || [])
            );
        });
    }

    /**
     * Busca todos os tickets do jogador
     */
    static async getTickets(jogadorId) {
        return new Promise((resolve,reject) => {
            db.all(
                "SELECT * FROM tickets_unicos WHERE jogador_id = ? ORDER BY data_obtencao DESC",
                [jogadorId],
                (err, rows) => err ? reject(err) : resolve(rows || [])
            );
        });
    }

    /**
     * Usa um ticket - entra na fila de avaliação
     */
    static async usarTicket(jogadorId,ticketId) { return queueService.use(jogadorId,ticketId); }
    static async getPosicaoFila(jogadorId) { return queueService.position(jogadorId); }
    static async getFilaCompleta() { return queueService.queue(); }
    static async avancarFila(filaId) { return queueService.advance(filaId); }
    static async corrigirPosicoesFila() { return queueService.repair(); }

    /**
     * Formata a mensagem de ticket obtido
     */
    static formatarMensagemTicket(ticket) {
        return `*⟨ ARQUITETO ⟩*

*O ciclo da Dungeon foi concluído.*

> Você recebeu um *${ticket.nome}*!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*O ticket foi adicionado ao seu inventário automaticamente.*

_Use *!usar ticket* para utilizá-lo._
_Use *!meus tickets* para ver seus tickets._`;
    }

    /**
     * Formata a mensagem de uso de ticket
     */
    static formatarMensagemUso(resultado) {
        const tipo = resultado.tipo === "item_unico" ? "Item Único" : "Técnica Única";
        
        return `*⟨ ARQUITETO ⟩*

*Ticket utilizado com sucesso!*

> Seu *${tipo}* está em produção!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*Posição na fila de avaliação:* *${resultado.posicao}*

_Seu ticket foi adicionado à fila de criação e avaliação._
_A posição será reduzida conforme os itens/técnicas forem finalizados._`;
    }
}

module.exports = TicketSystem;
