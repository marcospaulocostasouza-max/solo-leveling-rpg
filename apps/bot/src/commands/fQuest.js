const MessageService=require("../core/messageService"),admin=require("../core/adminCore");
module.exports=async msg=>{if(!await admin.isAdmin(msg.author||msg.from))return MessageService.send({message:msg,text:admin.msgAcessoNegado()});return MessageService.send({message:msg,text:`_*「 FICHA DE QUEST 」*_
_Copie, preencha e envie mantendo !Add Quest na primeira linha._

!Add Quest
NOME: [Nome da missão]
JOGADOR: [Nome completo do jogador]
DESCRIÇÃO: [Contexto narrativo]
TIPO: [Principal / Secundária / Evento / NPC]
OBJETIVO: [Descrição do objetivo]
QUANTIDADE: [Número necessário]
RANK: [E / D / C / B / A / S]
XP: [Quantidade]
WON: [Quantidade]
ITEM: [Nome do item ou Nenhum]`})};
