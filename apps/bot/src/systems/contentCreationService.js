'use strict';
const {randomUUID}=require('node:crypto');
const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const common=[['nome','Qual é o *nome*?'],['descricao','Envie a *descrição completa*.'],['rank','Qual é o *rank*? E, D, C, B, A ou S.']];
const fields={
 ITEM:[...common,['categoria','Qual é o *tipo*? Arma, Armadura, Escudo, Acessório ou Consumível.'],['slot','Qual é o *slot*? Cabeça, Corpo, Acessórios, Item de Apoio, Pernas, Pés, Arma 1 ou Arma 2.'],...['forca','resistencia','velocidade','sentidos','inteligencia','poder_magico'].map(key=>[key,`Qual o bônus de *${key.replace('_',' ')}*? Inteiro não negativo; 0 se não houver.`]),['efeito','Descreva o *efeito especial*, ou responda Nenhum.'],['condicao','Qual a *condição de uso/ativação*? Responda Nenhuma se não houver.'],['preco','Qual o *valor em Won*? 0 para não ter valor de venda.']],
 PASSIVA:[...common,['categoria','Qual a *categoria* da passiva?'],['efeito','Descreva o *efeito* e seus limites.'],['condicao','Qual a *condição de ativação*?']],
 TITULO:[...common,['categoria','Qual a *categoria* do título?'],['efeito','Quais os *efeitos*? Responda Nenhum se for apenas narrativo.'],['condicao','Como o título foi *obtido*?']],
 TECNICA:[...common,['tipo','A técnica é *Ativa* ou *Passiva*?'],['categoria','Qual a *categoria*? Física, Mágica ou Suporte.'],['classe','Qual a *classe*? Informe o nome ou Geral.'],['custo_mana','Qual o *custo de mana*? Inteiro não negativo.'],['cooldown','Qual o *cooldown* em turnos? Inteiro não negativo.'],['nivel_desbloqueio','Qual o *nível de desbloqueio*? Inteiro a partir de 1.']]
};
const labels={ITEM:'ITEM ÚNICO',PASSIVA:'PASSIVA',TITULO:'TÍTULO',TECNICA:'TÉCNICA ÚNICA'};
const destination={ITEM:'Inventário (sem equipar)',PASSIVA:'Passivas ativas da ficha',TITULO:'Título da ficha (substitui o atual)',TECNICA:'Técnicas aprendidas da ficha'};
const compatibleSlots={Arma:['Arma 1','Arma 2'],Armadura:['Cabeça','Corpo','Pernas','Pés'],Escudo:['Arma 1','Arma 2','Item de Apoio'],'Acessório':['Acessórios'],'Consumível':['Item de Apoio']};
function sheet(kind,data,player){
 const lines=[`*═══ FICHA DE ${labels[kind]} ═══*`,`> *NOME:* ${data.nome}`,`> *RANK:* ${data.rank}`,`> *DESCRIÇÃO:* ${data.descricao}`];
 for(const [key] of fields[kind].slice(3))lines.push(`> *${key.replaceAll('_',' ').toUpperCase()}:* ${data[key]}`);
 if(player)lines.push(`> *PERTENCENTE:* ${player.nome} (ID ${player.id})`,`> *DESTINO:* ${destination[kind]}`);
 return lines.join('\n');
}
function question(state){
 const list=fields[state.kind];
 if(state.step<list.length)return list[state.step][1];
 if(!state.player)return 'Qual é o *nome completo do jogador* que receberá? Também pode informar o ID. O destino será conferido antes da entrega.';
 return sheet(state.kind,state.data,state.player)+'\n\n*Deseja cadastrar e entregar para este jogador?* Responda *sim* ou *não*.\nUse !cancelar conteudo para cancelar.';
}
function validate(key,text){
 const value=String(text||'').trim();
 if(!value||value.length>(key==='nome'?120:6000))throw new Error('Preencha o campo com texto válido (nome até 120; demais até 6.000 caracteres).');
 if(key==='rank'){if(!/^[EDCBAS]$/i.test(value))throw new Error('Rank deve ser E, D, C, B, A ou S.');return value.toUpperCase();}
 if(['forca','resistencia','velocidade','sentidos','inteligencia','poder_magico','preco','custo_mana','cooldown','nivel_desbloqueio'].includes(key)){
  if(!/^\d+$/.test(value)||!Number.isSafeInteger(Number(value))||Number(value)>(key==='preco'?1000000000:1000000)||Number(value)<(key==='nivel_desbloqueio'?1:0))throw new Error('Informe um inteiro válido dentro do limite.');
  return Number(value);
 }
 const options={tipo:['Ativa','Passiva'],slot:['Cabeça','Corpo','Acessórios','Item de Apoio','Pernas','Pés','Arma 1','Arma 2']};
 if(options[key]){const result=options[key].find(option=>normalize(option)===normalize(value));if(!result)throw new Error('Escolha uma das opções da pergunta.');return result;}
 return value;
}
function createService(database,provider,getEngine){
 let ready;
 async function ensure(){if(!ready)ready=(async()=>{
  await database.ensureEquipmentSetSchema();await database.ensurePlayerHistorySchema();
  await database.run('CREATE TABLE IF NOT EXISTS content_creation_sessions(actor TEXT PRIMARY KEY,chat TEXT NOT NULL,state_json TEXT NOT NULL)');
  await database.run('CREATE TABLE IF NOT EXISTS custom_content_receipts(operation_id TEXT PRIMARY KEY,kind TEXT NOT NULL,entity_id BIGINT NOT NULL,player_id BIGINT NOT NULL,sheet_json TEXT NOT NULL,author TEXT NOT NULL,created_at TEXT NOT NULL)');
 })().catch(error=>{ready=null;throw error;});return ready;}
 async function get(actor,chat){await ensure();return database.get('SELECT * FROM content_creation_sessions WHERE actor=?'+(chat?' AND chat=?':''),chat?[actor,chat]:[actor]);}
 async function start(actor,chat,kind){
  if(!fields[kind])throw new Error('Tipo de conteúdo inválido.');await ensure();
  const state={operation:randomUUID(),kind,step:0,data:{}};
  await database.run('INSERT INTO content_creation_sessions(actor,chat,state_json) VALUES(?,?,?)',[actor,chat,JSON.stringify(state)]);
  return question(state);
 }
 async function consume(actor,chat,input){await ensure();return database.transaction(async q=>{
  const row=await q.get('SELECT * FROM content_creation_sessions WHERE actor=? AND chat=?'+(provider==='postgres'?' FOR UPDATE':''),[actor,chat]);
  if(!row)return null;const state=JSON.parse(row.state_json),value=normalize(input);
  if(value==='!cancelar conteudo'||value==='nao'){
   // "não" cancela apenas na confirmação; texto continua válido em outros campos.
   if(value.startsWith('!')||state.player){await q.run('DELETE FROM content_creation_sessions WHERE actor=?',[actor]);return 'Criação cancelada. Nada foi cadastrado ou entregue.';}
  }
  const list=fields[state.kind];
  if(state.step<list.length){const key=list[state.step][0];state.data[key]=validate(key,input);
   if(key==='categoria'&&state.kind==='ITEM'){
    const types=['Arma','Armadura','Escudo','Acessório','Consumível'];const canonical=types.find(t=>normalize(t)===normalize(input));
    if(!canonical)throw new Error('Escolha Arma, Armadura, Escudo, Acessório ou Consumível.');state.data[key]=canonical;
   }
   if(key==='slot'&&!compatibleSlots[state.data.categoria]?.includes(state.data.slot))throw new Error('Este slot não corresponde ao tipo do item. Informe um slot compatível.');
   if(key==='categoria'&&state.kind==='TECNICA'){
    const canonical=['Física','Mágica','Suporte'].find(option=>normalize(option)===normalize(input));
    if(!canonical)throw new Error('Escolha Física, Mágica ou Suporte.');state.data[key]=canonical;
   }
   state.step++;
  }else if(!state.player){
   const players=/^\d+$/.test(String(input).trim())?await q.all('SELECT id,nome FROM jogadores WHERE id=?',[Number(input)]):
    (await q.all('SELECT id,nome FROM jogadores')).filter(player=>normalize(player.nome)===normalize(input));
   if(players.length!==1)throw new Error(players.length?'Nome ambíguo. Informe o ID do jogador.':'Jogador não encontrado. Informe o nome completo da ficha ou ID.');
   state.player=players[0];
  }else{
   if(value!=='sim')throw new Error('Responda sim para cadastrar e entregar ou não para cancelar.');
   const player=await q.get('SELECT * FROM jogadores WHERE id=?'+(provider==='postgres'?' FOR UPDATE':''),[state.player.id]);
   if(!player||player.nome!==state.player.nome)throw new Error('O destino mudou. Cancele e identifique o jogador novamente.');
   const data=state.data;
   for(const [key] of list)validate(key,String(data[key]));
   if(state.kind==='ITEM'){
    if(!compatibleSlots[data.categoria]?.includes(data.slot))throw new Error('O slot não corresponde ao tipo do item. Cancele e informe uma combinação válida.');
   }
   const table=state.kind==='TECNICA'?'tecnicas':'itens';
   if(provider==='postgres')await q.get('SELECT pg_advisory_xact_lock(74190322)');
   if((await q.all(`SELECT nome FROM ${table}`)).some(item=>normalize(item.nome)===normalize(data.nome)))throw new Error('Já existe conteúdo com este nome. Cancele e crie com um nome diferente.');
   let id;
   async function insert(sql,args){return Number(provider==='postgres'?(await q.get(sql+' RETURNING id',args)).id:(await q.run(sql,args)).lastID);}
   if(state.kind==='TECNICA')id=await insert('INSERT INTO tecnicas(nome,classe,categoria,tipo,descricao,descricao_completa,custo_mana,cooldown,nivel_desbloqueio,passiva,rank) VALUES(?,?,?,?,?,?,?,?,?,?,?)',[data.nome,data.classe,data.categoria,data.tipo,data.descricao,sheet(state.kind,data,player),String(data.custo_mana),data.cooldown,data.nivel_desbloqueio,data.tipo==='Passiva'?1:0,data.rank]);
   else{
    const isItem=state.kind==='ITEM';
    id=await insert('INSERT INTO itens(nome,categoria,slot,tier,descricao,efeito,item_unico,arma,armadura,escudo,acessorio,consumivel,forca_bonus,resistencia_bonus,velocidade_bonus,sentidos_bonus,inteligencia_bonus,poder_magico_bonus,preco,valor) VALUES(?,?,?,?,?,?,1,?,?,?,?,?,?,?,?,?,?,?,?,?)',[data.nome,isItem?data.slot:state.kind==='TITULO'?'Título':'Passiva',isItem?data.slot:'Item de Apoio',data.rank,data.descricao,`${data.efeito}\nCondição: ${data.condicao}`,...['Arma','Armadura','Escudo','Acessório','Consumível'].map(type=>isItem&&data.categoria===type?1:0),...['forca','resistencia','velocidade','sentidos','inteligencia','poder_magico'].map(key=>isItem?data[key]:0),isItem?data.preco:0,isItem?data.preco:0]);
    if(!isItem)await q.run('INSERT INTO banner_rare_items(item_id,tipo,criado_por) VALUES(?,?,?)',[id,state.kind,actor]);
   }
   const engine=getEngine();const reward=await engine.resolverRecompensa({reward_type:state.kind,referencia_id:String(id),quantidade:1},q);
   await engine.entregar(q,player,reward,'ADM_CONTEUDO_PERSONALIZADO');
   await require('../../../../packages/database/reward-receipt').record(database,q,{playerId:Number(player.id),origin:'ADM_CONTEUDO_PERSONALIZADO',reference:state.operation,rewards:[{name:data.nome,quantity:1}]});
   await q.run('INSERT INTO custom_content_receipts(operation_id,kind,entity_id,player_id,sheet_json,author,created_at) VALUES(?,?,?,?,?,?,?)',[state.operation,state.kind,id,player.id,JSON.stringify(data),actor,new Date().toISOString()]);
   await q.run('DELETE FROM content_creation_sessions WHERE actor=?',[actor]);
   return `${sheet(state.kind,data,player)}\n\n*Cadastro e entrega concluídos.*\nConsulta: !consultar ${state.kind==='TECNICA'?'tecnica':state.kind==='PASSIVA'?'passiva':state.kind==='TITULO'?'titulo':'item'} ${data.nome}`;
  }
  await q.run('UPDATE content_creation_sessions SET state_json=? WHERE actor=?',[JSON.stringify(state),actor]);return question(state);
 });}
 return {ensure,get,start,consume};
}
module.exports={createService,fields,question,sheet,normalize};
