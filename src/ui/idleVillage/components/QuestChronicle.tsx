import React, { useMemo, useState } from 'react';
import type { QuestPhase, QuestPhaseResult, QuestPhaseType } from '@/balancing/config/idleVillage/types';
import idleVillagePanorama from '@/assets/ui/idleVillage/idle-village-map.jpg';

export type PhaseVisualState = 'locked' | 'active' | 'success' | 'failure';

export interface QuestChroniclePhase {
  phase: QuestPhase;
  state: PhaseVisualState;
  result?: QuestPhaseResult;
}

export interface QuestChronicleOutcome {
  result: 'victory' | 'defeat';
  label: string;
  subLabel?: string;
  icon?: string;
}

export interface QuestChronicleProps {
  title: string;
  summary?: string;
  phases: QuestChroniclePhase[];
  currentPhaseIndex: number;
  activePhaseProgress?: number;
  outcome?: QuestChronicleOutcome;
  questDone?: boolean;
  onOpenTheater?: () => void;
  panoramaUrl?: string;
}

const RISK_FALLBACKS: Record<QuestPhaseType, { injury: number; death: number }> = {
  check: { injury: 18, death: 4 },
  fight: { injury: 40, death: 15 },
  stealth: { injury: 25, death: 8 },
  trap: { injury: 12, death: 2 },
  explore: { injury: 20, death: 6 },
  dialogue: { injury: 0, death: 0 },
  branch: { injury: 0, death: 0 },
  timedChoice: { injury: 0, death: 0 },
};

type VariantKey = 've' | 'va' | 'vj';

const VARIANT_MAP: Record<QuestPhaseType, VariantKey> = {
  check: 'va',
  fight: 've',
  stealth: 'va',
  trap: 'vj',
  explore: 'va',
  dialogue: 'va',
  branch: 'va',
  timedChoice: 'va',
};

const PAL: Record<VariantKey, { r0: string; r1: string; r2: string; s0: string; s1: string; g: string }> = {
  ve: { r0: '#fcd34d', r1: '#b45309', r2: '#78350f', s0: '#1c0e04', s1: '#2e1508', g: 'rgba(245,158,11,.65)' },
  va: { r0: '#c4b5fd', r1: '#7c3aed', r2: '#3b1789', s0: '#0d0818', s1: '#180d2a', g: 'rgba(167,139,250,.6)' },
  vj: { r0: '#6ee7b7', r1: '#059669', r2: '#064e3b', s0: '#021a12', s1: '#073020', g: 'rgba(16,185,129,.6)' },
};

const FILL_GRADIENTS: Record<VariantKey, string> = {
  ve: 'linear-gradient(90deg,#92400e,#f59e0b,#fde68a)',
  va: 'linear-gradient(90deg,#5b21b6,#a78bfa,#ddd6fe)',
  vj: 'linear-gradient(90deg,#064e3b,#10b981,#6ee7b7)',
};

const FILL_SHADOWS: Record<VariantKey, string> = {
  ve: '0 0 6px rgba(245,158,11,.55)',
  va: '0 0 6px rgba(167,139,250,.5)',
  vj: '0 0 6px rgba(16,185,129,.5)',
};

interface DerivedCard {
  key: string;
  phase: QuestPhase;
  icon: string;
  variant: VariantKey;
  progressFraction: number;
  injury: number;
  death: number;
  isCurrent: boolean;
  state: PhaseVisualState;
  result?: QuestPhaseResult;
  seed: number;
  sky: string;
  midFill: string;
  fgFill: string;
  accent: string;
}

const SKY_MAP: Record<QuestPhaseType, string> = {
  stealth: '#091420',
  fight: '#160c08',
  check: '#08090f',
  trap: '#090a0a',
  dialogue: '#100e06',
  explore: '#091420',
  branch: '#08090f',
  timedChoice: '#08090f',
};

function saturation(state: PhaseVisualState, prog: number): number {
  if (state === 'success' || state === 'failure') return 1;
  if (state === 'active') return Math.max(0.15, prog);
  return 0;
}

function brightness(state: PhaseVisualState, prog: number): number {
  if (state === 'success') return 1;
  if (state === 'failure') return 0.8;
  if (state === 'active') return 0.7 + prog * 0.3;
  return 0.45;
}

const NOISE_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.52' numOctaves='4' seed='3'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 .07 0 0 0 0 .045 0 0 0 0 .02 0 0 0 0.28 0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E";

