'use strict';
const normalizeCode=value=>String(value||'').trim().toUpperCase();
function fail(code,message){throw Object.assign(new Error(message),{code});}
function createService(database,provider,engine){
 let ready;
 async function ensure(){
  if(!ready)ready=(async()=>{
   await database.ensureGachaEngineSchema();await database.ensurePlayerHistorySchema();
   let sql=require('./redeem-schema');
   if(provider==='postgres')sql=sql.replaceAll('INTEGER PRIMARY KEY AUTOINCREMENT','BIGSERIAL PRIMARY KEY');
   for(const statement of sql.split(';').map(s=>s.trim()).filter(Boolean))await database.run(statement);
  })().catch(error=>{ready=null;throw error;});
  return ready;
 }
 function validateRewards(rewards){
  if(!Array.isArray(rewards)||!rewards.length||rewards.length>30)fail('INVALID_REWARDS','Adicione de 1 a 30 recompensas.');
  const scalar=new Set(['XP','WON','CRISTAIS','MAESTRIA']);
  return rewards.map(r=>{
   const type=String(r.reward_type||'').toUpperCase();
   if(!Number.isSafeInteger(r.quantidade)||r.quantidade<=0||r.quantidade>1000000000)fail('INVALID_REWARDS','Quantidade inválida.');
   if(!scalar.has(type)&&(!Number.isSafeInteger(Number(r.referencia_id))||Number(r.referencia_id)<=0))fail('INVALID_REWARDS','Referência de catálogo inválida.');
   if(['TECNICA','TITULO'].includes(type)&&r.quantidade!==1)fail('INVALID_REWARDS','Título e técnica devem ter quantidade 1.');
   if(!scalar.has(type)&&r.quantidade>1000)fail('INVALID_REWARDS','Máximo de 1000 unidades por recompensa de catálogo.');
   return {reward_type:type,quantidade:r.quantidade,referencia_id:scalar.has(type)?null:String(r.referencia_id),unica:0};
  });
 }
 async function create(actor,data){
  if(!await database.get('SELECT numero FROM administradores WHERE numero=?',[actor]))fail('FORBIDDEN','Apenas ADM pode criar códigos.');
  await ensure();const code=normalizeCode(data.code);
  if(!/^[A-Z0-9_-]{3,64}$/.test(code))fail('INVALID_CODE','Use 3 a 64 letras, números, hífen ou underline.');
  const rewards=validateRewards(data.rewards);
  if(rewards.filter(r=>r.reward_type==='TITULO').length>1)fail('INVALID_REWARDS','Cada código pode entregar apenas um título, pois a ficha possui um título atual.');
  const start=new Date(data.starts_at||Date.now()),end=data.expires_at?new Date(data.expires_at):null;
  if(Number.isNaN(start.getTime())||(end&&(Number.isNaN(end.getTime())||end<=start)))fail('INVALID_DATE','Período inválido.');
  if(data.max_global_uses!=null&&(!Number.isSafeInteger(data.max_global_uses)||data.max_global_uses<=0))fail('INVALID_LIMIT','Limite inválido.');
  return database.transaction(async q=>{
   for(const r of rewards)await engine.resolverRecompensa(r,q);
   if(await q.get('SELECT id FROM redeem_codes WHERE code=?',[code]))fail('CODE_EXISTS','Esse código já existe.');
   await q.run('INSERT INTO redeem_codes(code,description,rewards_json,starts_at,expires_at,max_global_uses,created_by) VALUES(?,?,?,?,?,?,?)',[code,String(data.description||'').slice(0,1000),JSON.stringify(rewards),start.toISOString(),end?.toISOString()||null,data.max_global_uses??null,actor]);
   return q.get('SELECT * FROM redeem_codes WHERE code=?',[code]);
  });
 }
 async function claim(playerId,input){
  await ensure();const code=normalizeCode(input);if(!code)fail('INVALID_CODE','Código inválido.');
  return database.transaction(async q=>{
   const lock=provider==='postgres'?' FOR UPDATE':'';
   const row=await q.get('SELECT * FROM redeem_codes WHERE code=?'+lock,[code]);
   if(!row||Number(row.active)!==1)fail('INVALID_CODE','Código inválido.');
   const now=Date.now();if(now<new Date(row.starts_at).getTime())fail('NOT_STARTED','Código ainda não está disponível.');
   if(row.expires_at&&now>=new Date(row.expires_at).getTime())fail('EXPIRED','Código expirado.');
   if(await q.get('SELECT id FROM redeem_code_claims WHERE redeem_code_id=? AND player_id=?',[row.id,playerId]))fail('ALREADY_CLAIMED','Você já resgatou este código.');
   if(row.max_global_uses!=null&&Number(row.current_uses)>=Number(row.max_global_uses))fail('LIMIT_REACHED','Este código atingiu o limite de usos.');
   const player=await q.get('SELECT * FROM jogadores WHERE id=?'+lock,[playerId]);if(!player)fail('PLAYER_NOT_FOUND','Jogador não encontrado.');
   const rewards=validateRewards(JSON.parse(row.rewards_json));const delivered=[];
   for(const reward of rewards){
    const resolved=await engine.resolverRecompensa(reward,q);
    await engine.entregar(q,await q.get('SELECT * FROM jogadores WHERE id=?',[playerId]),resolved,`REDEEM_CODE:${code}`);
    await database.registrarHistoricoFichaComQuery(q,{jogadorId:playerId,tipo:'Código de resgate',direcao:'entrada',recurso:resolved.nome,quantidade:reward.quantidade,descricao:`Código ${code}: ${reward.quantidade} ${resolved.nome}`,origem:'REDEEM_CODE',referencia:`redeem_code:${row.id}`});
    const image=resolved.entidade?.imagem || resolved.entidade?.image_url;
    delivered.push({tipo:reward.reward_type,nome:resolved.nome,quantidade:reward.quantidade,...(typeof image==='string'&&/^https?:\/\//i.test(image)?{imagem:image}:{})});
   }
   await q.run('INSERT INTO redeem_code_claims(redeem_code_id,player_id,rewards_json) VALUES(?,?,?)',[row.id,playerId,JSON.stringify(delivered)]);
   await q.run('UPDATE redeem_codes SET current_uses=current_uses+1,updated_at=CURRENT_TIMESTAMP WHERE id=?',[row.id]);
   return {success:true,code,message:'Código resgatado com sucesso.',rewards:delivered};
  });
 }
 async function info(code){await ensure();return database.get('SELECT * FROM redeem_codes WHERE code=?',[normalizeCode(code)]);}
 async function list(page=1){await ensure();return database.all('SELECT * FROM redeem_codes ORDER BY id DESC LIMIT 20 OFFSET ?',[Math.max(0,page-1)*20]);}
 async function setActive(code,active,actor){if(!await database.get('SELECT numero FROM administradores WHERE numero=?',[actor]))fail('FORBIDDEN','Apenas ADM pode gerenciar códigos.');await ensure();const r=await database.run('UPDATE redeem_codes SET active=?,updated_at=CURRENT_TIMESTAMP WHERE code=?',[active?1:0,normalizeCode(code)]);if(!r.changes)fail('INVALID_CODE','Código inválido.');}
 return {ensure,create,claim,info,list,setActive,validateRewards};
}
let service;
function getService(){if(!service)service=createService(require('./index'),require('./config').provider,require('../../apps/bot/src/systems/gachaEngine'));return service;}
module.exports={normalizeCode,createService,getService};
