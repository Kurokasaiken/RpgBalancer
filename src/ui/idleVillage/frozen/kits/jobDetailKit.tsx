/**
 * jobDetailKit — canonical JobDetail isolated component.
 *
 * Contract subtree: `[data-testid="job-detail"]`
 * Route: /minimal-job-detail
 *
 * Shows full detail panel for a Job activity:
 * rewards, requirements, slot assignments, duration, fatigue cost.
 */

import React, { useState } from 'react';
import type { JSX, ReactNode } from 'react';
import { SkinSystemProvider } from '@/ui/idleVillage/hooks/useSkinSystem';
import { SandboxTimingProvider } from '@/ui/idleVillage/hooks/useSandboxTimingBridge';
import { DEFAULT_MINIMAL_CONFIG } from '@/ui/idleVillage/frozen/_infra/CanonicalDataBridge';
import { trackTelemetryEvent } from '@/analytics/telemetryStub';

const _accentHex = (DEFAULT_MINIMAL_CONFIG as { ui?: { tokens?: { accentHex?: string } } }).ui?.tokens?.accentHex ?? '#c9a227';

/** Demo job definitions shown in isolation. */
const DEMO_JOBS = [
  {
    id: 'chop-wood',
    label: 'Chop Wood',
    icon: '🪓',
    description: 'Gather lumber from the forest edge. Essential for building and fuel.',
    category: 'gathering',
    durationHours: 4,
    fatigueCost: 15,
    rewards: [
      { resource: 'Legname', amount: 12, icon: '🪵' },
      { resource: 'XP', amount: 8, icon: '⭐' },
    ],
    requirements: [{ label: 'Forza minima', value: '8' }],
    maxSlots: 2,
    danger: 'Basso',
    dangerColor: 'var(--accent-strong, #22c55e)',
  },
  {
    id: 'mine-iron',
    label: 'Estrai Ferro',
    icon: '⛏️',
    description: 'Scava nelle miniere del nord per raccogliere minerale grezzo.',
    category: 'gathering',
    durationHours: 6,
    fatigueCost: 25,
    rewards: [
      { resource: 'Ferro', amount: 6, icon: '⚙️' },
      { resource: 'XP', amount: 12, icon: '⭐' },
    ],
    requirements: [
      { label: 'Forza minima', value: '12' },
      { label: 'Costituzione', value: '10' },
    ],
    maxSlots: 3,
    danger: 'Medio',
    dangerColor: 'var(--halo-color, #f97316)',
  },
  {
    id: 'farm-food',
    label: 'Coltiva Campi',
    icon: '🌾',
    description: 'Lavora i campi del villaggio per produrre cibo per i residenti.',
    category: 'production',
    durationHours: 8,
    fatigueCost: 10,
    rewards: [
      { resource: 'Cibo', amount: 20, icon: '🥕' },
      { resource: 'XP', amount: 5, icon: '⭐' },
    ],
    requirements: [],
    maxSlots: 4,
    danger: 'Nullo',
    dangerColor: 'var(--text-muted, #6b7280)',
  },
];

type DemoJob = (typeof DEMO_JOBS)[number];

