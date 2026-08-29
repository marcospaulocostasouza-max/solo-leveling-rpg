import 'server-only';
import database from './rpg';

// Reuse the exact same GuildaSystem used by the WhatsApp bot.
// This prevents the site and bot from drifting into different rules.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const GuildaSystem = require('../../bot/src/systems/guildaSystem');

const botRules=GuildaSystem.regras||{};
export const GUILD_RULES = {
  creationCost:Number(botRules.CUSTO_CRIACAO||200000),
  memberLimit:Number(botRules.LIMITE_MEMBROS||10),
  leaveCooldownDays:Number(botRules.DIAS_COOLDOWN_SAIDA||7),
  minRank:'D'
} as const;

export async function listGuildState(playerId:number){
  const guilds=await GuildaSystem.listarGuildas();
  const [membership,player,cooldown]=await Promise.all([
    database.get('SELECT g.id,g.nome,g.nivel,g.membros,g.lider,g.passivas,gm.cargo FROM guilda_membros gm JOIN guildas g ON g.id=gm.guilda_id WHERE gm.jogador_id=?',[playerId]),
    database.get('SELECT rank,won FROM jogadores WHERE id=?',[playerId]),
    database.get('SELECT disponivel_em FROM guilda_cooldowns WHERE jogador_id=?',[playerId]),
  ]);
  return {guilds,membership:membership||null,player:player||null,cooldownUntil:cooldown?.disponivel_em||null,rules:GUILD_RULES};
}

export async function createGuild(playerId:number,name:unknown){
  const result=await GuildaSystem.criarGuilda(String(name||''),playerId);
  if(result?.erro)throw new Error(result.erro);
  return {nome:result.nome};
}

export async function joinGuild(playerId:number,guildId:unknown){
  const id=Number(guildId);if(!Number.isSafeInteger(id)||id<=0)throw new Error('Guilda inválida.');
  const guild=await database.get('SELECT id,nome FROM guildas WHERE id=?',[id]);if(!guild)throw new Error('Guilda não encontrada.');
  const result=await GuildaSystem.entrarGuilda(playerId,guild.nome);
  if(result?.erro)throw new Error(result.erro);
  return guild;
}

export async function leaveGuild(playerId:number){
  const result=await GuildaSystem.sairGuilda(playerId);
  if(result?.erro)throw new Error(result.erro);
  return {nome:result.guilda};
}
