"use strict";
const MessageService=require("../core/messageService");
const database=require("../../../../packages/database");
module.exports=async msg=>{
 try{
  const [items,techniques]=await Promise.all([database.get("SELECT COUNT(*) AS total FROM itens"),database.get("SELECT COUNT(*) AS total FROM tecnicas")]);
  return MessageService.send({message:msg,text:`_*「 CATÁLOGO DO RPG 」*_\n\n> *Itens registrados:* ${Number(items?.total||0).toLocaleString("pt-BR")}\n> *Técnicas registradas:* ${Number(techniques?.total||0).toLocaleString("pt-BR")}\n\n*Consultar item*\n_!consultar item <nome ou ID>_\n\n*Consultar técnica*\n_!consultar técnica <nome ou ID>_\n\nVocê também pode usar diretamente *!<nome exato>* para abrir a ficha de qualquer item ou técnica.`});
 }catch(error){console.error("[ITENS]",error);return MessageService.send({message:msg,text:"Não foi possível consultar o catálogo agora."});}
};
