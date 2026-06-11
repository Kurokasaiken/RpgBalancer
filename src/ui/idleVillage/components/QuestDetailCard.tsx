/**
 * QuestDetailCard — cinematic quest detail.
 *
 * Phase nodes use ActionHalo (the real map POI circle + progress arc).
 * Layout follows VerbDetailCard patterns (risk stripe, rewards, progress).
 * Overall outcome renders as a cinematic overlay on the 21:9 image.
 */

import React, { useMemo } from 'react';
import type { JSX, CSSProperties } from 'react';
import type { QuestPhase } from '@/balancing/config/idleVillage/types';
import type { QuestOutcome } from '@/engine/game/idleVillage/QuestPowerEngine';
import { DEFAULT_RISK_DISPLAY_CONFIG } from '@/balancing/config/idleVillage/riskDisplayConfig';
import { ActionHalo } from '@/ui/idleVillage/map/actionCards/ActionHalo';

export type PhaseOutcome = QuestOutcome;

const _riskColors = DEFAULT_RISK_DISPLAY_CONFIG.colors;

const OUTCOME_CONFIG: Record<PhaseOutcome, { label: string; icon: string; cssColor: string; glowColor: string }> = {
  perfect:  { label: 'GRANDE VITTORIA', icon: '★★', cssColor: '#f59e0b', glowColor: 'rgba(245,158,11,0.6)' },
  success:  { label: 'VITTORIA',        icon: '✓',  cssColor: '#22c55e', glowColor: 'rgba(34,197,94,0.5)' },
  partial:  { label: 'PARZIALE',        icon: '~',  cssColor: '#eab308', glowColor: 'rgba(234,179,8,0.4)' },
  fail:     { label: 'SCONFITTA',       icon: '✗',  cssColor: _riskColors.injuryColor, glowColor: 'rgba(239,68,68,0.5)' },
  deadly:   { label: 'DISFATTA',        icon: '☠',  cssColor: _riskColors.deathColor, glowColor: 'rgba(185,28,28,0.6)' },
};

const PHASE_TYPE_LABELS: Record<string, string> = {
  check: 'CHK', fight: 'FGT', stealth: 'STL', trap: 'TRP',
  explore: 'EXP', dialogue: 'DLG', branch: 'BRN', timedChoice: 'TMR',
};

export interface PhaseRuntimeState {
  phaseId: string;
  status: 'locked' | 'active' | 'completed';
  outcome?: PhaseOutcome;
  ticksElapsed?: number;
}

export interface QuestDetailCardProps {
  questName: string;
  questDescription?: string;
  questIcon?: string;
  difficulty?: string;
  imageUrl?: string;
  phases: QuestPhase[];
  phaseStates: PhaseRuntimeState[];
  currentPhaseIndex: number;
  totalTicksElapsed: number;
  totalTicksDuration: number;
  questDone?: boolean;
  overallOutcome?: PhaseOutcome;
  onPhaseClick?: (phaseIndex: number) => void;
}

function deriveOverallOutcome(phaseStates: PhaseRuntimeState[]): PhaseOutcome | undefined {
  const completed = phaseStates.filter(s => s.status === 'completed' && s.outcome);
  if (completed.length === 0) return undefined;
  const rank: Record<PhaseOutcome, number> = { deadly: 0, fail: 1, partial: 2, success: 3, perfect: 4 };
  let worst = 4;
  for (const s of completed) {
    const r = rank[s.outcome!];
    if (r < worst) worst = r;
  }
  const entries = Object.entries(rank) as [PhaseOutcome, number][];
  return entries.find(([, v]) => v === worst)?.[0] ?? 'partial';
}

