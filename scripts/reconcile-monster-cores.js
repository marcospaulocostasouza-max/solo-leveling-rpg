'use strict';
require('dotenv').config();
const database=require('../packages/database');
const cores=require('../packages/datasets/monster-cores');
async function reconcile(){return database.transaction(async query=>{
 const items=await query.all("SELECT id,nome,tier,preco,valor FROM itens WHERE LOWER(nome) LIKE '%cleo%'");
 const updated=[];
 for(const item of items){const rank=cores.coreRank(item);if(!rank)continue;
  await query.run('UPDATE itens SET preco=?,valor=?,tier=? WHERE id=?',[cores.prices[rank],cores.prices[rank],rank,item.id]);
  updated.push({id:item.id,nome:item.nome,rank,preco:cores.prices[rank]});
 }
 return updated;
});}
if(require.main===module)reconcile().then(result=>console.log(JSON.stringify(result,null,2))).catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{if(require('../packages/database/config').provider==='postgres')await require('../packages/database/postgres').getPool().end();});
module.exports={reconcile};
