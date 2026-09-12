"use strict";
require('dotenv').config({ quiet: true });
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const database = require('../packages/database');
const { provider } = require('../packages/database/config');
function load(name, overrides) {
    const file = path.resolve(__dirname, '../apps/bot/src/systems', name);
    const module = { exports: {} }, realRequire = createRequire(file);
    vm.runInNewContext(fs.readFileSync(file, 'utf8'), { module, __dirname: path.dirname(file), console,
        require: n => Object.hasOwn(overrides, n) ? overrides[n] : realRequire(n) }, { filename: file });
    return module.exports;
}
(async () => {
    if (provider !== 'postgres') throw new Error('This test requires the configured PostgreSQL database.');
    const rollback = new Error('TEST_ROLLBACK');
    try {
        await database.transaction(async q => {
            const suffix = `TEST_MISSION_${Date.now()}`;
            const player = await q.get("INSERT INTO jogadores(nome,numero,rank,nivel,experiencia,won) VALUES(?,?,'E',1,0,0) RETURNING id,numero", [suffix,suffix]);
            const cb = {
                run(sql,args,done) { if(typeof args==='function'){done=args;args=[];} q.run(sql,args).then(r=>done?.call(r,null)).catch(e=>done?.(e)); },
                get(sql,args,done) { q.get(sql,args).then(r=>done(null,r)).catch(e=>done(e)); },
                all(sql,args,done) { q.all(sql,args).then(r=>done(null,r)).catch(e=>done(e)); },
            };
            const quest = load('questSystem.js', { '../core/database': cb, '../npc/relationshipManager': { garantirTabela: async()=>{} } });
            const ids = [];
            for (let i=0;i<2;i++) {
                const row = await q.get(`INSERT INTO missoes(jogador_id,nome,tipo,status,progresso,objetivo,recompensa_xp,recompensa_won,recompensa_item,recompensa_vinculo,npc_id,oferecida_em,data)
                    VALUES(?,?,'missao_simples','disponivel',0,1,200,500,'Bandagens de Emergência',2,'elrica_edoras',?,?) RETURNING id`, [player.id,`${suffix}_${i}`,new Date().toISOString(),new Date().toISOString()]);
                ids.push(Number(row.id));
            }
            quest.sincronizarMissoesPorVinculo = async()=>{};
            for (const id of ids) assert.equal((await quest.aceitarMissao(player.id,String(id))).sucesso,true);
            assert.equal((await quest.listarMissoes(player.id)).filter(m=>m.status==='ativa').length,2);
            let levelChecks=0;
            const progress = load('missionProgressService.js', {
                '../../../../packages/database': {...database, transaction: work=>work(q),run:q.run},
                './questSystem': { garantirMetadadosMissoes:async()=>{} },
                '../npc/relationshipManager': { garantirTabela:async()=>{} },
                '../core/adminCore': { isAdmin:async actor=>actor==='TEST_ADM' },
                './levelSystem': { verificarProgressao:async()=>{levelChecks++;} },
                './crystalRewardService': { ORIGENS:{MISSAO:'MISSION'},conceder:async()=>({quantidade:0}) },
            });
            await assert.rejects(progress.concluir(player.id,ids[0],{aprovadoPor:'PLAYER'}),/ADM/);
            const result = await progress.concluir(player.id,ids[0],{aprovadoPor:'TEST_ADM',cena:'Cena revisada'});
            assert.equal(result.recompensa.xp,200); assert.equal(result.recompensa.vinculo,2);
            assert.equal((await progress.concluir(player.id,ids[0],{aprovadoPor:'TEST_ADM'})).duplicada,true);
            assert.equal(levelChecks,1);
            assert.deepEqual(await q.get('SELECT experiencia,won FROM jogadores WHERE id=?',[player.id]),{experiencia:'200',won:'500'});
            assert.equal(Number((await q.get('SELECT vinculo FROM npc_relationships WHERE "jogadorId"=?',[player.numero])).vinculo),2);
            assert.equal((await q.get('SELECT status FROM missoes WHERE id=?',[ids[1]])).status,'ativa');
            assert.equal((await quest.listarReacoesPendentesNPC(player.id,'elrica_edoras')).length,1);
            await quest.confirmarEntregaReacoesNPC(player.id,'elrica_edoras',[ids[0]]);
            assert.equal((await quest.listarReacoesPendentesNPC(player.id,'elrica_edoras')).length,0);
            assert.equal(Number((await q.get('SELECT quantidade FROM inventario_jogador WHERE jogador_id=?',[player.id])).quantidade),1);
            console.log('PASS: PostgreSQL aceite, duas missões, aprovação ADM, XP/Won/item/vínculo, entrega única e reação persistida.');
            throw rollback;
        });
    } catch(error) { if(error!==rollback)throw error; }
    console.log('PASS: todos os dados de teste foram revertidos.');
    process.exit(0);
})().catch(error=>{console.error(error);process.exit(1)});
