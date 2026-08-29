const test = require("node:test");
const assert = require("node:assert/strict");
const db = require("../src/core/database");
const Paimon = require("../src/systems/systemAssistantService");

const numero = "__teste_paimon__";
const run = (sql, params = []) => new Promise((resolve, reject) => db.run(sql, params, error => error ? reject(error) : resolve()));

test.after(async () => {
    await run("DELETE FROM paimon_mensagens WHERE numero = ?", [numero]);
    await run("DELETE FROM paimon_sessoes WHERE numero = ?", [numero]);
});

test("sessão e memória persistem mensagens em ordem", async () => {
    await Paimon.garantirTabelas();
    await Paimon.definirSessao(numero, true);
    assert.equal(await Paimon.sessaoAtiva(numero), true);
    await Paimon.salvarMensagem(numero, "user", "Como funciona a Maestria?");
    await Paimon.salvarMensagem(numero, "assistant", "Ela serve para comprar técnicas.");
    const historico = await Paimon.obterHistorico(numero, "e como consigo ela?");
    assert.match(historico, /Jogador: Como funciona a Maestria/);
    assert.match(historico, /Paimon: Ela serve para comprar técnicas/);
    await Paimon.definirSessao(numero, false);
    assert.equal(await Paimon.sessaoAtiva(numero), false);
});

test("pesquisa prioriza conteúdo relacionado e detecta encerramento", () => {
    assert.ok(Paimon.pontuar("Técnicas e custo de Maestria", "como compro técnicas com maestria") > Paimon.pontuar("Sistema de guildas", "como compro técnicas com maestria"));
    assert.equal(Paimon.deveEncerrar("tchau Paimon"), true);
    assert.equal(Paimon.deveEncerrar("como encerrar uma missão?"), false);
});

test("respostas curtas usam orçamento menor que explicações detalhadas", () => {
    assert.ok(Paimon.definirTamanhoResposta("O que é mana?").numPredict < Paimon.definirTamanhoResposta("Explique passo a passo como funciona a mana").numPredict);
});