function PhaseHaloNode({
  phase,
  state,
  index,
  onClick,
}: {
  phase: QuestPhase;
  state: PhaseRuntimeState;
  index: number;
  onClick?: () => void;
}) {
  const isActive = state.status === 'active';
  const isCompleted = state.status === 'completed';
  const isLocked = state.status === 'locked';

  const fillFraction = isCompleted
    ? 1
    : isActive
      ? (state.ticksElapsed ?? 0) / Math.max(1, phase.durationValue)
      : 0;

  const outcomeCfg = isCompleted && state.outcome ? OUTCOME_CONFIG[state.outcome] : null;
  const risk = phase.riskProfile;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        opacity: isLocked ? 0.3 : 1,
        transition: 'opacity 0.3s ease',
        cursor: onClick ? 'pointer' : 'default',
        minWidth: '80px',
      }}
      onClick={onClick}
      data-testid={`quest-phase-${phase.id}`}
      data-phase-status={state.status}
    >
      <ActionHalo
        icon={<span style={{ fontSize: '16px' }}>{phase.icon ?? '?'}</span>}
        iconText={PHASE_TYPE_LABELS[phase.type] ?? 'FAS'}
        size={28}
        ringWidth={3}
        fillFraction={fillFraction}
        pulseIntensity={isActive ? 0.8 : 0.2}
        dataTestId={`phase-halo-${phase.id}`}
        onClick={onClick ? () => onClick() : undefined}
      />

      {/* Phase label */}
      <span style={{
        fontSize: '10px', fontWeight: 600, textAlign: 'center',
        color: 'var(--text-primary, #f0efe4)',
        lineHeight: 1.2, maxWidth: '80px',
      }}>
        {phase.title}
      </span>

      {/* Type + duration */}
      <span style={{
        fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.15em',
        color: 'var(--text-muted, #6b7280)',
      }}>
        {PHASE_TYPE_LABELS[phase.type] ?? phase.type} · {phase.durationValue}t
      </span>

      {/* Risk mini-line */}
      {risk && (risk.injuryChance > 0 || risk.deathChance > 0) && !isLocked && (
        <div style={{ display: 'flex', gap: '4px', fontSize: '9px' }}>
          {risk.injuryChance > 0 && (
            <span style={{ color: _riskColors.injuryColor }}>🩹{risk.injuryChance}%</span>
          )}
          {risk.deathChance > 0 && (
            <span style={{ color: _riskColors.deathColor }}>💀{risk.deathChance}%</span>
          )}
        </div>
      )}

      {/* Outcome badge */}
      {outcomeCfg && (
        <span style={{
          fontSize: '9px', fontWeight: 700, padding: '1px 6px',
          borderRadius: '999px', border: `1px solid ${outcomeCfg.cssColor}`,
          color: outcomeCfg.cssColor,
          background: 'var(--panel-surface, rgba(255,255,255,0.04))',
        }}>
          {outcomeCfg.icon} {outcomeCfg.label.split(' ').pop()}
        </span>
      )}
    </div>
  );
}

function CinematicOutcomeOverlay({ outcome }: { outcome: PhaseOutcome }) {
  const cfg = OUTCOME_CONFIG[outcome];
  const isPositive = outcome === 'perfect' || outcome === 'success';

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 10,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: `radial-gradient(ellipse at center, ${cfg.glowColor} 0%, rgba(0,0,0,0.85) 70%)`,
      animation: 'outcomeReveal 0.6s ease-out forwards',
    }}>
      {/* Decorative lines */}
      <div style={{
        position: 'absolute', left: '10%', right: '10%', top: '50%',
        height: '1px', transform: 'translateY(-20px)',
        background: `linear-gradient(to right, transparent, ${cfg.cssColor}, transparent)`,
        opacity: 0.5,
      }} />
      <div style={{
        position: 'absolute', left: '10%', right: '10%', top: '50%',
        height: '1px', transform: 'translateY(20px)',
        background: `linear-gradient(to right, transparent, ${cfg.cssColor}, transparent)`,
        opacity: 0.5,
      }} />

      {/* Icon */}
      <span style={{
        fontSize: '32px', marginBottom: '4px',
        filter: `drop-shadow(0 0 12px ${cfg.glowColor})`,
      }}>
        {cfg.icon}
      </span>

      {/* Main text */}
      <span style={{
        fontSize: '28px', fontWeight: 900, letterSpacing: '0.25em',
        textTransform: 'uppercase',
        color: cfg.cssColor,
        textShadow: `0 0 30px ${cfg.glowColor}, 0 0 60px ${cfg.glowColor}`,
        fontFamily: 'system-ui, sans-serif',
        lineHeight: 1,
      }}>
        {cfg.label}
      </span>

      {/* Subtitle */}
      <span style={{
        fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase',
        color: isPositive ? 'rgba(255,255,255,0.6)' : 'rgba(255,200,200,0.6)',
        marginTop: '8px',
      }}>
        {isPositive ? 'Quest completata' : 'Quest fallita'}
      </span>
    </div>
  );
}

