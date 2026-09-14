'use client';
import {useRef,useState} from 'react';
type Reward={tipo:string;nome:string;quantidade:number;imagem?:string};
export default function RedeemCode({onRefresh}:{onRefresh?:()=>Promise<void>}){
 const [code,setCode]=useState(''),[loading,setLoading]=useState(false),[message,setMessage]=useState(''),[rewards,setRewards]=useState<Reward[]>([]);
 const busy=useRef(false);
 async function redeem(event:React.FormEvent){
  event.preventDefault();if(busy.current)return;busy.current=true;setLoading(true);setMessage('');setRewards([]);
  try{const r=await fetch('/api/redeem',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code})});const result=await r.json();if(!r.ok||!result.success)throw new Error(result.message||'Não foi possível resgatar.');setRewards(result.rewards);setCode('');setMessage(result.message);void onRefresh?.().catch(()=>undefined);}
  catch(error){setMessage(error instanceof Error?error.message:'Não foi possível resgatar.');}
  finally{busy.current=false;setLoading(false);}
 }
 return <section className="sys-panel redeem-code"><small>RECOMPENSAS DO SISTEMA</small><h1>Resgatar Código</h1><p>Digite um código promocional.</p><form onSubmit={redeem}><label htmlFor="redeem-code">Código</label><input id="redeem-code" value={code} onChange={e=>setCode(e.target.value)} maxLength={64} autoComplete="off" autoCapitalize="characters" required disabled={loading}/><button className="primary-cta" type="submit" disabled={loading||!code.trim()}>{loading?'Resgatando…':'RESGATAR'}</button></form><p role="status" aria-live="polite">{message}</p>{rewards.length>0&&<div><h2>Recompensas recebidas</h2><ul>{rewards.map((r,i)=><li key={i}>{r.imagem&&<img src={r.imagem} alt="" width={48} height={48}/>}+{r.quantidade.toLocaleString('pt-BR')} {r.nome}</li>)}</ul></div>}</section>;
}
