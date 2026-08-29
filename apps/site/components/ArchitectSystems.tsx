'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  BookOpen,
  ChevronRight,
  CircleHelp,
  Database,
  ExternalLink,
  Library,
  Map,
  MessageCircle,
  Search,
  Shield,
  Sparkles,
  Swords,
  Terminal,
  UserRound,
  Users,
  X,
  Zap,
} from 'lucide-react';
import {
  architectCategories,
  architectRootText,
  complementarySystems,
  type ArchitectEntry,
} from '@/lib/architect-catalog';

const icons = {
  cacador: UserRound,
  ascensao: Zap,
  associacoes: Users,
  biblioteca: Library,
  historia: BookOpen,
  dungeon: Swords,
  acervo: Database,
};

function statusLabel(status: ArchitectEntry['siteStatus']) {
  if (status === 'functional') return 'ABRE NO SITE';
  if (status === 'linked') return 'CONSULTA NO SITE';
  return 'AÇÃO PELO BOT';
}

function SystemDetail({ entry, onClose }: { entry: ArchitectEntry; onClose: () => void }) {
  return (
    <aside className="architect-detail" aria-label={`Detalhes de ${entry.title}`}>
      <button className="architect-detail-close" onClick={onClose} aria-label="Fechar detalhes">
        <X />
      </button>
      <small>ARQUIVO DO SISTEMA</small>
      <h2>{entry.title}</h2>
      <div className="architect-command"><Terminal /><code>{entry.command}</code></div>

      <div className="architect-detail-block">
        <span>FUNÇÃO REGISTRADA NO BOT</span>
        <p>{entry.functionText}</p>
      </div>

      <div className="architect-detail-block">
        <span>DESCRIÇÃO DO BOT</span>
        <p>{entry.description}</p>
      </div>

      {entry.note && (
        <div className="architect-detail-note">
          <CircleHelp />
          <p>{entry.note}</p>
        </div>
      )}

      <div className="architect-detail-meta">
        <div><span>ORIGEM</span><b>apps/bot/src/commands/{entry.source}</b></div>
        <div><span>STATUS WEB</span><b>{statusLabel(entry.siteStatus)}</b></div>
      </div>

      {entry.href ? (
        <Link className="architect-open-button" href={entry.href}>
          <ExternalLink /> Abrir sistema no site
        </Link>
      ) : (
        <div className="architect-bot-only">
          <MessageCircle />
          <div>
            <b>Continua pelo WhatsApp</b>
            <p>Esta ação ainda não possui uma interface web ligada ao serviço do bot. A descrição acima é a mesma referência usada pelo sistema atual.</p>
          </div>
        </div>
      )}
    </aside>
  );
}

