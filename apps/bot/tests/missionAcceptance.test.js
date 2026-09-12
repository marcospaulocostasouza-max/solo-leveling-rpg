const test = require('node:test');
const assert = require('node:assert/strict');
const QuestSystem = require('../src/systems/questSystem');

test('aceite curto exige nome quando houver mais de uma oferta', async t => {
    const originalListar = QuestSystem.listarMissoes;
    t.after(() => { QuestSystem.listarMissoes = originalListar; });

    QuestSystem.listarMissoes = async () => [
        { id: 1, nome: 'Pedido de Cyrus', status: 'disponivel', oferecida_em: '2026-09-11T12:00:00Z' },
        { id: 2, nome: 'Pedido de Elrica', status: 'disponivel', oferecida_em: '2026-09-11T12:01:00Z' }
    ];
    const ambigua = await QuestSystem.aceitarMissao(1, '');
    assert.match(ambigua.erro, /mais de uma missão disponível/i);
    assert.match(ambigua.erro, /Pedido de Cyrus/);
    assert.match(ambigua.erro, /Pedido de Elrica/);
});

test('missao de NPC sem oferta nao pode ser aceita por titulo', async t => {
    const originalBuscar = QuestSystem.buscarMissaoPorNome;
    t.after(() => { QuestSystem.buscarMissaoPorNome = originalBuscar; });

    QuestSystem.buscarMissaoPorNome = async () => ({
        id: 1,
        nome: 'Pedido ainda nao apresentado',
        status: 'disponivel',
        origem_missao_id: 'teste-oferta',
        oferecida_em: null
    });

    const resultado = await QuestSystem.aceitarMissao(1, 'Pedido ainda nao apresentado');
    assert.match(resultado.erro, /converse primeiro com o npc/i);
});
