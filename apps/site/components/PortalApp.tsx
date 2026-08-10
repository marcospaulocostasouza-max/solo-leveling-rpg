'use client';
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */

import { useEffect, useMemo, useState } from 'react';
import {
  Activity, Backpack, BookOpen, ChevronRight, CircleDollarSign, Crown, DoorOpen,
  Dumbbell, Gem, Globe2, Home, Map, Menu, Package, ScrollText, Shield, ShoppingBag,
  Sparkles, Swords, Trophy, Upload, UserRound, Users, X, Zap
} from 'lucide-react';
import MapViewer from './MapViewer';

type Tab = 'inicio'|'personagem'|'inventario'|'equipamentos'|'habilidades'|'missoes'|'guilda'|'mapa'|'loja'|'sistemas'|'npcs'|'ranking';

type Character = {
  name:string; level:number; rank:string; className:string; advancedClass:string; title:string; won:number;
  xp:number; xpMax:number; hp:number; hpMax:number; mp:number; mpMax:number; location:string;
  stats: Record<string, number>; guild:string; maestria:number;
};

const character: Character = {
  name:'Irelia', level:25, rank:'C', className:'Assassino', advancedClass:'Sword Dancer', title:'Sem título equipado', won:285000,
  xp:7280, xpMax:10000, hp:840, hpMax:840, mp:410, mpMax:410, location:'Seul', guild:'Independente', maestria:640,
  stats:{Força:350,Resistência:290,Velocidade:510,Sentidos:420,Inteligência:180,'Poder Mágico':120}
};

const inventory = [
  {name:'Adaga do Caçador',type:'Arma',rank:'C',qty:1,icon:'🗡️'},
  {name:'Poção de Cura',type:'Consumível',rank:'D',qty:5,icon:'🧪'},
  {name:'Núcleo Mágico',type:'Material',rank:'C',qty:12,icon:'💎'},
  {name:'Cristal Azul',type:'Material',rank:'D',qty:8,icon:'🔷'},
  {name:'Chave de Dungeon',type:'Chave',rank:'B',qty:1,icon:'🗝️'},
  {name:'Botas do Vento',type:'Equipamento',rank:'B',qty:1,icon:'🥾'},
];
const skills = [
  ['Dança das Lâminas','Ativa','35 MP','Sequência de cortes em alta velocidade.'],
  ['Passo Fantasma','Ativa','20 MP','Reposicionamento rápido em curta distância.'],
  ['Instinto de Combate','Passiva','—','Amplia reação e leitura de movimento.'],
  ['Corte Crescente','Ativa','28 MP','Golpe amplo de média distância.'],
];
const quests = [
  ['Treino de Combate','Diária','Em andamento','Complete uma rotina de treinamento.','2.500 XP'],
  ['Chamado da Associação','Associação','Disponível','Compareça à Associação dos Caçadores.','₩ 80.000'],
  ['Dungeon Semanal','Semanal','Disponível','Viaje até o Gate semanal antes de participar.','Recompensa fixa'],
];

const systems = [
  ['Guildas','Criação, níveis, buffs, cofre, aquisição, fusão, filiais e GvG.'],
  ['Territórios','Conquista dos locais do novo mapa, renda, administração e investimentos.'],
  ['Viagem','Localização persistente; interações exigem presença na mesma cidade/região.'],
  ['Gates','Viagens internacionais mediante autorização da Associação dos Caçadores.'],
  ['Dungeons Semanais','Gates azul/roxo comuns e vermelhos de armadilha; 1 participação semanal.'],
  ['Locais Especiais','Hallasan, Ilha das Memórias, templos, Parque das Zelkova e outros.'],
  ['Classes e Técnicas','Classes básicas/avançadas, estilos, maestrias, técnicas e progressão.'],
  ['Economia e Mercado','Won, compras, vendas, mineração, materiais, forja e lojas.'],
  ['Títulos e Passivas','Coleções, requisitos, efeitos e slots passivos.'],
  ['Arena e Rankings','Vitórias, derrotas, MVP, pontuação e classificações.'],
];

