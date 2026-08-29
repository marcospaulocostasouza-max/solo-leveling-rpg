"use strict";

const MessageService = require("../core/messageService");
const db = require("../core/database");
const CrystalRewardService = require("../systems/crystalRewardService");
const crystalRewards = require("../config/crystalRewards");
const SharedDatabase = require("../../../../packages/database");
const obter = (sql, params = []) => new Promise((resolve, reject) => db.get(sql, params, (erro, linha) => erro ? reject(erro) : resolve(linha)));
const executar = (sql, params = []) => new Promise((resolve, reject) => db.run(sql, params, function (erro) { erro ? reject(erro) : resolve(this); }));

async function adicionarItem(jogadorId, nome, descricao, efeito) {
    let item = await obter("SELECT id FROM itens WHERE nome = ?", [nome]);
    if (!item) {
        const resultado = await executar("INSERT INTO itens (nome, categoria, tier, descricao, consumivel, efeito) VALUES (?, 'Itens de Apoio', 'E', ?, 1, ?)", [nome, descricao, efeito]);
        item = { id: resultado.lastID };
    }
    const existente = await obter("SELECT id FROM inventario_jogador WHERE jogador_id = ? AND item_id = ?", [jogadorId, item.id]);
    if (existente) await executar("UPDATE inventario_jogador SET quantidade = quantidade + 1 WHERE id = ?", [existente.id]);
    else await executar("INSERT INTO inventario_jogador (jogador_id, item_id, quantidade, equipado) VALUES (?, ?, 1, 0)", [jogadorId, item.id]);
}

function sortearPonderado(entradas, rng = Math.random) {
    const validas = entradas.filter(item => Number(item.peso) > 0);
    const total = validas.reduce((soma, item) => soma + Number(item.peso), 0);
    let alvo = rng() * total;
    for (const item of validas) {
        alvo -= Number(item.peso);
        if (alvo < 0) return item;
    }
    return validas[validas.length - 1];
}

async function consumirCaixa(executor, caixa) {
    const resultado = caixa.quantidade > 1
        ? await executor("UPDATE inventario_jogador SET quantidade = quantidade - 1 WHERE id = ? AND quantidade = ?", [caixa.id, caixa.quantidade])
        : await executor("DELETE FROM inventario_jogador WHERE id = ? AND quantidade = 1", [caixa.id]);
    if (resultado.changes !== 1) throw new Error("Esta caixa ja foi aberta por outra solicitacao.");
}

async function abrirCaixa(msg) {
    try {
        const jogador = await obter("SELECT id, nome FROM jogadores WHERE numero = ?", [msg.author || msg.from]);
        if (!jogador) return MessageService.send({ message: msg, text: "[!] Não foi possível encontrar sua ficha." });
        const caixa = await obter("SELECT inv.id, inv.quantidade FROM inventario_jogador inv JOIN itens i ON i.id = inv.item_id WHERE inv.jogador_id = ? AND i.nome = 'Caixa de Item' AND inv.quantidade > 0", [jogador.id]);
        if (!caixa) return MessageService.send({ message: msg, text: "[!] Você não possui uma Caixa de Item no inventário." });
        const quantidadeCristais = CrystalRewardService.quantidadeConfigurada(crystalRewards.treinoDiarioCaixa.quantidade);
        const tipo = sortearPonderado([
            { tipo: "won", peso: 1 }, { tipo: "xp", peso: 1 }, { tipo: "item", peso: 1 },
            { tipo: "cristais", peso: quantidadeCristais > 0 ? crystalRewards.treinoDiarioCaixa.peso : 0 }
        ]).tipo;
        let premio;
        if (tipo !== "cristais") await consumirCaixa(executar, caixa);
        if (tipo === "won") {
            await executar("UPDATE jogadores SET won = won + 500 WHERE id = ?", [jogador.id]);
            premio = "500 Yulls";
        } else if (tipo === "xp") {
            await executar("UPDATE jogadores SET experiencia = experiencia + 100 WHERE id = ?", [jogador.id]);
            premio = "100 XP";
        } else if (tipo === "item") {
            await adicionarItem(jogador.id, "Poção do Aspirante", "Poção de cura para caçadores iniciantes.", "vida:10");
            premio = "Poção do Aspirante";
        } else {
            const resultado = await SharedDatabase.transaction(async query => {
                await consumirCaixa(query.run, caixa);
                return CrystalRewardService.conceder({ jogadorId: jogador.id, quantidade: quantidadeCristais,
                    origem: CrystalRewardService.ORIGENS.TREINO_DIARIO_CAIXA,
                    referencia: `caixa:${caixa.id}:unidade:${caixa.quantidade}`,
                    contexto: "Caixa de Item obtida por atividade diária", query });
            });
            premio = `💎 +${resultado.quantidade} Cristais`;
        }
        return MessageService.send({ message: msg, text: `════════════════════════════════════\n*CAIXA DE ITEM ABERTA*\n════════════════════════════════════\n\n› Recompensa: *${premio}*\n› Caixas restantes: ${Math.max(0, caixa.quantidade - 1)}\n\n_Itens recebidos são adicionados ao inventário._` });
    } catch (erro) {
        console.error("Erro ao abrir caixa:", erro);
        return MessageService.send({ message: msg, text: "[!] Não foi possível abrir esta caixa agora." });
    }
}

module.exports = abrirCaixa;
module.exports.sortearPonderado = sortearPonderado;