/** JobDetail panel component. */
export function JobDetail({ job, onAssign, onClose }: {
  job: DemoJob;
  onAssign?: (id: string) => void;
  onClose?: () => void;
}): JSX.Element {
  const handleAssign = () => {
    trackTelemetryEvent('job_detail_assign_clicked', { jobId: job.id, jobLabel: job.label });
    onAssign?.(job.id);
  };

  const handleClose = () => {
    trackTelemetryEvent('job_detail_closed', { jobId: job.id });
    onClose?.();
  };

  return (
    <div
      data-testid="job-detail"
      data-job-id={job.id}
      style={{
        background: 'var(--card-surface, #1a1a2e)',
        border: `2px solid ${_accentHex}`,
        borderRadius: 'var(--minimal-card-radius, 12px)',
        padding: '24px',
        maxWidth: '440px',
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
        <span style={{ fontSize: '36px' }}>{job.icon}</span>
        <div style={{ flex: 1 }}>
          <h2 data-testid="job-detail-label" style={{ margin: 0, fontSize: '20px', color: _accentHex }}>{job.label}</h2>
          <span style={{ fontSize: '11px', color: 'var(--text-muted, #6b7280)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{job.category}</span>
        </div>
        {onClose && (
          <button onClick={handleClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted, #6b7280)', cursor: 'pointer', fontSize: '18px' }}>✕</button>
        )}
      </div>

      {/* Description */}
      <p data-testid="job-detail-description" style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary, rgba(240,239,228,0.8))', lineHeight: 1.5 }}>
        {job.description}
      </p>

      {/* Stats row */}
      <div data-testid="job-detail-stats" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 700, color: _accentHex }}>⏱ {job.durationHours}h</div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted, #6b7280)' }}>Durata</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--halo-color, #f97316)' }}>💤 -{job.fatigueCost}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted, #6b7280)' }}>Fatica</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-strong, #60a5fa)' }}>👥 {job.maxSlots}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted, #6b7280)' }}>Slot max</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 700, color: job.dangerColor }}>{job.danger}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted, #6b7280)' }}>Pericolo</div>
        </div>
      </div>

      {/* Rewards */}
      <div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted, #6b7280)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Ricompense</div>
        <div data-testid="job-detail-rewards" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {job.rewards.map((r) => (
            <span key={r.resource} style={{ background: 'var(--panel-surface, rgba(255,255,255,0.05))', borderRadius: '6px', padding: '4px 10px', fontSize: '13px', color: _accentHex }}>
              {r.icon} {r.amount} {r.resource}
            </span>
          ))}
        </div>
      </div>

      {/* Requirements */}
      {job.requirements.length > 0 && (
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted, #6b7280)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Requisiti</div>
          <div data-testid="job-detail-requirements" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {job.requirements.map((req) => (
              <div key={req.label} style={{ fontSize: '12px', color: 'var(--text-secondary, rgba(240,239,228,0.8))' }}>
                • {req.label}: <strong>{req.value}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <button
        data-testid="job-detail-assign-btn"
        onClick={handleAssign}
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
        Assegna Residente →
      </button>
    </div>
  );
}

/** Shell provider for jobDetailKit. */
export function JobDetailKitShell({ children }: { children: ReactNode }): JSX.Element {
  return (
    <SkinSystemProvider>
      <SandboxTimingProvider>{children}</SandboxTimingProvider>
    </SkinSystemProvider>
  );
}

/** Isolated showcase component for /minimal-job-detail. */
export function JobDetailIsolated(): JSX.Element {
  const [idx, setIdx] = useState(0);
  const [assigned, setAssigned] = useState<string | null>(null);

  return (
    <JobDetailKitShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', padding: '24px', background: 'var(--panel-surface, #0d0d1a)', minHeight: '100vh' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {DEMO_JOBS.map((j, i) => (
            <button key={j.id} onClick={() => setIdx(i)} style={{ padding: '6px 14px', borderRadius: '6px', border: i === idx ? `2px solid ${_accentHex}` : '1px solid var(--panel-border, #374151)', background: 'var(--card-surface, #1a1a2e)', color: 'var(--text-primary, #f0efe4)', cursor: 'pointer', fontSize: '13px' }}>
              {j.icon} {j.label}
            </button>
          ))}
        </div>
        {assigned && (
          <div style={{ padding: '8px 16px', background: 'var(--panel-surface, rgba(34,197,94,0.1))', borderRadius: '6px', color: 'var(--accent-strong, #22c55e)', fontSize: '13px' }}>
            ✅ Residente assegnato a: <strong>{assigned}</strong>
          </div>
        )}
        <JobDetail
          job={DEMO_JOBS[idx]}
          onAssign={(id) => setAssigned(id)}
          onClose={() => setIdx((i) => (i + 1) % DEMO_JOBS.length)}
        />
      </div>
    </JobDetailKitShell>
  );
}
