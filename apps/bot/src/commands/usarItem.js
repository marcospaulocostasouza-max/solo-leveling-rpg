const MessageService = require("../core/messageService");
const db = require("../core/database");
const InventorySystem = require("../systems/inventorySystem");

function normalizar(texto) {
    return String(texto || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

module.exports = async (msg) => {
    try {
        const nomeBuscado = msg.body.replace(/^!usar\s*/i, "").trim();
        const numero = msg.author || msg.from;
        if (!nomeBuscado) return MessageService.send({ message: msg, text: "[!] Uso: !usar <nome do item consumível>" });

        const jogador = await new Promise((resolve, reject) => db.get(
            "SELECT id FROM jogadores WHERE numero = ?", [numero], (erro, linha) => erro ? reject(erro) : resolve(linha)
        ));
        if (!jogador) return MessageService.send({ message: msg, text: "[!] Não foi possível encontrar sua ficha." });

        const itens = await new Promise((resolve, reject) => db.all(
            "SELECT i.*, inv.quantidade FROM inventario_jogador inv JOIN itens i ON i.id = inv.item_id WHERE inv.jogador_id = ? AND inv.quantidade > 0",
            [jogador.id], (erro, linhas) => erro ? reject(erro) : resolve(linhas || [])
        ));
        const alvo = normalizar(nomeBuscado);
        const item = itens.find((atual) => normalizar(atual.nome) === alvo) || itens.find((atual) => normalizar(atual.nome).includes(alvo));
        if (!item) return MessageService.send({ message: msg, text: "[!] Item não encontrado no seu inventário." });
        if (!InventorySystem.isConsumivel(item)) return MessageService.send({ message: msg, text: `[!] ${item.nome} não é um item consumível.` });

        const resultado = await InventorySystem.usarItem(jogador.id, item.id);
        if (resultado.erro) return MessageService.send({ message: msg, text: `[!] ${resultado.erro}` });

        const efeitos = resultado.efeitos.map((efeito) => `› ${efeito.tipo}: +${efeito.valor}`).join("\n");
        const texto = [
            "════════════════════════════════════",
            "*ITEM UTILIZADO*",
            "════════════════════════════════════",
            "",
            `› Item: *${resultado.item}*`,
            efeitos,
            "",
            "_Uma unidade foi consumida do inventário._"
        ].join("\n");
        return MessageService.send({ message: msg, text: texto });
    } catch (erro) {
        console.error("Erro ao usar item:", erro);
        return MessageService.send({ message: msg, text: "[!] Não foi possível usar este item agora." });
    }
};
