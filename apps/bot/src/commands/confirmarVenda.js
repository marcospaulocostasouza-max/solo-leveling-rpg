'use strict';
const MessageService=require('../core/messageService');
const database=require('../../../../packages/database');
const VendaSystem=require('../systems/vendaSystem');
module.exports=async msg=>{
 let text;
 try{
  const player=await database.playerByPhone(msg.author||msg.from);
  if(!player)throw Error('Sua ficha nao foi encontrada.');
  const pending=await database.get('SELECT * FROM vendas_pendentes WHERE jogador_id=? ORDER BY data DESC,id DESC LIMIT 1',[player.id]);
  if(!pending)throw Error('Nenhuma venda pendente. Use !vender <nome completo do item>.');
  const result=await VendaSystem.venderItem(player.id,pending.item_nome,Number(pending.quantidade),pending.id);
  if(!result.sucesso)throw Error(result.erro);
  text=VendaSystem.formatarMensagemSucesso(result,result.saldoNovo);
 }catch(error){console.error('[CONFIRMAR VENDA]',error.message);text=`*VENDA NAO CONCLUIDA*\n${error.message}`;}
 return MessageService.send({message:msg,text});
};
