'use client';
import { X, AlertTriangle, Clock3, Coins, MapPin, Navigation, Skull, Swords } from 'lucide-react';

type Dungeon={id:string;name:string;x:number;y:number;rank:string;type:'common'|'red';status:string;rewardWon:number;rewardXp:number;expiresInDays:number;travelTargetId?:string;travelTargetName?:string;boss?:string;description?:string};
type Props={dungeon:Dungeon|null; currentLocationId:string; onTravel:(id:string)=>void; onParticipate?:(id:string,action:'arrive'|'enter')=>void; onClose:()=>void};
const won=(n:number)=>`${new Intl.NumberFormat('pt-BR').format(n)} Won`;
export default function DungeonPanel({dungeon,currentLocationId,onTravel,onParticipate,onClose}:Props){
 if(!dungeon)return null;
 const target=dungeon.travelTargetId||'seoul'; const here=currentLocationId===target;
 return <><div className="place-overlay" onClick={onClose}/><aside className={`place-panel dungeon-panel ${dungeon.type==='red'?'danger':''}`}>
  <button className="place-close" onClick={onClose}><X/></button>
  <div className="dungeon-hero"><div className={`dungeon-orb ${dungeon.type}`}><span/></div><small>{dungeon.type==='red'?'GATE VERMELHO • PERIGO / ARMADILHA':'GATE AZUL / ROXO • COMUM'}</small><h2>{dungeon.name}</h2><p><MapPin size={14}/> Coordenada dinâmica do mapa • {dungeon.travelTargetName||'Região próxima'}</p></div>
  <div className="place-body">
   <div className="dungeon-warning"><AlertTriangle/><div><b>{dungeon.type==='red'?'SAÍDA PODE SER SELADA':'DUNGEON SEMANAL'}</b><span>{dungeon.type==='red'?'Após a entrada, os caçadores podem ficar isolados até derrotarem o chefão.':'Cada jogador pode concluir apenas uma Dungeon geral/semanal por semana.'}</span></div></div>
   <section className="dungeon-stats"><div><Swords/><span>Rank</span><b>{dungeon.rank}</b></div><div><Clock3/><span>Tempo restante</span><b>~{dungeon.expiresInDays} dias</b></div><div><Coins/><span>Recompensa</span><b>{won(dungeon.rewardWon)} + {dungeon.rewardXp.toLocaleString('pt-BR')} XP</b></div><div><Skull/><span>Boss</span><b>{dungeon.boss||'Desconhecido'}</b></div></section>
   <p className="place-description">{dungeon.description||'Gate semanal manifestado em uma posição própria do mapa. Para validar participação e premiação, o personagem precisa viajar até a região associada antes de entrar.'}</p>
   <div className="travel-box"><div><Navigation/><span>Região exigida</span><b>{dungeon.travelTargetName||target}</b></div>{here?<><button onClick={()=>onParticipate?.(dungeon.id,'arrive')}>REGISTRAR CHEGADA</button><button onClick={()=>onParticipate?.(dungeon.id,'enter')}>ENTRAR NA DUNGEON</button></>:<button onClick={()=>{onTravel(target);onClose()}}>VIAJAR ATÉ O GATE</button>}</div>
   <p className="section-note">O algoritmo definitivo de aparição aleatória continuará configurável. O Gate já possui coordenadas X/Y independentes, portanto pode surgir em qualquer ponto do mapa.</p>
  </div>
 </aside></>
}
