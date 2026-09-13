const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
const filename = path.resolve(__dirname, '../src/ia/relationshipEngine.js');
function engine(ask = async () => null) {
    const module = { exports: {} };
    vm.runInNewContext(fs.readFileSync(filename, 'utf8'), { module, console: { error() {} }, require(name) {
        if (name === './ollama') return { perguntarIA: ask };
        if (name === '../npc/sceneParser') return { analisarCena: text => text, formatarCenaParaPrompt: text => text };
        throw new Error(name);
    } });
    return module.exports;
}
const valid = { interacaoSignificativa: true, deltaVinculo: 8, deltaHostilidade: -2, motivo: 'Ajudou o NPC.' };
test('recupera o +8 do log sem modificar o valor ou o motivo', () => {
    const result = engine().validarResposta('{"interacaoSignificativa":true,"deltaVinculo": +8,"deltaHostilidade": -2,"motivo":"O NPC disse: +8; preserve \\\"deltaVinculo\\\": +8."}');
    assert.equal(result.deltaVinculo, 8);
    assert.equal(result.deltaHostilidade, -2);
    assert.equal(result.motivo, 'O NPC disse: +8; preserve "deltaVinculo": +8.');
});
test('aceita JSON puro, cercas e texto ao redor, inclusive com sinal positivo', () => {
    for (const text of [JSON.stringify(valid), `\`\`\`json\n${JSON.stringify(valid)}\n\`\`\``, `Resultado:\n${JSON.stringify(valid)}\nFim.`, `Resultado:\n${JSON.stringify(valid).replace('"deltaVinculo":8', '"deltaVinculo":+8')}\nFim.`]) {
        const result = engine().validarResposta(text);
        assert.equal(result.deltaVinculo, 8); assert.equal(result.deltaHostilidade, -2);
    }
});
test('preserva limites e zera deltas de interação explicitamente não significativa', () => {
    const result = engine().validarResposta(JSON.stringify({ ...valid, deltaVinculo: 100, deltaHostilidade: -100 }));
    assert.equal(result.deltaVinculo, 12); assert.equal(result.deltaHostilidade, -12);
    const empty = engine().validarResposta(JSON.stringify({ ...valid, interacaoSignificativa: false }));
    assert.equal(empty.deltaVinculo, 0); assert.equal(empty.deltaHostilidade, 0);
    assert.equal(engine().validarResposta(JSON.stringify({ ...valid, deltaVinculo: '+8', deltaHostilidade: '-2' })).deltaVinculo, 8);
});
test('não inventa ganhos para JSON truncado, arrays, campos ausentes ou deltas inválidos', () => {
    for (const text of ['null', '[]', JSON.stringify([valid]), JSON.stringify(JSON.stringify(valid)), 'texto inválido', '{"deltaVinculo":+8', '{}', JSON.stringify({ ...valid, deltaVinculo: '8 pontos' }), JSON.stringify({ ...valid, deltaHostilidade: null }), JSON.stringify({ ...valid, deltaVinculo: 1.5 })]) assert.equal(engine().validarResposta(text), null, text);
});
test('avaliação solicita JSON na chamada real e usa a recuperação ao devolver o resultado', async () => {
    let options;
    const result = await engine(async (prompt, opts) => { options = opts; assert.match(prompt, /nunca \+8/); return '{"interacaoSignificativa":true,"deltaVinculo":+8,"deltaHostilidade":0,"motivo":"Ajuda."}'; }).analisarConversa({ nome: 'Cyrus' }, { nome: 'Player' }, [], [], null);
    assert.equal(options.format, 'json'); assert.equal(options.thinking, false);
    assert.equal(result.deltaVinculo, 8);
});
test('compatibilidade repassa opções e o serviço inclui format somente quando solicitado', async () => {
    const { OllamaService } = require('../src/ia/ollamaService');
    const service = new OllamaService();
    assert.equal(service._montarPayload('prompt', { format: 'json' }).format, 'json');
    assert.equal(service._montarPayload('prompt').format, undefined);
    const module = { exports: {} };
    vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, '../src/ia/ollama.js'), 'utf8'), { module, console, require: () => ({ ollamaService: { gerarResposta: async (prompt, options) => { assert.equal(options.format, 'json'); return { texto: 'result' }; } } }) });
    assert.equal(await module.exports.perguntarIA('prompt', { format: 'json' }), 'result');
});
