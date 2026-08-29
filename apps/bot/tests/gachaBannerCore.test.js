const test = require("node:test");
const assert = require("node:assert/strict");
const database = require("../../../packages/database");
const Gacha = require("../src/systems/gachaBannerService");

test("Núcleo 2 — Banners e pools persistentes", async t => {
    await Gacha.garantirEstrutura();
    const sufixo = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const banners = [];
    const conjuntos = [];
    const itens = await database.all("SELECT id FROM itens ORDER BY id LIMIT 2");
    const tecnica = await database.get("SELECT id FROM tecnicas ORDER BY id LIMIT 1");
    assert.ok(itens.length >= 2 && tecnica, "fixtures originais de itens e técnicas são necessárias");
    const jogador = await database.get("SELECT id, cristais FROM jogadores ORDER BY id LIMIT 1");
    const cristaisAntes = jogador ? Number(jogador.cristais || 0) : null;

    async function banner(dados = {}) {
        const criado = await Gacha.criarBanner({ nome: `Banner ${sufixo} ${banners.length}`, descricao: "Fixture isolada", permanente: true, ...dados });
        banners.push(criado.id); return criado;
    }
    async function conjunto() {
        const criado = await Gacha.criarConjunto({ nome: `Conjunto ${sufixo}`, descricao: "Fixture", itens: [{ itemId: itens[0].id, quantidade: 1 }, { itemId: itens[1].id, quantidade: 2 }] });
        conjuntos.push(criado.id); return criado;
    }
    async function preencher(id, grandeTipo = "PASSIVA", grandeReferencia = 1) {
        await Gacha.adicionarRecompensa(id, { tipo: "ITEM", referenciaId: itens[0].id, peso: 10, destaqueOrdem: 1 });
        await Gacha.adicionarRecompensa(id, { tipo: "TECNICA", referenciaId: tecnica.id, peso: 9, destaqueOrdem: 2 });
        await Gacha.adicionarRecompensa(id, { tipo: "TITULO", referenciaId: 1, peso: 8, destaqueOrdem: 3, exclusivoBanner: true });
        await Gacha.adicionarRecompensa(id, { tipo: "PASSIVA", referenciaId: 1, peso: 7, destaqueOrdem: 4, exclusivoBanner: true });
        await Gacha.adicionarRecompensa(id, { tipo: grandeTipo, referenciaId: grandeReferencia, peso: 1, grandePremio: true, raridade: "ESPECIAL" });
    }

    try {
        const principal = await banner();
        await t.test("criação e busca por ID", async () => assert.equal((await Gacha.getBannerPorId(principal.id)).nome, principal.nome));
        const set = await conjunto();
        await t.test("Conjunto de Item referencia múltiplos itens originais", async () => {
            const membros = await Gacha.getItensDoConjunto(set.id);
            assert.equal(membros.length, 2); assert.deepEqual(membros.map(x => Number(x.quantidade)).sort(), [1, 2]);
        });
        await preencher(principal.id);
        await Gacha.adicionarRecompensa(principal.id, { tipo: "XP", quantidade: 5000, peso: 100 });
        await Gacha.adicionarRecompensa(principal.id, { tipo: "WON", quantidade: 100000, peso: 90 });
        await Gacha.adicionarRecompensa(principal.id, { tipo: "MAESTRIA", quantidade: 2, peso: 80 });
        await Gacha.adicionarRecompensa(principal.id, { tipo: "CRISTAIS", quantidade: 100, peso: 20 });
        await Gacha.adicionarRecompensa(principal.id, { tipo: "TOKEN", quantidade: 3, peso: 30 });
        await Gacha.adicionarRecompensa(principal.id, { tipo: "FRAGMENTOS", quantidade: 10, peso: 30 });
        await Gacha.adicionarRecompensa(principal.id, { tipo: "CONJUNTO_ITEM", referenciaId: set.id, peso: 3 });

        await t.test("pool completo aceita tipos relacionais e numéricos", async () => {
            const pool = await Gacha.getPoolDoBanner(principal.id);
            const tipos = new Set(pool.map(x => x.reward_type));
            for (const tipo of ["ITEM", "TECNICA", "PASSIVA", "TITULO", "CONJUNTO_ITEM", "XP", "WON", "MAESTRIA", "CRISTAIS", "TOKEN", "FRAGMENTOS"]) assert.ok(tipos.has(tipo));
            assert.equal(Number(pool.find(x => x.reward_type === "XP").quantidade), 5000);
            assert.equal(Number(pool.find(x => x.reward_type === "WON").quantidade), 100000);
            assert.equal(Number(pool.find(x => x.reward_type === "MAESTRIA").quantidade), 2);
        });
        await t.test("Projeto é oficial, mas referência é recusada sem catálogo original", async () => {
            assert.ok(Gacha.TIPOS_RECOMPENSA.includes("PROJETO"));
            await assert.rejects(Gacha.adicionarRecompensa(principal.id, { tipo: "PROJETO", referenciaId: 1, peso: 1 }), /não possui catálogo estruturado/);
        });
        await t.test("exatamente quatro Destaques e um Grande Prêmio", async () => {
            assert.equal((await Gacha.getDestaquesDoBanner(principal.id)).length, 4);
            assert.equal((await Gacha.getGrandePremioDoBanner(principal.id)).reward_type, "PASSIVA");
            assert.equal((await Gacha.validarBanner(principal.id)).valido, true);
        });
        await t.test("quinto Destaque e segundo Grande Prêmio são impedidos", async () => {
            await assert.rejects(Gacha.adicionarRecompensa(principal.id, { tipo: "XP", quantidade: 1, peso: 1, destaqueOrdem: 4 }));
            await assert.rejects(Gacha.adicionarRecompensa(principal.id, { tipo: "TITULO", referenciaId: 2, peso: 1, grandePremio: true }));
        });
        await t.test("Grande Prêmio pode possuir outro tipo", async () => {
            const outro = await banner(); await preencher(outro.id, "TITULO", 2);
            assert.equal((await Gacha.getGrandePremioDoBanner(outro.id)).reward_type, "TITULO");
        });
        await Gacha.definirBannerAtivo(principal.id, true);
        await t.test("permanente ativo fica disponível e inativo não", async () => {
            assert.ok((await Gacha.getBannersDisponiveis()).some(x => x.id === principal.id));
            await Gacha.definirBannerAtivo(principal.id, false);
            assert.ok(!(await Gacha.getBannersDisponiveis()).some(x => x.id === principal.id));
        });

        const agora = new Date();
        async function temporario(inicio, fim) { const b = await banner({ permanente: false, inicioEm: inicio, fimEm: fim }); await preencher(b.id); await Gacha.definirBannerAtivo(b.id, true); return b; }
        const vigente = await temporario(new Date(agora - 60000), new Date(agora.getTime() + 60000));
        const expirado = await temporario(new Date(agora - 120000), new Date(agora - 60000));
        const futuro = await temporario(new Date(agora.getTime() + 60000), new Date(agora.getTime() + 120000));
        await t.test("temporário vigente disponível; expirado e futuro indisponíveis", async () => {
            const ids = new Set((await Gacha.getBannersDisponiveis(agora)).map(x => x.id));
            assert.equal(ids.has(vigente.id), true); assert.equal(ids.has(expirado.id), false); assert.equal(ids.has(futuro.id), false);
        });
        await t.test("persistência e migração repetida não perdem Banner nem Cristais", async () => {
            await Gacha.garantirEstrutura(); await Gacha.garantirEstrutura();
            assert.equal((await Gacha.getBannerPorId(principal.id)).nome, principal.nome);
            if (jogador) assert.equal(await database.consultarCristais(jogador.id), cristaisAntes);
        });
    } finally {
        for (const id of banners) await database.run("DELETE FROM gacha_banner_rewards WHERE banner_id = ?", [id]);
        for (const id of banners) await database.run("DELETE FROM gacha_banners WHERE id = ?", [id]);
        for (const id of conjuntos) await database.run("DELETE FROM gacha_item_set_entries WHERE conjunto_id = ?", [id]);
        for (const id of conjuntos) await database.run("DELETE FROM gacha_item_sets WHERE id = ?", [id]);
    }
});