function Progress({value,max,label}:{value:number,max:number,label:string}){
  const pct=Math.max(0,Math.min(100,(value/max)*100));
  return <div className="progress-block"><div><span>{label}</span><b>{value.toLocaleString('pt-BR')} / {max.toLocaleString('pt-BR')}</b></div><i><em style={{width:`${pct}%`}} /></i></div>
}

function StatRadar({stats}:{stats:Record<string,number>}){
  const vals=Object.values(stats).slice(0,6); const names=Object.keys(stats).slice(0,6); const max=Math.max(...vals,1); const c=110,r=85;
  const pts=vals.map((v,i)=>{const a=-Math.PI/2+i*Math.PI*2/vals.length; const rr=r*(v/max); return `${c+Math.cos(a)*rr},${c+Math.sin(a)*rr}`}).join(' ');
  return <svg className="radar" viewBox="0 0 220 220" aria-label="Gráfico dos atributos">
    {[.25,.5,.75,1].map((q,qi)=><polygon key={qi} points={vals.map((_,i)=>{const a=-Math.PI/2+i*Math.PI*2/vals.length;return `${c+Math.cos(a)*r*q},${c+Math.sin(a)*r*q}`}).join(' ')} fill="none" stroke="rgba(91,190,255,.22)" />)}
    {vals.map((_,i)=>{const a=-Math.PI/2+i*Math.PI*2/vals.length;return <line key={i} x1={c} y1={c} x2={c+Math.cos(a)*r} y2={c+Math.sin(a)*r} stroke="rgba(91,190,255,.22)"/>})}
    <polygon points={pts} fill="rgba(50,170,255,.22)" stroke="#56c7ff" strokeWidth="2"/>
    {names.map((n,i)=>{const a=-Math.PI/2+i*Math.PI*2/names.length; return <text key={n} x={c+Math.cos(a)*104} y={c+Math.sin(a)*104} textAnchor="middle" dominantBaseline="middle">{n.replace('Poder Mágico','P.Mágico')}</text>})}
  </svg>
}

function CharacterView({avatar,setAvatar}:{avatar:string|null,setAvatar:(s:string)=>void}){
  const handle=(f?:File)=>{if(!f)return; const r=new FileReader();r.onload=()=>setAvatar(String(r.result));r.readAsDataURL(f)};
  return <section className="page character-page">
    <div className="page-head"><div><small>SISTEMA DO CAÇADOR</small><h1>{character.name}</h1><p>{character.className} • {character.advancedClass} • Rank {character.rank}</p></div><div className="rank-emblem">{character.rank}</div></div>
    <div className="character-grid">
      <article className="system-panel stats-panel"><h2><Activity/> ATRIBUTOS</h2><StatRadar stats={character.stats}/><div className="stats-list">{Object.entries(character.stats).map(([k,v])=><div key={k}><span>{k}</span><strong>{v}</strong></div>)}</div></article>
      <article className="character-center">
        <div className="avatar-stage">{avatar?<img src={avatar} alt="PNG do personagem"/>:<div className="avatar-empty"><UserRound/><b>PNG DO PERSONAGEM</b><span>Envie uma render com fundo transparente</span></div>}</div>
        <label className="upload-btn"><Upload/> Alterar PNG<input type="file" accept="image/png,image/webp" onChange={e=>handle(e.target.files?.[0])}/></label>
      </article>
      <article className="system-panel status-panel"><h2><Sparkles/> STATUS</h2>
        <div className="status-level"><strong>{character.level}</strong><span>LEVEL</span></div>
        <div className="status-lines"><div><span>Rank</span><b>{character.rank}</b></div><div><span>Classe</span><b>{character.className}</b></div><div><span>Avançada</span><b>{character.advancedClass}</b></div><div><span>Título</span><b>{character.title}</b></div><div><span>Localização</span><b>📍 {character.location}</b></div><div><span>Guilda</span><b>{character.guild}</b></div></div>
        <Progress value={character.hp} max={character.hpMax} label="HP"/><Progress value={character.mp} max={character.mpMax} label="MP"/><Progress value={character.xp} max={character.xpMax} label="EXP"/>
      </article>
    </div>
  </section>
}

