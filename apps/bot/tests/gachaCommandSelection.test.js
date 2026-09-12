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

test('banner aceita ID, acentos, formatação e variantes do travessão', () => {
    const pool = [{id:'1',nome:'Caçador de Gates — Rank D'}, {id:'3',nome:'Player'}];
    assert.equal(command.localizarBanner('1',pool).id,'1');
    assert.equal(command.localizarBanner('#3',pool).id,'3');
    assert.equal(command.localizarBanner('*Cacador de Gates - Rank D*',pool).id,'1');
    assert.equal(command.localizarBanner('Caçador   de Gates – Rank D',pool).id,'1');
    assert.equal(command.localizarBanner('""',pool),null);
});

test('recompensas desativadas não participam do sorteio nem do pity', () => {
    const pool = [{id:1,peso:1,ativo:'0',grande_premio:1},
        {id:2,peso:1,ativo:1,grande_premio:1},
        {id:3,peso:1,ativo:1,garantido_conjunto:1}];
    assert.equal(engine.sortearRecompensa(pool,()=>0).id,2);
    const results = engine.prepararSorteios(pool,10,'E',99,()=>0);
    assert.equal(results[0].id,2);
    assert.ok(results.every(r=>r.id!==1));
    assert.ok(results.some(r=>r.garantidoConjunto));
});
