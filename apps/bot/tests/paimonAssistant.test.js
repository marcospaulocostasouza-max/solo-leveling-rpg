const test = require("node:test");
const assert = require("node:assert/strict");
const db = require("../src/core/database");
const Paimon = require("../src/systems/systemAssistantService");
const comandoPaimon = require("../src/commands/sistema");
const { BASE_CONHECIMENTO } = require("../src/systems/paimonKnowledgeBase");

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
    assert.ok(Paimon.definirTamanhoResposta("Explique passo a passo como funciona a mana").maxCaracteres <= 900);
});

test("perguntas sobre sistemas recebem comandos reais sem depender do modelo", () => {
    const resposta = Paimon.responderComandosDiretamente(true, "Quais são os comandos do gacha?");
    assert.match(resposta, /!Banners/); assert.match(resposta, /!Convergir/);
    assert.doesNotMatch(resposta, /!Gachar/);
});

test("linguagem informal recupera o sistema relacionado em vez de repetir a ficha", () => {
    assert.match(Paimon.expandirConsulta("como eu upo"), /nivel/);
    assert.match(Paimon.expandirConsulta("como eu upo"), /experiencia/);
    const fontes = Paimon.recuperarConhecimentoSistemas("como eu upo");
    assert.ok(fontes.some(item => /levelSystem\.js|nivel\.js|progresso\.js/.test(item.fonte)));
});

test("mensagens da Paimon seguem o molde do RPG e deixam a fala em itálico", () => {
    const mensagem = comandoPaimon.formatarPaimon("Paimon encontrou a resposta!");
    assert.match(mensagem, /^_\*「 PAIMON — GUIA DO SISTEMA 」\*_/);
    assert.match(mensagem, /_Paimon encontrou a resposta!_$/);
});

test("base oficial da Paimon possui pelo menos 500 perguntas e respeita permissões", () => {
    assert.ok(BASE_CONHECIMENTO.length >= 500);
    assert.ok(BASE_CONHECIMENTO.every(item => item.pergunta && item.resposta && item.comando));
    const jogador = Paimon.recuperarBasePaimon("como aprovar ficha", 10, false);
    assert.ok(jogador.every(item => !item.administrativo));
    const admin = Paimon.recuperarBasePaimon("como aprovar ficha", 10, true);
    assert.ok(admin.some(item => item.administrativo));
});

test("base da Paimon recupera comandos pela intenção da pergunta", () => {
    const respostas = Paimon.recuperarBasePaimon("como vejo os conjuntos?", 5, true);
    assert.ok(respostas.some(item => /!Conjuntos/i.test(item.comando)));
    assert.match(Paimon.responderBasePaimonDiretamente("para que serve !inventario?", false), /!inventario/i);
    assert.match(Paimon.responderBasePaimonDiretamente("como compro uma técnica?", false), /!comprar técnica/i);
    assert.equal(Paimon.responderBasePaimonDiretamente("como eu upo?", false), null);
});
