import 'server-only';
import database from './rpg';

// Reuse exactly the same services used by the WhatsApp bot.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const banners = require('../../bot/src/systems/gachaBannerService');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const engine = require('../../bot/src/systems/gachaEngine');

export async function getGachaState(playerId:number,bannerId?:number){
  await database.ensureGachaEngineSchema();
  const available=await banners.getBannersDisponiveis();
  const selected=available.find((b:any)=>Number(b.id)===Number(bannerId))||available[0]||null;
  const player=await database.get('SELECT cristais,fragmentos_invocacao,rank FROM jogadores WHERE id=?',[playerId]);
  if(!selected)return {banners:available,selected:null,pool:[],pity:0,history:[],wallet:player||{cristais:0,fragmentos_invocacao:0}};
  const rawPool=await banners.getPoolDoBanner(selected.id);
  const pool=await Promise.all(rawPool.map(async(item:any)=>{
    try{const resolved=await banners.validarReferencia(item.reward_type,item.referencia_id);return {...item,nome:resolved?.entidade?.nome||item.reward_type};}
    catch{return {...item,nome:item.reward_type};}
  }));
  const pity=await database.consultarPityGacha(playerId,selected.id);
  const history=await database.getUltimosGiros(playerId,8);
  return {banners:available,selected,pool,pity,history,wallet:player||{cristais:0,fragmentos_invocacao:0}};
}

export async function pullGacha(playerId:number,bannerId:number,count:number){
  return engine.realizarGiros(playerId,bannerId,count);
}
