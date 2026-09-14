const MessageService=require('../core/messageService');
const TicketSystem=require('../systems/ticketSystem');
const {normalize}=require('../systems/ticketSelector');
module.exports=async msg=>{
 try{
  const input=msg.body.replace(/^!fila\s+tickets\b/i,'').trim();
  const rows=await TicketSystem.getFilaCompleta();
  if(input){
   const matches=rows.filter(row=>normalize(row.jogador_nome)===normalize(input));
   if(matches.length!==1)return MessageService.send({message:msg,text:matches.length?'Nome ambíguo. Informe o nome completo.':'Este jogador não possui solicitação pendente na fila de tickets.'});
   const row=matches[0];return MessageService.send({message:msg,text:`*${row.jogador_nome}* — posição ${row.posicao}.\n${row.posicao-1} solicitação(ões) à frente.`});
  }
  return MessageService.send({message:msg,text:'*FILA DE TICKETS*\n'+(rows.length?rows.map(row=>`${row.posicao}. ${row.jogador_nome} — ${row.tipo==='item_unico'?'Item Único':'Técnica Única'}`).join('\n'):'Nenhuma solicitação pendente.')});
 }catch(error){return MessageService.send({message:msg,text:`Não foi possível consultar a fila: ${error.message}`});}
};