const QuestChronicle: React.FC<QuestChronicleProps> = ({
  title,
  phases,
  currentPhaseIndex,
  activePhaseProgress = 0,
  outcome: _outcome,
  questDone: _questDone,
  onOpenTheater,
  panoramaUrl,
}) => {
  const [isNarrativeExpanded, setIsNarrativeExpanded] = useState(true);

  const cards: DerivedCard[] = useMemo(() => {
    return phases.map((entry, index) => {
      const phase = entry.phase;
      const variant = VARIANT_MAP[phase.type];
      const riskProfile = phase.riskProfile;
      const fallback = RISK_FALLBACKS[phase.type];
      const prog = entry.state === 'success' ? 1 : entry.state === 'failure' ? 1 : entry.state === 'active' ? activePhaseProgress : 0;
      return {
        key: phase.id,
        phase,
        icon: phase.icon ?? (phase.type === 'fight' ? '⚔️' : phase.type === 'check' ? '🎲' : '🛠️'),
        variant,
        progressFraction: prog,
        injury: riskProfile?.injuryChance ?? fallback.injury,
        death: riskProfile?.deathChance ?? fallback.death,
        isCurrent: index === currentPhaseIndex,
        state: entry.state,
        result: entry.result,
        seed: index * 10 + 7,
        sky: SKY_MAP[phase.type],
        midFill: `rgba(${phase.type === 'fight' ? '42,20,10' : phase.type === 'stealth' ? '12,36,22' : '20,18,36'},.88)`,
        fgFill: `rgba(${phase.type === 'fight' ? '18,8,4' : phase.type === 'stealth' ? '5,14,9' : '8,7,18'},.96)`,
        accent: `rgba(${phase.type === 'fight' ? '165,82,20' : phase.type === 'stealth' ? '30,80,36' : '82,62,165'},.18)`,
      };
    });
  }, [phases, currentPhaseIndex, activePhaseProgress]);

  const latestResolved = useMemo(() => {
    const resolved = phases.filter((e) => e.result);
    return resolved[resolved.length - 1] ?? null;
  }, [phases]);

  const boardStatus = (() => {
    if (latestResolved?.result?.result === 'failure') return 'failure';
    if (latestResolved?.result?.result === 'success') return 'success';
    if (phases.some((e) => e.state === 'failure')) return 'failure';
    if (phases.every((e) => e.state === 'success')) return 'success';
    return 'pending';
  })();

  const boardLabel = boardStatus === 'success'
    ? 'Ultima prova superata'
    : boardStatus === 'failure'
      ? 'Prova fallita'
      : 'In attesa di esito dalla pattuglia';

  const activeNarrative = cards[currentPhaseIndex]?.phase.copy?.narrative ?? null;
  const backgroundImage = panoramaUrl ?? idleVillagePanorama;

  return (
    <div
      className="relative"
      style={{
        padding: 10,
        borderRadius: 24,
        background: 'linear-gradient(135deg, #fce89a 0%, #e4b048 8%, #a05c18 22%, #602c08 38%, #341604 58%, #6b3a10 72%, #c8903a 84%, #f0cc70 92%, #a86820 100%)',
        boxShadow: '0 0 0 1px rgba(0,0,0,0.9), 0 0 0 2px rgba(80,40,10,0.6), inset 0 1px 0 rgba(255,230,140,0.25), inset 0 -1px 0 rgba(40,15,5,0.8), 0 20px 60px rgba(0,0,0,0.9), 0 4px 20px rgba(120,70,10,0.3)',
      }}
    >
      {/* Noise texture */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ borderRadius: 24, backgroundImage: `url("${NOISE_SVG}")`, opacity: 0.7, zIndex: 1 }}
        aria-hidden
      />
      {/* Bevel inner shadow */}
      <div
        className="pointer-events-none absolute"
        style={{ inset: 10, borderRadius: 16, boxShadow: 'inset 0 0 12px rgba(0,0,0,0.7), inset 0 2px 4px rgba(0,0,0,0.5)', zIndex: 10 }}
        aria-hidden
      />
      {/* Corner ornaments */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ zIndex: 2, borderRadius: 24, overflow: 'hidden' }}>
        <polygon points="4,4 8,7 4,10 0,7" fill="#e4b048" opacity=".7" />
        <polygon points="96,4 100,7 96,10 92,7" fill="#e4b048" opacity=".7" />
        <polygon points="4,90 8,93 4,96 0,93" fill="#e4b048" opacity=".7" />
        <polygon points="96,90 100,93 96,96 92,93" fill="#e4b048" opacity=".7" />
        <polygon points="50,1 52.5,4 50,7 47.5,4" fill="#fce890" opacity=".55" />
        <path d="M12 5 Q50 2 88 5" fill="none" stroke="rgba(252,232,144,0.3)" strokeWidth=".4" />
        <path d="M12 95 Q50 98 88 95" fill="none" stroke="rgba(20,8,2,0.6)" strokeWidth=".5" />
      </svg>

      {/* Main content */}
      <div className="relative overflow-hidden" style={{ borderRadius: 16, zIndex: 3, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.6)' }}>

        {/* Cinema / Panorama */}
        <div className="relative overflow-hidden" style={{ aspectRatio: '21/9', background: '#08131f' }}>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${backgroundImage})` }}
            aria-hidden
          />
          {/* Vignette */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(5,5,9,.1) 0%, transparent 30%, transparent 50%, rgba(4,6,10,.72) 76%, rgba(3,5,9,.97) 100%)' }} aria-hidden />
          {/* Theater button */}
          {onOpenTheater && (
            <button
              type="button"
              onClick={onOpenTheater}
              className="absolute"
              style={{
                top: '4%', right: '3%',
                fontFamily: "'Trebuchet MS', sans-serif",
                fontSize: 'clamp(7px, 0.72vw, 9px)',
                letterSpacing: '0.44em',
                textTransform: 'uppercase',
                color: 'rgba(200,160,60,.75)',
                border: '1px solid rgba(180,130,40,.35)',
                background: 'rgba(5,5,9,.55)',
                padding: '5px 14px',
                borderRadius: 20,
                cursor: 'pointer',
              }}
            >
              Apri Teatro
            </button>
          )}
          {/* Title block */}
          <div className="absolute inset-x-0 bottom-0" style={{ padding: '0 4.5% 3%' }}>
            <div style={{ width: 55, height: 1, background: 'linear-gradient(to right, rgba(200,155,45,.65), transparent)', marginBottom: 6 }} />
            <div style={{
              fontFamily: "'Trebuchet MS', sans-serif",
              fontSize: 'clamp(6px, 0.7vw, 8px)',
              letterSpacing: '0.52em',
              textTransform: 'uppercase',
              color: 'rgba(195,155,55,.58)',
              marginBottom: 4,
            }}>
              Quest Chronicle
            </div>
            <div style={{
              fontSize: 'clamp(13px, 2.2vw, 28px)',
              fontWeight: 'normal',
              fontStyle: 'italic',
              letterSpacing: '0.2em',
              color: '#f0e8c8',
              textShadow: '0 0 50px rgba(195,150,40,.4), 0 2px 6px rgba(0,0,0,.9)',
            }}>
              {title}
            </div>
          </div>
        </div>

        {/* Table section */}
        <div className="relative overflow-hidden" style={{ background: '#07090e', borderTop: '1px solid rgba(150,115,35,.2)' }}>
          {/* Stone texture */}
          <div className="pointer-events-none absolute inset-0" style={{ opacity: 0.12 }} aria-hidden>
            <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
              <filter id="fsto"><feTurbulence type="fractalNoise" baseFrequency=".48 .52" numOctaves="4" seed="8" result="n" /><feColorMatrix in="n" type="matrix" values="0 0 0 0 .06 0 0 0 0 .08 0 0 0 0 .05 0 0 0 1 0" /></filter>
              <rect width="100%" height="100%" filter="url(#fsto)" />
            </svg>
          </div>

          <div className="relative" style={{ zIndex: 2, padding: '2.8% 4% 3.5%' }}>
            {/* Progress bar */}
            <div style={{ marginBottom: '2.5%' }}>
              <div style={{
                height: 5, background: 'rgba(255,255,255,.04)', borderRadius: 3, overflow: 'hidden', display: 'flex', border: '1px solid rgba(255,255,255,.03)',
              }}>
                {cards.map((card, i) => (
                  <div key={card.key} style={{ flex: 1, position: 'relative', borderRight: i < cards.length - 1 ? '1px solid rgba(0,0,0,.5)' : 'none' }}>
                    <div style={{
                      position: 'absolute', insetBlock: 0, left: 0,
                      width: `${card.progressFraction * 100}%`,
                      borderRadius: 2,
                      background: FILL_GRADIENTS[card.variant],
                      boxShadow: FILL_SHADOWS[card.variant],
                    }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Main row: phases + narrative */}
            <div style={{ display: 'flex', gap: '2.5%', alignItems: 'stretch', flexWrap: 'wrap' }}>
              {/* Phase cards */}
              <div style={{ flex: '1 1 280px', display: 'flex', gap: '1.8%', minWidth: 0 }}>
                {cards.map((card) => (
                  <PhaseCard key={card.key} card={card} />
                ))}
              </div>

              {/* Narrative sidebar */}
              <div style={{
                flex: '0 0 21%', minWidth: 140,
                borderLeft: '1px solid rgba(150,115,35,.13)',
                paddingLeft: '3%',
                display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 9,
              }}>
                <div style={{
                  fontFamily: "'Trebuchet MS', sans-serif",
                  fontSize: 'clamp(6px, 0.62vw, 7.5px)',
                  letterSpacing: '0.46em',
                  textTransform: 'uppercase',
                  color: 'rgba(190,145,50,.46)',
                  display: 'flex', alignItems: 'center', gap: 5,
                  cursor: 'pointer',
                }}
                  onClick={() => setIsNarrativeExpanded((p) => !p)}
                >
                  <span style={{ width: 11, height: 1, background: 'rgba(190,145,50,.26)', flexShrink: 0 }} />
                  Diario
                </div>
                {isNarrativeExpanded && (
                  <div style={{
                    fontSize: 'clamp(9px, 0.95vw, 12px)',
                    lineHeight: 1.82,
                    fontStyle: 'italic',
                    color: 'rgba(215,200,165,.75)',
                  }}>
                    {activeNarrative ?? 'La pattuglia avanza tra le rovine — ogni passo potrebbe essere l\'ultimo.'}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                  {boardStatus !== 'pending' && (
                    <span style={{
                      fontFamily: "'Trebuchet MS', sans-serif",
                      fontSize: 'clamp(5px, 0.58vw, 7px)',
                      letterSpacing: '0.36em',
                      textTransform: 'uppercase',
                      padding: '2px 9px',
                      borderRadius: 10,
                      border: boardStatus === 'success' ? '1px solid rgba(16,185,129,.4)' : '1px solid rgba(244,63,94,.4)',
                      color: boardStatus === 'success' ? 'rgba(105,225,165,.9)' : 'rgba(255,130,130,.9)',
                      background: boardStatus === 'success' ? 'rgba(10,80,50,.2)' : 'rgba(80,10,20,.2)',
                    }}>
                      {boardStatus === 'success' ? 'Successo' : 'Fallimento'}
                    </span>
                  )}
                  <span style={{
                    fontFamily: "'Trebuchet MS', sans-serif",
                    fontSize: 'clamp(4px, 0.55vw, 6.5px)',
                    letterSpacing: '0.28em',
                    textTransform: 'uppercase',
                    color: 'rgba(170,180,170,.4)',
                  }}>
                    {boardLabel}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Outcome splash overlay */}
          {_outcome && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                zIndex: 20,
                background: 'radial-gradient(ellipse at center, rgba(3,5,10,.92) 0%, rgba(3,5,10,.78) 100%)',
                backdropFilter: 'blur(4px)',
              }}
            >
              <div className="flex flex-col items-center gap-3 text-center" style={{ fontFamily: "'Palatino Linotype', Palatino, serif" }}>
                {_outcome.icon && (
                  <div style={{
                    fontSize: 'clamp(28px, 4vw, 48px)',
                    lineHeight: 1,
                    filter: _outcome.result === 'victory'
                      ? 'drop-shadow(0 0 20px rgba(252,211,77,.5))'
                      : 'drop-shadow(0 0 20px rgba(244,63,94,.4))',
                  }}>
                    {_outcome.icon}
                  </div>
                )}
                <div style={{
                  fontSize: 'clamp(16px, 2.5vw, 32px)',
                  fontWeight: 'bold',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: _outcome.result === 'victory' ? '#fcd34d' : '#fb7185',
                  textShadow: _outcome.result === 'victory'
                    ? '0 0 40px rgba(252,211,77,.4), 0 2px 8px rgba(0,0,0,.8)'
                    : '0 0 40px rgba(244,63,94,.35), 0 2px 8px rgba(0,0,0,.8)',
                }}>
                  {_outcome.label}
                </div>
                {_outcome.subLabel && (
                  <div style={{
                    fontSize: 'clamp(8px, 1vw, 12px)',
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                    color: 'rgba(215,200,165,.6)',
                    marginTop: 2,
                  }}>
                    {_outcome.subLabel}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface PhaseCardProps {
  card: DerivedCard;
}

const PhaseCard: React.FC<PhaseCardProps> = ({ card }) => {
  const pal = PAL[card.variant];
  const sat = saturation(card.state, card.progressFraction);
  const bri = brightness(card.state, card.progressFraction);
  const isLocked = card.state === 'locked';
  const isActive = card.state === 'active';
  const isSuccess = card.state === 'success';
  const ringOpacity = isLocked ? 0.16 : 0.9;

  const risks: React.ReactNode[] = [];
  if (card.injury > 0) {
    risks.push(
      <span key="inj" style={{
        fontFamily: "'Trebuchet MS', sans-serif",
        fontSize: 'clamp(4px, 0.5vw, 6px)',
        letterSpacing: '0.15em',
        color: 'rgba(245,158,11,.75)',
      }}>
        {card.injury}% ferita
      </span>
    );
  }
  if (card.death > 0) {
    risks.push(
      <span key="death" style={{
        fontFamily: "'Trebuchet MS', sans-serif",
        fontSize: 'clamp(4px, 0.5vw, 6px)',
        letterSpacing: '0.15em',
        color: 'rgba(244,63,94,.75)',
      }}>
        {card.death}% morte
      </span>
    );
  }

  const uid = card.key;

  return (
    <div style={{ flex: 1 }}>
      <div style={{
        width: '100%', position: 'relative', overflow: 'hidden',
        borderRadius: 10, border: '1px solid rgba(150,115,35,.16)',
        background: '#06080f', aspectRatio: '1 / 1.22',
        display: 'flex', flexDirection: 'column',
        filter: `saturate(${sat}) brightness(${bri})`,
        transition: 'filter .8s ease',
      }}>
        {/* Phase scene background */}
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 122" preserveAspectRatio="xMidYMid slice">
          <defs>
            <filter id={`fsc${uid}`}><feTurbulence type="fractalNoise" baseFrequency=".022 .03" numOctaves="4" seed={card.seed} result="n" /><feColorMatrix in="n" type="matrix" values="0 0 0 0 .03 0 0 0 0 .08 0 0 0 0 .05 0 0 0 .45 0" result="c" /><feBlend in="SourceGraphic" in2="c" mode="overlay" /></filter>
            <radialGradient id={`rga${uid}`} cx="50%" cy="38%" r="52%"><stop offset="0%" stopColor={card.accent} /><stop offset="100%" stopColor="rgba(0,0,0,0)" /></radialGradient>
          </defs>
          <rect width="100" height="122" fill={card.sky} />
          <rect width="100" height="122" filter={`url(#fsc${uid})`} fill="transparent" />
          <ellipse cx="50" cy="46" rx="58" ry="36" fill={`url(#rga${uid})`} />
          <path d={`M0 68 Q20 56 32 60 Q44 50 58 56 Q72 47 86 53 Q94 48 100 51 L100 122 L0 122Z`} fill={card.midFill} />
          <path d={`M0 84 Q18 76 32 80 Q48 72 62 77 Q78 69 94 74 L100 72 L100 122 L0 122Z`} fill={card.fgFill} />
        </svg>
        {/* Card vignette */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 20%, rgba(4,6,14,.88) 100%)' }} />

        {/* POI medallion */}
        <div className="relative flex flex-1 items-center justify-center" style={{ zIndex: 3, paddingTop: '8%' }}>
          <div style={{ width: '60%', aspectRatio: '1' }}>
            <svg viewBox="0 0 68 68" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <defs>
                <filter id={`gl${uid}`} x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="5" result="b" /><feComposite in="SourceGraphic" in2="b" operator="over" /></filter>
                <filter id={`nm${uid}`}><feTurbulence type="fractalNoise" baseFrequency=".54" numOctaves="3" seed={card.seed + 1} result="n" /><feColorMatrix in="n" type="matrix" values="0 0 0 0 .05 0 0 0 0 .04 0 0 0 0 .01 0 0 0 .22 0" result="c" /><feBlend in="SourceGraphic" in2="c" mode="overlay" /></filter>
                <radialGradient id={`rs${uid}`} cx="37%" cy="27%" r="68%"><stop offset="0%" stopColor={pal.s1} /><stop offset="55%" stopColor={pal.s0} /><stop offset="100%" stopColor="#010203" /></radialGradient>
                <linearGradient id={`lr${uid}`} x1="14%" y1="5%" x2="86%" y2="95%">
                  <stop offset="0%" stopColor={pal.r0} stopOpacity={ringOpacity} />
                  <stop offset="28%" stopColor={pal.r1} stopOpacity={ringOpacity * 0.9} />
                  <stop offset="70%" stopColor={pal.r2} stopOpacity={ringOpacity * 0.75} />
                  <stop offset="100%" stopColor="#050404" stopOpacity={ringOpacity * 0.5} />
                </linearGradient>
                <radialGradient id={`rh${uid}`} cx="35%" cy="23%" r="42%"><stop offset="0%" stopColor="rgba(255,255,255,.12)" /><stop offset="100%" stopColor="rgba(255,255,255,0)" /></radialGradient>
                <radialGradient id={`rg${uid}`} cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor={pal.g} /><stop offset="100%" stopColor="rgba(0,0,0,0)" /></radialGradient>
              </defs>
              {/* Active glow pulse */}
              {isActive && <circle cx="34" cy="34" r="30" fill={`url(#rg${uid})`} opacity=".8"><animate attributeName="opacity" values=".85;.3;.85" dur="2.8s" repeatCount="indefinite" /></circle>}
              {/* Ring */}
              <circle cx="34" cy="34" r="29" fill={`url(#lr${uid})`} filter={`url(#nm${uid})`}>
                {isActive && <animate attributeName="opacity" values=".9;.44;.9" dur="9.4s" repeatCount="indefinite" />}
              </circle>
              {/* Inner dark */}
              <circle cx="34" cy="34" r="24.5" fill="#040507" />
              <circle cx="34" cy="34" r="22.5" fill={`url(#rs${uid})`} filter={`url(#nm${uid})`} />
              <circle cx="34" cy="34" r="22.5" fill={`url(#rh${uid})`} />
              {/* Highlight arc */}
              <path d="M17 27 Q34 13 51 27" fill="none" stroke={pal.r0} strokeWidth="1.2" strokeLinecap="round" strokeOpacity={isLocked ? 0.04 : isActive ? 0.58 : 0.22}>
                {isActive && <animate attributeName="strokeOpacity" values=".58;.22;.58" dur="9.4s" repeatCount="indefinite" />}
              </path>
              {/* Icon */}
              <text x="34" y="39" textAnchor="middle" dominantBaseline="middle" fontSize="18" opacity={isLocked ? 0.22 : 1}>{card.icon}</text>
              {/* Success checkmark */}
              {isSuccess && (
                <>
                  <circle cx="51" cy="17" r="7.5" fill="#052a16" stroke="#10b981" strokeWidth="1" />
                  <text x="51" y="21" textAnchor="middle" fontSize="9.5" fill="#6ee7b7">✓</text>
                </>
              )}
              {/* Active outer ring pulse */}
              {isActive && (
                <circle cx="34" cy="34" r="29" fill="none" stroke={pal.r0} strokeWidth="1" strokeOpacity=".5" filter={`url(#gl${uid})`}>
                  <animate attributeName="opacity" values=".85;.3;.85" dur="2.8s" repeatCount="indefinite" />
                </circle>
              )}
            </svg>
          </div>
        </div>

        {/* Labels */}
        <div className="relative" style={{ zIndex: 3, padding: '0 6% 9%', textAlign: 'center' }}>
          <span style={{
            fontFamily: "'Trebuchet MS', sans-serif",
            fontSize: 'clamp(5px, 0.68vw, 8px)',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'rgba(230,210,160,.9)',
            display: 'block',
            marginBottom: 2,
          }}>
            {card.phase.title}
          </span>
          <span style={{
            fontFamily: "'Trebuchet MS', sans-serif",
            fontSize: 'clamp(4px, 0.55vw, 6.5px)',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'rgba(115,130,140,.5)',
            display: 'block',
          }}>
            {card.phase.type}
          </span>
          {risks.length > 0 && (
            <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 3 }}>
              {risks}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestChronicle;
