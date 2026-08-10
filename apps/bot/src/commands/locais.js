const MessageService = require("../core/messageService");

/**
 * COMANDO: !local
 * 
 * Exibe locais especiais da Coreia do Sul para exploração e treino.
 * 
 * Uso: !local listar - Lista todos os locais
 *      !local <nome> - Detalhes de um local específico
 */

const locais = require("../database/data/locais.json");

module.exports = async (msg) => {
    const args = msg.body.split(" ");
    const subcomando = args[1] ? args.slice(1).join(" ").toLowerCase() : "listar";
    
    if (subcomando === "listar") {
        let mensagem = `*─ Locais 🏔️ ─*
        
A Coréia do Sul é um país de primeiro mundo, vasto e diversificado no que pode oferecer aos que a ele se guiam. Caçadores de dungeon têm alguns "passes livres" para certos locais por contribuírem para a defesa do país à ameaça dos portais. Cada local oferece bônus únicos para treinos, interações e recompensas.

══════════════════════════

*LOCAIS ESPECIAIS DA COREIA DO SUL*\n`;
        mensagem += "═".repeat(30) + "\n\n";
        
        locais.forEach(l => {
            mensagem += `*${l.nome}* (${l.tipo})\n`;
            mensagem += `> ${l.descricao.substring(0, 100)}...\n`;
            mensagem += `> Ranks: ${l.ranks_permitidos}\n\n`;
        });
        
        mensagem += "═".repeat(30) + "\n";
        mensagem += "_Use !local [nome] para detalhes completos_";
        
        await MessageService.send({ message: msg, text: mensagem });
    } else {
        const local = locais.find(l => l.nome.toLowerCase().includes(subcomando));
        if (!local) return MessageService.send({ message: msg, text: "*✖ Local nao encontrado.*" });
        
        let mensagem = `
*${local.nome}* (${local.tipo})
═${"═".repeat(25)}

*DESCRICAO*
${local.descricao}

*BONUS*
${local.bonus}

*RISCO*
${local.risco}

*RANKS PERMITIDOS*
${local.ranks_permitidos}
        `;
        
        if (local.titulos && local.titulos.length > 0) {
            mensagem += `\n*TITULOS RELACIONADOS*\n`;
            local.titulos.forEach(t => mensagem += `> ${t}\n`);
        }
        
        await MessageService.send({ message: msg, text: mensagem });
    }
};