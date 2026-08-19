const MessageService = require("../core/messageService");
const db = require("../core/database");
const InventorySystem = require("../systems/inventorySystem");
const AtributoSystem = require("../systems/atributoSystem");

function normalizarNome(valor) {
    return String(valor || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim()
        .replace(/\s+/g, " ");
}

function escolherItem(itens, nomeItem) {
    const alvo = normalizarNome(nomeItem);
    return (itens || []).filter(item => {
        const nome = normalizarNome(item.nome);
        return nome === alvo || nome.includes(alvo) || alvo.includes(nome);
    }).sort((a, b) => {
        const nomeA = normalizarNome(a.nome);
        const nomeB = normalizarNome(b.nome);
        if (nomeA === alvo && nomeB !== alvo) return -1;
        if (nomeB === alvo && nomeA !== alvo) return 1;
        if (!InventorySystem.isConsumivel(a) && InventorySystem.isConsumivel(b)) return -1;
        if (!InventorySystem.isConsumivel(b) && InventorySystem.isConsumivel(a)) return 1;
        return nomeA.length - nomeB.length;
    })[0] || null;
}

const get = (sql, params = []) => new Promise((resolve, reject) =>
    db.get(sql, params, (err, row) => err ? reject(err) : resolve(row))
);
const all = (sql, params = []) => new Promise((resolve, reject) =>
    db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows || []))
);

module.exports = async msg => {
    try {
        const nomeItem = String(msg.body || "").replace(/^!equipar/i, "").trim();
        const numero = msg.author || msg.from;

        if (!nomeItem) {
            return MessageService.send({ message: msg, text: `*SISTEMA DE EQUIPAMENTO*

Informe o nome do item para equipar.
Exemplo: !equipar Espada Simples

_Use !equipados para ver seus slots._
_Use !desequipar <item> para desequipar._
_Use !inventario para ver seus itens._` });
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
        if (InventorySystem.isConsumivel(item)) {
            return MessageService.send({ message: msg, text: "*Itens consumiveis nao podem ser equipados.*\n_Use !usar <item> para consumir._" });
        }
        if (Number(item.equipado) === 1) {
            return MessageService.send({ message: msg, text: `*Este item ja esta equipado.*\n> ${item.nome}\n\n_Use !desequipar ${item.nome} para desequipar._` });
        }

        const resultado = await InventorySystem.equiparItem(jogador.id, item.id);
        if (resultado.erro) return MessageService.send({ message: msg, text: `*${resultado.erro}*` });

        await AtributoSystem.recalcularAtributos(jogador.id);
        const jogadorAtual = await get("SELECT * FROM jogadores WHERE id = ?", [jogador.id]);

        await MessageService.send({ message: msg, text: `*SISTEMA DE EQUIPAMENTO*

Item equipado com sucesso!
> ${resultado.item}

EQUIPADO - atributos atualizados automaticamente.

*Atributos Totais Atuais:*
> Forca: ${jogadorAtual.forca_total}
> Resistencia: ${jogadorAtual.resistencia_total}
> Velocidade: ${jogadorAtual.velocidade_total}
> Sentidos: ${jogadorAtual.sentidos_total}
> Inteligencia: ${jogadorAtual.inteligencia_total}
> Poder Magico: ${jogadorAtual.poder_magico_total}

_Use !equipados para ver seus equipamentos._` });
    } catch (erro) {
        console.error("[EQUIPAR]", erro.message);
        return MessageService.send({ message: msg, text: "*Erro ao equipar item.*" });
    }
};

module.exports.escolherItem = escolherItem;
module.exports.normalizarNome = normalizarNome;
