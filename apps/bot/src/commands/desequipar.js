const MessageService = require("../core/messageService");
const db = require("../core/database");
const AtributoSystem = require("../systems/atributoSystem");
const { escolherItem } = require("./equipar");

const get = (sql, params = []) => new Promise((resolve, reject) =>
    db.get(sql, params, (err, row) => err ? reject(err) : resolve(row))
);
const all = (sql, params = []) => new Promise((resolve, reject) =>
    db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows || []))
);
const run = (sql, params = []) => new Promise((resolve, reject) =>
    db.run(sql, params, function (err) { err ? reject(err) : resolve(this); })
);

module.exports = async msg => {
    try {
        const nomeItem = String(msg.body || "").replace(/^!desequipar/i, "").trim();
        const numero = msg.author || msg.from;

        if (!nomeItem) {
            return MessageService.send({ message: msg, text: `*SISTEMA DE EQUIPAMENTO*

Informe o nome do item para desequipar.
Exemplo: !desequipar Espada Simples

_Use !equipados para ver seus equipamentos._
_Use !equipar <item> para equipar._` });
        }

        const jogador = await get("SELECT id FROM jogadores WHERE numero = ?", [numero]);
        if (!jogador) return MessageService.send({ message: msg, text: "*Voce precisa ter uma ficha aprovada.*" });

        const itens = await all(
            `SELECT i.*, inv.id as inv_id, inv.equipado
             FROM inventario_jogador inv
             JOIN itens i ON inv.item_id = i.id
             WHERE inv.jogador_id = ?`,
            [jogador.id]
        );
        const item = escolherItem(itens, nomeItem);
        if (!item) return MessageService.send({ message: msg, text: "*Item nao encontrado no inventario.*" });
        if (Number(item.equipado) !== 1) {
            return MessageService.send({ message: msg, text: `*Este item nao esta equipado.*\n> ${item.nome}` });
        }

        await run("UPDATE inventario_jogador SET equipado = 0 WHERE jogador_id = ? AND item_id = ?", [jogador.id, item.id]);
        await AtributoSystem.recalcularAtributos(jogador.id);
        const jogadorAtual = await get("SELECT * FROM jogadores WHERE id = ?", [jogador.id]);

        return MessageService.send({ message: msg, text: `*SISTEMA DE EQUIPAMENTO*

Item desequipado com sucesso!
> ${item.nome}

DESEQUIPADO - atributos atualizados automaticamente.

*Atributos Totais Atuais:*
> Forca: ${jogadorAtual.forca_total}
> Resistencia: ${jogadorAtual.resistencia_total}
> Velocidade: ${jogadorAtual.velocidade_total}
> Sentidos: ${jogadorAtual.sentidos_total}
> Inteligencia: ${jogadorAtual.inteligencia_total}
> Poder Magico: ${jogadorAtual.poder_magico_total}

_Use !equipados para ver seus equipamentos._` });
    } catch (erro) {
        console.error("[DESEQUIPAR]", erro.message);
        return MessageService.send({ message: msg, text: "*Erro ao desequipar item.*" });
    }
};
