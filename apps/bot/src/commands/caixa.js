const MessageService = require("../core/messageService");
const db = require("../core/database");

const executar = (sql, params = []) => new Promise((resolve, reject) => db.run(sql, params, function (erro) { erro ? reject(erro) : resolve(this); }));
const obter = (sql, params = []) => new Promise((resolve, reject) => db.get(sql, params, (erro, linha) => erro ? reject(erro) : resolve(linha)));

module.exports = async (msg) => {
    try {
        const jogador = await obter("SELECT id, nome FROM jogadores WHERE numero = ?", [msg.author || msg.from]);
        if (!jogador) return MessageService.send({ message: msg, text: "[!] Não foi possível encontrar sua ficha." });

        await executar("CREATE TABLE IF NOT EXISTS caixas_iniciais (jogador_id INTEGER PRIMARY KEY, recebida_em TEXT NOT NULL)");
        const recebida = await obter("SELECT jogador_id FROM caixas_iniciais WHERE jogador_id = ?", [jogador.id]);
        if (recebida) return MessageService.send({ message: msg, text: "[!] Você já recebeu sua Caixa Inicial." });

        let item = await obter("SELECT id FROM itens WHERE nome = 'Caixa de Item'");
        if (!item) {
            const inserido = await executar("INSERT INTO itens (nome, categoria, tier, descricao, consumivel) VALUES (?, ?, ?, ?, 0)", ["Caixa de Item", "Caixa", "E", "Caixa de recompensa obtida em atividades e eventos."]);
            item = { id: inserido.lastID };
        }
        const existente = await obter("SELECT id FROM inventario_jogador WHERE jogador_id = ? AND item_id = ?", [jogador.id, item.id]);
        if (existente) await executar("UPDATE inventario_jogador SET quantidade = quantidade + 1 WHERE id = ?", [existente.id]);
        else await executar("INSERT INTO inventario_jogador (jogador_id, item_id, quantidade, equipado) VALUES (?, ?, 1, 0)", [jogador.id, item.id]);
        await executar("INSERT INTO caixas_iniciais (jogador_id, recebida_em) VALUES (?, datetime('now'))", [jogador.id]);

        return MessageService.send({ message: msg, text: "════════════════════════════════════\n*CAIXA INICIAL RECEBIDA*\n════════════════════════════════════\n\n› Uma Caixa de Item foi adicionada ao seu inventário.\n› Use !abrir caixa para abrir quando desejar." });
    } catch (erro) {
        console.error("Erro ao entregar caixa inicial:", erro);
        return MessageService.send({ message: msg, text: "[!] Não foi possível entregar sua Caixa Inicial agora." });
    }
};
