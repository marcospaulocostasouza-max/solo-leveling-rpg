"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const database = require("../../../packages/database");
const Banners = require("../src/systems/gachaBannerService");
const Gacha = require("../src/systems/gachaEngine");

test("Nucleo 4 - pity, duplicatas, fragmentos e historico", async t => {
    await database.ensureGachaEngineSchema();
    const sufixo = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const bannerIds = []; const itemIds = []; let jogadorId; let outroJogadorId;
    const tecnica = await database.get("SELECT id FROM tecnicas ORDER BY id LIMIT 1");
    assert.ok(tecnica);

    async function novoItem(rank, nome) {
        const linha = await database.run("INSERT INTO itens (nome, categoria, tier) VALUES (?, 'Material', ?)", [`${nome} ${sufixo}`, rank]);
        itemIds.push(Number(linha.lastID)); return Number(linha.lastID);
    }
    async function novoBanner(nome, recompensas, periodo = {}) {
        const banner = await Banners.criarBanner({ nome: `${nome} ${sufixo}`, descricao: "Fixture Nucleo 4", permanente: periodo.permanente !== false, inicioEm: periodo.inicioEm, fimEm: periodo.fimEm });
        bannerIds.push(Number(banner.id));
        for (const recompensa of recompensas) await Banners.adicionarRecompensa(banner.id, recompensa);
        await Banners.definirBannerAtivo(banner.id, true);
        return banner;
    }
    async function rngDaRecompensa(bannerId, predicado) {
        const pool = await Banners.getPoolDoBanner(bannerId);
        const total = pool.reduce((soma, item) => soma + Number(item.peso), 0);
        let anterior = 0;
        for (const item of pool) {
            const atual = anterior + Number(item.peso);
            if (predicado(item)) return () => (anterior + (atual - anterior) / 2) / total;
            anterior = atual;
        }
        throw new Error("Recompensa de teste nao encontrada.");
    }
    async function definirPity(bannerId, contador) {
        await database.run("INSERT INTO gacha_pity (jogador_id, banner_id, contador) VALUES (?, ?, ?) ON CONFLICT(jogador_id, banner_id) DO UPDATE SET contador = excluded.contador", [jogadorId, bannerId, contador]);
    }

    try {
        const itemE = await novoItem("E", "Comum E");
        const gpD = await novoItem("D", "Grande Premio D");
        const jogador = await database.run("INSERT INTO jogadores (numero, nome, rank, nivel, cristais, won, maestria, titulo, passivas_ativas) VALUES (?, ?, 'E', 1, 50000, 0, 0, 'Nenhum', '[]')", [`__stage4_${sufixo}`, `Stage4 ${sufixo}`]);
        jogadorId = Number(jogador.lastID);
        const outro = await database.run("INSERT INTO jogadores (numero, nome, rank, nivel, cristais) VALUES (?, ?, 'E', 1, 1000)", [`__stage4_b_${sufixo}`, `Stage4 B ${sufixo}`]);
        outroJogadorId = Number(outro.lastID);

        const principal = await novoBanner("Pity", [
            { tipo: "ITEM", referenciaId: itemE, peso: 10, destaqueOrdem: 1 },
            { tipo: "ITEM", referenciaId: itemE, peso: 10, destaqueOrdem: 2 },
            { tipo: "ITEM", referenciaId: itemE, peso: 10, destaqueOrdem: 3 },
            { tipo: "ITEM", referenciaId: itemE, peso: 10, destaqueOrdem: 4 },
            { tipo: "ITEM", referenciaId: gpD, peso: 1, grandePremio: true, unica: true, duplicateFragmentValue: 37 },
            { tipo: "WON", quantidade: 5, peso: 30 }
        ]);
        const rngComum = await rngDaRecompensa(principal.id, item => item.reward_type === "WON");
        const rngGp = await rngDaRecompensa(principal.id, item => Number(item.grande_premio) === 1);

        await t.test("novo jogador inicia em zero e pity e isolado por banner", async () => {
            assert.equal(await database.consultarPityGacha(jogadorId, principal.id), 0);
            const segundo = await novoBanner("Segundo", [
                { tipo: "ITEM", referenciaId: itemE, peso: 1, destaqueOrdem: 1 }, { tipo: "ITEM", referenciaId: itemE, peso: 1, destaqueOrdem: 2 },
                { tipo: "ITEM", referenciaId: itemE, peso: 1, destaqueOrdem: 3 }, { tipo: "ITEM", referenciaId: itemE, peso: 1, destaqueOrdem: 4 },
                { tipo: "ITEM", referenciaId: gpD, peso: 1, grandePremio: true }
            ]);
            await definirPity(principal.id, 43);
            assert.equal(await database.consultarPityGacha(jogadorId, principal.id), 43);
            assert.equal(await database.consultarPityGacha(jogadorId, segundo.id), 0);
            await definirPity(principal.id, 0);
        });
        await t.test("giros sem GP incrementam individualmente e GP natural reseta", async () => {
            assert.equal((await Gacha.realizarGiros(jogadorId, principal.id, 1, { rng: rngComum })).pityDepois, 1);
            assert.equal((await Gacha.realizarGiros(jogadorId, principal.id, 1, { rng: rngComum })).pityDepois, 2);
            const natural = await Gacha.realizarGiros(jogadorId, principal.id, 1, { rng: rngGp });
            assert.equal(natural.pityDepois, 0); assert.equal(natural.resultados[0].pityForcado, false);
        });
        await t.test("pity 99 forca GP, reseta e duplicata do GP tambem conta", async () => {
            await definirPity(principal.id, 99);
            const forçado = await Gacha.realizarGiros(jogadorId, principal.id, 1, { rng: rngComum });
            assert.equal(forçado.resultados[0].grandePremio, true); assert.equal(forçado.resultados[0].pityForcado, true);
            assert.equal(forçado.resultados[0].duplicata, true); assert.equal(forçado.resultados[0].fragmentosInvocacaoRecebidos, 37);
            assert.equal(forçado.pityDepois, 0);
        });
        await t.test("pacote iniciado em 94 entrega GP no sexto pull e termina em 4", async () => {
            await definirPity(principal.id, 94);
            const resultado = await Gacha.realizarGiros(jogadorId, principal.id, 10, { rng: rngComum });
            assert.equal(resultado.resultados[5].pityForcado, true);
            assert.equal(resultado.resultados[5].grandePremio, true);
            assert.equal(resultado.pityDepois, 4);
            assert.ok(resultado.resultados.some(item => item.garantidoRank && item.rank === "E"));
        });
        await t.test("reinicializacao e expiracao nao apagam pity nem historico", async () => {
            await definirPity(principal.id, 27);
            const totalAntes = (await database.getHistoricoBanner(jogadorId, principal.id, { limite: 100 })).length;
            await database.ensureGachaEngineSchema(); await database.ensureGachaEngineSchema();
            assert.equal(await database.consultarPityGacha(jogadorId, principal.id), 27);
            await database.run("UPDATE gacha_banners SET permanente = 0, inicio_em = ?, fim_em = ? WHERE id = ?", [new Date(Date.now() - 120000).toISOString(), new Date(Date.now() - 60000).toISOString(), principal.id]);
            assert.equal(await database.consultarPityGacha(jogadorId, principal.id), 27);
            assert.equal((await database.getHistoricoBanner(jogadorId, principal.id, { limite: 100 })).length, totalAntes);
            await database.run("UPDATE gacha_banners SET permanente = 1 WHERE id = ?", [principal.id]);
        });
        await t.test("Fragmentos persistem, possuem auditoria e nunca ficam negativos", async () => {
            const antes = await database.consultarFragmentosInvocacao(jogadorId);
            assert.ok(antes >= 37);
            assert.equal((await database.adicionarFragmentosInvocacao(jogadorId, 5, "TESTE")).saldo, antes + 5);
            const recusada = await database.removerFragmentosInvocacao(jogadorId, antes + 6, "TESTE");
            assert.equal(recusada.sucesso, false); assert.equal(await database.consultarFragmentosInvocacao(jogadorId), antes + 5);
        });

        const unicos = await novoBanner("Unicos", [
            { tipo: "TITULO", referenciaId: 1, peso: 10, destaqueOrdem: 1, unica: true, duplicateFragmentValue: 11 },
            { tipo: "PASSIVA", referenciaId: 1, peso: 10, destaqueOrdem: 2, unica: true, duplicateFragmentValue: 12 },
            { tipo: "TECNICA", referenciaId: tecnica.id, peso: 10, destaqueOrdem: 3, unica: true, duplicateFragmentValue: 13 },
            { tipo: "ITEM", referenciaId: itemE, peso: 10, destaqueOrdem: 4 },
            { tipo: "ITEM", referenciaId: gpD, peso: 1, grandePremio: true, unica: true, duplicateFragmentValue: 37 },
            { tipo: "WON", quantidade: 7, peso: 10 }, { tipo: "XP", quantidade: 1, peso: 10 },
            { tipo: "CRISTAIS", quantidade: 3, peso: 10 }, { tipo: "ITEM", referenciaId: itemE, quantidade: 2, peso: 10 }
        ]);
        async function duasVezes(predicado, fragmentos) {
            const rng = await rngDaRecompensa(unicos.id, predicado);
            const primeira = await Gacha.realizarGiros(jogadorId, unicos.id, 1, { rng });
            const segunda = await Gacha.realizarGiros(jogadorId, unicos.id, 1, { rng });
            assert.equal(primeira.resultados[0].duplicata, false);
            assert.equal(segunda.resultados[0].duplicata, true);
            assert.equal(segunda.resultados[0].fragmentosInvocacaoRecebidos, fragmentos);
        }
        await t.test("Titulo, Passiva e Tecnica unicos convertem sem reroll", async () => {
            await duasVezes(item => item.reward_type === "TITULO", 11);
            await duasVezes(item => item.reward_type === "PASSIVA", 12);
            await duasVezes(item => item.reward_type === "TECNICA", 13);
        });
        await t.test("recompensas acumulaveis nao sao convertidas", async () => {
            for (const tipo of ["WON", "XP", "CRISTAIS"]) {
                const rng = await rngDaRecompensa(unicos.id, item => item.reward_type === tipo);
                const resultado = await Gacha.realizarGiros(jogadorId, unicos.id, 1, { rng });
                assert.equal(resultado.resultados[0].duplicata, false);
            }
            const rngItem = await rngDaRecompensa(unicos.id, item => item.reward_type === "ITEM" && item.grande_premio === 0 && item.destaque_ordem == null);
            const antes = Number((await database.get("SELECT quantidade FROM inventario_jogador WHERE jogador_id = ? AND item_id = ?", [jogadorId, itemE]))?.quantidade || 0);
            await Gacha.realizarGiros(jogadorId, unicos.id, 1, { rng: rngItem });
            const depois = Number((await database.get("SELECT quantidade FROM inventario_jogador WHERE jogador_id = ? AND item_id = ?", [jogadorId, itemE])).quantidade);
            assert.equal(depois, antes + 2);
        });
        await t.test("recompensa unica sem conversao invalida o Banner", async () => {
            const invalido = await Banners.criarBanner({ nome: `Invalido ${sufixo}`, descricao: "sem conversao", permanente: true }); bannerIds.push(invalido.id);
            for (let i = 1; i <= 4; i++) await Banners.adicionarRecompensa(invalido.id, { tipo: "ITEM", referenciaId: itemE, peso: 1, destaqueOrdem: i });
            await Banners.adicionarRecompensa(invalido.id, { tipo: "ITEM", referenciaId: gpD, peso: 1, grandePremio: true, unica: true });
            assert.equal((await Banners.validarBanner(invalido.id)).valido, false);
            await assert.rejects(Banners.definirBannerAtivo(invalido.id, true), /duplicata/i);
        });
        await t.test("historico completo e limitado permanece isolado", async () => {
            const dez = await database.getHistoricoBanner(jogadorId, principal.id, { limite: 10 });
            assert.equal(dez.length, 10);
            assert.ok(dez.some(item => Number(item.pity_forcado) === 1));
            assert.ok(dez.every(item => item.pity_antes != null && item.pity_depois != null && Number(item.custo_associado) === 100));
            assert.equal((await database.getUltimosGiros(jogadorId, 3)).length, 3);
            assert.equal((await database.getUltimosGiros(outroJogadorId, 10)).length, 0);
        });
        await t.test("falha de entrega reverte Cristais, Pity, Fragmentos e historico", async () => {
            const falha = await novoBanner("Falha", [
                { tipo: "ITEM", referenciaId: itemE, peso: 1, destaqueOrdem: 1 }, { tipo: "ITEM", referenciaId: itemE, peso: 1, destaqueOrdem: 2 },
                { tipo: "ITEM", referenciaId: itemE, peso: 1, destaqueOrdem: 3 }, { tipo: "ITEM", referenciaId: itemE, peso: 1, destaqueOrdem: 4 },
                { tipo: "ITEM", referenciaId: gpD, peso: 1, grandePremio: true }, { tipo: "PASSIVA", referenciaId: 2, quantidade: 11, peso: 10 }
            ]);
            const rngFalha = await rngDaRecompensa(falha.id, item => item.reward_type === "PASSIVA");
            const saldo = await database.consultarCristais(jogadorId); const frag = await database.consultarFragmentosInvocacao(jogadorId);
            await assert.rejects(Gacha.realizarGiros(jogadorId, falha.id, 1, { rng: rngFalha }), /Limite de 10/);
            assert.equal(await database.consultarCristais(jogadorId), saldo);
            assert.equal(await database.consultarPityGacha(jogadorId, falha.id), 0);
            assert.equal(await database.consultarFragmentosInvocacao(jogadorId), frag);
            assert.equal((await database.getHistoricoBanner(jogadorId, falha.id)).length, 0);
        });
    } finally {
        for (const id of [jogadorId, outroJogadorId].filter(Boolean)) {
            await database.run("DELETE FROM gacha_resultados WHERE operacao_id IN (SELECT id FROM gacha_operacoes WHERE jogador_id = ?)", [id]);
            await database.run("DELETE FROM gacha_operacoes WHERE jogador_id = ?", [id]);
            await database.run("DELETE FROM historico_cristais WHERE jogador_id = ?", [id]);
            await database.run("DELETE FROM historico_fragmentos_invocacao WHERE jogador_id = ?", [id]);
            await database.run("DELETE FROM gacha_pity WHERE jogador_id = ?", [id]);
            await database.run("DELETE FROM gacha_unique_ownership WHERE jogador_id = ?", [id]);
            await database.run("DELETE FROM inventario_jogador WHERE jogador_id = ?", [id]);
            await database.run("DELETE FROM jogador_tecnicas WHERE jogador_id = ?", [id]);
            await database.run("DELETE FROM jogadores WHERE id = ?", [id]);
        }
        for (const id of bannerIds) await database.run("DELETE FROM gacha_banner_rewards WHERE banner_id = ?", [id]);
        for (const id of bannerIds) await database.run("DELETE FROM gacha_banners WHERE id = ?", [id]);
        for (const id of itemIds) await database.run("DELETE FROM itens WHERE id = ?", [id]);
    }
});
