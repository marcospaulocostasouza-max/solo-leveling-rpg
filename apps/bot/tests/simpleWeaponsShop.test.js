const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const starterWeapons = require('../src/database/itens.json').armas;
const { ITENS_LOJA } = require('../src/utils/lojaItens');

test('loja simples contém todas as armas iniciais por 5.000 Won', () => {
    const shop = ITENS_LOJA.Inicial['Armas Simples'];
    assert.equal(shop.length, starterWeapons.length);
    assert.deepEqual(shop.map(item => item.nome), starterWeapons.map(item => item.nome));
    assert.ok(shop.every(item => item.preco === 5000 && item.bonus === 'Sem bônus'));
    assert.ok(shop.every(item => ['Arma 1', 'Arma 2'].includes(item.categoria)));
});

test('abrir loja e roteador anunciam a loja de armas simples', () => {
    const openShop = fs.readFileSync(path.join(__dirname, '../src/commands/abrirLoja.js'), 'utf8');
    const handler = fs.readFileSync(path.join(__dirname, '../src/core/commandHandler.js'), 'utf8');
    assert.match(openShop, /!Loja Armas Simples/);
    assert.match(handler, /"!loja armas simples": "lojaArmasSimples\.js"/);
});
