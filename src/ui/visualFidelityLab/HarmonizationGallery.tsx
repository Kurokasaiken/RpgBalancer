import React, { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import './matericSkin.css';
import { ErrorBoundary } from '@/ui/organisms/ErrorBoundary';
import { FIELD_BACKGROUND, FIELD_VIGNETTE } from './foundationRecipe';
import { PgCardStandalone, residentToPgCardProps } from '@/ui/idleVillage/frozen/kits/pgcardKit';
import { pgcardFixtureResidents } from '@/ui/idleVillage/frozen/kits/pgcardKit.fixture';
// Import each Standalone DIRECTLY from its kit file — the barrel index re-exports
// slottedMedalKit, whose `@/ui/idleVillage/components/SlottedMedal` import is broken
// upstream (pre-existing), and pulling the barrel would fail the whole module.
import { ClockWidgetStandalone } from '@/ui/idleVillage/frozen/kits/clockKit';
import { ActivityCapsuleStandalone } from '@/ui/idleVillage/frozen/kits/activityCapsuleKit';
import { QuestPOIStandalone } from '@/ui/idleVillage/frozen/kits/poiKit';

/**
 * Harmonization Gallery — the BRIDGE surface (2026-07-18).
 *
 * Real, canonical components (mounted via their frozen kits, with fixture data)
 * shown so we can judge whether they belong to the same game as the Material
 * Language. HARMONIZATION IS A CSS-VARIABLE FLAG: the `.materic-skin` class
 * (see matericSkin.css) sets ~8 tokens; present = materic, absent = "liscio".
 * The components are UNTOUCHED — they read those tokens with their own fallbacks.
 *
 * Modes: "Coppie" (as-is | materic side by side), "Materico" (default look),
 * "Liscio" (revert). The last two ARE the trivial flag the game would use.
 *
 * Today the flag maps the STAT-BAR tokens (proven on PgCard). Components without
 * bars (medal, clock, POI…) render the same in both columns until their own
 * material tokens are mapped — labelled honestly per tab.
 */

type Mode = 'pairs' | 'materic' | 'plain';

const PG_FALLBACK = { workerId: 'gal-pg', label: 'Salvatrice', hp: 168, maxHp: 210, fatigue: 22 };
let pgProps: Record<string, unknown> = PG_FALLBACK;
try {
  const first = pgcardFixtureResidents?.[0];
  // keep the real portrait from the fixture, but populate the bars with realistic
  // values (the fixture resident sits at 0 HP → bars would be empty = unjudgeable)
  if (first) pgProps = { ...residentToPgCardProps(first), label: 'Salvatrice', hp: 168, maxHp: 210, fatigue: 22 };
} catch {
  /* keep fallback if fixture/portrait derivation throws at module load */
}

interface GalleryTab {
  id: string;
  label: string;
  note?: string;
  render: (instanceKey: string) => ReactNode;
}

const TABS: GalleryTab[] = [
  {
    id: 'pgcard',
    label: 'PgCard',
    render: (k) => <PgCardStandalone {...(pgProps as Record<string, never>)} workerId={`gal-pg-${k}`} />,
  },
  {
    id: 'clock',
    label: 'Clock',
    note: 'mapping materico da fare — per ora uguale nei due',
    render: () => <ClockWidgetStandalone />,
  },
  {
    id: 'poidetail',
    label: 'POI Detail',
    note: 'mapping materico da fare (field/slot/bar) — per ora uguale nei due',
    render: () => <ActivityCapsuleStandalone />,
  },
  {
    id: 'poi',
    label: 'POI',
    note: 'mapping materico da fare (token/bezel) — per ora uguale nei due',
    render: () => <QuestPOIStandalone />,
  },
];

const caption: CSSProperties = {
  fontFamily: 'var(--skin-font-display)',
  fontSize: 11,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'var(--skin-subtitle-color)',
  textAlign: 'center',
  margin: '0 0 12px',
};

const Skinned: React.FC<{ materic: boolean; tag: string; children: ReactNode }> = ({ materic, tag, children }) => (
  <div className={materic ? 'materic-skin' : undefined}>
    <ErrorBoundary componentName={`gallery-${tag}`}>{children}</ErrorBoundary>
  </div>
);

const tabBtn = (active: boolean): CSSProperties => ({
  padding: '7px 14px',
  borderRadius: 8,
  cursor: 'pointer',
  border: `1px solid rgba(223,184,87,${active ? 0.6 : 0.25})`,
  background: active ? 'rgba(223,184,87,0.16)' : 'transparent',
  color: 'var(--skin-title-color)',
  font: '600 11px var(--skin-font-display), system-ui',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
});

export const HarmonizationGallery: React.FC = () => {
  const [tabId, setTabId] = useState(TABS[0].id);
  const [mode, setMode] = useState<Mode>('pairs');
  const tab = TABS.find((t) => t.id === tabId) ?? TABS[0];

  return (
    <div style={{ minHeight: '100vh', padding: '32px 24px 96px', position: 'relative' }}>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: -1,
          backgroundImage: 'url(/assets/ui/bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <h1 style={{ ...caption, fontSize: 13 }}>Harmonization Gallery · componenti veri + flag materico</h1>

      {/* mode = the trivial flag: Materico (default) ⟷ Liscio; Coppie = compare */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 14 }}>
        {(['pairs', 'materic', 'plain'] as Mode[]).map((m) => (
          <button key={m} type="button" style={tabBtn(mode === m)} onClick={() => setMode(m)}>
            {m === 'pairs' ? 'Coppie (as-is | materico)' : m === 'materic' ? 'Solo materico' : 'Solo liscio'}
          </button>
        ))}
      </div>

      {/* component tabs */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 22 }}>
        {TABS.map((t) => (
          <button key={t.id} type="button" style={tabBtn(t.id === tabId)} onClick={() => setTabId(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab.note && (
        <p style={{ ...caption, fontSize: 10, opacity: 0.6, letterSpacing: '0.08em', marginBottom: 16 }}>
          ⚠ {tab.note}
        </p>
      )}

      <div
        style={{
          maxWidth: mode === 'pairs' ? 900 : 480,
          margin: '0 auto',
          padding: 26,
          borderRadius: 14,
          background: FIELD_BACKGROUND,
          boxShadow: FIELD_VIGNETTE,
        }}
      >
        {mode === 'pairs' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, alignItems: 'start' }}>
            <div>
              <p style={caption}>as-is (liscio)</p>
              <Skinned materic={false} tag={`${tab.id}-asis`}>{tab.render('asis')}</Skinned>
            </div>
            <div>
              <p style={caption}>materico (default)</p>
              <Skinned materic tag={`${tab.id}-mat`}>{tab.render('mat')}</Skinned>
            </div>
          </div>
        ) : (
          <div>
            <p style={caption}>{mode === 'materic' ? 'materico (default)' : 'liscio (revert)'}</p>
            <Skinned materic={mode === 'materic'} tag={`${tab.id}-solo`}>{tab.render('solo')}</Skinned>
          </div>
        )}
      </div>
    </div>
  );
};

export default HarmonizationGallery;