function InventoryView(){return <section className="page"><div className="page-head"><div><small>ARMAZENAMENTO</small><h1>Inventário</h1><p>Itens, materiais, consumíveis e equipamentos.</p></div><div className="wallet"><CircleDollarSign/> ₩ {character.won.toLocaleString('pt-BR')}</div></div><div className="inventory-layout"><article className="system-panel"><div className="inventory-grid">{Array.from({length:32}).map((_,i)=>{const it=inventory[i];return <div className={`slot ${it?'filled':''}`} key={i}>{it&&<><span>{it.icon}</span><small>{it.qty>1?`x${it.qty}`:''}</small><div className="slot-tip"><b>{it.name}</b><em>Rank {it.rank} • {it.type}</em></div></>}</div>})}</div></article><article className="system-panel inventory-info"><Backpack/><h2>Capacidade</h2><strong>6 / 32</strong><p>O inventário será sincronizado com o mesmo banco do bot quando a API central for conectada.</p></article></div></section>}

function EquipmentView({avatar}:{avatar:string|null}){
 const left=[['Cabeça','1 slot'],['Corpo','1 slot'],['Pernas 1','1/2'],['Pernas 2','2/2'],['Pés','1 slot']];
 const right=[['Acessório 1','1/4'],['Acessório 2','2/4'],['Acessório 3','3/4'],['Acessório 4','4/4'],['Item de Apoio','1 slot']];
 const weapons=[['Arma 1A','1-FP'],['Arma 1B','1-FP']];
 return <section className="page"><div className="page-head"><div><small>LOADOUT OFICIAL DO BOT</small><h1>Equipamentos</h1><p>Mesmos slots de <code>inventorySystem.js</code>. Arma 2 (2FP) bloqueia os dois slots de Arma 1.</p></div></div>
 <article className="equipment-board official-equipment">
   <div className="equip-column left">{left.map(([s,n])=><button key={s} className="equip-slot static"><Package/><span>{s}</span><small>{n}</small></button>)}</div>
   <div className="equip-center"><div className="equip-avatar official">{avatar?<img src={avatar} alt="Personagem equipado"/>:<UserRound/>}</div><div className="weapon-row">{weapons.map(([s,n])=><button key={s} className="equip-slot static weapon"><Swords/><span>{s}</span><small>{n}</small></button>)}</div><button className="equip-slot static weapon-two"><Swords/><span>Arma 2</span><small>2-FP • bloqueia Arma 1</small></button></div>
   <div className="equip-column right">{right.map(([s,n])=><button key={s} className="equip-slot static"><Gem/><span>{s}</span><small>{n}</small></button>)}</div>
 </article><p className="equipment-rule">Capacidades oficiais: Cabeça 1 • Corpo 1 • Acessórios 4 • Item de Apoio 1 • Pernas 2 • Pés 1 • Arma 1 (1FP) 2 • Arma 2 (2FP) 1.</p></section>}

function SkillsView(){return <section className="page"><div className="page-head"><div><small>COMBATE</small><h1>Habilidades & Técnicas</h1><p>Técnicas ativas, passivas e da classe avançada.</p></div></div><div className="card-grid">{skills.map(([n,t,c,d])=><article className="system-panel skill-card" key={n}><Zap/><div><small>{t}</small><h3>{n}</h3><p>{d}</p></div><b>{c}</b></article>)}</div></section>}

