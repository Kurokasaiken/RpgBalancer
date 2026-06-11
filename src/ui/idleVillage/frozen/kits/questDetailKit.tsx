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
import type { JSX, ReactNode } from 'react';
import { SkinSystemProvider } from '@/ui/idleVillage/hooks/useSkinSystem';
import { SandboxTimingProvider } from '@/ui/idleVillage/hooks/useSandboxTimingBridge';
import { DEFAULT_RISK_DISPLAY_CONFIG } from '@/balancing/config/idleVillage/riskDisplayConfig';
import { DEFAULT_MINIMAL_CONFIG } from '@/ui/idleVillage/frozen/_infra/CanonicalDataBridge';
import { trackTelemetryEvent } from '@/analytics/telemetryStub';

const _riskColors = DEFAULT_RISK_DISPLAY_CONFIG.colors;
const _accentHex = (DEFAULT_MINIMAL_CONFIG as { ui?: { tokens?: { accentHex?: string } } }).ui?.tokens?.accentHex ?? '#c9a227';
const _dangerHex = (DEFAULT_MINIMAL_CONFIG as { ui?: { tokens?: { dangerHex?: string } } }).ui?.tokens?.dangerHex ?? _riskColors.deathColor;

const DEMO_QUESTS = [
  {
    id: 'goblin-raid',
    label: 'Incursione Goblin',
    icon: '🗡️',
    category: 'combat',
    minLevel: 2,
    maxParticipants: 3,
    durationHours: 3,
    description: 'I goblin si sono radunati a sud del villaggio. Sconfiggili prima che attacchino.',
    narrative: 'Il guardiano del villaggio riferisce movimenti sospetti nella foresta. Un gruppo di esploratori ha individuato un accampamento goblin a soli 2 chilometri dalle mura.',
    skillChecks: [
      { label: 'Prova di Forza', stat: 'Forza', minValue: 10, icon: '💪' },
      { label: 'Prova di Agilità', stat: 'Agilità', minValue: 8, icon: '🏃' },
    ],
    rewards: [
      { resource: 'Oro', amount: 150, icon: '💰' },
      { resource: 'XP', amount: 80, icon: '⭐' },
      { resource: 'Pozione', amount: 1, icon: '🧪' },
    ],
    risks: { injury: 0.25, death: 0.05 },
    difficulty: 'Medio',
    difficultyColor: 'var(--halo-color, #f97316)',
  },
  {
    id: 'ancient-ruins',
    label: 'Rovine Antiche',
    icon: '🏛️',
    category: 'exploration',
    minLevel: 5,
    maxParticipants: 2,
    durationHours: 8,
    description: 'Esplora le rovine a est per recuperare artefatti perduti.',
    narrative: 'Un mercante ha riportato storie di rovine semi-sepolte, ricche di oggetti dell\'era pre-guerra. Il percorso è lungo e i pericoli sconosciuti.',
    skillChecks: [
      { label: 'Prova di Intelligenza', stat: 'Intelligenza', minValue: 14, icon: '🧠' },
      { label: 'Prova di Percezione', stat: 'Percezione', minValue: 12, icon: '👁️' },
    ],
    rewards: [
      { resource: 'Oro', amount: 400, icon: '💰' },
      { resource: 'XP', amount: 200, icon: '⭐' },
      { resource: 'Artefatto', amount: 1, icon: '🏺' },
    ],
    risks: { injury: 0.40, death: 0.15 },
    difficulty: 'Alto',
    difficultyColor: _dangerHex,
  },
  {
    id: 'herb-gathering',
    label: 'Raccolta Erbe',
    icon: '🌿',
    category: 'gathering',
    minLevel: 1,
    maxParticipants: 4,
    durationHours: 2,
    description: 'Raccogli erbe medicinali per rifornire la scorta del guaritore.',
    narrative: 'Il guaritore del villaggio ha esaurito le sue riserve. Le erbe crescono abbondanti nei prati oltre il fiume, ma serve qualcuno capace di riconoscerle.',
    skillChecks: [
      { label: 'Conoscenza Erbe', stat: 'Natura', minValue: 6, icon: '🌱' },
    ],
    rewards: [
      { resource: 'Erbe', amount: 15, icon: '🌿' },
      { resource: 'XP', amount: 30, icon: '⭐' },
    ],
    risks: { injury: 0.05, death: 0.0 },
    difficulty: 'Facile',
    difficultyColor: 'var(--accent-strong, #22c55e)',
  },
];

type DemoQuest = (typeof DEMO_QUESTS)[number];

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

/** Shell provider for questDetailKit. */
export function QuestDetailKitShell({ children }: { children: ReactNode }): JSX.Element {
  return (
    <SkinSystemProvider>
      <SandboxTimingProvider>{children}</SandboxTimingProvider>
    </SkinSystemProvider>
  );
}

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
