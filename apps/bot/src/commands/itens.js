const MessageService = require("../core/messageService");

module.exports = async (msg) => {
    const mensagem = `
*═══ ITENS DO SISTEMA ═══*

*─── Categorias ───*
> Armas - Espadas, arcos, cajados
> Armaduras - Peitorais, capacetes, luvas
> Escudos - Defensivos e mágicos
> Acessórios - Anéis, amuletos, buffs
> Consumíveis - Poções, pergaminhos

*─── Raridades ───*
> Comum - Itens básicos
> Incomum - Itens com bônus
> Raro - Itens poderosos
> Muito Raro - Itens lendários

──────────────────────────
_Use !abrir loja para ver itens à venda._
`;
    await MessageService.send({ message: msg, text: mensagem });
};