function QuestView(){return <section className="page"><div className="page-head"><div><small>ATIVIDADES</small><h1>Missões</h1><p>Diárias, Associação, NPCs e Dungeon semanal.</p></div></div><div className="quest-list">{quests.map(([n,t,s,d,r])=><article className="system-panel quest-card" key={n}><ScrollText/><div><small>{t}</small><h3>{n}</h3><p>{d}</p></div><span className="status-chip">{s}</span><b>{r}</b></article>)}</div></section>}

function GuildView(){return <section className="page"><div className="page-head"><div><small>ORGANIZAÇÃO</small><h1>Guildas</h1><p>O mundo começa sem nenhuma guilda criada e sem territórios dominados.</p></div></div><div className="empty-feature"><Shield/><h2>Nenhuma guilda criada</h2><p>Criação disponível a partir do Rank D por ₩ 200.000. Os territórios conquistáveis são exclusivamente os locais do novo mapa. Seul permanece neutra e protegida.</p><button>Regras de Guilda</button></div></section>}

function ShopView(){
 const [mode,setMode]=useState<'won'|'mastery'>('won');
 const [catalog,setCatalog]=useState<Record<string,Record<string,any[]>>>({});
 const [techniques,setTechniques]=useState<any[]>([]);
 const [category,setCategory]=useState('Slot de Cabeça');
 useEffect(()=>{fetch('/data/shop-items.json').then(r=>r.json()).then(d=>setCatalog(d.ranks||{}));fetch('/data/mastery-techniques.json').then(r=>r.json()).then(d=>setTechniques(d.techniques||[]))},[]);
 const rankCatalog=catalog[character.rank]||catalog['C']||{}; const categories=Object.keys(rankCatalog); const items=rankCatalog[category]||rankCatalog[categories[0]]||[];
 return <section className="page"><div className="page-head"><div><small>MERCADO • BASE REAL DO BOT</small><h1>Loja</h1><p>Itens em Won e técnicas adquiridas com Maestria ficam separados, como no sistema atual.</p></div><div className="wallet-stack"><div className="wallet"><CircleDollarSign/> ₩ {character.won.toLocaleString('pt-BR')}</div><div className="wallet mastery"><Sparkles/> {character.maestria.toLocaleString('pt-BR')} Maestria</div></div></div>
 <div className="shop-tabs"><button className={mode==='won'?'active':''} onClick={()=>setMode('won')}>ITENS • WON</button><button className={mode==='mastery'?'active':''} onClick={()=>setMode('mastery')}>TÉCNICAS • MAESTRIA</button></div>
 {mode==='won'?<><div className="shop-categories">{categories.map(c=><button key={c} className={category===c?'active':''} onClick={()=>setCategory(c)}>{c}</button>)}</div><div className="shop-list">{items.slice(0,12).map((it:any)=><article className="shop-item expanded" key={it.nome}><Gem/><div><small>Rank {character.rank} • {category}</small><h3>{it.nome}</h3><p>{it.bonus} • {it.descricao}</p></div><b>₩ {Number(it.preco||0).toLocaleString('pt-BR')}</b><button>COMPRAR</button></article>)}</div></>:<div className="shop-list">{techniques.map((t:any)=><article className="shop-item expanded mastery-item" key={t.id}><Zap/><div><small>{t.tipo} • Nível {t.nivel_desbloqueio}</small><h3>{t.nome}</h3><p>{t.descricao} • Mana: {t.custo_mana} MP</p></div><b>{Number(t.custo_maestria||0).toLocaleString('pt-BR')} Maestria</b><button>ADQUIRIR</button></article>)}</div>}
 <p className="section-note">Catálogo de itens importado de <code>src/utils/lojaItens.js</code> e técnicas de Assassino da base enviada. As compras ficam visuais nesta versão; a transação real será ligada ao banco compartilhado na integração.</p></section>}