export default function QuestDetailCard({
  questName,
  questDescription,
  questIcon,
  difficulty,
  imageUrl,
  phases,
  phaseStates,
  currentPhaseIndex,
  totalTicksElapsed,
  totalTicksDuration,
  questDone,
  overallOutcome,
  onPhaseClick,
}: QuestDetailCardProps): JSX.Element {
  const effectiveProgressPct = questDone
    ? 100
    : totalTicksDuration > 0
      ? Math.min(100, (totalTicksElapsed / totalTicksDuration) * 100)
      : 0;

  const derivedOutcome = useMemo(() => {
    if (overallOutcome) return overallOutcome;
    if (questDone) return deriveOverallOutcome(phaseStates);
    return undefined;
  }, [overallOutcome, questDone, phaseStates]);

  const placeholderBg = useMemo(() => {
    const hue = questName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
    return `linear-gradient(135deg, hsl(${hue}, 40%, 12%) 0%, hsl(${(hue + 60) % 360}, 30%, 8%) 100%)`;
  }, [questName]);

  // Aggregate risk from all phases (VerbDetailCard-style)
  const aggregateRisk = useMemo(() => {
    let maxInjury = 0;
    let maxDeath = 0;
    const allRewards: string[] = [];
    for (const p of phases) {
      if (p.riskProfile) {
        maxInjury = Math.max(maxInjury, p.riskProfile.injuryChance);
        maxDeath = Math.max(maxDeath, p.riskProfile.deathChance);
      }
      if (p.successEffects?.resources) {
        for (const r of p.successEffects.resources) {
          allRewards.push(`${r.resourceId} +${r.amountFormula}`);
        }
      }
    }
    return { maxInjury, maxDeath, allRewards };
  }, [phases]);

  const cardBorderColor = questDone && derivedOutcome
    ? OUTCOME_CONFIG[derivedOutcome].cssColor
    : 'var(--panel-border, rgba(201, 162, 39, 0.4))';

  return (
    <div
      className="w-full max-w-3xl"
      style={{
        background: 'var(--card-surface, #1a1a2e)',
        border: `2px solid ${cardBorderColor}`,
        borderRadius: 'var(--minimal-card-radius, 12px)',
        color: 'var(--text-primary, #f0efe4)',
        fontFamily: 'system-ui, sans-serif',
        overflow: 'hidden',
        boxShadow: '0 40px 90px rgba(0,0,0,0.6)',
        transition: 'border-color 0.4s ease',
      }}
      data-testid="quest-detail-card"
    >
      {/* ── Header (VerbDetailCard-style) ── */}
      <div className="space-y-2 border-b px-6 py-4" style={{ borderColor: 'var(--panel-border, rgba(201,162,39,0.3))' }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em]" style={{ color: 'var(--text-muted, #6b7280)' }}>
              Quest
            </div>
            <div className="flex items-center gap-2">
              {questIcon && <span style={{ fontSize: '20px' }}>{questIcon}</span>}
              <h2 data-testid="quest-detail-label" className="text-xl font-semibold leading-tight" style={{ color: 'var(--halo-color, #c9a227)' }}>
                {questName}
              </h2>
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted, #6b7280)' }}>
              {phases.length} fasi · {totalTicksDuration} ticks
              {difficulty && <> · Difficoltà <span className="uppercase">{difficulty}</span></>}
            </div>
          </div>
          {/* Duration display */}
          <div className="text-right text-xs" style={{ color: 'var(--text-secondary, rgba(240,239,228,0.75))' }}>
            <div className="uppercase tracking-[0.2em] text-[10px]" style={{ color: 'var(--text-muted, #6b7280)' }}>Progresso</div>
            <div className="text-lg font-mono" style={{ color: 'var(--halo-color, #c9a227)' }}>
              {effectiveProgressPct.toFixed(0)}%
            </div>
            <div className="text-[10px] uppercase tracking-[0.3em]" style={{
              color: questDone
                ? (derivedOutcome && (derivedOutcome === 'perfect' || derivedOutcome === 'success') ? '#22c55e' : _riskColors.injuryColor)
                : '#22c55e',
            }}>
              {questDone ? 'Completata' : 'In corso'}
            </div>
          </div>
        </div>

        {/* Progress bar (VerbDetailCard-style) */}
        <div
          className="relative h-2 overflow-hidden rounded-full"
          style={{ background: 'var(--panel-surface, rgba(255,255,255,0.06))' }}
          data-testid="quest-progress-track"
        >
          <div
            style={{
              height: '100%',
              width: `${effectiveProgressPct}%`,
              background: questDone && derivedOutcome
                ? OUTCOME_CONFIG[derivedOutcome].cssColor
                : 'linear-gradient(to right, var(--halo-color, #c9a227), var(--accent-strong, #f59e0b))',
              transition: 'width 0.5s ease-out, background 0.4s ease',
              borderRadius: 'inherit',
            }}
            data-testid="quest-progress-bar"
          />
          {/* Phase separators */}
          {phases.map((_, i) => {
            if (i === 0) return null;
            const pct = phases.slice(0, i).reduce((acc, p) => acc + p.durationValue, 0) / totalTicksDuration * 100;
            return (
              <div key={i} style={{
                position: 'absolute', top: 0, bottom: 0, left: `${pct}%`,
                width: '1px', background: 'var(--panel-border, rgba(255,255,255,0.2))',
              }} />
            );
          })}
        </div>
      </div>

      {/* ── Cinematic image (21:9) with outcome overlay ── */}
      <div style={{
        margin: '12px', position: 'relative',
        aspectRatio: '21 / 9', borderRadius: '8px', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: imageUrl ? `url(${imageUrl}) center/cover no-repeat` : placeholderBg,
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--card-surface, #1a1a2e) 0%, transparent 40%, rgba(0,0,0,0.2) 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.3) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.3) 100%)' }} />
        </div>

        {/* Phase/progress overlay (bottom-left) — visible only when NOT done */}
        {!questDone && (
          <div style={{ position: 'absolute', bottom: '8px', left: '12px', display: 'flex', gap: '8px', zIndex: 5 }}>
            <span style={{
              fontSize: '10px', fontFamily: 'monospace',
              color: 'var(--halo-color, #c9a227)',
              background: 'rgba(0,0,0,0.6)', borderRadius: '4px', padding: '2px 8px',
            }}>
              Fase {currentPhaseIndex + 1}/{phases.length}
            </span>
          </div>
        )}

        {/* Cinematic outcome overlay (LoL-style) */}
        {questDone && derivedOutcome && (
          <CinematicOutcomeOverlay outcome={derivedOutcome} />
        )}
      </div>

      {/* ── Phase POI strip (ActionHalo circles) ── */}
      <div style={{ padding: '8px 12px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', alignItems: 'flex-start' }}>
          {/* Connecting line behind halos */}
          <div style={{ position: 'absolute', display: 'none' }} />
          {phases.map((phase, i) => {
            const state = phaseStates[i] ?? { phaseId: phase.id, status: 'locked' as const };
            return (
              <React.Fragment key={phase.id}>
                {i > 0 && (
                  <div style={{
                    alignSelf: 'center', width: '20px', height: '2px', flexShrink: 0,
                    background: state.status !== 'locked'
                      ? 'var(--halo-color, #c9a227)'
                      : 'var(--panel-border, rgba(255,255,255,0.1))',
                    borderRadius: '1px',
                    transition: 'background 0.3s ease',
                    marginTop: '-20px',
                  }} />
                )}
                <PhaseHaloNode
                  phase={phase}
                  state={state}
                  index={i}
                  onClick={onPhaseClick ? () => onPhaseClick(i) : undefined}
                />
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ── Quest info grid (VerbDetailCard-style: description + risk stripe) ── */}
      <div className="px-6 pb-4 text-[12px]">
        {questDescription && (
          <p className="mb-4" style={{ color: 'var(--text-secondary, rgba(240,239,228,0.75))', lineHeight: 1.6 }}>
            {questDescription}
          </p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px' }}>
          {/* Rewards */}
          <div className="space-y-2">
            <div className="text-[10px] uppercase tracking-[0.25em]" style={{ color: 'var(--text-muted, #6b7280)' }}>
              Ricompense
            </div>
            {aggregateRisk.allRewards.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {aggregateRisk.allRewards.map((r, i) => (
                  <div key={i} className="flex items-center gap-1 rounded-full px-2 py-1 text-[11px]"
                    style={{
                      border: '1px solid var(--panel-border, rgba(255,255,255,0.1))',
                      background: 'var(--panel-surface, rgba(255,255,255,0.04))',
                    }}>
                    <span className="font-semibold" style={{ color: 'var(--halo-color, #c9a227)' }}>{r}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[10px]" style={{ color: 'var(--text-muted, #6b7280)' }}>
                Ricompense al completamento della quest.
              </div>
            )}
          </div>

          {/* Risk stripe (VerbDetailCard-style) */}
          <div className="space-y-2">
            <div className="text-[10px] uppercase tracking-[0.25em]" style={{ color: 'var(--text-muted, #6b7280)' }}>
              Rischio (max fase)
            </div>
            <div className="flex items-center gap-3">
              <div
                style={{
                  display: 'flex', flexDirection: 'column', height: '70px', width: '28px',
                  borderRadius: '3px', overflow: 'hidden',
                  border: '1px solid var(--panel-border, rgba(255,255,255,0.1))',
                }}
                data-testid="risk-stripe"
              >
                <div style={{ background: _riskColors.deathColor, height: `${aggregateRisk.maxDeath}%` }} />
                <div style={{ background: _riskColors.injuryColor, height: `${Math.max(0, aggregateRisk.maxInjury - aggregateRisk.maxDeath)}%` }} />
                <div style={{ flex: 1, background: 'rgba(34,197,94,0.15)' }} />
              </div>
              <div className="text-[10px] uppercase tracking-[0.2em] space-y-1">
                <div style={{ color: _riskColors.injuryColor }}>Ferite {aggregateRisk.maxInjury}%</div>
                <div style={{ color: _riskColors.deathColor }}>Morte {aggregateRisk.maxDeath}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS animation for outcome reveal */}
      <style>{`
        @keyframes outcomeReveal {
          from { opacity: 0; transform: scale(1.1); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
