"use strict";
const MessageService=require("../core/messageService");
const catalog=require("../systems/catalogConsultationService");
module.exports=async function consultarConteudo(msg){
 let response;
 try{
  const match=String(msg.body||"").match(/^!consultar\s+(item|t[eé]cnica|passiva|t[ií]tulo)\s+(.+)$/iu);
  if(!match)throw new Error("Use *!consultar item <nome>* ou *!consultar técnica <nome>*.");
  const type={tecnica:"TECNICA",passiva:"PASSIVA",titulo:"TITULO",item:"ITEM"}[catalog.normalize(match[1])];
  const rows=await catalog.find(type,match[2].trim());
  if(!rows.length)throw new Error("Conteúdo não encontrado. Informe o nome completo ou o ID.");
  if(rows.length>1)throw new Error(`Mais de um resultado. Consulte pelo ID:\n${rows.map(row=>`${row.id}: ${row.nome}`).join("\n")}`);
  response=await catalog.customSheet(type,rows[0]);
  if(!response)response=type==="TECNICA"?catalog.techniqueSheet(rows[0]):catalog.itemSheet(rows[0]);
 }catch(error){response=error.message;}
 return MessageService.send({message:msg,text:response});
};
