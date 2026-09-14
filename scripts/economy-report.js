'use strict';
require('dotenv').config();
const database=require('../packages/database');
async function report(){
 await database.ensurePlayerHistorySchema();
 const since=new Date(Date.now()-7*86400000).toISOString();
 const sources={};
 // As fontes originais evitam contar novamente os recibos complementares.
 for(const [name,sql] of Object.entries({
  won:"SELECT tipo, SUM(valor) AS total, COUNT(*) AS operacoes FROM transacoes WHERE data>=? GROUP BY tipo",
  xp:"SELECT SUM(quantidade) AS total, COUNT(*) AS operacoes FROM experiencia_historico WHERE data>=?",
  crystals:"SELECT tipo,origem,SUM(quantidade) AS total,COUNT(*) AS operacoes FROM historico_cristais WHERE criado_em>=? GROUP BY tipo,origem",
  receipts:"SELECT origem, recurso, direcao, SUM(quantidade) AS total, COUNT(*) AS operacoes FROM historico_ficha WHERE data>=? GROUP BY origem,recurso,direcao",
  mining:"SELECT jogador_id, COUNT(*) AS usos, SUM(xp) AS xp FROM dungeon_mineracoes WHERE data>=? GROUP BY jogador_id"
 })){
  try{sources[name]={rows:await database.all(sql,[since])};}
  catch(error){sources[name]={unavailable:true,error:error.message};}
 }
 const prices=await database.all('SELECT nome,tier,preco,valor FROM itens WHERE preco>0 ORDER BY preco DESC LIMIT 30');
 return {periodo:{inicio:since,fim:new Date().toISOString()},sources,prices,
  regras:{mineracaoCristaisPorDungeon:500,mineracaoLimiteSemanal:2,mineracaoCristaisMaximoSemanal:1000,gachaCustoPorGiro:100,girosFinanciadosPorMineracao:10},
  limites:['Recibos complementam históricos: não some as duas fontes.','Históricos incompletos não representam todos os ganhos.','Relatório não altera preços ou probabilidades.']};
}
if(require.main===module)report().then(r=>console.log(JSON.stringify(r,null,2))).catch(e=>{console.error(e.message);process.exitCode=1;}).finally(async()=>{if(require('../packages/database/config').provider==='postgres')await require('../packages/database/postgres').getPool().end();});
module.exports={report};
