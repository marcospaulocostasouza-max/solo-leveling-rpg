const test = require('node:test');
const assert = require('node:assert/strict');
const command = require('../src/commands/gachaAdm');
const Admin = require('../src/systems/gachaAdminService');
const messages = require('../src/core/messageService');

test('desativação reconhece nome completo, nome parcial, ID e comando curto', async t => {
    const calls = [], replies = [];
    t.mock.method(Admin,'autorizar',async()=>{});
    t.mock.method(Admin,'listBannersAdmin',async()=>[{id:'1',nome:'Caçador de Gates — Rank D'},{id:'3',nome:'Player'}]);
    t.mock.method(Admin,'deactivateBanner',async(actor,id)=>{calls.push([actor,id]);return {id,nome:'Caçador de Gates — Rank D'};});
    t.mock.method(messages,'send',async ({text})=>replies.push(text));
    for(const body of ['!gachaadm banner desativar Caçador de Gates','!desativar banner Caçador de Gates — Rank D','!desativarbanner 1','!gachaadm banner desativar #1']) {
        await command({body,from:'ADM'});
    }
    assert.deepEqual(calls,Array.from({length:4},()=>['ADM','1']));
    assert.ok(replies.every(text=>text.includes('desativado')));
});

test('nome ambíguo e usuário sem autorização não desativam banners', async t => {
    let calls=0;
    const replies=[];
    t.mock.method(Admin,'autorizar',async actor=>{if(actor!=='ADM')throw new Error('Somente administradores');});
    t.mock.method(Admin,'listBannersAdmin',async()=>[{id:1,nome:'Caçador de Gates D'},{id:2,nome:'Caçador de Gates C'}]);
    t.mock.method(Admin,'deactivateBanner',async()=>{calls++;});
    t.mock.method(messages,'send',async({text})=>replies.push(text));
    await command({body:'!desativar banner Caçador de Gates',from:'ADM'});
    await command({body:'!desativar banner 1',from:'PLAYER'});
    assert.equal(calls,0);
    assert.match(replies[0],/ambíguo/);
    assert.match(replies[1],/administradores/);
});
