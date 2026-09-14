'use strict';
require('dotenv').config();
const fs=require('node:fs');const path=require('node:path');
const database=require('../packages/database');
const {estimatePrice}=require('../packages/datasets/item-pricing');
const catalog=require('../packages/datasets/catalog').listShopItems();
async function priceItems(){return database.transaction(async q=>{
 const items=await q.all('SELECT * FROM itens ORDER BY id');const changes=[];
 for(const item of items){
  if(Number(item.preco)>0)continue;
  const estimate=estimatePrice(item,catalog);
  changes.push({id:item.id,nome:item.nome,tier:item.tier,categoria:item.categoria,previous:{preco:item.preco,valor:item.valor},...estimate,sale:Math.floor(estimate.price/2)});
  await q.run('UPDATE itens SET preco=?,valor=? WHERE id=? AND COALESCE(preco,0)<=0',[estimate.price,estimate.price,item.id]);
 }
 return {checked:items.length,changed:changes.length,estimated:changes.filter(item=>item.source==='estimado').length,changes};
});}
if(require.main===module)priceItems().then(report=>{
 const stamp=new Date().toISOString().replace(/[:.]/g,'-');
 const destination=path.resolve(__dirname,`../docs/precos-itens-estimados-${stamp}.json`);
 fs.writeFileSync(destination,JSON.stringify({generatedAt:new Date().toISOString(),...report},null,2)+'\n');
 console.log(JSON.stringify({checked:report.checked,changed:report.changed,estimated:report.estimated,report:destination}));
}).catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{if(require('../packages/database/config').provider==='postgres')await require('../packages/database/postgres').getPool().end();});
module.exports={priceItems};
