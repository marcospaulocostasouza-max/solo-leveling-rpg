const MessageService = require("../core/messageService");

/*
 * COMANDO: !equipar
 * 
 * Equipa ou desequipa um item do inventário.
 */

const db = require("../core/database");
const InventorySystem = require("../systems/inventorySystem");
const AtributoSystem = require("../systems/atributoSystem");

module.exports = async (msg) => {
    const args = msg.body.split(" ");
    const nomeItem = args.slice(1).join(" ").trim();
    const numero = msg.author || msg.from;

    if (!nomeItem) {
        return MessageService.send({ message: msg, text: `*═══ SISTEMA DE EQUIPAMENTO ═══*
──────────────────────────

Informe o nome do item para equipar/desequipar.
Exemplo: !equipar Espada Simples

_Use !equipados para ver seus slots._
_Use !inventario para ver seus itens._` });
    }

    db.get("SELECT id FROM jogadores WHERE numero = ?", [numero], async (err, jogador) => {
        if (err || !jogador) return MessageService.send({ message: msg, text: "*✖ Você precisa ter uma ficha aprovada.*" });

        // Buscar item pelo nome no inventário
        db.get(
            `SELECT i.*, inv.id as inv_id FROM inventario_jogador inv 
             JOIN itens i ON inv.item_id = i.id 
             WHERE inv.jogador_id = ? AND i.nome LIKE ?`,
            [jogador.id, `%${nomeItem}%`],
            async (err, item) => {
                if (err || !item) return MessageService.send({ message: msg, text: "*✖ Item não encontrado no inventário.*" });

                if (item.consumivel) {
                    return MessageService.send({ message: msg, text: "*✖ Itens consumíveis não podem ser equipados.*\n_Use !usar <item> para consumir._" });
                }

                // Equipar/desequipar usando o item
                const resultado = await InventorySystem.equiparItem(jogador.id, item.id);

                if (resultado.erro) {
                    return MessageService.send({ message: msg, text: `*✖ ${resultado.erro}*` });
                }

                // Recalcular TODOS os atributos automaticamente
                await AtributoSystem.recalcularAtributos(jogador.id);

                // Buscar novos totais para exibir
                const jogadorAtual = await new Promise((resolve) => {
                    db.get("SELECT * FROM jogadores WHERE id = ?", [jogador.id], (er, row) => resolve(row));
                });

                const acao = resultado.acao === "equipado" ? "**EQUIPADO**" : "**DESEQUIPADO**";

                await MessageService.send({ message: msg, text: `
*═══ SISTEMA DE EQUIPAMENTO ═══*

Item ${resultado.acao} com sucesso!
> ${resultado.item}

${acao} — atributos atualizados automaticamente!

*Atributos Totais Atuais:*
> Força: ${jogadorAtual.forca_total}
> Resistência: ${jogadorAtual.resistencia_total}
> Velocidade: ${jogadorAtual.velocidade_total}
> Sentidos: ${jogadorAtual.sentidos_total}
> Inteligência: ${jogadorAtual.inteligencia_total}
> Poder Mágico: ${jogadorAtual.poder_magico_total}

_Use !equipados para ver seus equipamentos._
                ` });
            }
        );
    });
};
