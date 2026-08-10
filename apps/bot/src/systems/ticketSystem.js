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
        return new Promise((resolve) => {
            db.all(
                "SELECT * FROM tickets_unicos WHERE jogador_id = ? AND status = 'disponivel'",
                [jogadorId],
                (err, rows) => resolve(rows || [])
            );
        });
    }

    /**
     * Busca todos os tickets do jogador
     */
    static async getTickets(jogadorId) {
        return new Promise((resolve) => {
            db.all(
                "SELECT * FROM tickets_unicos WHERE jogador_id = ? ORDER BY data_obtencao DESC",
                [jogadorId],
                (err, rows) => resolve(rows || [])
            );
        });
    }

    /**
     * Usa um ticket - entra na fila de avaliação
     */
    static async usarTicket(jogadorId, ticketId) {
        // Buscar ticket
        const ticket = await new Promise((resolve) => {
            db.get("SELECT * FROM tickets_unicos WHERE id = ? AND jogador_id = ?", [ticketId, jogadorId], (err, row) => {
                resolve(row || null);
            });
        });

        if (!ticket) {
            return { erro: "Ticket não encontrado." };
        }

        if (ticket.status !== "disponivel") {
            return { erro: "Este ticket já foi utilizado." };
        }

        // Verificar se já está na fila
        const jaNaFila = await new Promise((resolve) => {
            db.get(
                "SELECT * FROM fila_avaliacao WHERE jogador_id = ? AND status = 'aguardando'",
                [jogadorId],
                (err, row) => resolve(row || null)
            );
        });

        if (jaNaFila) {
            return { erro: "Você já possui uma solicitação na fila de avaliação." };
        }

        // Calcular posição na fila
        const posicao = await new Promise((resolve) => {
            db.get(
                "SELECT COUNT(*) as total FROM fila_avaliacao WHERE status = 'aguardando'",
                [],
                (err, row) => resolve((row && row.total) || 0)
            );
        });

        const agora = new Date().toISOString();

        // Atualizar ticket para 'em_producao'
        await new Promise((resolve) => {
            db.run(
                "UPDATE tickets_unicos SET status = 'em_producao', data_uso = ? WHERE id = ?",
                [agora, ticket.id],
                () => resolve()
            );
        });

        // Adicionar à fila de avaliação
        const filaId = await new Promise((resolve) => {
            db.run(
                `INSERT INTO fila_avaliacao (jogador_id, ticket_id, tipo, posicao, status, data_entrada) 
                 VALUES (?, ?, ?, ?, 'aguardando', ?)`,
                [jogadorId, ticket.id, ticket.tipo, posicao + 1, agora],
                function(err) {
                    resolve(this.lastID);
                }
            );
        });

        return {
            sucesso: true,
            filaId,
            posicao: posicao + 1,
            tipo: ticket.tipo,
            nome: ticket.nome
        };
    }

    /**
     * Busca a posição atual do jogador na fila
     */
    static async getPosicaoFila(jogadorId) {
        return new Promise((resolve) => {
            db.get(
                "SELECT * FROM fila_avaliacao WHERE jogador_id = ? AND status = 'aguardando'",
                [jogadorId],
                (err, row) => resolve(row || null)
            );
        });
    }

    /**
     * Busca a fila completa de avaliação
     */
    static async getFilaCompleta() {
        return new Promise((resolve) => {
            db.all(
                `SELECT fa.*, j.nome as jogador_nome 
                 FROM fila_avaliacao fa 
                 JOIN jogadores j ON j.id = fa.jogador_id 
                 WHERE fa.status = 'aguardando' 
                 ORDER BY fa.posicao ASC`,
                [],
                (err, rows) => resolve(rows || [])
            );
        });
    }

    /**
     * Avança a fila - remove o primeiro da fila e atualiza posições
     */
    static async avancarFila(filaId) {
        // Marcar como concluído
        await new Promise((resolve) => {
            db.run(
                "UPDATE fila_avaliacao SET status = 'concluido', data_conclusao = ? WHERE id = ?",
                [new Date().toISOString(), filaId],
                () => resolve()
            );
        });

        // Atualizar ticket para 'concluido'
        await new Promise((resolve) => {
            db.run(
                `UPDATE tickets_unicos SET status = 'concluido' 
                 WHERE id = (SELECT ticket_id FROM fila_avaliacao WHERE id = ?)`,
                [filaId],
                () => resolve()
            );
        });

        // Recalcular posições dos restantes
        const restantes = await new Promise((resolve) => {
            db.all(
                "SELECT * FROM fila_avaliacao WHERE status = 'aguardando' ORDER BY posicao ASC",
                [],
                (err, rows) => resolve(rows || [])
            );
        });

        for (let i = 0; i < restantes.length; i++) {
            await new Promise((resolve) => {
                db.run(
                    "UPDATE fila_avaliacao SET posicao = ? WHERE id = ?",
                    [i + 1, restantes[i].id],
                    () => resolve()
                );
            });
        }

        return { sucesso: true };
    }

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