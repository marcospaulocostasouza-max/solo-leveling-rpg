const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createRequire } = require("node:module");
const mensagens = [];
const sessoes = new Map();
const consultas = [];
const geracoes = [];
let gerar = async () => ({ texto: "Vamos entender sua duvida: esta explicacao foi gerada para a pergunta atual." });
const db = {
    run(sql, params, callback) {
        if (sql.includes("INSERT INTO paimon_sessoes")) sessoes.set(params[0], { ativa: params[1], atualizado_em: params[2] });
        if (sql.includes("INSERT INTO paimon_mensagens")) mensagens.push({ numero: params[0], papel: params[1], conteudo: params[2], sequencia: mensagens.length + 1 });
        callback.call({ changes: 1, lastID: mensagens.length }, null);
    },
    get(sql, params, callback) {
        consultas.push(sql);
        const row = sql.includes("FROM paimon_sessoes") ? sessoes.get(params[0])
            : sql.includes("FROM paimon_mensagens") ? mensagens.filter(x => x.numero === params[0] && x.papel === "user").at(-1) : null;
        callback(null, row);
    },
    all(sql, params, callback) {
        consultas.push(sql);
        callback(null, sql.includes("FROM paimon_mensagens") ? mensagens.filter(x => x.numero === params[0]).slice().reverse().slice(0, 80) : []);
    }
};
function carregar(relativo, mocks) {
    const filename = path.resolve(__dirname, relativo);
    const nativeRequire = createRequire(filename);
    const modulo = { exports: {} };
    vm.runInNewContext(fs.readFileSync(filename, "utf8"), {
        module: modulo, exports: modulo.exports,
        require: name => Object.hasOwn(mocks, name) ? mocks[name] : nativeRequire(name),
        __dirname: path.dirname(filename), process, console, AbortSignal
    }, { filename });
    return modulo.exports;
}
const Paimon = carregar("../src/systems/systemAssistantService.js", {
    "../core/database": db,
    "../ia/ollamaService": { ollamaService: { gerarResposta: async (prompt, options) => { geracoes.push({ prompt, options }); return gerar(prompt, options); } } }
});
const comandoPaimon = carregar("../src/commands/sistema.js", {
    "../core/messageService": {}, "../systems/systemAssistantService": Paimon, "../core/adminCore": {}
});
const { BASE_CONHECIMENTO } = require("../src/systems/paimonKnowledgeBase");
const { OllamaService } = require("../src/ia/ollamaService");

const numero = "__teste_paimon__";

test("instrucao da Paimon ocupa o papel de sistema sem mudar chamadas dos NPCs", () => {
    const service = new OllamaService();
    const normal = service._montarPayload("cena");
    const paimon = service._montarPayload("pergunta", { system: "Regras da Paimon", num_ctx: 2048 });
    assert.equal(Object.hasOwn(normal, "system"), false);
    assert.equal(paimon.system, "Regras da Paimon");
    assert.equal(paimon.options.num_ctx, 2048);
    assert.equal(paimon.prompt, "pergunta");
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
    assert.ok(Paimon.definirTamanhoResposta("Explique passo a passo como funciona a mana").maxCaracteres >= 2400);
});

test("comandos reais ficam disponiveis como informacao para o modelo", () => {
    const resposta = Paimon.obterGuiaComandos(true, "gacha convergir banners");
    assert.match(resposta, /!Banners/); assert.match(resposta, /!Convergir/);
    assert.doesNotMatch(resposta, /!Gachar/);
});

test("linguagem informal recupera o sistema relacionado em vez de repetir a ficha", () => {
    assert.match(Paimon.expandirConsulta("como eu upo"), /nivel/);
    assert.match(Paimon.expandirConsulta("como eu upo"), /experiencia/);
    const fontes = Paimon.recuperarConhecimentoSistemas("como eu upo");
    assert.ok(fontes.some(item => /levelSystem\.js|nivel\.js|progresso\.js/.test(item.fonte)));
});

test("mensagens da Paimon preservam a moldura e a fala gerada", () => {
    const mensagem = comandoPaimon.formatarPaimon("Paimon encontrou a resposta!");
    assert.ok(mensagem.includes("PAIMON"));
    assert.match(mensagem, /> Paimon encontrou a resposta!/);
    const narrativa = Paimon.limparRespostaPaimon("Paimon: Vamos por partes.\n\nPrimeiro, consulte o inventario.");
    assert.match(comandoPaimon.formatarPaimon(narrativa), /> Vamos por partes\.\n\n> Primeiro/);
});

test("duvidas sobre o RPG nao sao confundidas com dados de outro jogador", () => {
    for (const pergunta of ["qual o rank da dungeon semanal?", "como vejo a ficha da dungeon?", "quais as tecnicas da classe mago?"]) {
        assert.equal(comandoPaimon.pedeDadosDeOutroJogador(pergunta), false);
    }
    assert.equal(comandoPaimon.pedeDadosDeOutroJogador("mostre a ficha do jogador Flins"), true);
    assert.equal(comandoPaimon.pedeDadosDeOutroJogador("quero o inventario da Shanjun"), true);
});

