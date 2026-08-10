const MessageService = require("../core/messageService");

/**
 * COMANDO: !territorios
 * 
 * Exibe a lista de territórios disponíveis para compra por guildas.
 * Sistema completo de territórios com valores, lucros e donos.
 */

const db = require("../core/database");
const territorios = require("../database/data/territorios.json");

module.exports = async (msg) => {
    const args = msg.body.split(" ");
    const subcomando = args[1] ? args[1].toLowerCase() : "listar";
    
    if (subcomando === "listar" || subcomando === "lista") {
        let mensagem = `*─ Territórios 🗺️ ─*
        
Os territórios são regiões de Seul que podem ser adquiridas por guildas para gerar renda passiva, influência política e recursos exclusivos. Cada território possui características únicas, como recursos naturais e localização estratégica, que afetam a guilda de diferentes formas.

*COMO FUNCIONA:*
- Guildas podem adquirir territórios por compra, leilão ou conquista
- O valor é calculado por extensão territorial e densidade demográfica
- Cada território comporta até 2 investimentos
- A guilda recebe 10% do valor de compra como renda semanal

══════════════════════════

*TERRITORIOS DE SEUL*\n`;
        mensagem += "═".repeat(30) + "\n\n";
        
        const porCategoria = {};
        territorios.forEach(t => {
            if (!porCategoria[t.categoria]) porCategoria[t.categoria] = [];
            porCategoria[t.categoria].push(t);
        });
        
        for (const [categoria, lista] of Object.entries(porCategoria)) {
            mensagem += `*${categoria}*\n`;
            lista.forEach(t => {
                mensagem += `> ${t.nome} | Valor: ${t.valor.toLocaleString()} Won | Lucro: ${t.lucro_semanal.toLocaleString()}/sem | Dono: ${t.dono}\n`;
            });
            mensagem += "\n";
        }
        
        mensagem += "═".repeat(30) + "\n";
        mensagem += "_Use !territorio [nome] para detalhes_";
        
        await MessageService.send({ message: msg, text: mensagem });
    } else {
        // Detalhes de um território específico
        const nomeBusca = args.slice(1).join(" ").toLowerCase();
        const territorio = territorios.find(t => t.nome.toLowerCase().includes(nomeBusca));
        
        if (!territorio) {
            return MessageService.send({ message: msg, text: "*✖ Territorio nao encontrado.* Use !territorios para ver a lista." });
        }
        
        const mensagem = `
*${territorio.nome}*
═${"═".repeat(25)}
> Categoria: ${territorio.categoria}
> Valor: ${territorio.valor.toLocaleString()} Won
> Lucro Semanal: ${territorio.lucro_semanal.toLocaleString()} Won
> Dono Atual: ${territorio.dono}

*INFORMACOES*
Os territorios podem ser comprados por guildas para gerar renda passiva.
Cada territorio comporta ate 2 investimentos.
        `;
        
        await MessageService.send({ message: msg, text: mensagem });
    }
};