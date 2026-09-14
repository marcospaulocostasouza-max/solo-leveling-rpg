'use strict';
const database=require('../../../../packages/database');
const {provider}=require('../../../../packages/database/config');
const service=require('./contentCreationService').createService(database,provider,()=>require('./gachaEngine'));
const Admin=require('../core/adminCore');
const MessageService=require('../core/messageService');
const {normalize,question}=require('./contentCreationService');
async function start(msg,kind){
 const actor=msg.author||msg.from;
 if(!await Admin.isAdmin(actor))throw new Error('Apenas ADM pode criar e entregar conteúdo.');
 if(await service.get(actor))throw new Error('Você já está criando conteúdo. Finalize ou use !cancelar conteudo.');
 if(await require('./creationWizardService').get(actor))throw new Error('Finalize a criação de banner/dungeon ou use !cancelar criação.');
 await require('../../../../packages/database/redeem').getService().ensure();
 if(await database.get('SELECT actor FROM redeem_creation_sessions WHERE actor=?',[actor]))throw new Error('Finalize a criação de código ou use !cancelar codigo.');
 return service.start(actor,msg.from,kind);
}
async function consumeMessage(msg){
 const actor=msg.author||msg.from,body=String(msg.body||'').trim();
 if(body.startsWith('!')&&!/^!(?:cancelar conteudo|criar\b)/i.test(normalize(body)))return false;
 const row=await service.get(actor);if(!row)return false;
 if(body.startsWith('!')&&normalize(body)!=='!cancelar conteudo'){
  await MessageService.send({message:msg,text:'Finalize a criação atual ou use !cancelar conteudo antes de iniciar outra.'});return true;
 }
 if(row.chat!==msg.from)return false;
 let response;
 if(!await Admin.isAdmin(actor)){
  await database.run('DELETE FROM content_creation_sessions WHERE actor=?',[actor]);response='Permissão de ADM inativa. Criação encerrada sem entrega.';
 }else{
  try{response=await service.consume(actor,msg.from,body);}
  catch(error){response=`${error.message}\n\n${question(JSON.parse(row.state_json))}`;}
 }
 if(response)await MessageService.send({message:msg,text:response});return true;
}
module.exports={start,consumeMessage,service};
