'use client';

import { useEffect, useMemo, useState } from 'react';
import { Crown, DoorOpen, Search, ShieldCheck, Sparkles, Users, WalletCards } from 'lucide-react';

type Guild = { id:number; nome:string; nivel:number; membros:number; lider:string };
type GuildState = {
  guilds: Guild[];
  membership?: { id:number; nome:string; nivel:number; membros:number; lider:string; cargo:string; passivas?:string } | null;
  cooldownUntil?: string | null;
  player?: { rank:string; won:number };
  rules?: { creationCost:number; minRank:string; memberLimit:number; leaveCooldownDays:number };
};

function money(value:unknown){return Number(value||0).toLocaleString('pt-BR')}
async function parse(response:Response){const text=await response.text();if(!text.trim())return {};try{return JSON.parse(text)}catch{return {error:'O Sistema recebeu uma resposta inválida.'}}}

export default function GuildHub({onCharacterRefresh}:{onCharacterRefresh:()=>Promise<void>}){
  const[state,setState]=useState<GuildState|null>(null);const[query,setQuery]=useState('');const[name,setName]=useState('');const[busy,setBusy]=useState('');const[msg,setMsg]=useState<{type:'ok'|'error';text:string}|null>(null);
  const load=async()=>{const r=await fetch('/api/guilds',{cache:'no-store'});const d=await parse(r);if(!r.ok)throw new Error(d.error||'Não foi possível carregar as Guildas.');setState(d)};
  useEffect(()=>{load().catch(e=>setMsg({type:'error',text:e.message}))},[]);
  const act=async(action:string,payload:Record<string,unknown>={})=>{setBusy(action);setMsg(null);try{const r=await fetch('/api/guilds',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action,...payload})});const d=await parse(r);if(!r.ok)throw new Error(d.error||'A operação não pôde ser concluída.');setMsg({type:'ok',text:d.message||'Operação concluída.'});setName('');await load();await onCharacterRefresh()}catch(e){setMsg({type:'error',text:e instanceof Error?e.message:'Falha na operação.'})}finally{setBusy('')}};
  const filtered=useMemo(()=>state?.guilds.filter(g=>g.nome.toLowerCase().includes(query.toLowerCase())||g.lider.toLowerCase().includes(query.toLowerCase()))||[],[state,query]);
  if(!state)return <article className="guild-loading sys-panel"><Crown/><b>Consultando registros de Guilda...</b></article>;
  const membership=state.membership;const rules=state.rules||{creationCost:200000,minRank:'D',memberLimit:10,leaveCooldownDays:7};
  return <div className="guild-hub">
    <section className="guild-hero">
      <div><small>ASSOCIAÇÕES // GUILDA</small><h1>{membership?membership.nome:'Erga seu próprio estandarte.'}</h1><p>{membership?'Seu vínculo está sincronizado com o mesmo banco utilizado pelo bot.':'Crie uma Guilda ou procure uma organização existente. O que acontecer aqui será reconhecido pelo bot automaticamente.'}</p></div>
      <Crown/>
    </section>
    {msg&&<div className={`system-message guild-message ${msg.type}`}>{msg.text}</div>}

    {membership?<section className="guild-command-center">
      <article className="sys-panel guild-main-card"><div className="guild-emblem"><Crown/></div><small>MINHA GUILDA</small><h2>{membership.nome}</h2><p>Liderada por <b>{membership.lider}</b></p><div className="guild-metrics"><span><b>{membership.nivel}</b>NÍVEL</span><span><b>{membership.membros}/{rules.memberLimit}</b>MEMBROS</span><span><b>{membership.cargo}</b>SEU CARGO</span></div>{membership.passivas&&<div className="guild-passive"><Sparkles/><span><small>PASSIVAS</small><b>{membership.passivas}</b></span></div>}</article>
      <article className="sys-panel guild-rules-card"><ShieldCheck/><h3>Vínculo sincronizado</h3><p>Entrar ou sair pelo site altera o mesmo registro usado por <b>!Guilda</b> no WhatsApp.</p>{membership.cargo!=='Líder'?<button className="danger-action" disabled={!!busy} onClick={()=>act('leave')}>{busy==='leave'?'PROCESSANDO...':<><DoorOpen/> SAIR DA GUILDA</>}</button>:<div className="guild-leader-note"><Crown/> Líderes devem transferir a liderança ou dissolver a Guilda pelo fluxo administrativo do bot.</div>}</article>
    </section>:<>
      <section className="guild-create sys-panel"><div><small>CRIAR GUILDA</small><h2>Fundar uma nova organização</h2><p>Requer Rank {rules.minRank} ou superior e custa ₩ {money(rules.creationCost)}. O nome deve possuir entre 3 e 40 caracteres.</p></div><div className="guild-create-form"><input value={name} onChange={e=>setName(e.target.value)} maxLength={40} placeholder="Nome da Guilda"/><button disabled={!!busy||name.trim().length<3} onClick={()=>act('create',{name})}>{busy==='create'?'CRIANDO...':<><Crown/> CRIAR POR ₩ {money(rules.creationCost)}</>}</button></div><footer><WalletCards/> Seu saldo atual: <b>₩ {money(state.player?.won)}</b> • Rank <b>{state.player?.rank||'—'}</b></footer></section>
      <section className="guild-directory"><header><div><small>DIRETÓRIO DE ASSOCIAÇÕES</small><h2>Guildas disponíveis</h2></div><label><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar Guilda ou líder"/></label></header><div className="guild-list">{filtered.map(g=><article className="sys-panel guild-list-card" key={g.id}><div className="guild-list-emblem"><Users/></div><div><small>GUILDA #{g.id}</small><h3>{g.nome}</h3><p>Líder: {g.lider}</p></div><div className="guild-list-stats"><span>Nv. <b>{g.nivel}</b></span><span><b>{g.membros}</b>/{rules.memberLimit}</span></div><button disabled={!!busy||g.membros>=rules.memberLimit} onClick={()=>act('join',{guildId:g.id})}>{busy===`join:${g.id}`?'...':g.membros>=rules.memberLimit?'LOTADA':'ENTRAR'}</button></article>)}{!filtered.length&&<div className="guild-empty">Nenhuma Guilda corresponde à busca.</div>}</div></section>
    </>}
    <section className="guild-lore sys-panel"><ShieldCheck/><div><small>REGRA DO SISTEMA</small><h3>Guildas são organizações de Caçadores.</h3><p>Elas reúnem jogadores, recursos, progressão coletiva, GvG e territórios. Ao sair de uma Guilda, o cooldown oficial de {rules.leaveCooldownDays} dias continua sendo aplicado.</p></div></section>
  </div>
}
