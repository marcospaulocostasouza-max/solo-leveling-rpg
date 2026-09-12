const test = require('node:test');
const assert = require('node:assert/strict');
const command = require('../src/commands/gacha');
const database = require('../../../packages/database');
const banners = require('../src/systems/gachaBannerService');
const engine = require('../src/systems/gachaEngine');
const messages = require('../src/core/messageService');

test('convergir exige banner e entrega ao engine somente o banner escolhido', async t => {
    const calls = [];
    t.mock.method(banners, 'getBannersDisponiveis', async () => [{ id: 1, nome: 'Lua Azul' }, { id: 2, nome: 'Lua Vermelha' }]);
    t.mock.method(database, 'playerByPhone', async () => ({ id: 7 }));
    t.mock.method(messages, 'send', async () => {});
    t.mock.method(engine, 'realizarGiros', async (...args) => {
        calls.push(args);
        return { banner: { nome: 'Lua Vermelha' }, custo: 1000, saldoAtual: 100, pityDepois: 10, resultados: [] };
    });
    for (const body of ['!convergir', '!convergir 10', '!convergir 2 Lua Azul', '!convergir 10 Lua', '!convergir 1 Inexistente']) {
        await command({ body, from: 'player' });
    }
    assert.equal(calls.length, 0);
    await command({ body: '!Convergir 10 Lua Vermelha', from: 'player' });
    assert.deepEqual(calls, [[7, 2, 10]]);
    await command({ body: '!convergir 1 Lua Azul', from: 'player' });
    assert.deepEqual(calls[1], [7, 1, 1]);
});

test('nomes exatos têm prioridade; duplicatas não escolhem o primeiro', () => {
    assert.equal(command.localizarBanner('Lua', [{ id: 1, nome: 'Lua Azul' }, { id: 2, nome: 'Lua' }]).id, 2);
    assert.throws(() => command.localizarBanner('Lua', [{ nome: 'Lua' }, { nome: 'Lua' }]), /ambíguo/);
    assert.equal(command.localizarBanner('', [{ nome: 'Lua' }]), null);
});
