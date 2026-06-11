/**
 * locationDetailKit — canonical LocationDetail isolated component.
 *
 * Contract subtree: `[data-testid="location-detail"]`
 * Route: /minimal-location-detail
 *
 * Shows full detail panel for a map Location (POI / luogo):
 * tipo, slot disponibili, attività collegate, pericolo ambientale.
 */

import React, { useState } from 'react';
import type { JSX, ReactNode } from 'react';
import { SkinSystemProvider } from '@/ui/idleVillage/hooks/useSkinSystem';
import { SandboxTimingProvider } from '@/ui/idleVillage/hooks/useSandboxTimingBridge';
import { DEFAULT_MINIMAL_CONFIG } from '@/ui/idleVillage/frozen/_infra/CanonicalDataBridge';
import { trackTelemetryEvent } from '@/analytics/telemetryStub';

const _accentHex = (DEFAULT_MINIMAL_CONFIG as { ui?: { tokens?: { accentHex?: string } } }).ui?.tokens?.accentHex ?? '#c9a227';

const DEMO_LOCATIONS = [
  {
    id: 'forest-edge',
    label: 'Margine della Foresta',
    icon: '🌲',
    type: 'wilderness',
    biome: 'Foresta Temperata',
    distance: '1.2 km',
    dangerLevel: 1,
    dangerLabel: 'Basso',
    dangerColor: 'var(--accent-strong, #22c55e)',
    description: 'La foresta densa che circonda il villaggio a nord. Ricca di legname e selvaggina, ma nasconde lupi nelle ore notturne.',
    flavorText: 'Il profumo di resina e terra umida permea l\'aria. Tra le radici contorte si intravedono tracce di animali.',
    slots: 3,
    activeResidents: 1,
    linkedActivities: [
      { id: 'chop-wood', label: 'Taglia Legna', icon: '🪓' },
      { id: 'hunt-game', label: 'Caccia', icon: '🏹' },
    ],
    resources: [
      { label: 'Legname', icon: '🪵', abundance: 'Abbondante' },
      { label: 'Selvaggina', icon: '🦌', abundance: 'Moderata' },
    ],
    unlocked: true,
  },
  {
    id: 'iron-mine',
    label: 'Miniera di Ferro',
    icon: '⛏️',
    type: 'dungeon',
    biome: 'Sotterraneo Roccioso',
    distance: '3.5 km',
    dangerLevel: 3,
    dangerLabel: 'Medio-Alto',
    dangerColor: 'var(--halo-color, #f97316)',
    description: 'Una miniera abbandonata a est del villaggio. Ancora ricca di minerale, ma i cunicoli sono instabili e abitati da creature.',
    flavorText: 'Un vento gelido soffia dall\'ingresso buio. Risuona il lontano gocciolio dell\'acqua sulle rocce.',
    slots: 2,
    activeResidents: 0,
    linkedActivities: [
      { id: 'mine-iron', label: 'Estrai Ferro', icon: '⚙️' },
      { id: 'clear-tunnel', label: 'Sgombra Cunicolo', icon: '💎' },
    ],
    resources: [
      { label: 'Ferro', icon: '⚙️', abundance: 'Abbondante' },
      { label: 'Carbone', icon: '🪨', abundance: 'Scarsa' },
    ],
    unlocked: true,
  },
  {
    id: 'ancient-ruins',
    label: 'Rovine di Valdor',
    icon: '🏛️',
    type: 'dungeon',
    biome: 'Rovine Pre-Guerra',
    distance: '8.0 km',
    dangerLevel: 5,
    dangerLabel: 'Critico',
    dangerColor: 'var(--risk-death-color, #ef4444)',
    description: 'I resti di un\'antica città sommersa dalla vegetazione. Oggetti di valore inestimabile, ma protetti da guardiani millenari.',
    flavorText: 'Statue di divinità dimenticate ti osservano dalle nicchie. Il silenzio qui ha un peso fisico.',
    slots: 2,
    activeResidents: 0,
    linkedActivities: [
      { id: 'explore-ruins', label: 'Esplora Rovine', icon: '🔍' },
      { id: 'recover-artifact', label: 'Recupera Artefatto', icon: '🏺' },
    ],
    resources: [
      { label: 'Artefatti', icon: '🏺', abundance: 'Rara' },
      { label: 'Conoscenza', icon: '📜', abundance: 'Moderata' },
    ],
    unlocked: false,
  },
  {
    id: 'village-fields',
    label: 'Campi del Villaggio',
    icon: '🌾',
    type: 'settlement',
    biome: 'Pianura Coltivata',
    distance: '0.2 km',
    dangerLevel: 0,
    dangerLabel: 'Nullo',
    dangerColor: 'var(--text-muted, #6b7280)',
    description: 'I fertili campi appena fuori le mura. Producono cibo sufficiente per il villaggio nella buona stagione.',
    flavorText: 'L\'odore dolce del grano maturo riempie l\'aria. I residenti salutano al tuo passaggio.',
    slots: 4,
    activeResidents: 2,
    linkedActivities: [
      { id: 'farm-food', label: 'Coltiva Campi', icon: '🌾' },
      { id: 'harvest', label: 'Raccolto', icon: '🥕' },
    ],
    resources: [
      { label: 'Cibo', icon: '🥕', abundance: 'Abbondante' },
      { label: 'Semi', icon: '🌱', abundance: 'Moderata' },
    ],
    unlocked: true,
  },
];

type DemoLocation = (typeof DEMO_LOCATIONS)[number];

