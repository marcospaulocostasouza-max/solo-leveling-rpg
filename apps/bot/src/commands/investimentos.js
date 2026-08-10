const MessageService = require("../core/messageService");

/**
 * COMANDO: !investimentos
 * 
 * Exibe opções de investimento para guildas em seus territórios.
 */

const investimentos = require("../database/data/investimentos.json");

module.exports = async (msg) => {
    let mensagem = `*─ Investimentos 💸 ─*
    
Os investimentos são um sistema onde as Guildas usam seus lucros para investir no bem-estar de seus membros e criar uma comunidade próspera em seu bairro. Locais comprados pela guilda dão um buff para os caçadores que se alocam no local, devido aos cristais de mana usados na construção.

══════════════════════════

*INVESTIMENTOS PARA GUILDAS*\n`;
    mensagem += "═".repeat(30) + "\n\n";
    mensagem += "Cada territorio comporta ate 2 investimentos.\n\n";
    
    investimentos.forEach(inv => {
        mensagem += `*${inv.nome}*\n`;
        mensagem += `> Custo: ${inv.custo.toLocaleString()} Won\n`;
        mensagem += `> Rendimento: ${inv.rendimento_semanal.toLocaleString()}/semana\n`;
        mensagem += `> Buff: ${inv.buff}\n\n`;
    });
    
    mensagem += "═".repeat(30) + "\n";
    mensagem += "_Compre investimentos no seu territorio para gerar renda e buffs!_";
    
    await MessageService.send({ message: msg, text: mensagem });
};