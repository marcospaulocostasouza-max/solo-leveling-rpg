"use strict";
const database = require('../../../../packages/database');
const { provider } = require('../../../../packages/database/config');
const catalog = require('../database/itens.json').armas;
const normalize = v => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
function findWeapon(name) { return catalog.find(item => normalize(item.nome) === normalize(name)); }
async function grant(playerId, name) {
    const weapon = findWeapon(name);
    if (!weapon) throw new Error('Arma inicial não encontrada no catálogo.');
    return database.transaction(async q => {
        const player = await q.get(provider === 'postgres' ? 'SELECT id FROM jogadores WHERE id=? FOR UPDATE' : 'SELECT id FROM jogadores WHERE id=?', [playerId]);
        if (!player) throw new Error('Jogador não encontrado.');
        // Reaprovar a ficha não concede outra arma gratuita.
        const prior = await q.get('SELECT id FROM inventario_jogador WHERE jogador_id=? AND item_inicial=1', [playerId]);
        if (prior) return { entregue: false, existente: true };
        let item = await q.get('SELECT id FROM itens WHERE LOWER(nome)=LOWER(?)',[weapon.nome]);
        if (!item) {
            await q.run("INSERT INTO itens(nome,categoria,tier,descricao,arma,preco) VALUES(?,?,'Inicial',?,1,0) ON CONFLICT DO NOTHING",[weapon.nome,weapon.categoria || 'Arma 1',weapon.descricao]);
            item = await q.get('SELECT id FROM itens WHERE LOWER(nome)=LOWER(?)',[weapon.nome]);
        }
        if (!item) throw new Error('Não foi possível registrar a arma inicial.');
        // Slot disponível será validado pelo mesmo serviço de equipamentos.
        const equipped = await q.get('SELECT id FROM inventario_jogador WHERE jogador_id=? AND equipado=1',[playerId]);
        await q.run('INSERT INTO inventario_jogador(jogador_id,item_id,quantidade,equipado,item_inicial) VALUES(?,?,1,?,1)',[playerId,item.id,equipped ? 0 : 1]);
        return { entregue: true,itemId: item.id };
    });
}
module.exports = { findWeapon, grant, catalog };
