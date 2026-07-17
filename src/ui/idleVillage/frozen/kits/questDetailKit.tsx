/**
 * questDetailKit — canonical QuestDetail isolated component.
 *
 * Contract subtree: `[data-testid="quest-detail"]`
 * Route: /minimal-quest-detail
 *
 * Shows full detail panel for a Quest:
 * narrative, skill checks, risks, rewards, party composition.
 */

import React, { useState } from 'react';
import type { JSX } from 'react';
import { createKitShell } from '../_infra/KitShell';
import { DEFAULT_RISK_DISPLAY_CONFIG } from '@/balancing/config/idleVillage/riskDisplayConfig';
import { DEFAULT_MINIMAL_CONFIG } from '@/ui/idleVillage/frozen/_infra/CanonicalDataBridge';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '@/balancing/config/idleVillage/defaultConfig';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import { trackTelemetryEvent } from '@/analytics/telemetryStub';

const _riskColors = DEFAULT_RISK_DISPLAY_CONFIG.colors;
const _accentHex = (DEFAULT_MINIMAL_CONFIG as { ui?: { tokens?: { accentHex?: string } } }).ui?.tokens?.accentHex ?? '#c9a227';
const _dangerHex = (DEFAULT_MINIMAL_CONFIG as { ui?: { tokens?: { dangerHex?: string } } }).ui?.tokens?.dangerHex ?? _riskColors.deathColor;

const MIGRATED_QUEST_IDS = ['bandit-camp-demo', 'ancient-ruins', 'herb-gathering'] as const;

/**
 * Resolves the display label for a resource id using the canonical config.
 */
const getResourceLabel = (resourceId: string): string =>
  DEFAULT_IDLE_VILLAGE_CONFIG.resources[resourceId]?.label ?? resourceId;

/**
 * Resolves the display icon for a resource id using the canonical config.
 */
const getResourceIcon = (resourceId: string): string =>
  DEFAULT_IDLE_VILLAGE_CONFIG.resources[resourceId]?.icon ?? '📦';

/**
 * Resolves a difficulty label and colour from the ActivityDefinition metadata.
 * Lossy mapping from C1 per-skill checks to a single C2 difficulty scalar.
 */
const getDifficultyMeta = (activity: ActivityDefinition): { label: string; color: string } => {
  const label = (activity.metadata?.difficultyLabel as string | undefined) ?? 'Medio';
  if (label === 'Facile') return { label, color: 'var(--accent-strong, #22c55e)' };
  if (label === 'Medio') return { label, color: 'var(--halo-color, #f97316)' };
  if (label === 'Alto') return { label, color: _dangerHex };
  return { label, color: _dangerHex };
};

/**
 * Converts a C2 ActivityDefinition into the DemoQuest shape used by QuestDetail.
 * Per-skill checks are collapsed into the single questDifficulty scalar exposed
 * through config metadata; stat requirements are displayed as a single combined hint.
 */
const activityToDemoQuest = (activity: ActivityDefinition): DemoQuest => {
  const meta = (activity.metadata ?? {}) as Record<string, unknown>;
  const difficultyMeta = getDifficultyMeta(activity);
  const statRequirement = activity.statRequirement;
  const statTags = [
    ...(statRequirement?.allOf?.filter((t): t is string => typeof t === 'string') ?? []),
    ...(statRequirement?.anyOf ?? []),
  ];
  const durationHours = Number(meta.durationHours ?? activity.durationFormula ?? '0');
  const maxParticipants = activity.maxSlots === 'infinite' ? 99 : (activity.maxSlots ?? 1);
  const injuryDisplay = typeof meta.injuryChanceDisplay === 'number' ? meta.injuryChanceDisplay : (activity.dangerRating ?? 0) * 5;
  const deathDisplay = typeof meta.deathChanceDisplay === 'number' ? meta.deathChanceDisplay : (activity.dangerRating ?? 0);

  return {
    id: activity.id,
    label: activity.label,
    icon: (meta.icon as string | undefined) ?? '⚔️',
    category: activity.tags.find((t) => t !== 'quest') ?? 'quest',
    minLevel: activity.level ?? 1,
    maxParticipants,
    durationHours,
    description: activity.description ?? '',
    narrative: (meta.narrative as string | undefined) ?? activity.description ?? '',
    skillChecks:
      statTags.length > 0
        ? [
            {
              label: statRequirement?.label ?? 'Skill Check',
              stat: statTags.join(' | '),
              minValue: activity.level ?? 1,
              icon: '�',
            },
          ]
        : [],
    rewards:
      activity.rewards?.map((r) => ({
        resource: getResourceLabel(r.resourceId),
        amount: Number.parseInt(r.amountFormula, 10) || 0,
        icon: getResourceIcon(r.resourceId),
      })) ?? [],
    risks: {
      injury: Math.max(0, Math.min(1, injuryDisplay / 100)),
      death: Math.max(0, Math.min(1, deathDisplay / 100)),
    },
    difficulty: difficultyMeta.label,
    difficultyColor: difficultyMeta.color,
  };
};

