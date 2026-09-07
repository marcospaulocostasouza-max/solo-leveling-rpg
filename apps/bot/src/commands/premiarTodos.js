"use strict";

const MessageService = require("../core/messageService");
const adminCore = require("../core/adminCore");
const JogadorCore = require("../core/jogadorCore");
const database = require("../../../../packages/database");

const RECURSOS = Object.freeze({
    xp: { coluna: "experiencia", nome: "XP" },
    experiencia: { coluna: "experiencia", nome: "XP" },
    maestria: { coluna: "maestria", nome: "Maestria" },
    won: { coluna: "won", nome: "Won" },
    yulls: { coluna: "won", nome: "Won" },
    cristais: { coluna: "cristais", nome: "Cristais" },
    cristal: { coluna: "cristais", nome: "Cristais" },
    pontos: { coluna: "pontos_atributo", nome: "Pontos de atributo" },
    "pontos de atributo": { coluna: "pontos_atributo", nome: "Pontos de atributo" }
});

function limpar(texto) {
    return String(texto || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function lerPedido(texto) {
    let restante = String(texto || "").replace(/^\s*!premiar\s+todos\b/i, "").trim();
    const confirmado = /\s+confirmar\s*$/i.test(restante);
    if (confirmado) restante = restante.replace(/\s+confirmar\s*$/i, "").trim();
    const match = restante.match(/^(.+?)\s+(\d+)$/);
    if (!match) return { erro: "Informe o tipo e uma quantidade inteira." };
    const tipo = limpar(match[1]);
    const quantidade = Number(match[2]);
    if (!Number.isSafeInteger(quantidade) || quantidade <= 0 || quantidade > 1000000000) return { erro: "A quantidade deve ser um inteiro entre 1 e 1.000.000.000." };
    const recurso = RECURSOS[tipo];
    if (!recurso) return { erro: "Tipo inválido. Use: xp, maestria, won, cristais ou pontos." };
    return { recurso, quantidade, confirmado };
}

function uso() {
    return ["*═══ PREMIAÇÃO GLOBAL ═══*", "", "*Prévia:* !premiar todos <tipo> <quantidade>", "*Confirmar:* !premiar todos <tipo> <quantidade> confirmar", "", "Tipos: *xp, maestria, won, cristais, pontos*.", "", "_Use a confirmação explícita: a ação alcança todos os jogadores cadastrados._"].join("\n");
}

module.exports = async msg => {
    const numero = msg.author || msg.from;
    if (!await adminCore.isAdmin(numero)) return MessageService.send({ message: msg, text: adminCore.msgAcessoNegado() });
    const pedido = lerPedido(msg.body);
    if (pedido.erro) return MessageService.send({ message: msg, text: ["*═══ PREMIAÇÃO NÃO CRIADA ═══*", pedido.erro, "", uso()].join("\n") });

    await database.ensureCrystalSchema();
    await database.ensurePlayerHistorySchema();
    const jogadores = await database.all("SELECT id, nome FROM jogadores WHERE TRIM(COALESCE(nome, '')) <> '' ORDER BY id");
    if (!jogadores.length) return MessageService.send({ message: msg, text: "*═══ PREMIAÇÃO GLOBAL ═══*\nNenhum jogador cadastrado foi encontrado." });
    if (!pedido.confirmado) {
        const comandoConfirmacao = limpar(msg.body).replace(/^!premiar\s+todos\s+/, "").replace(/\s+confirmar$/, "");
        return MessageService.send({ message: msg, text: ["*═══ CONFIRMAÇÃO DE PREMIAÇÃO ═══*", "", `Premiar: *${jogadores.length} jogadores*`, `Recompensa individual: *+${pedido.quantidade.toLocaleString("pt-BR")} ${pedido.recurso.nome}*`, `Total distribuído: *${(jogadores.length * pedido.quantidade).toLocaleString("pt-BR")} ${pedido.recurso.nome}*`, "", "Para executar, envie:", `*!premiar todos ${comandoConfirmacao} confirmar*`, "", "_Nenhuma ficha foi alterada nesta prévia._"].join("\n") });
    }

    await database.transaction(async query => {
        for (const jogador of jogadores) {
            if (pedido.recurso.coluna === "cristais") await database.adicionarCristaisComQuery(query, jogador.id, pedido.quantidade, "PREMIO_GLOBAL");
            else await query.run(`UPDATE jogadores SET ${pedido.recurso.coluna} = COALESCE(${pedido.recurso.coluna}, 0) + ? WHERE id = ?`, [pedido.quantidade, jogador.id]);
            await database.registrarHistoricoFichaComQuery(query, {
                jogadorId: jogador.id,
                tipo: "Premiação da ADM",
                direcao: "entrada",
                recurso: pedido.recurso.nome,
                quantidade: pedido.quantidade,
                descricao: `Premiação global: +${pedido.quantidade} ${pedido.recurso.nome}.`,
                origem: "ADM_PREMIACAO_GLOBAL",
                referencia: "premiar_todos"
            });
        }
    });
    if (pedido.recurso.coluna === "experiencia") for (const jogador of jogadores) await JogadorCore.verificarEAtualizarNivel(jogador.id);
    const infoAdmin = await adminCore.getAdminLevel(numero);
    adminCore.registrarLog(numero, infoAdmin.nome, "premiacao_global", "TODOS OS JOGADORES", pedido.recurso.nome, 0, jogadores.length * pedido.quantidade);
    return MessageService.send({ message: msg, text: ["*═══ PREMIAÇÃO GLOBAL CONCLUÍDA ═══*", "", `Jogadores premiados: *${jogadores.length}*`, `Recompensa por jogador: *+${pedido.quantidade.toLocaleString("pt-BR")} ${pedido.recurso.nome}*`, `Total distribuído: *${(jogadores.length * pedido.quantidade).toLocaleString("pt-BR")} ${pedido.recurso.nome}*`, "", `_Registrado por: ${infoAdmin.nome}._`].join("\n") });
};

module.exports.lerPedido = lerPedido;
