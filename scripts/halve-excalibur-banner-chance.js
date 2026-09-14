'use strict';
require('../apps/bot/node_modules/dotenv').config({quiet:true});
const db=require('../packages/database');
const {provider}=require('../packages/database/config');
async function main(){
 const results=await db.transaction(async q=>{
  const results=[];
  // Pesos anteriores conferidos no banco. Impede reduzir novamente ao repetir o script.
  for(const expected of [{id:13,banner:2,peso:1},{id:19,banner:3,peso:0.7}]){
   const lock=provider==='postgres'?' FOR UPDATE':'';
   const banner=await q.get('SELECT id,nome FROM gacha_banners WHERE id=?'+lock,[expected.banner]);
   const rows=await q.all('SELECT * FROM gacha_banner_rewards WHERE banner_id=?'+lock,[expected.banner]);
   const reward=rows.find(r=>Number(r.id)===expected.id);
   if(!reward||String(reward.referencia_id)!=='662'||Math.abs(Number(reward.peso)-expected.peso)>1e-10)throw new Error('A configuração mudou ou a redução já foi aplicada. Nenhum peso foi alterado.');
   const item=await q.get('SELECT nome FROM itens WHERE id=?',[662]);
   if(!item?.nome.toLowerCase().includes('excalibur'))throw new Error('Item alvo não corresponde à Excalibur.');
   const total=rows.filter(r=>Number(r.ativo??1)===1&&Number(r.peso)>0).reduce((n,r)=>n+Number(r.peso),0);
   const oldWeight=Number(reward.peso),newWeight=oldWeight*(total-oldWeight)/(2*total-oldWeight);
   const before=oldWeight/total*100,after=newWeight/(total-oldWeight+newWeight)*100;
   if(!Number.isFinite(newWeight)||newWeight<=0||Math.abs(after-before/2)>1e-10)throw new Error('Falha ao calcular a nova chance.');
   await q.run('UPDATE gacha_banner_rewards SET peso=? WHERE id=?',[newWeight,reward.id]);
   await q.run('UPDATE gacha_banners SET atualizado_em=CURRENT_TIMESTAMP WHERE id=?',[banner.id]);
   results.push({banner:banner.nome,recompensa:item.nome,antes:before,depois:after,garantia100:Number(reward.grande_premio)===1});
  }
  return results;
 });
 console.log(JSON.stringify(results,null,2));
}
main().catch(error=>{console.error(error.message);process.exitCode=1;}).finally(async()=>{if(provider==='postgres')await require('../packages/database/postgres').getPool().end();});