const DEMO_QUESTS: DemoQuest[] = MIGRATED_QUEST_IDS.map((id) => DEFAULT_IDLE_VILLAGE_CONFIG.activities[id]).filter(Boolean).map(activityToDemoQuest);

type DemoQuest = {
  id: string;
  label: string;
  icon: string;
  category: string;
  minLevel: number;
  maxParticipants: number;
  durationHours: number;
  description: string;
  narrative: string;
  skillChecks: { label: string; stat: string; minValue: number; icon: string }[];
  rewards: { resource: string; amount: number; icon: string }[];
  risks: { injury: number; death: number };
  difficulty: string;
  difficultyColor: string;
};

/** QuestDetail panel component. */
export function QuestDetail({ quest, onAccept, onClose }: {
  quest: DemoQuest;
  onAccept?: (id: string) => void;
  onClose?: () => void;
}): JSX.Element {
  const handleAccept = () => {
    trackTelemetryEvent('quest_detail_accepted', { questId: quest.id, questLabel: quest.label, difficulty: quest.difficulty });
    onAccept?.(quest.id);
  };

  const handleClose = () => {
    trackTelemetryEvent('quest_detail_closed', { questId: quest.id });
    onClose?.();
  };

  const injuryPct = Math.round(quest.risks.injury * 100);
  const deathPct = Math.round(quest.risks.death * 100);

  return (
    <div
      data-testid="quest-detail"
      data-quest-id={quest.id}
      style={{
        background: 'var(--card-surface, #1a1a2e)',
        border: `2px solid ${_accentHex}`,
        borderRadius: 'var(--minimal-card-radius, 12px)',
        padding: '24px',
        maxWidth: '480px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        color: 'var(--text-primary, #f0efe4)',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '36px' }}>{quest.icon}</span>
        <div style={{ flex: 1 }}>
          <h2 data-testid="quest-detail-label" style={{ margin: 0, fontSize: '20px', color: _accentHex }}>{quest.label}</h2>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted, #6b7280)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{quest.category}</span>
            <span style={{ fontSize: '11px', color: quest.difficultyColor, fontWeight: 600 }}>● {quest.difficulty}</span>
          </div>
        </div>
        {onClose && (
          <button onClick={handleClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted, #6b7280)', cursor: 'pointer', fontSize: '18px' }}>✕</button>
        )}
      </div>

      {/* Narrative */}
      <div style={{ background: 'var(--panel-surface, rgba(255,255,255,0.03))', borderRadius: '8px', padding: '12px', borderLeft: `3px solid ${_accentHex}` }}>
        <p data-testid="quest-detail-narrative" style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary, rgba(240,239,228,0.75))', lineHeight: 1.6, fontStyle: 'italic' }}>
          "{quest.narrative}"
        </p>
      </div>

      {/* Stats row */}
      <div data-testid="quest-detail-stats" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '16px', fontWeight: 700, color: _accentHex }}>⏱ {quest.durationHours}h</div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted, #6b7280)' }}>Durata</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-strong, #60a5fa)' }}>👥 max {quest.maxParticipants}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted, #6b7280)' }}>Partecipanti</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-strong, #60a5fa)' }}>🏅 Liv. {quest.minLevel}+</div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted, #6b7280)' }}>Livello min.</div>
        </div>
      </div>

      {/* Skill checks */}
      <div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted, #6b7280)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Prove Richieste</div>
        <div data-testid="quest-detail-skill-checks" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {quest.skillChecks.map((sc) => (
            <div key={sc.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '6px 10px', background: 'var(--panel-surface, rgba(255,255,255,0.04))', borderRadius: '6px' }}>
              <span>{sc.icon} {sc.label}</span>
              <span style={{ color: _accentHex, fontWeight: 600 }}>{sc.stat} ≥ {sc.minValue}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Risks */}
      <div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted, #6b7280)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Rischi</div>
        <div data-testid="quest-detail-risks" style={{ display: 'flex', gap: '12px' }}>
          <span style={{ fontSize: '12px', color: _riskColors.injuryColor }}>🩹 Ferita {injuryPct}%</span>
          {deathPct > 0 && <span style={{ fontSize: '12px', color: _dangerHex }}>💀 Morte {deathPct}%</span>}
        </div>
      </div>

      {/* Rewards */}
      <div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted, #6b7280)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Ricompense</div>
        <div data-testid="quest-detail-rewards" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {quest.rewards.map((r) => (
            <span key={r.resource} style={{ background: 'var(--panel-surface, rgba(255,255,255,0.05))', borderRadius: '6px', padding: '4px 10px', fontSize: '13px', color: _accentHex }}>
              {r.icon} {r.amount} {r.resource}
            </span>
          ))}
        </div>
      </div>

      {/* CTA */}
      <button
        data-testid="quest-detail-accept-btn"
        onClick={handleAccept}
        style={{
          padding: '10px',
          background: 'var(--button-bg, #166534)',
          color: 'var(--button-text, #fff)',
          border: 'none',
          borderRadius: 'var(--minimal-card-radius, 6px)',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        ⚔️ Accetta Quest →
      </button>
    </div>
  );
}

/** Shell provider for questDetailKit. Smart: mounts only the providers missing above. */
export const QuestDetailKitShell = createKitShell(
  ['SkinSystemProvider', 'SandboxTimingProvider'],
  'QuestDetailKitShell'
);

/** Isolated showcase component for /minimal-quest-detail. */
export function QuestDetailIsolated(): JSX.Element {
  const [idx, setIdx] = useState(0);
  const [accepted, setAccepted] = useState<string | null>(null);

  return (
    <QuestDetailKitShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', padding: '24px', background: 'var(--panel-surface, #0d0d1a)', minHeight: '100vh' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {DEMO_QUESTS.map((q, i) => (
            <button key={q.id} onClick={() => setIdx(i)} style={{ padding: '6px 14px', borderRadius: '6px', border: i === idx ? `2px solid ${_accentHex}` : '1px solid var(--panel-border, #374151)', background: 'var(--card-surface, #1a1a2e)', color: 'var(--text-primary, #f0efe4)', cursor: 'pointer', fontSize: '13px' }}>
              {q.icon} {q.label}
            </button>
          ))}
        </div>
        {accepted && (
          <div style={{ padding: '8px 16px', background: 'var(--panel-surface, rgba(34,197,94,0.1))', borderRadius: '6px', color: 'var(--accent-strong, #22c55e)', fontSize: '13px' }}>
            ⚔️ Quest accettata: <strong>{accepted}</strong>
          </div>
        )}
        <QuestDetail
          quest={DEMO_QUESTS[idx]}
          onAccept={(id) => setAccepted(id)}
          onClose={() => setIdx((i) => (i + 1) % DEMO_QUESTS.length)}
        />
      </div>
    </QuestDetailKitShell>
  );
}
