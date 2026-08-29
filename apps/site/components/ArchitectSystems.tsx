'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  BookOpen, ChevronRight, Crown, Database, Hammer, Landmark, Library,
  Map, Network, ScrollText, Shield, Sparkles, Swords, Trophy, UserRound,
  Users, WandSparkles, Zap
} from 'lucide-react';

type Entry = {
  title: string;
  command?: string;
  description: string;
  href?: string;
  tag?: string;
};

type Category = {
  id: string;
  title: string;
  eyebrow: string;
  intro: string;
  icon: typeof UserRound;
  entries: Entry[];
};

const categories: Category[] = [
  {
    id: 'cacador', title: 'Caçador', eyebrow: 'REGISTRO DO JOGADOR', icon: UserRound,
    intro: 'Tudo que define o seu Caçador: ficha, atributos, inventário, técnicas, equipamentos e recursos pessoais.',
    entries: [
      { title: 'Meu Personagem', command: '!Jogador', description: 'Ficha, Rank, nível, classe e atributos atuais.', href: '/personagem', tag: 'FUNCIONAL' },
      { title: 'Nível', command: '!Nível', description: 'Consulte sua progressão e o estágio atual do personagem.' },
      { title: 'Distribuição de Atributos', command: '!Distribuir', description: 'Entenda como os pontos são distribuídos entre os atributos oficiais.' },
      { title: 'Afinidade', command: '!Consultar Afinidade', description: 'Consulte a afinidade elemental/mágica registrada para o personagem.' },
      { title: 'Equipamentos', command: '!Equipados', description: 'Veja o loadout, slots oficiais e itens atualmente equipados.', href: '/equipamentos', tag: 'FUNCIONAL' },
      { title: 'Inventário', command: '!Inventário', description: 'Itens, materiais, armas, equipamentos e consumíveis do personagem.', href: '/inventario', tag: 'FUNCIONAL' },
      { title: 'Passivas', command: '!Minhas Passivas', description: 'Passivas adquiridas e efeitos permanentes do personagem.', href: '/titulos' },
      { title: 'Títulos', command: '!Meus Títulos', description: 'Títulos conquistados e os efeitos vinculados a eles.', href: '/titulos' },
      { title: 'Técnicas', command: '!Minhas Técnicas', description: 'Técnicas aprendidas, domínio e arsenal de combate.', href: '/habilidades', tag: 'FUNCIONAL' },
      { title: 'HP', command: '!Hp', description: 'Regras de vida, dano e recuperação do Caçador.' },
    ]
  },
  {
    id: 'ascensao', title: 'Ascensão', eyebrow: 'EVOLUÇÃO', icon: Zap,
    intro: 'Os caminhos de crescimento do Sistema: progressão, penalidades, histórico, classes avançadas e ascensão de Rank.',
    entries: [
      { title: 'Progresso', command: '!Progresso', description: 'Acompanhe o avanço geral do personagem.' },
      { title: 'Penalidade', command: '!Penalidade', description: 'Consulte penalidades e consequências registradas pelo Sistema.' },
      { title: 'Histórico', command: '!Histórico', description: 'Registro da evolução e acontecimentos relevantes do Caçador.' },
      { title: 'Classe Avançada', command: '!Classe Avançada', description: 'Caminho de evolução disponível a partir do nível 40.' },
      { title: 'Informações de Rank', command: '!Rank Info', description: 'Regras, requisitos e significado dos Ranks de Caçador.' },
      { title: 'Locais de Treino', command: '!Locais', description: 'Locais especiais do mundo e benefícios associados.', href: '/mapa' },
    ]
  },
  {
    id: 'associacoes', title: 'Associações', eyebrow: 'ORGANIZAÇÕES DO MUNDO', icon: Users,
    intro: 'Guildas, organizações, hierarquias, guerras, territórios e grupos que disputam influência no mundo dos Caçadores.',
    entries: [
      { title: 'Guildas', command: '!Guilda', description: 'Crie, procure, entre e acompanhe sua Guilda diretamente pelo Sistema.', href: '/guilda', tag: 'FUNCIONAL' },
      { title: 'Rankings', command: '!Rank', description: 'Classificações e posição dos Caçadores.' },
      { title: 'Membros', command: '!Membroa', description: 'Gestão e consulta dos membros de organizações.' },
      { title: 'Cargos', command: '!Cargosa', description: 'Hierarquia e funções internas das organizações.' },
      { title: 'Investimentos', command: '!Investimentos', description: 'Recursos investidos em organizações e estruturas.' },
      { title: 'Guerra', command: '!Guerra', description: 'Conflitos entre Guildas e regras de GvG.' },
      { title: 'MVP', command: '!MVP', description: 'Destaques e desempenho em atividades competitivas.' },
      { title: 'Submundo', command: '!Submundo', description: 'Informações sobre grupos e atividades ligadas ao Submundo.' },
      { title: 'Territórios', command: '!Territórios', description: 'Conquista, domínio e administração territorial.', href: '/mapa' },
    ]
  },
  {
    id: 'biblioteca', title: 'Biblioteca', eyebrow: 'CONHECIMENTO DO SISTEMA', icon: Library,
    intro: 'A enciclopédia mecânica do RPG: atributos, estilos, poderes únicos, títulos, passivas e Portais.',
    entries: [
      { title: 'Atributos Físicos', command: '!Atributos Físicos', description: 'Força, Resistência, Velocidade e Sentidos.' },
      { title: 'Atributos Mágicos', command: '!Atributos Mágicos', description: 'Inteligência, Poder Mágico e regras relacionadas ao uso de energia.' },
      { title: 'Atributos Adicionais', command: '!Atributos Adicionais', description: 'Valores derivados e sistemas complementares da ficha.' },
      { title: 'Habilidades Únicas', command: '!Únicos', description: 'Poderes individuais originados da história e trajetória de cada personagem.' },
      { title: 'Estilos de Luta', command: '!Estilos de Luta', description: 'Proficiências, armas e caminhos técnicos de combate.' },
      { title: 'Passivas', command: '!Passivas', description: 'Catálogo e regras de habilidades passivas.' },
      { title: 'Títulos', command: '!Títulos', description: 'Sistema de conquistas e títulos especiais.' },
      { title: 'Portais', command: '!Portais', description: 'Viagem entre capitais e regras oficiais dos Gates internacionais.', href: '/mapa' },
    ]
  },
  {
    id: 'historia', title: 'História', eyebrow: 'CRÔNICAS DO MUNDO', icon: ScrollText,
    intro: 'Missões, capítulos, Fragmentos e forças que conduzem a história do universo do RPG.',
    entries: [
      { title: 'Ler História', command: '!Ler História', description: 'Acompanhe os capítulos e acontecimentos já registrados.' },
      { title: 'Missões', command: '!Missões', description: 'Objetivos ativos e missões disponíveis para o personagem.', href: '/missoes', tag: 'FUNCIONAL' },
      { title: 'Fragmentos', command: '!Fragmentos', description: 'Fragmentos narrativos e recursos relacionados à progressão da história.' },
      { title: 'Monarcas', command: '!Monarcas', description: 'Informações relacionadas aos Monarcas no universo do RPG.' },
      { title: 'Governantes', command: '!Governantes', description: 'Informações relacionadas aos Governantes.' },
      { title: 'Sucessores', command: '!Sucessores', description: 'Sistema e registros de sucessão de poderes.' },
    ]
  },
  {
    id: 'dungeon', title: 'Dungeon Semanal', eyebrow: 'INCURSÃO ESPECIAL', icon: Swords,
    intro: 'Consulte Gates semanais, objetivos, regras de participação e recompensas. A localização do personagem continua sendo requisito do mundo.',
    entries: [
      { title: 'Dungeon Semanal', command: '!Consultar Dungeon Semanal', description: 'Veja a incursão semanal atualmente liberada.', href: '/dungeons', tag: 'FUNCIONAL' },
      { title: 'Mapa dos Gates', description: 'Localize Dungeons e viaje até o ponto correto antes de participar.', href: '/mapa', tag: 'FUNCIONAL' },
    ]
  },
  {
    id: 'acervo', title: 'Acervo', eyebrow: 'PERSONAGENS E OFÍCIOS', icon: Database,
    intro: 'NPCs, relações, missões, profissões e sistemas de criação ligados aos habitantes do mundo.',
    entries: [
      { title: 'Amizade', command: '!Amizade', description: 'Relações e vínculos construídos com personagens do mundo.' },
      { title: 'NPCs', command: '!Npc', description: 'Guia de interação com NPCs e cenas narrativas.', href: '/npcs', tag: 'FUNCIONAL' },
      { title: 'Listar NPCs', command: '!Listar Npcs', description: 'Catálogo dos NPCs conhecidos pelo Sistema.', href: '/npcs' },
      { title: 'Fermentação', command: '!Fermentação', description: 'Sistema de produção e criação ligado à fermentação.' },
      { title: 'Bigorna', command: '!Bigorna', description: 'Processos de aprimoramento e trabalho de forja.' },
      { title: 'Encantamento', command: '!Encantamento', description: 'Aplicação de propriedades especiais em equipamentos.' },
      { title: 'Ferreiro Bilac', command: '!Olá Bilac', description: 'Oficina de forjas de Rank E a B e atendimento do NPC profissional.' },
    ]
  },
];

