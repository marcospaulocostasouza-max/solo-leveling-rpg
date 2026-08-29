"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const database = require("../../../packages/database");
const Admin = require("../src/systems/gachaAdminService");
const Banners = require("../src/systems/gachaBannerService");
const Gacha = require("../src/systems/gachaEngine");

test("Nucleo 6 - administracao de Banners", async t => {
    await database.ensureGachaEngineSchema();
    const suffix = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const adminNumero = `__gadm_${suffix}`; const comumNumero = `__common_${suffix}`;
    const banners = []; const itens = []; let jogadorId;
    await database.run("INSERT INTO administradores (numero,nome,nivel,permissao) VALUES (?,? ,1,'admin')", [adminNumero, `Admin ${suffix}`]);
    async function item(rank) { const row = await database.run("INSERT INTO itens (nome,categoria,tier) VALUES (?, 'Material', ?)", [`Admin Item ${rank} ${suffix}`, rank]); itens.push(Number(row.lastID)); return Number(row.lastID); }
    try {
        await t.test("jogador comum nao cria, edita nem ativa; ADM cria rascunho", async () => {
            await assert.rejects(() => Admin.createBanner(comumNumero, { nome: "X", descricao: "X", permanente: true }), /administradores/);
            await assert.rejects(() => Admin.updateBanner(comumNumero, 1, { descricao: "X" }), /administradores/);
            await assert.rejects(() => Admin.activateBanner(comumNumero, 1), /administradores/);
            const view = await Admin.createBanner(adminNumero, { nome: `Banner ${suffix}`, descricao: "Rascunho", permanente: true });
            banners.push(Number(view.banner.id)); assert.equal(view.banner.status, "DRAFT"); assert.equal(Number(view.banner.ativo), 0);
        });
        const bannerId = banners[0];

        await t.test("edita identidade sem trocar ID e valida datas", async () => {
            const editado = await Admin.updateBanner(adminNumero, bannerId, { nome: `Renomeado ${suffix}`, descricao: "Descrição nova", imagem: "https://example.test/banner.png" });
            assert.equal(Number(editado.banner.id), bannerId); assert.equal(editado.banner.descricao, "Descrição nova");
            await assert.rejects(() => Admin.updateBanner(adminNumero, bannerId, { permanente: false, inicioEm: "2030-02-02", fimEm: "2030-01-01" }), /posterior/);
            const temporario = await Admin.updateBanner(adminNumero, bannerId, { permanente: false, inicioEm: "2020-01-01", fimEm: "2035-01-01" });
            assert.equal(Number(temporario.banner.permanente), 0);
            await Admin.updateBanner(adminNumero, bannerId, { permanente: true });
        });

        const rankItems = {};
        for (const rank of ["E", "D", "C", "B", "A", "S"]) rankItems[rank] = await item(rank);
        const rewards = [];
        await t.test("pool valida referência, peso e duplicidade", async () => {
            await assert.rejects(() => Admin.addReward(adminNumero, bannerId, { tipo: "ITEM", referenciaId: 999999999, quantidade: 1, peso: 1 }), /existe/);
            await assert.rejects(() => Admin.addReward(adminNumero, bannerId, { tipo: "ITEM", referenciaId: rankItems.E, quantidade: 1, peso: -1 }), /Peso/);
            for (const rank of ["E", "D", "C", "B", "A", "S"]) rewards.push(await Admin.addReward(adminNumero, bannerId, { tipo: "ITEM", referenciaId: rankItems[rank], quantidade: 1, peso: 10 }));
            await assert.rejects(() => Admin.addReward(adminNumero, bannerId, { tipo: "ITEM", referenciaId: rankItems.E, quantidade: 1, peso: 20 }), /ja pertence/);
            await Admin.updateReward(adminNumero, bannerId, rewards[0].id, { peso: 25 });
            assert.equal(Number((await Banners.getPoolDoBanner(bannerId)).find(x => Number(x.id) === Number(rewards[0].id)).peso), 25);
        });

        await t.test("Destaques exigem quatro entradas do pool", async () => {
            await assert.rejects(() => Admin.setFeaturedRewards(adminNumero, bannerId, rewards.slice(0, 3).map(x => x.id)), /exatamente 4/);
            await assert.rejects(() => Admin.setFeaturedRewards(adminNumero, bannerId, [rewards[0].id, rewards[1].id, rewards[2].id, 999999]), /pool/);
            const set = await Admin.setFeaturedRewards(adminNumero, bannerId, rewards.slice(0, 4).map(x => x.id));
            assert.deepEqual(set.map(x => Number(x.destaque_ordem)), [1, 2, 3, 4]);
            await assert.rejects(() => Admin.setFeaturedRewards(adminNumero, bannerId, [...rewards.slice(0, 4).map(x => x.id), rewards[4].id]), /exatamente 4/);
        });

        await t.test("Grande Premio pertence ao pool e aceita tipos oficiais", async () => {
            await assert.rejects(() => Admin.setGrandPrize(adminNumero, bannerId, 999999), /pool/);
            const passiva = await Admin.addReward(adminNumero, bannerId, { tipo: "PASSIVA", referenciaId: 1, quantidade: 1, peso: 1, unica: true, duplicateFragmentValue: 9 });
            const titulo = await Admin.addReward(adminNumero, bannerId, { tipo: "TITULO", referenciaId: 1, quantidade: 1, peso: 1, unica: true, duplicateFragmentValue: 10 });
            assert.equal((await Admin.setGrandPrize(adminNumero, bannerId, passiva.id)).reward_type, "PASSIVA");
            assert.equal((await Admin.setGrandPrize(adminNumero, bannerId, titulo.id)).reward_type, "TITULO");
            assert.equal((await Admin.setGrandPrize(adminNumero, bannerId, rewards[4].id)).reward_type, "ITEM");
        });

        await t.test("validateBanner bloqueia incompleto e ativa configuração E-S válida", async () => {
            const vazio = await Admin.createBanner(adminNumero, { nome: `Vazio ${suffix}`, descricao: "Vazio", permanente: true }); banners.push(Number(vazio.banner.id));
            assert.equal((await Admin.validateBanner(adminNumero, vazio.banner.id)).valid, false);
            await assert.rejects(() => Admin.activateBanner(adminNumero, vazio.banner.id), /Pool vazio/);
            const validacao = await Admin.validateBanner(adminNumero, bannerId);
            assert.equal(validacao.valid, true, validacao.errors.join(" | "));
            const ativo = await Admin.activateBanner(adminNumero, bannerId); assert.equal(ativo.status, "ACTIVE");
            assert.ok((await Banners.getBannersDisponiveis()).some(x => Number(x.id) === bannerId));
        });

        await t.test("Banner ativo bloqueia alterações sensíveis e permite visuais", async () => {
            await assert.rejects(() => Admin.updateReward(adminNumero, bannerId, rewards[0].id, { peso: 2 }), /Desative/);
            await assert.rejects(() => Admin.setGrandPrize(adminNumero, bannerId, rewards[5].id), /Desative/);
            const visual = await Admin.updateBanner(adminNumero, bannerId, { descricao: "Visual ativo" });
            assert.equal(visual.banner.descricao, "Visual ativo");
        });

        await t.test("desativar, reativar e arquivar preservam pity e histórico", async () => {
            const jogador = await database.run("INSERT INTO jogadores (numero,nome,rank,nivel,cristais) VALUES (?,?,'E',1,1000)", [`__gadm_player_${suffix}`, `Player ${suffix}`]); jogadorId = Number(jogador.lastID);
            await database.run("INSERT INTO gacha_pity (jogador_id,banner_id,contador) VALUES (?,?,42)", [jogadorId, bannerId]);
            await Admin.deactivateBanner(adminNumero, bannerId); assert.equal(await database.consultarPityGacha(jogadorId, bannerId), 42);
            assert.ok(!(await Banners.getBannersDisponiveis()).some(x => Number(x.id) === bannerId));
            await Admin.activateBanner(adminNumero, bannerId); assert.equal(await database.consultarPityGacha(jogadorId, bannerId), 42);
            await database.run("INSERT INTO gacha_operacoes (jogador_id,banner_id,quantidade_giros,custo_cristais,saldo_anterior,saldo_atual) VALUES (?,?,1,100,1000,900)", [jogadorId, bannerId]);
            await Admin.archiveBanner(adminNumero, bannerId);
            assert.equal(await database.consultarPityGacha(jogadorId, bannerId), 42);
            assert.equal(Number((await database.get("SELECT COUNT(*) total FROM gacha_operacoes WHERE banner_id=?", [bannerId])).total), 1);
            await assert.rejects(() => Admin.deleteUnusedBanner(adminNumero, bannerId), /historico|arquivado/i);
        });

        await t.test("consulta identifica itens de conjunto e os 150 conjuntos", async () => {
            const conjuntos = await Admin.buscarConjuntos(adminNumero, { termo: "" });
            assert.ok(conjuntos.length > 0); assert.ok(conjuntos[0].itens.length >= 2);
            const peca = conjuntos[0].itens[0]; const encontrados = await Admin.buscarRecompensas(adminNumero, { termo: peca.nome });
            assert.ok(encontrados.some(item => Number(item.id) === Number(peca.id) && item.conjunto_nome));
            const antes = Number((await database.get("SELECT COUNT(*) total FROM itens")).total);
            const extra = await Admin.createBanner(adminNumero, { nome: `Set ${suffix}`, descricao: "Set", permanente: true }); banners.push(Number(extra.banner.id));
            await Admin.addReward(adminNumero, extra.banner.id, { tipo: "ITEM", referenciaId: peca.id, quantidade: 1, peso: 1 });
            assert.equal(Number((await database.get("SELECT COUNT(*) total FROM itens")).total), antes);
        });

        await t.test("auditoria registra operações e regressões permanecem", async () => {
            const logs = await database.all("SELECT acao FROM gacha_admin_audit WHERE administrador=?", [adminNumero]);
            for (const acao of ["CREATE_BANNER", "UPDATE_BANNER", "ADD_REWARD", "UPDATE_WEIGHT", "SET_FEATURED", "SET_GRAND_PRIZE", "ACTIVATE_BANNER", "DEACTIVATE_BANNER", "ARCHIVE_BANNER"]) assert.ok(logs.some(x => x.acao === acao), acao);
            assert.equal(Gacha.CUSTOS[1], 100); assert.equal(Gacha.CUSTOS[10], 1000);
        });
    } finally {
        if (jogadorId) {
            await database.run("DELETE FROM gacha_resultados WHERE operacao_id IN (SELECT id FROM gacha_operacoes WHERE jogador_id=?)", [jogadorId]);
            await database.run("DELETE FROM gacha_operacoes WHERE jogador_id=?", [jogadorId]);
            await database.run("DELETE FROM gacha_pity WHERE jogador_id=?", [jogadorId]);
            await database.run("DELETE FROM jogadores WHERE id=?", [jogadorId]);
        }
        await database.run("DELETE FROM gacha_admin_audit WHERE administrador=?", [adminNumero]);
        for (const bannerId of banners) await database.run("DELETE FROM gacha_banner_rewards WHERE banner_id=?", [bannerId]);
        for (const bannerId of banners) await database.run("DELETE FROM gacha_banners WHERE id=?", [bannerId]);
        for (const itemId of itens) await database.run("DELETE FROM itens WHERE id=?", [itemId]);
        await database.run("DELETE FROM administradores WHERE numero=?", [adminNumero]);
    }
});
