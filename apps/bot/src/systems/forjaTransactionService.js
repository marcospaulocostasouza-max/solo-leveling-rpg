'use strict';
const database=require('../../../../packages/database');
const {provider}=require('../../../../packages/database/config');
const Inventory=require('./inventorySystem');
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const colors={E:'branco',D:'amarelo',C:'verde',B:'azul',A:'vermelho',S:'roxo'};
function materialMatches(item,name){
 if(Number(item.equipado)===1||!/(material|nucleo|minerio)/.test(normalize(item.categoria)))return false;
 const a=normalize(item.nome),b=normalize(name);
 if(a===b)return true;
 if(b.startsWith('nucleo '))return a===b.replace('nucleo ','nucleo de monstro ')||a===`nucleo de monstro rank ${Object.keys(colors).find(r=>colors[r]===b.slice(7))?.toLowerCase()}`;
 return false;
}
async function emptySlots(query,playerId){
 const items=await query.all('SELECT i.* FROM inventario_jogador inv JOIN itens i ON i.id=inv.item_id WHERE inv.jogador_id=? AND inv.equipado=1',[playerId]);
 const counts={};for(const item of items){const slot=Inventory.getSlotDoItem(item);counts[slot]=(counts[slot]||0)+1;}
 return Object.entries(Inventory.SLOT_CAPACIDADE).filter(([s,n])=>s!=='Item de Apoio'&&(counts[s]||0)<n&&!(s==='Arma 1'&&counts['Arma 2'])&&!(s==='Arma 2'&&counts['Arma 1'])).map(([s])=>s);
}
async function syncCatalog(F){
 const catalog=F.carregarCatalogo();if(!catalog)throw Error('Catalogo indisponivel.');
 return database.transaction(async q=>{
  const entries=[...catalog.materiais.map(m=>({...m,categoria:'Material de Forja'})),...catalog.nucleos.map(n=>({...n,nome:`N\u00facleo ${n.cor}`,categoria:'Nucleo de Forja'}))];
  let created=0;for(const e of entries){const found=await q.get('SELECT id,categoria FROM itens WHERE LOWER(nome)=LOWER(?)',[e.nome]);if(found){if(!/(material|nucleo|minerio)/.test(normalize(found.categoria)))throw Error('Nome de material conflita com equipamento: '+e.nome);await q.run('UPDATE itens SET preco=?,valor=?,tier=? WHERE id=?',[e.preco,e.preco,e.rank,found.id]);continue;}await q.run('INSERT INTO itens(nome,categoria,tier,preco,valor,descricao,arma,armadura,escudo,acessorio,consumivel) VALUES(?,?,?,?,?,?,0,0,0,0,0)',[e.nome,e.categoria,e.rank,e.preco,e.preco,'Ingrediente do catalogo de forja.']);created++;}return {created};
 });
}
async function forge(F,playerId,npcName,sessionId,national=false){
 try{await database.ensurePlayerHistorySchema();return await database.transaction(async q=>{
  const lock=provider==='postgres'?' FOR UPDATE':'';
  const player=await q.get('SELECT * FROM jogadores WHERE id=?'+lock,[playerId]);if(!player)throw Error('Jogador nao encontrado.');
  let recipe,session;
  if(!national){session=await q.get('SELECT * FROM forja_sessoes WHERE id=? AND jogador_id=?'+lock,[sessionId,playerId]);if(!session||session.etapa!=='aguardando_confirmacao'||session.npc_nome!==npcName)throw Error('Encomenda ja concluida ou desatualizada.');recipe=JSON.parse(session.combinacao_resultado);if(!recipe?.materiais_necessarios)throw Error('Receita invalida.');}
  const affinity=await q.get('SELECT * FROM npc_afinidade WHERE jogador_id=? AND npc_nome=?',[playerId,npcName])||{};
  if(national&&(npcName!=='Vysache'||Number(affinity.afinidade)<100||Number(affinity.forja_nacional_disponivel)!==1))throw Error('Forja Nacional indisponivel.');
  const ranks=npcName==='Bilac'?['E','D','C','B']:npcName==='Vysache'?['A','S']:[];
  if(!national&&!ranks.includes(recipe.rank))throw Error('Receita fora da especialidade deste ferreiro.');
  const cost=national?500000:F.calcularCustoFinal(Math.floor(Number(recipe.custo)*(npcName==='Vysache'?1.5:1)),Number(affinity.afinidade||0));
  if(!Number.isSafeInteger(cost)||cost<=0)throw Error('Custo invalido.');
  if(!national&&cost!==Number(session.custo))throw Error('O orcamento mudou. Apresente novamente os materiais.');
  if(Number(player.won||0)<cost)throw Error('Saldo insuficiente: '+cost+' Won.');
  const consumed={};
  if(!national){
   const inventory=await q.all('SELECT i.*,inv.id AS inventory_id,inv.quantidade,inv.equipado FROM inventario_jogador inv JOIN itens i ON i.id=inv.item_id WHERE inv.jogador_id=?',[playerId]);
   for(const [name,quantity] of Object.entries(recipe.materiais_necessarios)){
    let remaining=Number(quantity);if(!Number.isSafeInteger(remaining)||remaining<=0)throw Error('Quantidade de material invalida.');
    for(const item of inventory.filter(i=>materialMatches(i,name))){const take=Math.min(remaining,Number(item.quantidade));if(take<=0)continue;const removed=await q.run('UPDATE inventario_jogador SET quantidade=quantidade-? WHERE id=? AND jogador_id=? AND quantidade>=? AND COALESCE(equipado,0)=0',[take,item.inventory_id,playerId,take]);if(removed.changes!==1)throw Error('Material indisponivel.');item.quantidade=Number(item.quantidade)-take;remaining-=take;consumed[item.nome]=(consumed[item.nome]||0)+take;await q.run('DELETE FROM inventario_jogador WHERE id=? AND quantidade=0',[item.inventory_id]);if(!remaining)break;}
    if(remaining)throw Error('Material insuficiente: '+name+' x'+remaining);
   }
  }
  const data=national?F.gerarItemNacional(player):recipe.itemCatalogo?F.gerarItemDoCatalogo(recipe.itemCatalogo,npcName):F.gerarItemForja(recipe,player);
  if(!national&&!recipe.itemCatalogo){for(const k of Object.keys(data.bonus))data.bonus[k]=Math.floor(data.bonus[k]*(npcName==='Bilac'?1.1:1.3));}
  if(npcName==='Bilac'){const vacant=await emptySlots(q,playerId);if(!vacant.includes(Inventory.getSlotDoItem({categoria:data.categoria})))throw Error('O slot desta encomenda foi ocupado. Apresente os materiais novamente.');}
  data.nome=`[${npcName}] ${data.nome}`;
  if(national)data.efeito='Obra Nacional: atributos fixos descritos na ficha. Efeitos adicionais dependem de validacao narrativa do ADM.';
  const keys=['forca','resistencia','velocidade','sentidos','inteligencia','poder_magico'];
  const sql='INSERT INTO itens(nome,categoria,tier,descricao,arma,armadura,escudo,acessorio,consumivel,forca_bonus,resistencia_bonus,velocidade_bonus,sentidos_bonus,inteligencia_bonus,poder_magico_bonus,efeito,preco,valor) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
  const args=[data.nome,data.categoria,data.rank,data.descricao,data.isArma,data.isArmadura,data.isEscudo,data.isAcessorio,0,...keys.map(k=>Number(data.bonus[k]||0)),data.efeito,cost,cost];
  const itemId=provider==='postgres'?(await q.get(sql+' RETURNING id',args)).id:(await q.run(sql,args)).lastID;
  await q.run('INSERT INTO inventario_jogador(jogador_id,item_id,quantidade,equipado,item_inicial) VALUES(?,?,1,0,0)',[playerId,itemId]);
  await q.run('UPDATE jogadores SET won=won-? WHERE id=?',[cost,playerId]);
  await q.run("INSERT INTO transacoes(jogador_id,valor,tipo,motivo,data) VALUES(?,?,'gasto',?,?)",[playerId,cost,'Forja: '+data.nome,new Date().toISOString()]);
  const old=Number(affinity.afinidade||0),next=national?old:Math.min(100,old+1),count=Number(affinity.itens_forjados||0)+(national?0:1),available=national?0:(npcName==='Vysache'&&old<100&&next===100?1:Number(affinity.forja_nacional_disponivel||0));
  await q.run('INSERT INTO npc_afinidade(jogador_id,npc_nome,afinidade,itens_forjados,forja_nacional_disponivel,data_ultima_forja) VALUES(?,?,?,?,?,?) ON CONFLICT(jogador_id,npc_nome) DO UPDATE SET afinidade=excluded.afinidade,itens_forjados=excluded.itens_forjados,forja_nacional_disponivel=excluded.forja_nacional_disponivel,data_ultima_forja=excluded.data_ultima_forja',[playerId,npcName,next,count,available,new Date().toISOString()]);
  await q.run('INSERT INTO forja_historico(jogador_id,npc_nome,materiais_usados,item_nome,item_categoria,item_rank,custo,tipo_forja,data) VALUES(?,?,?,?,?,?,?,?,?)',[playerId,npcName,JSON.stringify(consumed),data.nome,data.categoria,data.rank,cost,national?'nacional':'normal',new Date().toISOString()]);
  await require('../../../../packages/database/reward-receipt').record(database,q,{playerId,origin:'FORJA',reference:`forja:item:${itemId}`,rewards:[{name:data.nome,quantity:1},{name:'WON',quantity:cost,direction:'saida'}]});
  if(session)await q.run("UPDATE forja_sessoes SET etapa='concluida',item_resultado_id=? WHERE id=?",[itemId,session.id]);
  return {sucesso:true,item:data,itemId,custo:cost,materiaisConsumidos:consumed,afinidade:{afinidade:next,itens_forjados:count,forja_nacional_disponivel:available,atingiu_100:old<100&&next===100}};
 });}catch(error){console.error('[FORJA]',error.message);return {erro:error.message};}
}
module.exports={forge,emptySlots,materialMatches,syncCatalog};