const categoryIcons = [Shield, Crown, Landmark, BookOpen, Map, WandSparkles, Trophy, Network, Hammer, Sparkles];

export default function ArchitectSystems(){
  const [activeId,setActiveId]=useState('cacador');
  const active=useMemo(()=>categories.find(c=>c.id===activeId) || categories[0],[activeId]);
  const Icon=active.icon;
  return <div className="architect-page">
    <section className="architect-hero">
      <div className="architect-hero-glyph"><Sparkles/></div>
      <small>SISTEMA DO ARQUITETO</small>
      <h1>Escolha seu caminho,<br/><em>Jogador.</em></h1>
      <p>O mundo foi organizado em caminhos guiados. Explore cada sistema, entenda suas regras e acesse diretamente aquilo que já pode ser realizado pelo site.</p>
      <div className="architect-scan"><span/>ARQUITETO // ARQUIVOS SINCRONIZADOS</div>
    </section>

    <div className="architect-tabs" role="tablist" aria-label="Categorias do Arquiteto">
      {categories.map((c,i)=>{const CIcon=c.icon || categoryIcons[i%categoryIcons.length];return <button key={c.id} className={c.id===active.id?'active':''} onClick={()=>setActiveId(c.id)}><CIcon/><span>{c.title}</span></button>})}
    </div>

    <section className="architect-category">
      <header><div className="architect-category-icon"><Icon/></div><div><small>{active.eyebrow}</small><h2>{active.title}</h2><p>{active.intro}</p></div></header>
      <div className="architect-entry-grid">
        {active.entries.map((entry,index)=>{
          const content=<><span className="architect-index">{String(index+1).padStart(2,'0')}</span><div><small>{entry.command||'SISTEMA'}</small><h3>{entry.title}</h3><p>{entry.description}</p>{entry.tag&&<b>{entry.tag}</b>}</div><ChevronRight/></>;
          return entry.href?<Link className="architect-entry" href={entry.href} key={entry.title}>{content}</Link>:<article className="architect-entry info-only" key={entry.title}>{content}</article>
        })}
      </div>
    </section>
  </div>
}
