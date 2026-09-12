'use strict';
require('dotenv').config({quiet:true});
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {createRequire} = require('node:module');
const db = require('../packages/database');
const banners = require('../apps/bot/src/systems/gachaBannerService');
async function main() {
    assert.equal(require('../packages/database/config').provider,'postgres');
    await db.ensureGachaEngineSchema();
    const active = await banners.getBannersDisponiveis();
    assert.ok(active.length, 'Nenhum banner disponível para validar.');
    const rollback = new Error('ROLLBACK_GACHA_TEST');
    try {
        await db.transaction(async q => {
            const name = `__gacha_audit_${Date.now()}`;
            const player = await q.get("INSERT INTO jogadores(nome,numero,rank,nivel,experiencia,won,maestria,cristais) VALUES(?,?,'E',1,0,0,0,10000) RETURNING id",[name,name]);
            const file = path.resolve(__dirname,'../apps/bot/src/systems/gachaEngine.js');
            const module = {exports:{}};
            const realRequire = createRequire(file);
            vm.runInNewContext(fs.readFileSync(file,'utf8'), {module,console,__dirname:path.dirname(file),require:n =>
                n==='../../../../packages/database' ? {...db,get:q.get,all:q.all,transaction:work=>work(q)} : realRequire(n)}, {filename:file});
            const engine = module.exports;
            for (const banner of active) {
                const before = Number((await q.get('SELECT cristais FROM jogadores WHERE id=?',[player.id])).cristais);
                const single = await engine.realizarGiros(player.id,banner.id,1,{rng:()=>0});
                const ten = await engine.realizarGiros(player.id,banner.id,10,{rng:()=>0});
                assert.equal(single.resultados.length,1);
                assert.equal(ten.resultados.length,10);
                assert.ok(ten.resultados.some(r=>r.garantidoConjunto));
                assert.equal(ten.saldoAtual,before-1100);
                const history = await q.all('SELECT r.* FROM gacha_resultados r JOIN gacha_operacoes o ON o.id=r.operacao_id WHERE o.jogador_id=? AND o.banner_id=?',[player.id,banner.id]);
                assert.equal(history.length,11);
                assert.ok(history.every(r=>Number(r.quantidade)>0 && r.nome));
                assert.ok(Number((await q.get('SELECT SUM(quantidade) AS quantidade FROM inventario_jogador WHERE jogador_id=?',[player.id])).quantidade)>0);
                console.log(`PASS PostgreSQL: ${banner.nome}: 1/10 giros, débito de 1100, conjunto, inventário e 11 resultados no histórico.`);
            }
            await q.run('UPDATE jogadores SET cristais=0 WHERE id=?',[player.id]);
            await assert.rejects(engine.realizarGiros(player.id,active[0].id,1),/insuficiente/i);
            throw rollback;
        });
    } catch(error) {if(error!==rollback)throw error;}
    console.log('PASS: dados temporários e gastos de teste revertidos.');
}
main().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)});
