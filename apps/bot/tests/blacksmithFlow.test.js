const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ForjaSystem = require("../src/systems/forjaSystem");
const NPCManager = require("../src/npc/npcManager");

test("Bilac e Vysache possuem responsabilidades de rank separadas", async () => {
    const receitaA = { rank: "A", custo: 1000, materiais_necessarios: { Mithril: 1 } };
    const receitaB = { rank: "B", custo: 500, materiais_necessarios: { Ferro: 1 } };

    const bilac = await ForjaSystem.executarForja(1, receitaA, {}, "Bilac");
    const vysache = await ForjaSystem.executarForja(1, receitaB, {}, "Vysache");

    assert.equal(bilac.encaminhar, "Vysache");
    assert.equal(vysache.encaminhar, "Bilac");
    assert.deepEqual(ForjaSystem.FERREIROS.Bilac.ranks, ["E", "D", "C", "B"]);
    assert.deepEqual(ForjaSystem.FERREIROS.Vysache.ranks, ["A", "S"]);
});

test("cada ferreiro aplica seu próprio bônus ao item", () => {
    const item = { nome: "Lâmina de Teste", slot: "Arma 1", rank: "B", descricao: "Teste", atributo1: "Força", valor1: 100 };
    assert.equal(ForjaSystem.gerarItemDoCatalogo(item, "Bilac").bonus.forca, 110);
    assert.equal(ForjaSystem.gerarItemDoCatalogo({ ...item, rank: "A" }, "Vysache").bonus.forca, 130);
});

test("materiais iguais somam atributo e investimento e núcleo alteram a qualidade", () => {
    const base = { nome: "Teste", slot: "Cabeça", rank: "C", descricao: "Teste", atributo1: "Força", valor1: 29, atributo2: "Força", valor2: 20 };
    const baixo = ForjaSystem.gerarItemDoCatalogo({ ...base, preco: 48000, nucleoRank: "E" }, "Bilac");
    const alto = ForjaSystem.gerarItemDoCatalogo({ ...base, preco: 160000, nucleoRank: "C" }, "Bilac");
    assert.ok(baixo.bonus.forca > 22);
    assert.ok(alto.bonus.forca > baixo.bonus.forca);
});

test("Bilac cobra 50% adicional antes do desconto de afinidade", () => {
    assert.equal(ForjaSystem.calcularCustoFerreiro(1000, "Bilac", 0), 1500);
    assert.equal(ForjaSystem.calcularCustoFerreiro(1000, "Bilac", 100), 1050);
});

test("Bilac está no catálogo narrativo e os 75 IDs são únicos", () => {
    const npcs = NPCManager.listarNPCs();
    assert.equal(npcs.length, 75);
    assert.equal(new Set(npcs.map(npc => npc.id)).size, 75);
    assert.equal(NPCManager.carregarNPC("bilac").nome, "Bilac");
});

test("roteador contém comandos estruturados dos dois ferreiros", () => {
    const handler = fs.readFileSync(path.join(__dirname, "../src/core/commandHandler.js"), "utf8");
    for (const comando of ["!olá bilac", "!aceitar forja bilac", "!aceitar forja vysache", "!bilac afinidade"]) {
        assert.match(handler, new RegExp(comando.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
    }
});
