'use strict';
const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const number=value=>{const parsed=Number(value);return Number.isSafeInteger(parsed)?parsed:null;};
const time=value=>Number.isFinite(Date.parse(value))?Date.parse(value):0;
const family=source=>String(source||'SISTEMA').replace(/_NATIVE$/,'').replace(/^ADM:.*/,'ADM').replace(/^LOJA$/,'ECONOMIA');
function event(data){return {type:String(data.type||'Sistema'),resource:String(data.resource||data.type||'Movimentação'),quantity:number(data.quantity),direction:['entrada','saida','informativo'].includes(data.direction)?data.direction:'informativo',reason:String(data.reason||'').trim(),origin:String(data.origin||'SISTEMA'),reference:data.reference?String(data.reference):null,date:data.date||null,source:String(data.source||data.origin||'SISTEMA')};}
function normalizedResource(value){const text=normalize(value);if(/^(?:\d+ )?xp$/.test(text))return 'xp';if(/^(?:\d+ )?wons?$/.test(text))return 'won';if(/^(?:\d+ )?cristais?$/.test(text))return 'cristais';if(/^(?:\d+ )?maestria$/.test(text))return 'maestria';return text;}
function signature(item){const moment=time(item.date);return [normalizedResource(item.resource),item.quantity,item.direction,moment?Math.floor(moment/10000):item.reference||`${item.source}:${normalize(item.reason)}`].join('|');}
function score(item){return (item.reference?30:0)+Math.min(item.reason.length,100)+(item.quantity!==null?10:0)+(item.source.endsWith('_NATIVE')?100:0);}
function deduplicate(events){
 const result=[];
 for(const item of events.sort((a,b)=>time(b.date)-time(a.date))){
  const index=result.findIndex(other=>signature(other)===signature(item)&&family(other.origin)===family(item.origin)&&other.source!==item.source&&(!other.reference||!item.reference||other.reference===item.reference));
  if(index<0)result.push(item);else if(score(item)>score(result[index]))result[index]=item;
 }
 return result.sort((a,b)=>time(b.date)-time(a.date));
}
async function safe(database,sql,args=[]){try{return await database.all(sql,args);}catch(error){console.error('[HISTÓRICO] Fonte indisponível:',error.message);return [];}}
async function collect(database,player){
 await Promise.all([database.ensurePlayerHistorySchema(),database.ensureGachaEngineSchema(),database.ensureCrystalSchema()]);
 const queries=await Promise.all([
  safe(database,'SELECT tipo,direcao,recurso,quantidade,descricao,origem,referencia,data FROM historico_ficha WHERE jogador_id=? ORDER BY data DESC LIMIT 300',[player.id]),
  safe(database,'SELECT tipo,descricao,data FROM atividades_registro WHERE jogador_id=? ORDER BY data DESC LIMIT 200',[player.id]),
  safe(database,'SELECT id,item,preco,data FROM compras WHERE jogador_id=? ORDER BY data DESC LIMIT 200',[player.id]),
  safe(database,'SELECT id,premio_tipo,premio_valor,data FROM premios_dungeon WHERE jogador_id=? ORDER BY data DESC LIMIT 200',[player.id]),
  safe(database,'SELECT valor,tipo,motivo,data FROM transacoes WHERE jogador_id=? ORDER BY data DESC LIMIT 300',[player.id]),
  safe(database,'SELECT quantidade,motivo,data FROM experiencia_historico WHERE jogador_id=? ORDER BY data DESC LIMIT 300',[player.id]),
  safe(database,'SELECT valor,descricao,data FROM historico_maestria WHERE jogador_id=? ORDER BY data DESC LIMIT 200',[player.id]),
  safe(database,'SELECT quantidade,tipo,saldo_resultante,origem,referencia,contexto,criado_em FROM historico_cristais WHERE jogador_id=? ORDER BY criado_em DESC LIMIT 300',[player.id]),
  safe(database,'SELECT quantidade,tipo,saldo_resultante,origem,criado_em FROM historico_fragmentos_invocacao WHERE jogador_id=? ORDER BY criado_em DESC LIMIT 300',[player.id]),
  safe(database,`SELECT o.id AS operacao_id,o.banner_nome,o.criado_em,r.posicao,r.nome,r.quantidade,r.estrelas,r.duplicata,r.recompensa_entregue,r.fragmentos_invocacao_recebidos
    FROM gacha_resultados r JOIN gacha_operacoes o ON o.id=r.operacao_id WHERE o.jogador_id=? ORDER BY o.criado_em DESC,r.posicao DESC LIMIT 300`,[player.id]),
  safe(database,'SELECT npc_id,resumo,atualizado_em FROM npc_resumos_cena WHERE jogador_id=? ORDER BY atualizado_em DESC LIMIT 100',[String(player.id)]),
  safe(database,'SELECT id,acao,detalhes,data,admin_nome FROM admin_logs WHERE alvo=? ORDER BY data DESC LIMIT 200',[player.nome])
 ]);
 const [ledger,activities,purchases,dungeon,transactions,xp,mastery,crystals,fragments,gacha,narrative,admin]=queries;
 const events=[];
 for(const r of ledger){const type=r.tipo==='Recompensa'&&r.origem==='GACHA'?'Gacha':r.tipo;events.push(event({type,resource:r.recurso,quantity:r.quantidade,direction:r.direcao,reason:r.descricao,origin:r.origem,reference:r.referencia,date:r.data,source:'LEDGER'}));}
 for(const r of activities)events.push(event({type:r.tipo,resource:r.tipo,reason:r.descricao,origin:'ATIVIDADE',date:r.data,source:'ATIVIDADE'}));
 for(const r of purchases)events.push(event({type:'Compra',resource:'Won',quantity:Math.abs(number(r.preco)||0),direction:'saida',reason:`Compra de ${r.item}`,origin:'LOJA',reference:`compra:${r.id}`,date:r.data,source:'COMPRAS'}));
 for(const r of dungeon){const q=number(r.premio_valor);events.push(event({type:'Dungeon',resource:r.premio_tipo||'Prêmio',quantity:q,direction:'entrada',reason:q===null?String(r.premio_valor||'Prêmio escolhido'):'Prêmio escolhido',origin:'DUNGEON',reference:`premio_dungeon:${r.id}`,date:r.data,source:'DUNGEON_NATIVE'}));}
 for(const r of transactions){const out=/gasto|compra/i.test(r.tipo),mining=/mineracao|mineração.*dungeon/i.test(r.motivo);events.push(event({type:'Won',resource:'Won',quantity:Math.abs(number(r.valor)||0),direction:out?'saida':'entrada',reason:r.motivo,origin:mining?'DUNGEON_MINERACAO':'ECONOMIA',date:r.data,source:'TRANSACOES'}));}
 for(const r of xp){const mining=/mineracao|mineração.*dungeon/i.test(r.motivo);events.push(event({type:'XP',resource:'XP',quantity:Math.abs(number(r.quantidade)||0),direction:'entrada',reason:r.motivo,origin:mining?'DUNGEON_MINERACAO':'PROGRESSO',date:r.data,source:'XP_NATIVE'}));}
 for(const r of mastery)events.push(event({type:'Maestria',resource:'Maestria',quantity:Math.abs(number(r.valor)||0),direction:'saida',reason:r.descricao,origin:'TECNICA',date:r.data,source:'MAESTRIA_NATIVE'}));
 for(const r of crystals)events.push(event({type:'Cristais',resource:'Cristais',quantity:Math.abs(number(r.quantidade)||0),direction:r.tipo==='saida'?'saida':'entrada',reason:r.contexto||r.origem,origin:r.origem||'CRISTAIS',reference:r.referencia,date:r.criado_em,source:'CRISTAIS_NATIVE'}));
 for(const r of fragments)events.push(event({type:'Fragmentos',resource:'Fragmentos de Invocação',quantity:Math.abs(number(r.quantidade)||0),direction:r.tipo==='saida'?'saida':'entrada',reason:r.origem,origin:r.origem||'GACHA',date:r.criado_em,source:'FRAGMENTOS_NATIVE'}));
 for(const r of gacha){const duplicate=Number(r.duplicata)===1;events.push(event({type:'Gacha',resource:duplicate?'Fragmentos de Invocação':r.nome,quantity:duplicate?Number(r.fragmentos_invocacao_recebidos):Number(r.quantidade),direction:'entrada',reason:`${r.estrelas||3}★ em ${r.banner_nome||'Banner'}${duplicate?' — duplicata convertida':''}`,origin:'GACHA',reference:`gacha:${r.operacao_id}:${r.posicao}`,date:r.criado_em,source:'GACHA_NATIVE'}));}
 for(const r of narrative)events.push(event({type:'Cena com NPC',resource:'Narrativa',reason:r.resumo,origin:'NARRATIVA',reference:`npc:${r.npc_id}`,date:r.atualizado_em,source:'NARRATIVA'}));
 for(const r of admin)events.push(event({type:'Ação da ADM',resource:r.acao||'Administração',reason:r.detalhes||r.acao,origin:`ADM: ${r.admin_nome||'Administração'}`,reference:`admin_log:${r.id}`,date:r.data,source:'ADM'}));
 return deduplicate(events.filter(item=>item.reason||item.quantity!==null));
}
function parseRequest(body){const terms=normalize(body).replace(/^historico\b|^atividades\b/,'').trim().split(' ').filter(Boolean);let page=1;const words=[];for(const term of terms){if(/^\d+$/.test(term))page=Math.max(1,Number(term));else words.push(term);}return {page,filter:words.join(' ')};}
function filter(events,value){if(!value)return events;const needle=normalize(value);return events.filter(item=>normalize(`${item.type} ${item.resource} ${item.origin} ${item.reason}`).includes(needle));}
module.exports={collect,deduplicate,event,parseRequest,filter,normalize,time,normalizedResource};
