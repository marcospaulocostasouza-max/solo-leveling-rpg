'use strict';
require('dotenv').config();
const assert=require('node:assert/strict');
const database=require('../packages/database');
const engine=require('../apps/bot/src/systems/gachaEngine');
const {createService,fields}=require('../apps/bot/src/systems/contentCreationService');
async function main(){
 assert.equal(require('../packages/database/config').provider,'postgres');
 await createService(database,'postgres',()=>engine).ensure();
 const rolledBack=new Error('TEST_ROLLBACK');
 try{await database.transaction(async q=>{
  const player=await q.get('SELECT * FROM jogadores ORDER BY id LIMIT 1 FOR UPDATE');assert.ok(player);
  const adapter={...database,run:q.run,get:q.get,all:q.all,transaction:work=>work(q),ensureEquipmentSetSchema:async()=>{},ensurePlayerHistorySchema:async()=>{}};
  const service=createService(adapter,'postgres',()=>engine);
  for(const kind of ['ITEM','TECNICA','PASSIVA','TITULO']){
   const actor='TEST_CONTENT_'+kind+'_'+Date.now();
   await service.start(actor,'TEST_CHAT',kind);
   const data={nome:actor,descricao:'Conteúdo temporário de teste, revertido ao final.',rank:'D',categoria:kind==='ITEM'?'Acessório':'Suporte',slot:'Acessórios',forca:'10',resistencia:'0',velocidade:'0',sentidos:'0',inteligencia:'0',poder_magico:'0',efeito:'Efeito de teste.',condicao:'Durante o teste.',preco:'0',tipo:'Ativa',classe:'Geral',custo_mana:'50',cooldown:'2',nivel_desbloqueio:'1'};
   for(const [key] of fields[kind])await service.consume(actor,'TEST_CHAT',data[key]);
   const preview=await service.consume(actor,'TEST_CHAT',String(player.id));assert.match(preview,/PERTENCENTE/);
   assert.equal(await q.get('SELECT operation_id FROM custom_content_receipts WHERE author=?',[actor]),null);
   assert.match(await service.consume(actor,'TEST_CHAT','sim'),/entrega concluídos/);
   assert.equal(await service.consume(actor,'TEST_CHAT','sim'),null);
   const receipt=await q.get('SELECT * FROM custom_content_receipts WHERE author=?',[actor]);assert.equal(Number(receipt.player_id),Number(player.id));
   if(kind==='ITEM')assert.ok(await q.get('SELECT id FROM inventario_jogador WHERE jogador_id=? AND item_id=?',[player.id,receipt.entity_id]));
   if(kind==='TECNICA')assert.ok(await q.get('SELECT id FROM jogador_tecnicas WHERE jogador_id=? AND tecnica_id=?',[player.id,receipt.entity_id]));
   if(kind==='TITULO')assert.equal((await q.get('SELECT titulo FROM jogadores WHERE id=?',[player.id])).titulo,actor);
   if(kind==='PASSIVA')assert.ok(JSON.parse((await q.get('SELECT passivas_ativas FROM jogadores WHERE id=?',[player.id])).passivas_ativas).some(p=>p.nome===actor));
  }
  throw rolledBack;
 });}catch(error){if(error!==rolledBack)throw error;}
 console.log('Quatro tipos criados e entregues no PostgreSQL; todas as alterações temporárias revertidas.');
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{if(require('../packages/database/config').provider==='postgres')await require('../packages/database/postgres').getPool().end();});
