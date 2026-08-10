const MessageService = require("../core/messageService");

/**
 * COMANDO: !abrir loja
 * 
 * Exibe as categorias de equipamentos disponíveis para o jogador
 * baseado no seu Rank atual.
 * 
 * Cada categoria mostra apenas itens do rank correspondente.
 */

const db = require("../core/database");

module.exports = async (msg) => {
    const numero = msg.author || msg.from;
    
    // Buscar jogador
    const jogador = await new Promise((resolve) => {
        db.get("SELECT * FROM jogadores WHERE numero = ?", [numero], (err, row) => {
            resolve(row);
        });
    });
    
    if (!jogador) {
        return MessageService.send({ message: msg, text: "*✖ Você precisa ter uma ficha aprovada primeiro.*" });
    }
    
    const rank = (jogador.rank || "E").toUpperCase();
    
    // Definir categorias disponíveis por rank
    const categoriasPorRank = {
        "E": [
            "!Slot de Cabeça E",
            "!Slot de Corpo E",
            "!Slot de Pernas E",
            "!Slot de Pés E",
            "!Slot de Acessórios E",
            "!Itens de Apoio E",
            "!Arma 1 E",
            "!Arma 2 E"
        ],
        "D": [
            "!Slot de Cabeça D",
            "!Slot de Corpo D",
            "!Slot de Pernas D",
            "!Slot de Pés D",
            "!Slot de Acessórios D",
            "!Itens de Apoio D",
            "!Arma 1 D",
            "!Arma 2 D"
        ],
        "C": [
            "!Slot de Cabeça C",
            "!Slot de Corpo C",
            "!Slot de Pernas C",
            "!Slot de Pés C",
            "!Slot de Acessórios C",
            "!Itens de Apoio C",
            "!Arma 1 C",
            "!Arma 2 C"
        ],
        "B": [
            "!Slot de Cabeça B",
            "!Slot de Corpo B",
            "!Slot de Pernas B",
            "!Slot de Pés B",
            "!Slot de Acessórios B",
            "!Itens de Apoio B",
            "!Arma 1 B",
            "!Arma 2 B"
        ],
        "A": [
            "!Slot de Cabeça A",
            "!Slot de Corpo A",
            "!Slot de Pernas A",
            "!Slot de Pés A",
            "!Slot de Acessórios A",
            "!Itens de Apoio A",
            "!Arma 1 A",
            "!Arma 2 A"
        ],
        "S": [
            "!Slot de Cabeça S",
            "!Slot de Corpo S",
            "!Slot de Pernas S",
            "!Slot de Pés S",
            "!Slot de Acessórios S",
            "!Itens de Apoio S",
            "!Arma 1 S",
            "!Arma 2 S"
        ]
    };
    
    // Buscar categorias disponíveis para o rank do jogador
    const categoriasDisponiveis = categoriasPorRank[rank] || categoriasPorRank["E"];
    
    // Montar mensagem
    let mensagem = `*═══ LOJA DE EQUIPAMENTOS ═══*\n`;
    mensagem += `──────────────────────────\n\n`;
    mensagem += `> *Seu Rank:* ${rank}\n`;
    mensagem += `> *Seu Saldo:* ${(jogador.won || 0).toLocaleString()} Won\n\n`;
    mensagem += `*─── Categorias Disponíveis ───*\n\n`;
    
    categoriasDisponiveis.forEach(categoria => {
        mensagem += `${categoria}\n`;
    });

    mensagem += `\n*─── Lojas Especiais ───*\n`;
    mensagem += `!Loja Materiais\n`;
    mensagem += `!Loja Nucleos\n`;
    
    mensagem += `\n*─── Ver Itens ───*\n`;
    mensagem += `> Use o comando da categoria desejada para ver os itens disponíveis.\n\n`;
    mensagem += `*Exemplo:*\n`;
    mensagem += `> !Slot de Cabeça ${rank}\n`;
    mensagem += `> !Arma 1 ${rank}\n\n`;
    mensagem += `*Dica:*\n`;
    mensagem += `> Você pode consultar lojas de ranks inferiores usando o comando com a letra do rank desejado.\n`;
    mensagem += `_Exemplo: !Slot de Cabeça E (mesmo sendo rank D)_\n\n`;
    
    mensagem += `*─── Como Comprar ───*\n\n`;
    mensagem += `*1. Comprar item:*\n`;
    mensagem += `> !comprar <nome do item>\n`;
    mensagem += `_Exemplo: !comprar Adaga do Aspirante_\n\n`;
    mensagem += `*2. Confirmar compra:*\n`;
    mensagem += `> !confirmar compra\n`;
    mensagem += `_O bot irá exibir os detalhes e saldo antes de confirmar._\n\n`;
    mensagem += `*Como funciona:*\n`;
    mensagem += `> O sistema verifica seu saldo disponível\n`;
    mensagem += `> Mostra o preço do item e saldo pós-compra\n`;
    mensagem += `> O item vai para o inventário (NÃO equipa automático)\n`;
    mensagem += `> Use !equipar <nome> para equipar o item\n\n`;
    mensagem += `*3. Vender item:*\n`;
    mensagem += `> Use !vender <nome do item> para consultar a venda disponível.\n`;
    mensagem += `_Itens consumíveis podem ser usados com !usar <nome do item>._\n\n`;
    mensagem += `──────────────────────────\n`;
    mensagem += `_Você será avisado se o saldo for insuficiente._`;
    
    await MessageService.send({ message: msg, text: mensagem });
};
