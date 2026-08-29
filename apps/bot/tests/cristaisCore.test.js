const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const database = require("../../../packages/database");

const legadoNumero = "__cristais_legado__";
const novoNumero = "__cristais_novo__";
let legadoId;
let novoId;

test.before(async () => {
    await database.run("DELETE FROM jogadores WHERE numero IN (?, ?)", [legadoNumero, novoNumero]);
    const legado = await database.run("INSERT INTO jogadores (numero, nome, won, maestria, nivel, rank) VALUES (?, 'Legado Cristais', 4321, 77, 9, 'D')", [legadoNumero]);
    legadoId = legado.lastID;
});

test.after(async () => {
    for (const id of [legadoId, novoId].filter(Boolean)) await database.run("DELETE FROM historico_cristais WHERE jogador_id = ?", [id]);
    await database.run("DELETE FROM jogadores WHERE numero IN (?, ?)", [legadoNumero, novoNumero]);
});

test("migração acrescenta zero ao jogador existente e preserva seus dados", async () => {
    await database.ensureCrystalSchema();
    const jogador = await database.playerByPhone(legadoNumero);
    assert.equal(Number(jogador.cristais), 0);
    assert.equal(Number(jogador.won), 4321);
    assert.equal(Number(jogador.maestria), 77);
    assert.equal(Number(jogador.nivel), 9);
    assert.equal(jogador.rank, "D");
});

test("novo jogador recebe zero pelo DEFAULT", async () => {
    const novo = await database.run("INSERT INTO jogadores (numero, nome, won) VALUES (?, 'Novo Cristais', 9876)", [novoNumero]);
    novoId = novo.lastID;
    const jogador = await database.playerById(novoId);
    assert.equal(Number(jogador.cristais), 0);
    assert.equal(Number(jogador.won), 9876);
});

test("adiciona, acumula, remove e recusa saldo insuficiente", async () => {
    assert.equal((await database.adicionarCristais(legadoId, 500, "TESTE")).saldo, 500);
    assert.equal((await database.adicionarCristais(legadoId, 200, "TESTE")).saldo, 700);
    assert.equal((await database.removerCristais(legadoId, 100, "TESTE")).saldo, 600);
    const recusada = await database.removerCristais(legadoId, 700, "TESTE");
    assert.equal(recusada.sucesso, false);
    assert.equal(recusada.saldo, 600);
    assert.equal(await database.consultarCristais(legadoId), 600);
    assert.equal(await database.possuiCristais(legadoId, 600), true);
    assert.equal(await database.possuiCristais(legadoId, 601), false);
});

test("persistência, auditoria e inicialização repetida não redefinem o saldo", async () => {
    await database.ensureCrystalSchema();
    await database.ensureCrystalSchema();
    const recarregado = await database.playerById(legadoId);
    assert.equal(Number(recarregado.cristais), 600);
    const historico = await database.all("SELECT quantidade, tipo, saldo_resultante, origem FROM historico_cristais WHERE jogador_id = ? ORDER BY id", [legadoId]);
    assert.deepEqual(historico.map(item => [Number(item.quantidade), item.tipo, Number(item.saldo_resultante), item.origem]), [
        [500, "entrada", 500, "TESTE"], [200, "entrada", 700, "TESTE"], [100, "saida", 600, "TESTE"]
    ]);
});

test("débito condicionado no banco nunca permite saldo negativo", async () => {
    const resultado = await database.run("UPDATE jogadores SET cristais = cristais - ? WHERE id = ? AND cristais >= ?", [700, legadoId, 700]);
    assert.equal(resultado.changes, 0);
    assert.equal(await database.consultarCristais(legadoId), 600);
});

test("duas tentativas concorrentes não gastam o mesmo saldo", async () => {
    await database.adicionarCristais(novoId, 600, "TESTE_CONCORRENCIA");
    const tentativas = await Promise.allSettled([
        database.removerCristais(novoId, 400, "TESTE_CONCORRENCIA"),
        database.removerCristais(novoId, 400, "TESTE_CONCORRENCIA")
    ]);
    const aprovadas = tentativas.filter(item => item.status === "fulfilled" && item.value.sucesso).length;
    assert.equal(aprovadas, 1);
    assert.equal(await database.consultarCristais(novoId), 200);
});

test("!saldos e !jogador apresentam Cristais", () => {
    const raiz = path.resolve(__dirname, "../src/commands");
    const saldo = fs.readFileSync(path.join(raiz, "saldo.js"), "utf8");
    const jogador = fs.readFileSync(path.join(raiz, "jogador.js"), "utf8");
    assert.match(saldo, /Cristais:/);
    assert.match(saldo, /jogador\.cristais/);
    assert.match(jogador, /Cristais:/);
    assert.match(jogador, /jogador\.cristais/);
});