function SystemsView(){return <section className="page"><div className="page-head"><div><small>ENCICLOPÉDIA</small><h1>Sistemas do RPG</h1><p>Central organizada das regras que hoje vivem no bot e nos documentos do RPG.</p></div></div><div className="systems-grid">{systems.map(([n,d])=><article className="system-card" key={n}><BookOpen/><div><h3>{n}</h3><p>{d}</p></div><ChevronRight/></article>)}</div></section>}

function NpcView(){const npcs=[['Ophilia Clement','Seul — área de templos','Sua rotina espiritual e função de suporte tornam os templos e centros de auxílio o ponto mais coerente para encontrá-la.'],['Therion','Incheon','Porto, fluxo internacional e rotas comerciais combinam com seu perfil furtivo e contatos de submundo.'],['Cyrus Albright','Suwon','Cidade de forte presença acadêmica e tecnológica, adequada à pesquisa, estudo e investigação.'],['Primrose Azelhart','Busan','Grande centro costeiro de entretenimento e vida noturna, coerente com sua atuação social e investigativa.'],['Ochette','Pocheon','Região montanhosa e natural, ideal para uma caçadora ligada a feras e ambientes selvagens.']];return <section className="page"><div className="page-head"><div><small>PERSONAGENS DO MUNDO</small><h1>NPCs</h1><p>A interação em grupo só é liberada quando player e NPC estão na mesma cidade/região.</p></div></div><div className="npc-list">{npcs.map(([n,l,d])=><article className="system-panel npc-card" key={n}><UserRound/><div><h3>{n}</h3><b>📍 {l}</b><p>{d}</p></div><span>Localização-base</span></article>)}</div></section>}