/** LocationDetail panel component. */
export function LocationDetail({ location, onExplore, onClose }: {
  location: DemoLocation;
  onExplore?: (id: string) => void;
  onClose?: () => void;
}): JSX.Element {
  const handleExplore = () => {
    trackTelemetryEvent('location_detail_explore_clicked', { locationId: location.id, locationLabel: location.label, dangerLevel: location.dangerLevel });
    onExplore?.(location.id);
  };

  const handleClose = () => {
    trackTelemetryEvent('location_detail_closed', { locationId: location.id });
    onClose?.();
  };

  const slotsUsed = location.activeResidents;
  const slotsTotal = location.slots;

  return (
    <div
      data-testid="location-detail"
      data-location-id={location.id}
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
        <span style={{ fontSize: '40px' }}>{location.icon}</span>
        <div style={{ flex: 1 }}>
          <h2 data-testid="location-detail-label" style={{ margin: 0, fontSize: '20px', color: _accentHex }}>{location.label}</h2>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted, #6b7280)' }}>📍 {location.distance}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted, #6b7280)' }}>🌍 {location.biome}</span>
            {!location.unlocked && <span style={{ fontSize: '11px', color: 'var(--halo-color, #f97316)', fontWeight: 600 }}>🔒 Bloccato</span>}
          </div>
        </div>
        {onClose && (
          <button onClick={handleClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted, #6b7280)', cursor: 'pointer', fontSize: '18px' }}>✕</button>
        )}
      </div>

      {/* Flavor text */}
      <div style={{ background: 'var(--panel-surface, rgba(255,255,255,0.03))', borderRadius: '8px', padding: '12px', borderLeft: `3px solid ${_accentHex}` }}>
        <p data-testid="location-detail-flavor" style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary, rgba(240,239,228,0.75))', lineHeight: 1.6, fontStyle: 'italic' }}>
          "{location.flavorText}"
        </p>
      </div>

      {/* Description */}
      <p data-testid="location-detail-description" style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary, rgba(240,239,228,0.8))', lineHeight: 1.5 }}>
        {location.description}
      </p>

      {/* Stats row */}
      <div data-testid="location-detail-stats" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '16px', fontWeight: 700, color: location.dangerColor }}>⚠️ {location.dangerLabel}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted, #6b7280)' }}>Pericolo Liv. {location.dangerLevel}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-strong, #60a5fa)' }}>
            👥 {slotsUsed}/{slotsTotal}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted, #6b7280)' }}>Slot occupati</div>
        </div>
      </div>

      {/* Resources */}
      <div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted, #6b7280)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Risorse Disponibili</div>
        <div data-testid="location-detail-resources" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {location.resources.map((r) => (
            <div key={r.label} style={{ background: 'var(--panel-surface, rgba(255,255,255,0.05))', borderRadius: '6px', padding: '6px 10px', fontSize: '12px' }}>
              <div>{r.icon} {r.label}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted, #6b7280)' }}>{r.abundance}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Linked activities */}
      <div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted, #6b7280)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Attività Collegate</div>
        <div data-testid="location-detail-activities" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {location.linkedActivities.map((a) => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', padding: '6px 10px', background: 'var(--panel-surface, rgba(255,255,255,0.04))', borderRadius: '6px' }}>
              <span>{a.icon}</span>
              <span>{a.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <button
        data-testid="location-detail-explore-btn"
        onClick={handleExplore}
        disabled={!location.unlocked}
        style={{
          padding: '10px',
          background: location.unlocked ? 'var(--button-bg, #166534)' : 'var(--panel-surface, rgba(255,255,255,0.05))',
          color: location.unlocked ? 'var(--button-text, #fff)' : 'var(--text-muted, #6b7280)',
          border: 'none',
          borderRadius: 'var(--minimal-card-radius, 6px)',
          fontSize: '14px',
          fontWeight: 600,
          cursor: location.unlocked ? 'pointer' : 'not-allowed',
        }}
      >
        {location.unlocked ? '🗺️ Esplora Luogo →' : '🔒 Sblocca per Esplorare'}
      </button>
    </div>
  );
}

/** Shell provider for locationDetailKit. */
export function LocationDetailKitShell({ children }: { children: ReactNode }): JSX.Element {
  return (
    <SkinSystemProvider>
      <SandboxTimingProvider>{children}</SandboxTimingProvider>
    </SkinSystemProvider>
  );
}

/** Isolated showcase component for /minimal-location-detail. */
export function LocationDetailIsolated(): JSX.Element {
  const [idx, setIdx] = useState(0);
  const [explored, setExplored] = useState<string | null>(null);

  return (
    <LocationDetailKitShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', padding: '24px', background: 'var(--panel-surface, #0d0d1a)', minHeight: '100vh' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {DEMO_LOCATIONS.map((l, i) => (
            <button key={l.id} onClick={() => setIdx(i)} style={{ padding: '6px 14px', borderRadius: '6px', border: i === idx ? `2px solid ${_accentHex}` : '1px solid var(--panel-border, #374151)', background: 'var(--card-surface, #1a1a2e)', color: 'var(--text-primary, #f0efe4)', cursor: 'pointer', fontSize: '13px' }}>
              {l.icon} {l.label}
            </button>
          ))}
        </div>
        {explored && (
          <div style={{ padding: '8px 16px', background: 'var(--panel-surface, rgba(34,197,94,0.1))', borderRadius: '6px', color: 'var(--accent-strong, #22c55e)', fontSize: '13px' }}>
            🗺️ In esplorazione: <strong>{explored}</strong>
          </div>
        )}
        <LocationDetail
          location={DEMO_LOCATIONS[idx]}
          onExplore={(id) => setExplored(id)}
          onClose={() => setIdx((i) => (i + 1) % DEMO_LOCATIONS.length)}
        />
      </div>
    </LocationDetailKitShell>
  );
}
