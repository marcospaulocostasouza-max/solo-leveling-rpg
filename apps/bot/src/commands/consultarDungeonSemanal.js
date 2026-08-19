const M=require("../core/messageService"),S=require("../systems/weeklyDungeonSystem");module.exports=async msg=>{await S.ensure();const r=await S.db.get("SELECT dados,data_liberacao FROM dungeons_semanais WHERE status='liberada' ORDER BY id DESC LIMIT 1");if(!r)return M.send({message:msg,text:"_*「 DUNGEON SEMANAL 」*_\n_Nenhuma Dungeon semanal está liberada no momento._"});const d=JSON.parse(r.dados);return M.send({message:msg,text:`_*「 DUNGEON SEMANAL — ${String(d.nome).toUpperCase()} 」*_
_• Tema: ${d.tema}_
_• Rank: ${d.rank}_
_• Descrição: ${d.descricao}_
_• Objetivo: ${d.objetivo}_
_• Boss: ${d.boss||"Nenhum"}_
_• Limite: ${d.participantes||"Não informado"}_

_*PRÊMIOS:*_
_• XP: ${d.xp||0}_
_• Won: ${d.won||0}_
_• Itens: ${d.itens||"Nenhum"}_

_*REGRAS:*_ ${d.regras||"Regras gerais de Dungeon."}
_*DURAÇÃO:*_ ${d.duracao||"Não informada"}`})};
