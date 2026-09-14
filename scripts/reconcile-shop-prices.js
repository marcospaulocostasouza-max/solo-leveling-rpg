'use strict';
require('dotenv').config();
const database=require('../packages/database');
const {catalogPrice}=require('../packages/datasets/item-pricing');
const catalog=require('../packages/datasets/catalog').listShopItems();
async function reconcile(){return database.transaction(async q=>{
 const rows=await q.all('SELECT id,nome,tier,preco,valor FROM itens WHERE COALESCE(preco,0)=0');const updated=[];
 for(const item of rows){const price=catalogPrice(item,catalog);if(!price)continue;
  const result=await q.run('UPDATE itens SET preco=?,valor=? WHERE id=? AND COALESCE(preco,0)=0',[price,price,item.id]);
  if(result.changes===1)updated.push({nome:item.nome,preco:price,venda:Math.floor(price/2)});
 }
 return updated;
});}
if(require.main===module)reconcile().then(rows=>console.log(JSON.stringify(rows,null,2))).catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{if(require('../packages/database/config').provider==='postgres')await require('../packages/database/postgres').getPool().end();});
module.exports={reconcile};
