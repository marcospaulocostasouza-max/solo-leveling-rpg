const MessageService = require("../core/messageService");

/**
 * COMANDO: !armasiniciais / !armas iniciais
 * 
 * Lista todas as armas iniciais disponíveis para criação de personagem.
 * As armas são carregadas do itens.json (mesma base do !itens).
 * 
 * O jogador escolhe a arma durante a criação da ficha.
 * Após aprovação, a arma é vinculada ao personagem no banco de dados.
 */

const itens = require("../database/itens.json");

module.exports = async (msg) => {
    const armas = itens.armas || [];
    
    if (armas.length === 0) {
        return MessageService.send({ message: msg, text: `
*═══ ARMAS INICIAIS ═══*
──────────────────────────

Nenhuma arma cadastrada no sistema.

──────────────────────────` });
    }
    
    let mensagem = `*═══ ARMAS INICIAIS ═══*
──────────────────────────

_Escolha uma destas armas durante a criação da ficha:_

`;
    
    // Listar todas as armas com descrição
    armas.forEach((arma, i) => {
        const nome = arma.nome || 'Sem nome';
        const desc = arma.descricao || 'Sem descrição';
        mensagem += `> *${i + 1}. ${nome}*\n> _${desc}_\n\n`;
    });
    
    mensagem += `──────────────────────────
_Total: ${armas.length} armas disponíveis_

_Como escolher:_
> Preencha o campo "Arma inicial" na sua ficha
> com o nome de uma destas armas.

_Exemplo: Arma inicial: Espada Simples_`;
    
    await MessageService.send({ message: msg, text: mensagem });
};