'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Gem, Sparkles, Star, Trophy } from 'lucide-react';
import { gachaDebug } from '@/lib/gacha-debug';
import { gachaRewardLabel } from '@/lib/gacha-reward-label';

type Reward = {
  tipo?: string; nome?: string; quantidade?: number; raridade?: string | null;
  estrelas?: number; rank?: string | null; destaque?: number | null;
  grandePremio?: boolean; garantidoConjunto?: boolean; duplicata?: boolean;
  fragmentosInvocacaoRecebidos?: number;
};

type PullResult = { banner?: { nome?: string }; resultados?: Reward[] };
type Phase = 'darkening' | 'riftCharging' | 'riftOpening' | 'rewardEmerging' | 'revealed' | 'gridAppearing' | 'finished';

type Visual = { key: 'three' | 'four' | 'five'; primary: string; secondary: string; glow: number; particles: number; shake: number; width: string; duration: number; flash: number };

export const rarityVisualConfig: Record<Visual['key'], Visual> = {
  three: { key: 'three', primary: '#68cfff', secondary: '#2858d4', glow: .55, particles: 14, shake: 1, width: 'clamp(124px, 27vw, 270px)', duration: 680, flash: .2 },
  four: { key: 'four', primary: '#bd82ff', secondary: '#5731d5', glow: .82, particles: 22, shake: 3, width: 'clamp(150px, 34vw, 360px)', duration: 850, flash: .45 },
  five: { key: 'five', primary: '#eef8ff', secondary: '#7b38e6', glow: 1, particles: 30, shake: 6, width: 'clamp(180px, 42vw, 460px)', duration: 1000, flash: .78 }
};

function visualFor(rewards: Reward[]): Visual {
  const highest = Math.max(...rewards.map(reward => Number(reward.estrelas || (reward.grandePremio ? 5 : 3))), 3);
  return rarityVisualConfig[highest >= 5 ? 'five' : highest >= 4 ? 'four' : 'three'];
}

function IconFor({ reward }: { reward: Reward }) {
  if (reward.grandePremio) return <Trophy />;
  if (Number(reward.estrelas) >= 4 || reward.destaque != null) return <Star />;
  return reward.tipo === 'CRISTAIS' ? <Gem /> : <Sparkles />;
}

export function GachaRewardCard({ reward, revealed, onReveal }: { reward: Reward; revealed: boolean; onReveal?: () => void }) {
  const label = reward.rank || reward.raridade || `${Number(reward.estrelas || 3)}★`;
  return <button type="button" className={`gacha-reveal-card stars-${Math.min(5, Math.max(3, Number(reward.estrelas || 3)))} ${revealed ? 'is-revealed' : ''}`} onClick={onReveal} disabled={!onReveal || revealed} aria-label={revealed ? `Recompensa ${reward.nome}` : 'Revelar recompensa'}>
    <span className="gacha-card-veil" aria-hidden="true"><i /></span>
    <span className="gacha-reward-icon"><IconFor reward={reward} /></span>
    <span className="gacha-card-content"><small>{reward.tipo || 'RECOMPENSA'} · {label}</small><b>{gachaRewardLabel(reward)}</b>{reward.garantidoConjunto && <strong>PEÇA GARANTIDA</strong>}{reward.duplicata && <p>Duplicata → +{reward.fragmentosInvocacaoRecebidos || 0} fragmentos</p>}</span>
  </button>;
}

function VerticalRift({ phase, visual }: { phase: Phase; visual: Visual }) {
  const particles = useMemo(() => Array.from({ length: visual.particles }, (_, index) => ({ id: index, x: `${((index * 37) % 92) + 4}%`, y: `${((index * 53) % 82) + 9}%`, delay: `${(index % 9) * 70}ms` })), [visual]);
  return <div className={`vertical-rift ${phase}`} style={{ '--rift-primary': visual.primary, '--rift-secondary': visual.secondary, '--rift-glow': visual.glow, '--rift-width': visual.width, '--rift-duration': `${visual.duration}ms`, '--rift-flash': visual.flash } as React.CSSProperties} aria-hidden="true">
    <div className="rift-mist" /><div className="rift-outer" /><div className="rift-core" /><div className="rift-edge rift-edge-left" /><div className="rift-edge rift-edge-right" />
    <div className="rift-crack crack-one" /><div className="rift-crack crack-two" /><div className="rift-flash" />
    <div className="rift-particles">{particles.map(particle => <i key={particle.id} style={{ left: particle.x, top: particle.y, animationDelay: particle.delay }} />)}</div>
  </div>;
}

