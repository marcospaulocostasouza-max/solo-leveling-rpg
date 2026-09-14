const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
function fixture(admin=true){
 const sessions=new Map(),items=[{id:10,nome:'Caixa Rank B',tier:'B',categoria:'Consumível'}];let creates=0;
 const service={ensure:async()=>{},info:async()=>null,create:async()=>{creates++;}};
 const db={get:async(sql,args)=>sql.includes('redeem_creation_sessions')?(sessions.get(args[0])?.chat===args[1]?sessions.get(args[0]):null):null,all:async()=>items,run:async(sql,args)=>{if(sql.startsWith('INSERT'))sessions.set(args[0],{actor:args[0],chat:args[1],state_json:args[2]});if(sql.startsWith('DELETE'))sessions.delete(args[0]);}};
 const messages=[];const sandbox={module:{exports:{}},require:name=>name.endsWith('/redeem')?{getService:()=>service}:name.includes('packages/database')?db:name.includes('adminCore')?{isAdmin:async()=>admin}:name.includes('messageService')?{send:async m=>messages.push(m.text)}:{get:async()=>null}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../src/systems/redeemWizardService'),'utf8'),sandbox);
 return {wizard:sandbox.module.exports,messages,creates:()=>creates,sessions};
}
test('ADM responde questionário; só confirmação final cria código',async()=>{
 const f=fixture();await f.wizard.start('ADM','CHAT');
 for(const body of ['SOLO2026','Evento','agora','nunca','ilimitado','500','100000','200','0','não','sim','Caixa Rank B','1','sim','não','não','não','não','não','não','não']){
  assert.equal(await f.wizard.consumeMessage({author:'ADM',from:'CHAT',body}),true);
 }
 assert.equal(f.creates(),0);assert.match(f.messages.at(-1),/Deseja criar/);
 assert.equal(await f.wizard.consumeMessage({author:'ADM',from:'OUTRO',body:'sim'}),false);
 await f.wizard.consumeMessage({author:'ADM',from:'CHAT',body:'sim'});assert.equal(f.creates(),1);
 assert.equal(f.sessions.size,0);
});
test('jogador comum não inicia; datas inválidas são recusadas',async()=>{
 const f=fixture(false);await assert.rejects(f.wizard.start('PLAYER','CHAT'),/ADM/);assert.equal(f.sessions.size,0);
 const w=fixture().wizard;assert.throws(()=>w.parseDate('31/02/2026'),/inválida/);assert.throws(()=>w.parseDate('14/09/2026 25:00'),/inválida/);
 assert.equal(w.parseDate('30/09/2026',true),'2026-10-01T02:59:59.000Z');
});
test('validade indeterminada ou limitada com pergunta da data',async()=>{
 const w=fixture().wizard;
 for(const option of ['tempo indeterminado','para sempre','nunca']){
  const s={step:'expiry',starts_at:'2026-01-01T00:00:00.000Z'};
  await w.answer(s,option);assert.equal(s.expires_at,null);assert.equal(s.step,'limit');
 }
 const s={step:'expiry',starts_at:'2026-01-01T00:00:00.000Z'};
 await w.answer(s,'tempo limite');assert.equal(s.step,'expiryDate');assert.match(w.question(s),/data limite/);
 await w.answer(s,'30/09/2026');assert.equal(s.expires_at,'2026-10-01T02:59:59.000Z');assert.equal(s.step,'limit');
});