function RankingView(){return <section className="page"><div className="page-head"><div><small>CLASSIFICAÇÃO</small><h1>Rankings</h1><p>Estrutura pronta para Arena, nível, atributos e guildas.</p></div></div><div className="leaderboard">{['Caçador #01','Caçador #02','Irelia','Caçador #04','Caçador #05'].map((n,i)=><div key={n}><strong>#{i+1}</strong><UserRound/><span>{n}</span><b>{(9850-i*730).toLocaleString('pt-BR')} pts</b></div>)}</div></section>}

function HomeView({setTab}:{setTab:(t:Tab)=>void}){return <section className="page home-page"><div className="hero-home"><small>PORTAL DO CAÇADOR</small><h1>Bem-vinda, {character.name}</h1><p>Seu personagem, mundo, guildas, sistemas e progressão em uma única interface.</p><div className="hero-actions"><button onClick={()=>setTab('personagem')}>VER PERSONAGEM</button><button onClick={()=>setTab('mapa')}>ABRIR MAPA</button></div></div><div className="quick-grid"><article><Map/><small>LOCALIZAÇÃO</small><b>Seul</b><span>Zona neutra • Cidade-base</span></article><article><ScrollText/><small>DUNGEON SEMANAL</small><b>Disponível</b><span>Viaje ao Gate para participar</span></article><article><Shield/><small>GUILDA</small><b>Nenhuma</b><span>Mundo ainda sem guildas criadas</span></article><article><CircleDollarSign/><small>SALDO</small><b>₩ {character.won.toLocaleString('pt-BR')}</b><span>Carteira do personagem</span></article></div></section>}

function DemoPortalApp(){
  const [tab,setTab]=useState<Tab>('inicio'); const [menu,setMenu]=useState(false); const [avatar,setAvatarState]=useState<string|null>(null);
  useEffect(()=>{try{setAvatarState(localStorage.getItem('rpg-avatar'))}catch{}},[]);
  const setAvatar=(s:string)=>{setAvatarState(s);try{localStorage.setItem('rpg-avatar',s)}catch{}};
  const nav=useMemo(()=>[
    ['inicio','Início',Home],['personagem','Meu Personagem',UserRound],['inventario','Inventário',Backpack],['equipamentos','Equipamentos',Shield],['habilidades','Habilidades',Zap],['missoes','Missões',ScrollText],['guilda','Guildas',Crown],['mapa','Mapa',Map],['loja','Loja',ShoppingBag],['sistemas','Sistemas',BookOpen],['npcs','NPCs',Users],['ranking','Rankings',Trophy]
  ] as [Tab,string,any][],[]);
  return <main className="portal-shell"><aside className={menu?'portal-nav open':'portal-nav'}><div className="brand"><div className="brand-mark">SL</div><div><b>SOLO LEVELING</b><span>RPG SYSTEM</span></div><button onClick={()=>setMenu(false)}><X/></button></div><nav>{nav.map(([id,label,Icon])=><button key={id} onClick={()=>{setTab(id);setMenu(false)}} className={tab===id?'active':''}><Icon/><span>{label}</span></button>)}</nav><div className="nav-footer"><DoorOpen/><span>!site • sessão vinculada</span></div></aside><section className="portal-content"><header className="topbar"><button className="menu-btn" onClick={()=>setMenu(true)}><Menu/></button><div><span>LOCALIZAÇÃO</span><b>📍 Seul</b></div><div className="top-character"><span>{character.name}</span><b>Lv. {character.level} • Rank {character.rank}</b></div></header><div className={tab==='mapa'?'content-body map-mode':'content-body'}>{tab==='inicio'&&<HomeView setTab={setTab}/>} {tab==='personagem'&&<CharacterView avatar={avatar} setAvatar={setAvatar}/>} {tab==='inventario'&&<InventoryView/>} {tab==='equipamentos'&&<EquipmentView avatar={avatar}/>} {tab==='habilidades'&&<SkillsView/>} {tab==='missoes'&&<QuestView/>} {tab==='guilda'&&<GuildView/>} {tab==='mapa'&&<MapViewer/>} {tab==='loja'&&<ShopView/>} {tab==='sistemas'&&<SystemsView/>} {tab==='npcs'&&<NpcView/>} {tab==='ranking'&&<RankingView/>}</div></section></main>
}

type LivePayload = { player:any; inventory:any[]; skills:any[]; guild:any; location:any; titles:string[]; passives:any[]; slots:Record<string,number> };
function LivePortal(){
 const [data,setData]=useState<LivePayload|null>(null); const [tab,setTab]=useState<'personagem'|'inventario'|'equipamentos'|'habilidades'|'missoes'|'npcs'|'loja'|'mapa'>('personagem'); const [error,setError]=useState(''); const [busy,setBusy]=useState<string|number|null>(null); const [shop,setShop]=useState<any[]>([]); const [quests,setQuests]=useState<any[]>([]); const [npcs,setNpcs]=useState<any[]>([]);
 const load=async()=>{const r=await fetch('/api/me',{cache:'no-store'});if(r.status===401){location.href='/login';return}const d=await r.json();if(!r.ok)throw new Error(d.error);setData(d)};
 useEffect(()=>{load().catch(e=>setError(e.message))},[]);
 useEffect(()=>{if(tab==='loja')fetch('/api/shop').then(r=>r.json()).then(d=>setShop(d.items||[])).catch(()=>{})},[tab]);
 useEffect(()=>{if(tab==='missoes')fetch('/api/quests').then(r=>r.json()).then(d=>setQuests(d.quests||[]));if(tab==='npcs')fetch('/api/npcs').then(r=>r.json()).then(d=>setNpcs(d.npcs||[]))},[tab]);
 const action=async(url:string,body:any,id:string|number)=>{setBusy(id);setError('');try{const r=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const d=await r.json();if(!r.ok)throw new Error(d.error);await load();if(tab==='loja')setShop(s=>s)}catch(e){setError(e instanceof Error?e.message:'Operação falhou.')}finally{setBusy(null)}};
 if(!data)return <main className="portal-shell"><section className="portal-content"><div className="page"><h1>{error||'Carregando personagem...'}</h1></div></section></main>;
 const p=data.player; const stats=[['Força','forca'],['Resistência','resistencia'],['Velocidade','velocidade'],['Sentidos','sentidos'],['Inteligência','inteligencia'],['Poder Mágico','poder_magico']];
 return <main className="portal-shell"><aside className="portal-nav"><div className="brand"><div className="brand-mark">SL</div><div><b>SOLO LEVELING</b><span>RPG SYSTEM</span></div></div><nav>{([['personagem','Meu Personagem'],['inventario','Inventário'],['equipamentos','Equipamentos'],['habilidades','Habilidades'],['missoes','Missões'],['npcs','NPCs'],['loja','Loja'],['mapa','Mapa']] as const).map(([id,label])=><button key={id} className={tab===id?'active':''} onClick={()=>setTab(id)}><span>{label}</span></button>)}</nav></aside><section className="portal-content"><header className="topbar"><div><span>LOCALIZAÇÃO</span><b>📍 {data.location.city_id}</b></div><div className="top-character"><span>{p.nome}</span><b>Lv. {p.nivel} • Rank {p.rank}</b></div></header><div className={tab==='mapa'?'content-body map-mode':'content-body'}>{error&&<p className="section-note">{error}</p>}
 {tab==='personagem'&&<section className="page character-page"><div className="page-head"><div><small>SISTEMA DO CAÇADOR • DADOS REAIS</small><h1>{p.nome}</h1><p>{p.classe} • {p.classe_avancada} • Rank {p.rank}</p></div><div className="rank-emblem">{p.rank}</div></div><div className="character-grid"><article className="system-panel stats-panel"><h2>ATRIBUTOS</h2><div className="stats-list">{stats.map(([label,key])=><div key={key}><span>{label}</span><strong>{p[`${key}_total`]}</strong><small>base {p[`${key}_base`]} • buffs {p[`${key}_buff`]}</small></div>)}</div></article><article className="system-panel status-panel"><h2>STATUS</h2><div className="status-level"><strong>{p.nivel}</strong><span>LEVEL</span></div><div className="status-lines"><div><span>Won</span><b>₩ {Number(p.won||0).toLocaleString('pt-BR')}</b></div><div><span>Maestria</span><b>{Number(p.maestria||0).toLocaleString('pt-BR')}</b></div><div><span>Título</span><b>{p.titulo||'Nenhum'}</b></div><div><span>Guilda</span><b>{data.guild?.nome||'Independente'}</b></div></div><Progress value={p.vida_atual} max={p.vida_maxima} label="HP"/><Progress value={p.mana_atual} max={p.mana_maxima} label="MP"/><Progress value={p.experiencia} max={Math.max(p.experiencia,1)} label="EXP (meta oficial pendente)"/></article></div><div className="card-grid"><article className="system-panel skill-card"><Trophy/><div><small>TÍTULO EQUIPADO</small><h3>{p.titulo||'Nenhum'}</h3><p>{data.titles.join(', ')||'Sem título persistido.'}</p></div></article><article className="system-panel skill-card"><Sparkles/><div><small>PASSIVAS ATIVAS</small><h3>{data.passives.length}</h3><p>{data.passives.map((passive:any)=>passive.nome||passive).join(', ')||'Nenhuma passiva ativa.'}</p></div></article><article className="system-panel skill-card"><Shield/><div><small>GUILDA</small><h3>{data.guild?.nome||'Independente'}</h3><p>{data.guild?.cargo||'Sem vínculo de guilda'}</p></div></article></div></section>}
 {tab==='inventario'&&<section className="page"><div className="page-head"><div><small>ARMAZENAMENTO • BANCO DO BOT</small><h1>Inventário</h1></div><div className="wallet">₩ {Number(p.won||0).toLocaleString('pt-BR')}</div></div><div className="card-grid">{data.inventory.map(item=><article className="system-panel skill-card" key={item.id}><Package/><div><small>{item.slot} • {item.tier||item.categoria}</small><h3>{item.nome} {item.equipado?'• EQUIPADO':''}</h3><p>{item.descricao||'Sem descrição'} • Quantidade: {item.quantidade}</p></div><b>x{item.quantidade}</b></article>)}{!data.inventory.length&&<p>Nenhum item no inventário.</p>}</div></section>}
 {tab==='equipamentos'&&<section className="page"><div className="page-head"><div><small>LOADOUT OFICIAL</small><h1>Equipamentos</h1><p>Arma 2 (2FP) bloqueia automaticamente Arma 1.</p></div></div><div className="card-grid">{data.inventory.filter(i=>!i.consumivel).map(item=><article className="system-panel skill-card" key={item.id}><Shield/><div><small>{item.slot}</small><h3>{item.nome}</h3><p>{item.equipado?'Equipado':'No inventário'}</p></div><button disabled={busy===item.id} onClick={()=>action('/api/equipment',{itemId:item.id},item.id)}>{busy===item.id?'...':item.equipado?'DESEQUIPAR':'EQUIPAR'}</button></article>)}</div></section>}
 {tab==='habilidades'&&<section className="page"><div className="page-head"><div><small>COMBATE • BANCO DO BOT</small><h1>Habilidades & Técnicas</h1></div></div><div className="card-grid">{data.skills.map(skill=><article className="system-panel skill-card" key={skill.id}><Zap/><div><small>{skill.classe} • nível {skill.nivel}</small><h3>{skill.nome}</h3><p>{skill.descricao}</p></div><b>{skill.custo_mana||0} MP</b></article>)}</div></section>}
 {tab==='missoes'&&<section className="page"><div className="page-head"><div><small>MISSÕES REAIS DO BOT</small><h1>Missões</h1></div></div><div className="card-grid">{quests.map(q=><article className="system-panel skill-card" key={q.id}><ScrollText/><div><small>{q.status} • Rank {q.rank||'—'}</small><h3>{q.nome}</h3><p>{q.descricao||q.objetivo_texto||'Sem descrição'}</p></div><b>{q.recompensa_xp||0} XP</b></article>)}{!quests.length&&<p>Nenhuma missão vinculada ao personagem.</p>}</div></section>}
 {tab==='npcs'&&<section className="page"><div className="page-head"><div><small>ARQUIVOS OFICIAIS DO BOT</small><h1>NPCs</h1><p>Localização narrativa é exibida sem expor memória ou prompt interno.</p></div></div><div className="card-grid">{npcs.map(n=><article className="system-panel skill-card" key={n.id}><Users/><div><small>{n.profissao||'NPC'}</small><h3>{n.nome}</h3><p>📍 {n.localizacao||'Localização ainda não configurada'}</p></div></article>)}</div></section>}
 {tab==='loja'&&<section className="page"><div className="page-head"><div><small>LOJA REAL • WON</small><h1>Loja</h1><p>Compras são transacionais no SQLite do bot.</p></div><div className="wallet">₩ {Number(p.won||0).toLocaleString('pt-BR')}</div></div><div className="shop-list">{shop.map(item=><article className="shop-item expanded" key={item.id}><Gem/><div><small>{item.tier||item.categoria}</small><h3>{item.nome}</h3><p>{item.descricao}</p></div><b>₩ {Number(item.preco||item.valor||0).toLocaleString('pt-BR')}</b><button disabled={busy===item.id} onClick={()=>action('/api/shop',{itemId:item.id},item.id)}>COMPRAR</button></article>)}{!shop.length&&<p>Não há itens normalizados com preço no SQLite. O catálogo legado permanece preservado e será migrado incrementalmente.</p>}</div></section>}
 {tab==='mapa'&&<MapViewer/>}
 </div></section></main>
}

export default function PortalApp(){ return <LivePortal/>; }
