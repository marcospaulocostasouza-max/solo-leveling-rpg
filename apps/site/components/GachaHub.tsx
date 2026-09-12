'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Gem } from 'lucide-react';
import GachaRevealOverlay from './GachaRevealOverlay';
import { gachaDebug } from '@/lib/gacha-debug';
import { gachaRewardLabel } from '@/lib/gacha-reward-label';
import type { BannerDetail, BannerList, BannerPreview, GachaPullResult } from '@/lib/gacha-types';
const TTL = 30_000;
const fmt = (n: number) => Number(n).toLocaleString('pt-BR');
const labels = {active:'Ativo',ending:'Encerrando em breve',permanent:'Permanente',upcoming:'Em breve'};
function available(b: BannerPreview) {return b.permanente || (Date.parse(b.inicioEm || '') <= Date.now() && Date.parse(b.fimEm || '') > Date.now());}
async function read<T>(r: Response): Promise<T> {
 const data = await r.json().catch(() => {throw new Error('Resposta inválida do Sistema.');});
 if (!r.ok || data.error) throw new Error(data.error || 'Não foi possível carregar os dados.');
 return data as T;
}
function Skeleton() {return <div className="gacha-selection-grid" aria-label="Carregando banners" aria-busy="true">{[1,2,3].map(id=><div key={id} className="gacha-preview gacha-skeleton"/>)}</div>;}
function BannerArt({banner,detail=false}:{banner:BannerPreview;detail?:boolean}) {
 const [attempt,setAttempt]=useState(0);
 const internal = Boolean(banner.imagem?.startsWith('/api/gacha/banners/'));
 const source = banner.imagem && internal ? `${banner.imagem}${banner.imagem.includes('?')?'&':'?'}${attempt===1?'original=1':`width=${detail?1440:640}`}` : banner.imagem;
 // Existing database art is resized on demand; remote art keeps its original URL.
 // eslint-disable-next-line @next/next/no-img-element
 return source && attempt < 2 ? <img src={source} alt={`Imagem do banner ${banner.nome}`} loading={detail?'eager':'lazy'} decoding="async" onError={()=>setAttempt(previous => internal && previous===0 ? 1 : 2)}/> : <span className="gacha-art-fallback" aria-hidden="true"><Gem/></span>;
}
export default function GachaHub({onRefresh}:{onRefresh:()=>Promise<void>}) {
 const [list,setList]=useState<BannerList|null>(null);
 const [selectedId,setSelectedId]=useState<number|null>(null);
 const [detail,setDetail]=useState<BannerDetail|null>(null);
 const [busy,setBusy]=useState(0);
 const [refreshing,setRefreshing]=useState(false);
 const [error,setError]=useState('');
 const [reveal,setReveal]=useState<GachaPullResult|null>(null);
 const [invoking,setInvoking]=useState(false);
 const pullLock=useRef(false);
 const currentId=useRef<number|null>(null);
 // Private data is scoped to this mounted player view, never shared between sessions.
 const cache=useRef(new Map<string,{expires:number;promise:Promise<unknown>}>());
 const get=useCallback(<T,>(key:string,force=false):Promise<T>=>{
  const hit=cache.current.get(key);
  if(hit && !force && hit.expires>Date.now()) return hit.promise as Promise<T>;
  const started=performance.now();
  const entry={expires:Date.now()+TTL,promise:fetch(key,{cache:'no-store'}).then(read<T>)};
  if(cache.current.size>=32)cache.current.delete(cache.current.keys().next().value!);
  cache.current.set(key,entry);
  entry.promise.then(()=>gachaDebug(key.includes('bannerId')?'banner detail loaded':'banner list loaded',started),()=>{if(cache.current.get(key)===entry)cache.current.delete(key);});
  return entry.promise;
 },[]);
 const loadDetail=useCallback(async(id:number,force=false)=>{
  const next=await get<BannerDetail>(`/api/gacha?bannerId=${id}`,force);
  if(currentId.current===id && (!pullLock.current || force))setDetail(next);
 },[get]);
 useEffect(()=>{
  let active=true;
  const sync=async()=>{
   if(pullLock.current || document.visibilityState==='hidden')return;
   try {const next=await get<BannerList>('/api/gacha');if(!active)return;setList(next);if(currentId.current!==null)await loadDetail(currentId.current);}
   catch(e){if(active)setError(e instanceof Error?e.message:'Falha ao atualizar banners.');}
  };
  void sync();const timer=window.setInterval(sync,TTL);window.addEventListener('focus',sync);
  return()=>{active=false;window.clearInterval(timer);window.removeEventListener('focus',sync);};
 },[get,loadDetail]);
 const open=async(id:number)=>{
  if(pullLock.current)return;
  currentId.current=id;setSelectedId(id);setDetail(null);setError('');
  try{await loadDetail(id);}catch(e){if(currentId.current===id)setError(e instanceof Error?e.message:'Falha ao abrir banner.');}
 };
 const pull=async(count:1|10)=>{
  if(!detail || pullLock.current || !available(detail.selected))return;
  pullLock.current=true;setBusy(count);setInvoking(true);setError('');const started=performance.now();
  gachaDebug(count===1?'single pull click':'ten pull click');
  try {
   const result=await read<GachaPullResult>(await fetch('/api/gacha',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({bannerId:detail.selected.id,count})}));
   gachaDebug('request finished',started);
   if(result.sucesso!==true || !Array.isArray(result.resultados) || result.resultados.length!==count || result.resultados.some(x=>!x || typeof x.nome!=='string' || !Number.isFinite(Number(x.quantidade))) || Number(result.banner?.id)!==detail.selected.id || !Number.isFinite(Number(result.saldoAtual)))throw new Error('Resultado incompleto. Consulte o histórico antes de tentar outra invocação.');
   setReveal(result);setInvoking(false);
   for(const key of cache.current.keys())if(key.includes('bannerId='))cache.current.delete(key);
   setDetail(previous=>previous?{...previous,pity:result.pityDepois,wallet:{...previous.wallet,cristais:result.saldoAtual}}:previous);
   gachaDebug('set reveal state');
  }catch(e){
   setInvoking(false);setReveal(null);
   pullLock.current=false;setError(`${e instanceof Error?e.message:'Invocação não concluída.'} Se houve perda de conexão, confira o histórico antes de tentar novamente.`);
   for(const key of cache.current.keys())if(key.includes('bannerId='))cache.current.delete(key);
   void loadDetail(detail.selected.id).catch(()=>undefined);
  }finally{setBusy(0);}
 };
 const finish=async()=>{
  if(!reveal || refreshing)return;
  gachaDebug('animation finished');setReveal(null);setRefreshing(true);
  try{await Promise.all([loadDetail(reveal.banner.id,true),onRefresh()]);}
  catch(e){setError(e instanceof Error?e.message:'Prêmio salvo; não foi possível atualizar os dados.');}
  finally{pullLock.current=false;setRefreshing(false);}
 };
 const retry=()=>{setError('');void(selectedId===null?get<BannerList>('/api/gacha',true).then(setList):loadDetail(selectedId,true)).catch(e=>setError(e.message));};
 const locked=invoking || !!busy || !!reveal || refreshing;
 return <div className="gacha-hub" data-gacha-version="selection-reveal-v2">
  {selectedId===null?<>
   <header className="gacha-selection-heading"><small>SISTEMA DE INVOCAÇÃO</small><h1>Escolha sua fenda</h1><p>Explore os banners e descubra suas recompensas.</p></header>
   {!list && !error && <Skeleton/>}
   {list && <div className="gacha-selection-grid">{list.banners.map(b=><button type="button" key={b.id} className="gacha-preview" onClick={()=>void open(b.id)} disabled={b.status==='upcoming'}><BannerArt key={b.imagem} banner={b}/><span className="gacha-preview-shade"/><span className={`gacha-status ${b.status}`}>{labels[b.status]}</span><span className="gacha-preview-copy"><h2>{b.nome}</h2><p>{b.descricao}</p>{!b.permanente && <small>{new Date(b.inicioEm!).toLocaleDateString('pt-BR')} — {new Date(b.fimEm!).toLocaleDateString('pt-BR')}</small>}<b>{b.status==='upcoming'?'Aguarde a abertura':'Explorar banner →'}</b></span></button>)}</div>}
   {list && !list.banners.length && <p className="sys-panel">Nenhum banner disponível. Novos banners aparecerão aqui quando forem ativados.</p>}
  </>:<>
   <button type="button" className="gacha-back" disabled={locked} onClick={()=>{currentId.current=null;setSelectedId(null);setDetail(null);setError('');}}>← Voltar aos banners</button>
   {!detail && !error && <Skeleton/>}
   {detail && <>
    <section className="gacha-banner gacha-detail-hero"><BannerArt key={detail.selected.imagem} banner={detail.selected} detail/><div className="gacha-banner-copy"><small>INVOCAÇÃO · BANNER #{detail.selected.id}</small><h1>{detail.selected.nome}</h1><p>{detail.selected.descricao}</p></div></section>
    <section className="gacha-wallet-row"><div><Gem/><span><small>CRISTAIS</small><b>{fmt(detail.wallet.cristais)}</b></span></div><div><span><small>FRAGMENTOS</small><b>{fmt(detail.wallet.fragmentos_invocacao)}</b></span></div><div><span><small>PITY DO GRANDE PRÊMIO</small><b>{detail.pity}/100</b></span></div></section>
    {!available(detail.selected) && <p role="status">Este banner está fora do período de invocação.</p>}
    <section className="gacha-actions"><button type="button" disabled={locked || !available(detail.selected) || detail.wallet.cristais<100} onClick={()=>void pull(1)}><span>{busy===1?'Invocando…':'Invocação única'}</span><b><Gem/>100</b></button><button type="button" className="ten" disabled={locked || !available(detail.selected) || detail.wallet.cristais<1000} onClick={()=>void pull(10)}><span>{busy===10?'Invocando…':'Invocação ×10'}</span><b><Gem/>1.000</b><small>{detail.guaranteeSet?'1 peça do conjunto garantida':'1 recompensa exatamente do seu Rank'}</small></button></section>
    <details className="sys-panel gacha-pool"><summary>Recompensas deste banner ({detail.pool.length})</summary><p>Chances base, antes das garantias e do pity.</p><div>{detail.pool.map(x=><p key={x.id}><span>{'★'.repeat(x.estrelas)} {x.nome}{x.grande_premio===1?' · Grande prêmio':x.destaque_ordem!==null?' · Destaque':''}</span><b>×{fmt(x.quantidade)} · {x.chance.toLocaleString('pt-BR',{maximumFractionDigits:3})}%</b></p>)}</div></details>
    <section className="gacha-history sys-panel"><h2>Últimas invocações deste banner</h2><div>{detail.history.map((x,i)=><span key={`${x.id}-${i}`}><b>{gachaRewardLabel(x)}</b>{!!Number(x.duplicata) && <small>Duplicata: +{x.fragmentos_invocacao_recebidos} fragmentos</small>}</span>)}{!detail.history.length && <p>Nenhuma invocação registrada.</p>}</div></section>
   </>}
  </>}
  {error && <div className="system-error" role="alert">{error} <button type="button" disabled={locked} onClick={retry}>Tentar novamente</button></div>}
  {(invoking || reveal) && <GachaRevealOverlay result={reveal} onContinue={()=>void finish()}/>}
 </div>;
}
