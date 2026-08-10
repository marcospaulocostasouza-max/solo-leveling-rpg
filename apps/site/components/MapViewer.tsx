'use client';

import { useEffect, useMemo, useState } from 'react';
import { TransformWrapper, TransformComponent, useControls } from 'react-zoom-pan-pinch';
import { ZoomIn, ZoomOut, RotateCcw, Crosshair, Map as MapIcon, Clock3, AlertTriangle } from 'lucide-react';
import CityPanel from './CityPanel';
import DungeonPanel from './DungeonPanel';
import SpecialLocationPanel from './SpecialLocationPanel';

type Place = { id:string; name:string; type:'city'|'island'; x:number; y:number; dangerLevel:string; protected?:boolean };
type Dungeon = {id:string;name:string;x:number;y:number;rank:string;type:'common'|'red';status:string;rewardWon:number;rewardXp:number;expiresInDays:number;travelTargetId?:string;travelTargetName?:string;boss?:string;description?:string};
type Special={id:string;name:string;x:number;y:number;location:string;kind:string;reason?:string;travelTargetId?:string};

function ZoomControls(){const{zoomIn,zoomOut,resetTransform}=useControls();return <div className="hud-zoom"><button onClick={()=>zoomIn(.18)} aria-label="Aumentar zoom"><ZoomIn/></button><button onClick={()=>zoomOut(.18)} aria-label="Diminuir zoom"><ZoomOut/></button><button onClick={()=>resetTransform()} aria-label="Resetar mapa"><RotateCcw/></button></div>}
function koreaTime(){const now=new Date(); const parts=new Intl.DateTimeFormat('pt-BR',{timeZone:'Asia/Seoul',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).formatToParts(now); const h=Number(parts.find(p=>p.type==='hour')?.value||0); const m=Number(parts.find(p=>p.type==='minute')?.value||0); const label=new Intl.DateTimeFormat('pt-BR',{timeZone:'Asia/Seoul',hour:'2-digit',minute:'2-digit',hour12:false}).format(now); let phase='night'; if(h>=5&&h<7)phase='dawn'; else if(h>=7&&h<17)phase='day'; else if(h>=17&&h<19)phase='dusk'; return {h,m,label,phase};}

export default function MapViewer(){
 const[places,setPlaces]=useState<Place[]>([]); const[selected,setSelected]=useState<Place|null>(null); const[dungeons,setDungeons]=useState<Dungeon[]>([]); const[selectedDungeon,setSelectedDungeon]=useState<Dungeon|null>(null); const[specials,setSpecials]=useState<Special[]>([]);const[selectedSpecial,setSelectedSpecial]=useState<Special|null>(null); const[time,setTime]=useState(koreaTime()); const[location,setLocation]=useState('seoul');
 useEffect(()=>{fetch('/data/places.json').then(r=>r.json()).then(d=>setPlaces(d.places||[])); fetch('/api/dungeons',{cache:'no-store'}).then(r=>r.ok?r.json():{active:[]}).then(d=>setDungeons(d.active||[])); fetch('/data/special-locations.json').then(r=>r.json()).then(d=>setSpecials(d.locations||[])); fetch('/api/me',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(d=>{if(d?.location?.city_id)setLocation(d.location.city_id)}); const t=setInterval(()=>setTime(koreaTime()),30000);return()=>clearInterval(t)},[]);
 const current=useMemo(()=>places.find(p=>p.id===location),[places,location]);
 const travel=async(id:string)=>{const r=await fetch('/api/location',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({cityId:id})});if(r.ok)setLocation(id)};
 const participate=async(id:string,action:'arrive'|'enter')=>{const r=await fetch(`/api/dungeons/${id}/participation`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action})});if(!r.ok){const d=await r.json();alert(d.error||'Não foi possível registrar a participação.');return}if(action==='enter')setSelectedDungeon(null)};
 const stop=(e:React.PointerEvent)=>e.stopPropagation();
 return <main className={`map-shell world-${time.phase}`}>
   <TransformWrapper initialScale={1} minScale={1} maxScale={8} centerOnInit={false} centerZoomedOut={false} limitToBounds={false} wheel={{step:.035}} panning={{velocityDisabled:true}} doubleClick={{disabled:true}}>
    <TransformComponent wrapperClass="map-transform-wrapper" contentClass="map-transform-content"><div className="map-stage"><img src="/mapa-coreia.png" alt="Mapa futurista da Coreia do Sul" draggable={false} decoding="sync" fetchPriority="high"/>
      <div className="daylight-layer"/><div className="night-lights-layer"/>
      {places.map(place=><button key={place.id} onPointerDown={stop} className={`map-hotspot ${place.type} ${place.id===location?'current-location':''}`} style={{left:`${place.x}%`,top:`${place.y}%`}} onClick={()=>{setSelectedDungeon(null);setSelectedSpecial(null);setSelected(place)}} aria-label={`Abrir ${place.name}`} title={place.name}><span className="hotspot-ring"/><span className="hotspot-name">{place.id===location?'VOCÊ • ':''}{place.name}</span></button>)}
      {specials.map(p=><button key={p.id} onPointerDown={stop} className="special-map-marker" style={{left:`${p.x}%`,top:`${p.y}%`}} onClick={()=>{setSelected(null);setSelectedDungeon(null);setSelectedSpecial(p)}} title={p.name}><span>✦</span><b>{p.name}</b></button>)}
      {dungeons.map(d=><button key={d.id} onPointerDown={stop} className={`dungeon-gate ${d.type}`} style={{left:`${d.x}%`,top:`${d.y}%`}} onClick={()=>{setSelected(null);setSelectedSpecial(null);setSelectedDungeon(d)}} title={`${d.name} • Rank ${d.rank}`}><span/><b>{d.type==='red'?'🔴':'🟣'} {d.rank}</b></button>)}
    </div></TransformComponent><ZoomControls/>
   </TransformWrapper>
   <div className="map-clock"><Clock3/><div><b>{time.label}</b><span>COREIA • {time.phase==='day'?'DIA':time.phase==='dawn'?'AMANHECER':time.phase==='dusk'?'ENTARDECER':'NOITE'}</span></div></div>
   <div className="map-help"><Crosshair size={16}/><div><strong>MAPA INTERATIVO 8K</strong><span>Arraste livremente • zoom suave até 8×</span></div></div>
   <div className="map-current"><MapIcon/><div><span>LOCALIZAÇÃO ATUAL</span><b>{current?.name||'Seul'}</b></div></div>
   <div className="gate-legend"><AlertTriangle/><span>✦ Local especial &nbsp; 🟣 Gate comum &nbsp; 🔴 Gate de perigo</span></div>
   <CityPanel place={selected} currentLocationId={location} onTravel={travel} onClose={()=>setSelected(null)}/>
   <DungeonPanel dungeon={selectedDungeon} currentLocationId={location} onTravel={travel} onParticipate={participate} onClose={()=>setSelectedDungeon(null)}/>
   <SpecialLocationPanel place={selectedSpecial} currentLocationId={location} onTravel={travel} onClose={()=>setSelectedSpecial(null)}/>
 </main>
}
