const MessageService=require('../core/messageService');
const wizard=require('../systems/contentCreationWizard');
const {normalize}=require('../systems/contentCreationService');
module.exports=async msg=>{
 const command=normalize(msg.body);const kind=command.includes('passiva')?'PASSIVA':command.includes('titulo')?'TITULO':/tecnica|habilidade|hab /.test(command)?'TECNICA':'ITEM';
 let response;try{response=await wizard.start(msg,kind);}catch(error){response=error.message;}
 return MessageService.send({message:msg,text:response});
};
