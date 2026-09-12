'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Gem, History, Sparkles, Star, Trophy } from 'lucide-react';
import GachaRevealOverlay from './GachaRevealOverlay';

type GachaState={banners:any[];selected:any;pool:any[];guaranteeSet?:boolean;pity:number;history:any[];wallet:any};
function fmt(n:unknown){return Number(n||0).toLocaleString('pt-BR')}
async function json(response:Response){const text=await response.text();if(!text.trim())return{};try{return JSON.parse(text)}catch{return{error:'Resposta inválida do Sistema.'}}}

export default function GachaHub({onRefresh}:{onRefresh:()=>Promise<void>}){
 const[state,setState]=useState<GachaState|null>(null);const[busy,setBusy]=useState(0);const[reveal,setReveal]=useState<any|null>(null);const[error,setError]=useState('');const pullLock=useRef(false);
 const load=async(id?:number)=>{const r=await fetch(`/api/gacha${id?`?bannerId=${id}`:''}`,{cache:'no-store'});const d=await json(r);if(!r.ok)throw new Error(d.error||'Falha ao carregar o Gacha.');setState(d)};
 useEffect(()=>{load().catch(e=>setError(e.message))},[]);
 const pull=async(count:number)=>{if(!state?.selected||busy||pullLock.current)return;pullLock.current=true;setBusy(count);setError('');try{const r=await fetch('/api/gacha',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({bannerId:state.selected.id,count})});const d=await json(r);if(!r.ok)throw new Error(d.error||'Giro não concluído.');setReveal(d);await Promise.all([load(state.selected.id),onRefresh()])}catch(e){setError(e instanceof Error?e.message:'Giro não concluído.')}finally{pullLock.current=false;setBusy(0)}};
 const highlights=useMemo(()=>state?.pool.filter(x=>x.destaque_ordem!=null).sort((a,b)=>a.destaque_ordem-b.destaque_ordem)||[],[state]);const grand=useMemo(()=>state?.pool.find(x=>Number(x.grande_premio)===1),[state]);
 if(!state)return <div className="gacha-loading sys-panel"><Gem/><span>{error||'Sincronizando Banners...'}</span></div>;
 if(!state.selected)return <div className="gacha-empty sys-panel"><Gem/><h2>Nenhum Banner disponível.</h2><p>Quando um Banner for ativado pelo administrador, ele aparecerá aqui automaticamente.</p></div>;
 const idx=state.banners.findIndex(x=>Number(x.id)===Number(state.selected.id));const nav=(dir:number)=>{if(busy)return;const next=state.banners[(idx+dir+state.banners.length)%state.banners.length];if(next)load(next.id).catch(e=>setError(e.message))};
 return <div className="gacha-hub">
  <section className="gacha-banner" style={state.selected.imagem?{backgroundImage:`linear-gradient(90deg,rgba(5,2,17,.98) 0%,rgba(5,2,17,.83) 43%,rgba(5,2,17,.28) 100%),url(${state.selected.imagem})`}:{}}><div className="gacha-banner-copy"><small>INVOCAÇÃO // BANNER #{state.selected.id}</small><h1>{state.selected.nome}</h1><p>{state.selected.descricao}</p><div className="gacha-featured-label"><Star/> 4 DESTAQUES + 1 GRANDE PRÊMIO</div></div>{state.banners.length>1&&<div className="gacha-banner-nav"><button onClick={()=>nav(-1)} disabled={!!busy}><ChevronLeft/></button><span>{idx+1}/{state.banners.length}</span><button onClick={()=>nav(1)} disabled={!!busy}><ChevronRight/></button></div>}</section>
  <section className="gacha-wallet-row"><div><Gem/><span><small>CRISTAIS</small><b>{fmt(state.wallet?.cristais)}</b></span></div><div><Sparkles/><span><small>FRAGMENTOS DE INVOCAÇÃO</small><b>{fmt(state.wallet?.fragmentos_invocacao)}</b></span></div><div className="gacha-pity"><span><small>GRANDE PRÊMIO</small><b>{state.pity}/100</b></span><i><em style={{width:`${Math.min(100,state.pity)}%`}}/></i></div></section>
  {error&&<div className="system-error">{error}</div>}
  <section className="gacha-prizes"><article className="gacha-grand sys-panel"><Trophy/><small>ITEM ESPECIAL DO BANNER</small><h2>{grand?.nome||grand?.reward_type||'Grande Prêmio'}</h2><p>{grand?.raridade?`Raridade ${grand.raridade}`:'Garantido no Hard Pity 100.'}</p></article><div className="gacha-highlights">{highlights.map((x:any)=><article className="sys-panel" key={x.id}><span>0{x.destaque_ordem}</span><Star/><small>{x.reward_type}</small><h3>{x.nome||x.raridade||'Recompensa em Destaque'}</h3></article>)}</div></section>
  <section className="gacha-actions"><button disabled={!!busy||Number(state.wallet?.cristais||0)<100} onClick={()=>pull(1)}><span>{busy===1?'INVOCANDO…':'INVOCAÇÃO ÚNICA'}</span><b><Gem/> 100</b></button><button className="ten" disabled={!!busy||Number(state.wallet?.cristais||0)<1000} onClick={()=>pull(10)}><span>{busy===10?'INVOCANDO…':'INVOCAÇÃO ×10'}</span><b><Gem/> 1.000</b><small>{state.guaranteeSet?'1 peça do conjunto garantida':'1 recompensa exatamente do seu Rank'}</small></button></section>
  <section className="gacha-history sys-panel"><header><History/><div><small>REGISTRO DO SISTEMA</small><h2>Últimas invocações</h2></div></header><div>{state.history?.map((x:any,i:number)=><span key={`${x.id||i}-${i}`}><b>{x.grande_premio?'★ ':''}{x.nome}</b><small>{x.banner_nome||`Banner #${x.banner_id}`}{x.duplicata?` • +${x.fragmentos_invocacao_recebidos} Fragmentos`:''}</small></span>)}{!state.history?.length&&<p>Nenhum giro registrado.</p>}</div></section>
  {reveal&&<GachaRevealOverlay result={reveal} onContinue={()=>setReveal(null)} />}
 </div>
}
