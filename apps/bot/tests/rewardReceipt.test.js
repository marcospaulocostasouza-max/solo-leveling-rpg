const {test}=require('node:test');
const assert=require('node:assert/strict');
const {record}=require('../../../packages/database/reward-receipt');
const guard=require('../src/ai/narrativeResponseGuard');
test('recibo rejeita lote inválido antes de gravar qualquer entrada',async()=>{
 const writes=[];const db={registrarHistoricoFichaComQuery:async(q,e)=>writes.push(e)};
 await assert.rejects(record(db,{}, {playerId:1,origin:'TEST',reference:'op:1',rewards:[{name:'XP',quantity:100},{name:'WON',quantity:0}]}));
 assert.equal(writes.length,0);
});
test('recibo preserva destino quantidade origem referência e query',async()=>{
 const query={};const db={registrarHistoricoFichaComQuery:async(q,e)=>{assert.equal(q,query);assert.equal(e.jogadorId,42);assert.equal(e.quantidade,500);assert.equal(e.referencia,'op:42');}};
 await record(db,query,{playerId:42,origin:'TEST',reference:'op:42',rewards:[{name:'XP',quantity:500}]});
});
test('correção vazia ou pior preserva cena original sem descartar',async()=>{
 for(const correction of ['', 'She looked at the hunter and smiled.']){
  let calls=0;const result=await guard.generate(async()=>({texto:++calls===1?'Pode entrar.':correction}),'Cena',{npc:{name:'Alexia Song'},message:'Olá'},{});
  assert.equal(result.texto,'Pode entrar.');
 }
});
