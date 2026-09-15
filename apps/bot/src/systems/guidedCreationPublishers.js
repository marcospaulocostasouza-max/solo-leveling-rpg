"use strict";
const db = require("../../../../packages/database");
const { provider } = require("../../../../packages/database/config");
const Guilda = require("./guildaSystem");

const ranks = new Set(["E", "D", "C", "B", "A", "S"]);
const text = value => String(value || "").trim();
const integer = (value, field, min = 0) => { const n=Number(value); if(!Number.isSafeInteger(n)||n<min)throw new Error(`${field} deve ser um inteiro a partir de ${min}.`); return n; };
async function player(name){const row=await db.get("SELECT id,nome,rank,won FROM jogadores WHERE LOWER(TRIM(nome))=LOWER(TRIM(?))",[text(name)]);if(!row)throw new Error(`Jogador ${name} não encontrado.`);return row;}
async function missionTargets(destination){
 if(/^todos$/i.test(text(destination))){const targets=await db.all("SELECT id,nome,rank,won FROM jogadores WHERE ficha_aprovada=1 ORDER BY LOWER(nome),id");if(!targets.length)throw new Error("Não há jogadores com ficha aprovada para receber a missão.");return targets;}
 return [await player(destination)];
}
async function validateMission(data){const targets=await missionTargets(data.jogador);const rank=text(data.rank).toUpperCase();if(!ranks.has(rank))throw new Error("Rank deve ser E, D, C, B, A ou S.");const item=text(data.item)||"Nenhum";if(!/^(nenhum|nenhuma)$/i.test(item)&&!await db.get("SELECT id FROM itens WHERE LOWER(nome)=LOWER(?)",[item]))throw new Error(`O item ${item} não existe no catálogo.`);for(const [key,label,min] of [["quantidade","Quantidade",1],["xp","XP",0],["won","Won",0],["cristais","Cristais",0]])integer(data[key],label,min);return{targets,rank,item};}
async function preview(type,data){
 if(type==="GUILD"){const leader=await player(data.lider);const name=Guilda.helpers.validarNome(data.nome);if(!name)throw new Error("O nome da Guilda deve ter entre 3 e 40 caracteres e não pode conter símbolos especiais.");return `> *Guilda:* ${name}\n> *Líder identificado:* ${leader.nome} — Rank ${leader.rank}\n> *Custo:* 200.000 Won\n> *Saldo atual:* ${Number(leader.won||0).toLocaleString("pt-BR")} Won\n> *Passivas:* ${data.passivas}`;}
 if(type==="MISSION"){const {targets,rank,item}=await validateMission(data);const destination=targets.length===1?targets[0].nome:`Todos os jogadores aprovados (${targets.length})`;return `> *Missão:* ${data.nome}\n> *Destino identificado:* ${destination}\n> *Rank:* ${rank}\n> *Objetivo:* ${data.objetivo} (${data.quantidade})\n> *Recompensas:* ${data.xp} XP • ${data.won} Won • ${data.cristais} Cristais • ${item}`;}
 const rank=text(data.rank).toUpperCase();if(!ranks.has(rank))throw new Error("Rank deve ser E, D, C, B, A ou S.");integer(data.xp,"XP");integer(data.won,"Won");const all=require("./dungeonDatabaseLoader").carregarDungeons();if(all.some(d=>text(d.nome).toLowerCase()===text(data.nome).toLowerCase()))throw new Error("Já existe uma dungeon com esse nome.");return `> *Dungeon:* ${data.nome}\n> *Rank:* ${rank}\n> *Tema/elemento:* ${data.tema} • ${data.elemento}\n> *Boss:* ${data.boss}\n> *Recompensas:* ${data.xp} XP • ${data.won} Won`;
}

async function guild(data){
 const leader=await player(data.lider);const result=await Guilda.criarGuilda(text(data.nome),leader.id);if(result.erro)throw new Error(result.erro);
 if(text(data.passivas)&&!/^(nenhuma|nenhum)$/i.test(text(data.passivas)))await db.run("UPDATE guildas SET passivas=? WHERE LOWER(nome)=LOWER(?)",[text(data.passivas),result.nome]);
 return `Guilda *${result.nome}* criada para *${leader.nome}*. Saldo restante: ${result.saldo.toLocaleString("pt-BR")} Won.`;
}
async function mission(data){
 const {targets,rank,item}=await validateMission(data);
 await require("./questSystem").listarMissoes(targets[0].id);
 const sql=`INSERT INTO missoes(jogador_id,nome,descricao,tipo,progresso,objetivo,recompensa_xp,recompensa_won,recompensa_cristais,recompensa_item,status,data,rank,objetivo_texto) VALUES(?,?,?,?,0,?,?,?,?,?,'disponivel',CURRENT_TIMESTAMP,?,?)`;
 let delivered=0,skipped=0;
 await db.transaction(async query=>{for(const target of targets){const existing=await query.get("SELECT id FROM missoes WHERE jogador_id=? AND LOWER(nome)=LOWER(?) AND status IN ('disponivel','ativa','aceita','em_andamento','aguardando_aprovacao') LIMIT 1",[target.id,text(data.nome)]);if(existing){skipped++;continue;}await query.run(sql,[target.id,text(data.nome),text(data.descricao),text(data.tipo)||"Personalizada",integer(data.quantidade,"Quantidade",1),integer(data.xp,"XP"),integer(data.won,"Won"),integer(data.cristais,"Cristais"),item,rank,text(data.objetivo)]);delivered++;}});
 const destination=targets.length===1?targets[0].nome:`${delivered} jogador(es)`;
 return `Missão *${data.nome}* disponibilizada para *${destination}*. Use *!aceitar missão ${data.nome}*.${skipped?` ${skipped} jogador(es) já possuíam essa missão ativa e não receberam duplicata.`:""}`;
}
async function instanceDungeon(data){
 const rank=text(data.rank).toUpperCase();if(!ranks.has(rank))throw new Error("Rank deve ser E, D, C, B, A ou S.");
 const dungeon=require("./dungeonDatabaseLoader").adicionarDungeon({nome:text(data.nome),rank,tema:text(data.tema),elemento:text(data.elemento),entrada:text(data.entrada),monstro:{nome:text(data.monstro),descricao:text(data.monstroDescricao)},boss:{nome:text(data.boss),descricao:text(data.bossDescricao),habilidades:text(data.bossHabilidades).split(/[,;]+/).map(v=>v.trim()).filter(Boolean)},recompensas:{xp:integer(data.xp,"XP"),won:integer(data.won,"Won"),item_misterioso:false,drop_tecnica:false}});
 if(provider==="postgres")await db.run("INSERT INTO dungeons(nome,rank,andar,descricao,boss,recompensa_xp,recompensa_won) VALUES(?,?,?,?,?,?,?) ON CONFLICT(nome) DO NOTHING",[dungeon.nome,rank,1,dungeon.entrada,dungeon.boss.nome,dungeon.recompensas.xp,dungeon.recompensas.won]);
 else await db.run("INSERT OR IGNORE INTO dungeons(nome,rank,andar,descricao,boss,recompensa_xp,recompensa_won) VALUES(?,?,?,?,?,?,?)",[dungeon.nome,rank,1,dungeon.entrada,dungeon.boss.nome,dungeon.recompensas.xp,dungeon.recompensas.won]);
 return `Dungeon instanciada *${dungeon.nome}* criada com ID ${dungeon.id} e integrada ao sorteio de chaves Rank ${rank}.`;
}
module.exports={guild,mission,instanceDungeon,preview};