export default function GachaRevealOverlay({ result, onContinue, audio }: { result: PullResult; onContinue: () => void; audio?: Partial<Record<'charge' | 'rupture' | 'impact' | 'rare', () => void>> }) {
  const [mounted, setMounted] = useState(false);
  const dialog = useRef<HTMLDivElement>(null);
  const rewards = useMemo(() => result.resultados || [], [result.resultados]);
  const isTen = rewards.length > 1;
  const visual = useMemo(() => visualFor(rewards), [rewards]);
  const [phase, setPhase] = useState<Phase>('darkening');
  const [revealed, setRevealed] = useState<boolean[]>(() => rewards.map(() => false));
  const allRevealed = revealed.every(Boolean);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setMounted(true);
      gachaDebug('animation mounted');
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    if (!mounted) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.classList.add('gacha-reveal-open');
    dialog.current?.focus();
    return () => {
      document.body.classList.remove('gacha-reveal-open');
      previousFocus?.focus({ preventScroll: true });
    };
  }, [mounted]);
  useEffect(() => {
    if (!mounted) return;
    gachaDebug(`animation phase: ${phase}`);
    if (phase === 'finished' || phase === 'revealed' || phase === 'gridAppearing') return;
    const next: Record<Exclude<Phase, 'revealed' | 'gridAppearing' | 'finished'>, [Phase, number, (() => void) | undefined]> = {
      darkening: ['riftCharging', 350, audio?.charge],
      riftCharging: ['riftOpening', 690, audio?.rupture],
      riftOpening: [isTen ? 'gridAppearing' : 'rewardEmerging', visual.duration, audio?.impact],
      rewardEmerging: ['revealed', 600, Number(rewards[0]?.estrelas || 3) >= 4 ? audio?.rare : undefined]
    };
    const [nextPhase, delay, sound] = next[phase];
    const timer = window.setTimeout(() => { sound?.(); setPhase(nextPhase); }, delay);
    return () => window.clearTimeout(timer);
  }, [mounted, phase, isTen, visual.duration, rewards, audio]);

  const skip = () => { setPhase(isTen ? 'gridAppearing' : 'revealed'); if (!isTen) setRevealed([true]); };
  const revealAll = () => setRevealed(rewards.map(() => true));
  const revealOne = (index: number) => setRevealed(current => current.map((value, itemIndex) => itemIndex === index || value));
  const ready = phase === 'revealed' || phase === 'gridAppearing';

  if (!mounted) return null;
  return createPortal(<div ref={dialog} tabIndex={-1} data-gacha-phase={phase} onKeyDown={event => {
    if (event.key !== 'Tab') return;
    const buttons = Array.from(dialog.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') || []);
    const first = buttons[0], last = buttons.at(-1);
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog.current)) { event.preventDefault(); first?.focus(); }
  }} className={`gacha-reveal-overlay phase-${phase} ${visual.key}`} style={{ '--reveal-primary': visual.primary, '--reveal-secondary': visual.secondary, '--reveal-shake': `${visual.shake}px` } as React.CSSProperties} role="dialog" aria-modal="true" aria-label="Revelação da invocação">
    <div className="gacha-reveal-backdrop" />
    <VerticalRift phase={phase} visual={visual} />
    <div className="gacha-reveal-top"><small>SISTEMA · FENDA DE INVOCAÇÃO</small>{!ready && <button type="button" onClick={skip}>Pular</button>}</div>
    <main className={`gacha-reveal-main ${ready ? 'ready' : ''}`}>
      {!ready && <p className="gacha-reveal-status">{phase === 'darkening' ? 'Lendo assinatura de mana' : phase === 'riftCharging' ? 'A fenda responde' : phase === 'riftOpening' ? 'Rasgando o espaço' : 'Materializando recompensa'}</p>}
      {!isTen && phase === 'revealed' && <div className="gacha-single-reward"><GachaRewardCard reward={rewards[0] || {}} revealed /><button type="button" className="gacha-continue" onClick={onContinue}>Continuar</button></div>}
      {isTen && phase === 'gridAppearing' && <section className="gacha-ten-reveal"><header><small>RECOMPENSAS RECEBIDAS</small><h2>{result.banner?.nome || 'Invocação ×10'}</h2><button type="button" onClick={revealAll}>Revelar tudo</button></header><div className="gacha-ten-grid">{rewards.map((reward, index) => <GachaRewardCard key={`${reward.nome}-${index}`} reward={reward} revealed={revealed[index]} onReveal={() => revealOne(index)} />)}</div>{allRevealed && <button type="button" className="gacha-continue" onClick={onContinue}>Continuar</button>}</section>}
    </main>
  </div>, document.body);
}
