"use strict";
const MessageService=require("../core/messageService");
const admin=require("../core/adminCore");
const Wizard=require("../systems/creationWizardService");
module.exports=async msg=>{const actor=msg.author||msg.from;if(!await admin.isAdmin(actor))return MessageService.send({message:msg,text:admin.msgAcessoNegado()});const body=String(msg.body||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();const type=body==="!criar guilda"?"GUILD":body==="!criar missao"?"MISSION":body==="!criar dungeon instanciada"?"INSTANCE_DUNGEON":null;if(!type)return MessageService.send({message:msg,text:"Use *!criar guilda*, *!criar missão* ou *!criar dungeon instanciada*."});const title={GUILD:"GUILDA",MISSION:"MISSÃO",INSTANCE_DUNGEON:"DUNGEON INSTANCIADA"}[type];return MessageService.send({message:msg,text:`_*「 CRIAÇÃO GUIADA DE ${title} 」*_\n\n${await Wizard.start(actor,type)}\n\n_Responda apenas à pergunta. Use !cancelar criação para interromper._`});};
