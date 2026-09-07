const db = require("../core/database");
const MessageService = require("../core/messageService");
const playerDatabase = require("../../../../packages/database");

const consultar = (sql, params = []) => new Promise((resolve, reject) => db.all(sql, params, (erro, linhas) => erro ? reject(erro) : resolve(linhas || [])));
const consultarSeguro = async (sql, params) => {
    try { return await consultar(sql, params); }
    catch (erro) { console.error("[HISTÓRICO] Fonte indisponível:", erro.message); return []; }
};
const dataOrdenavel = valor => Number.isFinite(Date.parse(valor)) ? Date.parse(valor) : 0;
function dataVisivel(valor) {
    if (!valor) return "data não informada";
    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? String(valor).slice(0, 16) : data.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

module.exports = async (msg) => {
    try {
        const jogador = await new Promise((resolve, reject) => db.get("SELECT id, numero, nome FROM jogadores WHERE numero = ?", [msg.author || msg.from], (erro, linha) => erro ? reject(erro) : resolve(linha)));
        if (!jogador) return MessageService.send({ message: msg, text: "[!] Não foi possível encontrar sua ficha." });

        await Promise.all([playerDatabase.ensurePlayerHistorySchema(), playerDatabase.ensureGachaEngineSchema()]);
        await new Promise(resolve => db.run("CREATE TABLE IF NOT EXISTS npc_resumos_cena (npc_id TEXT NOT NULL, jogador_id TEXT NOT NULL, resumo TEXT NOT NULL, atualizado_em TEXT NOT NULL, PRIMARY KEY (npc_id, jogador_id))", () => resolve()));
        const fontes = await Promise.all([
            consultarSeguro("SELECT tipo, descricao, data, origem FROM historico_ficha WHERE jogador_id = ?", [jogador.id]),
            consultarSeguro("SELECT tipo, descricao, data, 'ATIVIDADE APROVADA' AS origem FROM atividades_registro WHERE jogador_id = ?", [jogador.id]),
            consultarSeguro("SELECT 'Compra' AS tipo, 'Item comprado: ' || item || ' por ' || preco || ' Won.' AS descricao, data, 'LOJA' AS origem FROM compras WHERE jogador_id = ?", [jogador.id]),
            consultarSeguro("SELECT 'Dungeon' AS tipo, 'Prêmio escolhido: ' || premio_tipo || ' — ' || premio_valor || '.' AS descricao, data, 'DUNGEON' AS origem FROM premios_dungeon WHERE jogador_id = ?", [jogador.id]),
            consultarSeguro("SELECT 'Won' AS tipo, tipo || ': ' || valor || ' Won. ' || COALESCE(motivo, '') AS descricao, data, 'ECONOMIA' AS origem FROM transacoes WHERE jogador_id = ?", [jogador.id]),
            consultarSeguro("SELECT 'XP' AS tipo, '+' || quantidade || ' XP. ' || COALESCE(motivo, '') AS descricao, data, 'PROGRESSO' AS origem FROM experiencia_historico WHERE jogador_id = ?", [jogador.id]),
            consultarSeguro("SELECT 'Maestria' AS tipo, '-' || valor || ' Maestria. ' || COALESCE(descricao, '') AS descricao, data, 'TÉCNICA' AS origem FROM historico_maestria WHERE jogador_id = ?", [jogador.id]),
            consultarSeguro("SELECT 'Cristais' AS tipo, CASE WHEN tipo = 'entrada' THEN '+' ELSE '-' END || quantidade || ' Cristais. ' || COALESCE(contexto, origem, '') AS descricao, criado_em AS data, origem FROM historico_cristais WHERE jogador_id = ?", [jogador.id]),
            consultarSeguro("SELECT 'Fragmentos' AS tipo, CASE WHEN tipo = 'entrada' THEN '+' ELSE '-' END || quantidade || ' Fragmentos de Invocação.' AS descricao, criado_em AS data, origem FROM historico_fragmentos_invocacao WHERE jogador_id = ?", [jogador.id]),
            consultarSeguro("SELECT 'Gacha' AS tipo, 'Recebido em ' || COALESCE(o.banner_nome, 'Banner') || ': ' || r.nome || ' x' || r.quantidade || '.' AS descricao, o.criado_em AS data, 'GACHA' AS origem FROM gacha_resultados r JOIN gacha_operacoes o ON o.id = r.operacao_id WHERE o.jogador_id = ?", [jogador.id]),
            consultarSeguro("SELECT 'Cena com NPC' AS tipo, resumo AS descricao, atualizado_em AS data, 'NARRATIVA' AS origem FROM npc_resumos_cena WHERE jogador_id = ?", [String(jogador.id)]),
            consultarSeguro("SELECT 'Ação da ADM' AS tipo, COALESCE(detalhes, acao) AS descricao, data, 'ADM: ' || COALESCE(admin_nome, 'Administração') AS origem FROM admin_logs WHERE alvo = ?", [jogador.nome])
        ]);
        const historico = fontes.flat().filter(entrada => entrada && entrada.descricao).sort((a, b) => dataOrdenavel(b.data) - dataOrdenavel(a.data)).slice(0, 100);
        const linhas = historico.length
            ? historico.map(entrada => `› *${entrada.tipo}* — ${dataVisivel(entrada.data)}\n  ${entrada.descricao}\n  _Origem: ${entrada.origem || "SISTEMA"}_`)
            : ["› Nenhuma movimentação registrada ainda."];
        return MessageService.send({ message: msg, text: ["═══ HISTÓRICO DA FICHA ═══", `*${jogador.nome}*`, "", ...linhas, "", "_Exibe entradas e saídas da ficha: ADM, Dungeon, Gacha, Loja, XP, Won, Cristais, itens e atividades._"].join("\n") });
    } catch (erro) {
        console.error("Erro ao consultar histórico:", erro);
        return MessageService.send({ message: msg, text: "[!] Não foi possível consultar o histórico agora. Tente novamente em alguns instantes." });
    }
};
