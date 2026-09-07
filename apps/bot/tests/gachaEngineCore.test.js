"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const database = require("../../../packages/database");
const Banners = require("../src/systems/gachaBannerService");
const Gacha = require("../src/systems/gachaEngine");

test("Nucleo 3 - giros, entrega, garantia e transacao", async t => {
    await database.ensureGachaEngineSchema();
    const sufixo = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const idsBanner = [];
    const idsItem = [];
    let jogadorId;
    async function item(rank) {
        const criado = await database.run("INSERT INTO itens (nome, categoria, tier) VALUES (?, 'Item de Apoio', ?)", [`Gacha ${rank} ${sufixo}`, rank]);
        idsItem.push(Number(criado.lastID)); return Number(criado.lastID);
    }
    async function banner(rankItem, extra = {}) {
        const criado = await Banners.criarBanner({ nome: `Engine ${sufixo} ${idsBanner.length}`, descricao: "Teste isolado", permanente: true });
        idsBanner.push(criado.id);
        for (let ordem = 1; ordem <= 4; ordem++) await Banners.adicionarRecompensa(criado.id, { tipo: "ITEM", referenciaId: rankItem, quantidade: 1, peso: ordem, destaqueOrdem: ordem });
        await Banners.adicionarRecompensa(criado.id, { tipo: "ITEM", referenciaId: rankItem, quantidade: 1, peso: 1, grandePremio: true });
        if (extra.tipo) await Banners.adicionarRecompensa(criado.id, extra);
        await Banners.definirBannerAtivo(criado.id, true);
        return criado;
    }
    try {
        const rankE = await item("E");
        const rankD = await item("D");
        const jogador = await database.run("INSERT INTO jogadores (numero, nome, rank, nivel, cristais, won, maestria) VALUES (?, ?, 'E', 1, 5000, 0, 0)", [`__gacha_${sufixo}`, `Gacha ${sufixo}`]);
        jogadorId = Number(jogador.lastID);
        const principal = await banner(rankE, { tipo: "WON", quantidade: 50, peso: 1 });

        await t.test("custos e quantidades sao fechados", async () => {
            assert.deepEqual(Gacha.CUSTOS, { 1: 100, 10: 1000 });
            await assert.rejects(Gacha.realizarGiros(jogadorId, principal.id, 2), /exatamente 1 ou 10/);
        });
        await t.test("sorteio ponderado aceita RNG deterministico", () => {
            const pool = [{ id: 1, peso: 1 }, { id: 2, peso: 3 }];
            assert.equal(Gacha.sortearRecompensa(pool, () => 0).id, 1);
            assert.equal(Gacha.sortearRecompensa(pool, () => 0.99).id, 2);
        });
        await t.test("giro 10x garante uma peça marcada de conjunto sem perder a garantia de Rank", () => {
            const pool = [
                { id: 1, reward_type: "ITEM", peso: 100, grande_premio: 0, rankRecompensa: "E", garantido_conjunto: 0 },
                { id: 2, reward_type: "ITEM", peso: 0.0001, grande_premio: 0, rankRecompensa: "D", garantido_conjunto: 1 },
                { id: 3, reward_type: "ITEM_ESPECIAL_BANNER", peso: 0.0001, grande_premio: 1, rankRecompensa: "B", garantido_conjunto: 0 }
            ];
            const resultado = Gacha.prepararSorteios(pool, 10, "E", 0, () => 0);
            assert.ok(resultado.some(itemResultado => itemResultado.garantidoRank && itemResultado.rankRecompensa === "E"));
            assert.ok(resultado.some(itemResultado => itemResultado.garantidoConjunto && itemResultado.id === 2));
        });
        await t.test("giro unico debita e entrega no inventario", async () => {
            const resultado = await Gacha.realizarGiros(jogadorId, principal.id, 1, { rng: () => 0 });
            assert.equal(resultado.custo, 100);
            assert.equal(resultado.resultados.length, 1);
            assert.ok(await database.get("SELECT id FROM inventario_jogador WHERE jogador_id = ? AND item_id = ?", [jogadorId, rankE]));
        });
        await t.test("dez giros garantem exatamente o Rank atual", async () => {
            const misto = await banner(rankD, { tipo: "ITEM", referenciaId: rankE, quantidade: 1, peso: 0.0001 });
            const resultado = await Gacha.realizarGiros(jogadorId, misto.id, 10, { rng: () => 0 });
            assert.equal(resultado.resultados.length, 10);
            assert.ok(resultado.resultados.some(itemResultado => itemResultado.garantidoRank && itemResultado.rank === "E"));
        });
        await t.test("garantia funciona para E, D, C, B, A e S", async () => {
            const porRank = { E: rankE, D: rankD };
            for (const rank of ["C", "B", "A", "S"]) porRank[rank] = await item(rank);
            const completo = await Banners.criarBanner({ nome: `Todos ranks ${sufixo}`, descricao: "Teste dos seis ranks", permanente: true });
            idsBanner.push(completo.id);
            const ranks = ["E", "D", "C", "B", "A", "S"];
            for (let i = 0; i < ranks.length; i++) await Banners.adicionarRecompensa(completo.id, {
                tipo: "ITEM", referenciaId: porRank[ranks[i]], peso: i + 1,
                destaqueOrdem: i < 4 ? i + 1 : null, grandePremio: i === 4
            });
            await Banners.definirBannerAtivo(completo.id, true);
            await database.run("UPDATE jogadores SET cristais = 10000 WHERE id = ?", [jogadorId]);
            for (const rank of ranks) {
                await database.run("UPDATE jogadores SET rank = ? WHERE id = ?", [rank, jogadorId]);
                const resultado = await Gacha.realizarGiros(jogadorId, completo.id, 10, { rng: () => 0 });
                assert.ok(resultado.resultados.some(itemResultado => itemResultado.garantidoRank && itemResultado.rank === rank), `garantia ausente para ${rank}`);
            }
            await database.run("UPDATE jogadores SET rank = 'E' WHERE id = ?", [jogadorId]);
        });
        await t.test("sem recompensa do Rank falha antes de cobrar", async () => {
            const semRank = await banner(rankD);
            const antes = await database.consultarCristais(jogadorId);
            await assert.rejects(Gacha.realizarGiros(jogadorId, semRank.id, 10, { rng: () => 0 }), /Rank E/);
            assert.equal(await database.consultarCristais(jogadorId), antes);
        });
        await t.test("saldo insuficiente nao entrega", async () => {
            await database.run("UPDATE jogadores SET cristais = 0 WHERE id = ?", [jogadorId]);
            const antes = await database.get("SELECT quantidade FROM inventario_jogador WHERE jogador_id = ? AND item_id = ?", [jogadorId, rankE]);
            await assert.rejects(Gacha.realizarGiros(jogadorId, principal.id, 1, { rng: () => 0 }), /Cristais insuficientes/);
            const depois = await database.get("SELECT quantidade FROM inventario_jogador WHERE jogador_id = ? AND item_id = ?", [jogadorId, rankE]);
            assert.equal(Number(depois.quantidade), Number(antes.quantidade));
        });
        await t.test("giros concorrentes nao gastam o mesmo saldo", async () => {
            await database.run("UPDATE jogadores SET cristais = 100 WHERE id = ?", [jogadorId]);
            const antes = Number((await database.get("SELECT quantidade FROM inventario_jogador WHERE jogador_id = ? AND item_id = ?", [jogadorId, rankE])).quantidade);
            const historicoAntes = (await database.getHistoricoBanner(jogadorId, principal.id, { limite: 100 })).length;
            const tentativas = await Promise.allSettled([
                Gacha.realizarGiros(jogadorId, principal.id, 1, { rng: () => 0 }),
                Gacha.realizarGiros(jogadorId, principal.id, 1, { rng: () => 0 })
            ]);
            assert.equal(tentativas.filter(itemResultado => itemResultado.status === "fulfilled").length, 1, tentativas.map(itemResultado => itemResultado.status === "rejected" ? itemResultado.reason?.message : "ok").join(" | "));
            assert.equal(await database.consultarCristais(jogadorId), 0);
            assert.equal(await database.consultarPityGacha(jogadorId, principal.id), 0);
            assert.equal((await database.getHistoricoBanner(jogadorId, principal.id, { limite: 100 })).length, historicoAntes + 1);
            const depois = Number((await database.get("SELECT quantidade FROM inventario_jogador WHERE jogador_id = ? AND item_id = ?", [jogadorId, rankE])).quantidade);
            assert.equal(depois, antes + 1);
        });
    } finally {
        if (jogadorId) {
            await database.run("DELETE FROM gacha_resultados WHERE operacao_id IN (SELECT id FROM gacha_operacoes WHERE jogador_id = ?)", [jogadorId]);
            await database.run("DELETE FROM gacha_operacoes WHERE jogador_id = ?", [jogadorId]);
            await database.run("DELETE FROM historico_cristais WHERE jogador_id = ?", [jogadorId]);
            await database.run("DELETE FROM historico_fragmentos_invocacao WHERE jogador_id = ?", [jogadorId]);
            await database.run("DELETE FROM gacha_pity WHERE jogador_id = ?", [jogadorId]);
            await database.run("DELETE FROM gacha_unique_ownership WHERE jogador_id = ?", [jogadorId]);
            await database.run("DELETE FROM inventario_jogador WHERE jogador_id = ?", [jogadorId]);
            await database.run("DELETE FROM jogador_tecnicas WHERE jogador_id = ?", [jogadorId]);
            await database.run("DELETE FROM jogadores WHERE id = ?", [jogadorId]);
        }
        for (const id of idsBanner) await database.run("DELETE FROM gacha_banner_rewards WHERE banner_id = ?", [id]);
        for (const id of idsBanner) await database.run("DELETE FROM gacha_banners WHERE id = ?", [id]);
        for (const id of idsItem) await database.run("DELETE FROM itens WHERE id = ?", [id]);
    }
});
