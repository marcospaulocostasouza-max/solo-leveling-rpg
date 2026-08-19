const M=require("../core/messageService"),a=require("../core/adminCore");module.exports=async msg=>{if(!await a.isAdmin(msg.author||msg.from))return M.send({message:msg,text:a.msgAcessoNegado()});return M.send({message:msg,text:`_*「 FICHA DE DUNGEON SEMANAL 」*_
_Copie, preencha e envie mantendo !Liberar Dungeon na primeira linha._

!Liberar Dungeon
NOME: [Nome]
TEMA: [Tema e ambientação]
RANK: [E / D / C / B / A / S]
DESCRIÇÃO: [Descrição detalhada]
OBJETIVO: [Condição de conclusão]
BOSS: [Nome ou Nenhum]
PARTICIPANTES: [Limite]
XP: [Prêmio]
WON: [Prêmio]
ITENS: [Prêmios em itens ou Nenhum]
REGRAS: [Regras específicas]
DURAÇÃO: [Período disponível]`})};