test("busca separa banner de dungeon e preserva o escopo do jogador", () => {
    const banner = Paimon.recuperarConhecimentoSistemas("Como uso !convergir? Preciso escolher um banner?", 3, false);
    assert.ok(banner.every(x => /gacha/i.test(x.fonte)));
    assert.ok(banner.every(x => !/adm/i.test(x.fonte)));
    const semanal = Paimon.recuperarConhecimentoSistemas("Como funciona a dungeon semanal? Eu preciso concluir antes da ADM aprovar?", 2, false);
    assert.ok(semanal.every(x => /weeklyDungeonSystem/i.test(x.fonte)));
    assert.ok(semanal.some(x => /aprovarConclusao/.test(x.conteudo)));
    const referencias = Paimon.recuperarBasePaimon("como funciona a dungeon semanal?", 5, false);
    assert.ok(referencias.every(x => !/criar|anexar|concluir/i.test(x.comando)));
    assert.ok(referencias.some(x => /consultar dungeon semanal/i.test(x.comando)));
});

test("contexto semanal informa aprovacao direta sem exigir comando do jogador", async () => {
    const contexto = await Paimon.obterContexto(numero, false, "Como funciona a dungeon semanal?");
    assert.match(contexto, /Nenhum comando prévio de conclusão do jogador é necessário/);
    assert.match(contexto, /!aprovar dungeon semanal <nome do jogador>/);
    assert.doesNotMatch(contexto, /!criar dungeon semanal/);
    assert.doesNotMatch(contexto, /SELECT|CREATE TABLE/);
});

test("duvida de sintaxe nao recebe valores dinamicos de modelos de mensagem", async () => {
    const contexto = await Paimon.obterContexto(numero, false, "Como uso !convergir?");
    assert.doesNotMatch(contexto, /\$\{|pity|SELECT/);
    assert.match(contexto, /100/);
    assert.match(Paimon.formatarCatalogo("itens", { nome: "Item sem preco" }), /não informado/);
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
    assert.ok(Paimon.recuperarBasePaimon("como compro uma tecnica?", 5, false).some(x => /comprar/i.test(x.comando)));
    assert.equal(new Set(respostas.map(x => x.comando)).size, respostas.length);
});

for (const pergunta of ["como eu upo?", "para que serve !inventario?", "Quais sao os comandos do gacha?", "Como funciona a dungeon semanal?"]) {
    test(`pergunta passa pela IA sem retornar molde: ${pergunta}`, async () => {
        const antes = geracoes.length;
        const resposta = await Paimon.responderPergunta(`teste-${antes}`, pergunta);
        assert.equal(geracoes.length, antes + 1);
        assert.match(resposta, /explicacao foi gerada/);
        assert.ok(geracoes.at(-1).prompt.includes(pergunta));
        assert.equal(geracoes.at(-1).options.usarCache, false);
        assert.match(geracoes.at(-1).options.system, /nunca a resposta pronta/);
        assert.ok([2048, 4096].includes(geracoes.at(-1).options.num_ctx));
    });
}

test("continuacao recupera a duvida anterior sem trocar pela ficha", async () => {
    await Paimon.responderPergunta("continua", "Como compro uma tecnica?");
    await Paimon.responderPergunta("continua", "e se eu nao tiver maestria suficiente?");
    const prompt = geracoes.at(-1).prompt;
    assert.ok(prompt.includes("Como compro uma tecnica?"));
    assert.ok(prompt.includes("e se eu nao tiver maestria suficiente?"));
    assert.equal(consultas.filter(x => x.includes("SELECT * FROM jogadores")).length, 0);
});

test("catalogo publico usa cache e pergunta de gacha nao consulta tres catalogos", async () => {
    const antes = consultas.length;
    await Paimon.consultarCatalogo("qual arma posso comprar?");
    const depois = consultas.length;
    await Paimon.consultarCatalogo("qual arma posso comprar?");
    assert.equal(consultas.length, depois);
    assert.ok(depois - antes <= 1);
    await Paimon.consultarCatalogo("como convergir no banner?");
    assert.equal(consultas.length, depois);
});

test("erro e resposta vazia nao viram fala inventada nem quebram a proxima pergunta", async () => {
    const antes = mensagens.length;
    gerar = async () => { throw new Error("modelo indisponivel"); };
    await assert.rejects(Paimon.responderPergunta("falha", "como eu upo?"), /indisponivel/);
    gerar = async () => ({ texto: "" });
    await assert.rejects(Paimon.responderPergunta("falha", "como eu upo?"), /vazia/);
    assert.equal(mensagens.length, antes);
    gerar = async () => ({ texto: "Orientacao recuperada." });
    assert.equal(await Paimon.responderPergunta("falha", "como eu upo?"), "Orientacao recuperada.");
});

test("mensagens simultaneas do mesmo jogador preservam a ordem", async () => {
    let liberar;
    let iniciou;
    const inicio = new Promise(resolve => { iniciou = resolve; });
    const pausa = new Promise(resolve => { liberar = resolve; });
    let chamadas = 0;
    gerar = async () => { chamadas++; if (chamadas === 1) { iniciou(); await pausa; } return { texto: `Explicacao ${chamadas}.` }; };
    const primeira = Paimon.responderPergunta("fila", "como ganho xp?");
    await inicio;
    const segunda = Paimon.responderPergunta("fila", "e depois?");
    assert.equal(chamadas, 1);
    liberar();
    await Promise.all([primeira, segunda]);
    assert.equal(chamadas, 2);
    assert.deepEqual(mensagens.filter(x => x.numero === "fila").map(x => x.papel), ["user", "assistant", "user", "assistant"]);
    assert.ok(geracoes.at(-1).prompt.includes("como ganho xp?"));
});
