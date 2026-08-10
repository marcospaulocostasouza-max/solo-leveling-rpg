const db = require("../core/database");
const MessageService = require("../core/messageService");

const consultar = (sql, params = []) => new Promise((resolve, reject) => db.all(sql, params, (erro, linhas) => erro ? reject(erro) : resolve(linhas || [])));

module.exports = async (msg) => {
    try {
        const jogador = await new Promise((resolve, reject) => db.get("SELECT id, numero, nome FROM jogadores WHERE numero = ?", [msg.author || msg.from], (erro, linha) => erro ? reject(erro) : resolve(linha)));
        if (!jogador) return MessageService.send({ message: msg, text: "[!] Não foi possível encontrar sua ficha." });
        await new Promise((resolve) => db.run("CREATE TABLE IF NOT EXISTS npc_resumos_cena (npc_id TEXT NOT NULL, jogador_id TEXT NOT NULL, resumo TEXT NOT NULL, atualizado_em TEXT NOT NULL, PRIMARY KEY (npc_id, jogador_id))", () => resolve()));

        const historico = await consultar(`
            SELECT tipo, descricao, data FROM atividades_registro WHERE jogador_id = ?
            UNION ALL SELECT 'Compra', item, data FROM compras WHERE jogador_id = ?
            UNION ALL SELECT 'Cena com NPC', resumo, atualizado_em FROM npc_resumos_cena WHERE jogador_id = ?
            UNION ALL SELECT 'Dungeon', premio_tipo || ': ' || premio_valor, data FROM premios_dungeon WHERE jogador_id = ?
            UNION ALL SELECT 'Economia', motivo, data FROM transacoes WHERE jogador_id = ?
            ORDER BY data DESC LIMIT 20
        `, [jogador.id, jogador.id, jogador.numero, jogador.id, jogador.id]);

        const linhas = historico.length ? historico.map((entrada) => `› *${entrada.tipo}*${entrada.data ? ` — ${String(entrada.data).slice(0, 10)}` : ""}\n  ${entrada.descricao || "Sem descrição."}`) : ["› Nenhuma atividade registrada ainda."];
        return MessageService.send({ message: msg, text: ["════════════════════════════════════", `*ATIVIDADES — ${jogador.nome}*`, "════════════════════════════════════", "", ...linhas, "", "_O histórico reúne cenas encerradas, dungeons, compras, movimentações econômicas e atividades registradas._"].join("\n") });
    } catch (erro) {
        console.error("Erro ao consultar atividades:", erro);
        return MessageService.send({ message: msg, text: "[!] Não foi possível consultar suas atividades agora." });
    }
};
