'use strict';
const MessageService=require('../core/messageService');
const database=require('../../../../packages/database');
const History=require('../systems/playerHistoryService');
const PAGE_SIZE=15;
const icons={Gacha:'✦',Dungeon:'⚔',XP:'◆',Won:'₩',Cristais:'◇',Maestria:'◈',Compra:'▣',Fragmentos:'✧','Cena com NPC':'☾','Ação da ADM':'♛'};
const formatNumber=value=>Number(value).toLocaleString('pt-BR');
function visibleDate(value){const date=new Date(value);return Number.isNaN(date.getTime())?'Data não informada':date.toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'});}
function visibleOrigin(value){return String(value||'SISTEMA').replaceAll('_',' ').toLocaleLowerCase('pt-BR').replace(/\b\w/g,char=>char.toLocaleUpperCase('pt-BR'));}
function compact(text,max=210){const value=String(text||'').replace(/\s+/g,' ').trim();return value.length>max?value.slice(0,max-1)+'…':value;}
function line(item,index){
 const marker=icons[item.type]||'•';const movement=item.quantity===null?'':`${item.direction==='saida'?'−':item.direction==='entrada'?'+':'='}${formatNumber(item.quantity)} ${item.resource}`;
 const reason=compact(item.reason);const details=[movement,reason].filter(Boolean).join(' — ');
 return `${marker} *${index}. ${item.type}*  ·  ${visibleDate(item.date)}\n${details||item.resource}\n_Origem: ${visibleOrigin(item.origin)}${item.reference?` · Ref.: ${compact(item.reference,60)}`:''}_`;
}
module.exports=async msg=>{
 try{
  const player=await database.playerByPhone(msg.author||msg.from);
  if(!player)return MessageService.send({message:msg,text:'[!] Não foi possível encontrar sua ficha.'});
  const request=History.parseRequest(msg.body),all=History.filter(await History.collect(database,player),request.filter);
  const pages=Math.max(1,Math.ceil(all.length/PAGE_SIZE)),page=Math.min(request.page,pages),start=(page-1)*PAGE_SIZE,visible=all.slice(start,start+PAGE_SIZE);
  const input=all.filter(item=>item.direction==='entrada').length;
  const output=all.filter(item=>item.direction==='saida').length;
  const balances=`*Nível ${formatNumber(player.nivel||1)}*  ·  *Rank ${player.rank||'E'}*\nXP: ${formatNumber(player.experiencia||0)}  ·  Won: ${formatNumber(player.won||0)}\nCristais: ${formatNumber(player.cristais||0)}  ·  Maestria: ${formatNumber(player.maestria||0)}`;
  const title=request.filter?`Filtro: *${request.filter}* · `:'';
  const body=visible.length?visible.map((item,i)=>line(item,start+i+1)).join('\n\n'):'Nenhuma movimentação encontrada.';
  const navigation=pages>1?`\n\n_Página ${page}/${pages} · ${all.length} registros. Use !historico ${page<pages?page+1:1}${request.filter?' '+request.filter:''}._`:`\n\n_${all.length} registro(s) exibido(s)._`;
  return MessageService.send({message:msg,text:`╔═══════ ✦ HISTÓRICO ✦ ═══════╗\n     *${player.nome||'Jogador'}*\n╚══════════════════════════════╝\n${balances}\n──────────────────────────\n${title}Movimentações: ${all.length} · Entradas: ${input} · Saídas: ${output}\n──────────────────────────\n${body}${navigation}\n_Filtros: gacha, dungeon, xp, won, cristais, maestria, loja, narrativa ou ADM._`});
 }catch(error){console.error('[HISTÓRICO]',error);return MessageService.send({message:msg,text:'[!] Não foi possível consultar o histórico agora. Tente novamente em alguns instantes.'});}
};
module.exports.line=line;module.exports.visibleDate=visibleDate;
