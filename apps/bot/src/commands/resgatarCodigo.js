'use strict';
const MessageService=require('../core/messageService');
const database=require('../../../../packages/database');
const {getService}=require('../../../../packages/database/redeem');
module.exports=async function(msg){
 const match=String(msg.body||'').trim().match(/^!resgatar\s+c[oó]digo\s*:\s*([A-Za-z0-9_-]{3,64})\s*$/i);
 let text;
 try{
  if(!match)text='Use *!resgatar codigo: SOLO2026*.';
  else{
   const player=await database.playerByPhone(msg.author||msg.from);
   if(!player)text='Sua ficha não foi encontrada. Você precisa de um personagem para resgatar códigos.';
   else{
    const result=await getService().claim(Number(player.id),match[1]);
    text=`*${result.message}*\n\n${result.rewards.map(r=>`• +${Number(r.quantidade).toLocaleString('pt-BR')} ${r.nome}`).join('\n')}`;
   }
  }
 }catch(error){
  const known=['INVALID_CODE','EXPIRED','NOT_STARTED','ALREADY_CLAIMED','LIMIT_REACHED','PLAYER_NOT_FOUND'];
  if(known.includes(error.code))text=error.message;
  else{console.error('[BOT REDEEM] Falha:',error.code||'INTERNAL_ERROR');text='Não foi possível entregar as recompensas. Nenhum resgate foi concluído; tente novamente.';}
 }
 // Falha de envio da confirmação não muda o resgate já salvo.
 return MessageService.send({message:msg,text});
};