export default function ArchitectSystems() {
  const [activeId, setActiveId] = useState('cacador');
  const [selected, setSelected] = useState<ArchitectEntry | null>(null);
  const [query, setQuery] = useState('');
  const active = useMemo(
    () => architectCategories.find((category) => category.id === activeId) || architectCategories[0],
    [activeId],
  );

  const allEntries = useMemo(
    () => [...architectCategories.flatMap((category) => category.entries), ...complementarySystems],
    [],
  );

  const searchResults = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('pt-BR');
    if (!normalized) return [];
    return allEntries.filter((entry) =>
      [entry.title, entry.command, entry.functionText, entry.description]
        .join(' ')
        .toLocaleLowerCase('pt-BR')
        .includes(normalized),
    );
  }, [allEntries, query]);

  const Icon = icons[active.id as keyof typeof icons] || Shield;

  return (
    <div className="architect-page">
      <section className="architect-hero">
        <div className="architect-hero-glyph"><Sparkles /></div>
        <small>SISTEMA DO ARQUITETO</small>
        <h1>Conheça o mundo.<br /><em>Entenda o Sistema.</em></h1>
        <p>{architectRootText.replace(/[_*]/g, '').replace('「 ARQUITETO 」', '').trim()}</p>
        <div className="architect-scan"><span />BOT E SITE // MESMA REFERÊNCIA DE SISTEMAS</div>
      </section>

      <section className="architect-search-shell">
        <Search />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar sistema ou comando..."
          aria-label="Buscar sistema ou comando"
        />
        {query && <button onClick={() => setQuery('')} aria-label="Limpar busca"><X /></button>}
      </section>

      {query.trim() ? (
        <section className="architect-category architect-search-results">
          <header>
            <div className="architect-category-icon"><Search /></div>
            <div>
              <small>BUSCA GLOBAL</small>
              <h2>{searchResults.length} resultado{searchResults.length === 1 ? '' : 's'}</h2>
              <p>A busca consulta todos os sistemas expostos pelo Arquiteto e os sistemas complementares já registrados no bot.</p>
            </div>
          </header>
          <div className="architect-entry-grid">
            {searchResults.map((entry, index) => (
              <button className="architect-entry architect-entry-button" key={entry.id} onClick={() => setSelected(entry)}>
                <span className="architect-index">{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <small>{entry.command}</small>
                  <h3>{entry.title}</h3>
                  <p>{entry.description}</p>
                  <b className={`status-${entry.siteStatus}`}>{statusLabel(entry.siteStatus)}</b>
                </div>
                <ChevronRight />
              </button>
            ))}
            {!searchResults.length && (
              <article className="architect-empty-search">
                <CircleHelp />
                <h3>Nenhum sistema encontrado.</h3>
                <p>Tente buscar pelo nome do sistema ou pelo comando usado no WhatsApp.</p>
              </article>
            )}
          </div>
        </section>
      ) : (
        <>
          <div className="architect-tabs" role="tablist" aria-label="Categorias do Arquiteto">
            {architectCategories.map((category) => {
              const CategoryIcon = icons[category.id as keyof typeof icons] || Shield;
              return (
                <button
                  key={category.id}
                  className={category.id === active.id ? 'active' : ''}
                  onClick={() => { setActiveId(category.id); setSelected(null); }}
                >
                  <CategoryIcon />
                  <span>{category.title}</span>
                </button>
              );
            })}
          </div>

          <section className="architect-category">
            <header>
              <div className="architect-category-icon"><Icon /></div>
              <div>
                <small>{active.eyebrow}</small>
                <h2>{active.title}</h2>
                <p>{active.intro}</p>
              </div>
            </header>

            <details className="architect-bot-text">
              <summary><Terminal /> Ver texto original desta área no bot</summary>
              <pre>{active.botText}</pre>
            </details>

            <div className="architect-entry-grid">
              {active.entries.map((entry, index) => (
                <button className="architect-entry architect-entry-button" key={entry.id} onClick={() => setSelected(entry)}>
                  <span className="architect-index">{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <small>{entry.command}</small>
                    <h3>{entry.title}</h3>
                    <p>{entry.description}</p>
                    <b className={`status-${entry.siteStatus}`}>{statusLabel(entry.siteStatus)}</b>
                  </div>
                  <ChevronRight />
                </button>
              ))}
            </div>
          </section>

          <section className="architect-complementary">
            <div className="architect-complementary-title">
              <Map />
              <div>
                <small>SISTEMAS COMPLEMENTARES</small>
                <h2>Também ligados ao portal</h2>
                <p>Estes sistemas existem no bot atual e possuem atalhos diretos no site, embora não apareçam como áreas principais do comando <code>!Arquiteto</code>.</p>
              </div>
            </div>
            <div className="architect-entry-grid">
              {complementarySystems.map((entry, index) => (
                <button className="architect-entry architect-entry-button" key={entry.id} onClick={() => setSelected(entry)}>
                  <span className="architect-index">{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <small>{entry.command}</small>
                    <h3>{entry.title}</h3>
                    <p>{entry.description}</p>
                    <b className={`status-${entry.siteStatus}`}>{statusLabel(entry.siteStatus)}</b>
                  </div>
                  <ChevronRight />
                </button>
              ))}
            </div>
          </section>
        </>
      )}

      {selected && (
        <div className="architect-detail-backdrop" onMouseDown={(event) => {
          if (event.currentTarget === event.target) setSelected(null);
        }}>
          <SystemDetail entry={selected} onClose={() => setSelected(null)} />
        </div>
      )}
    </div>
  );
}
