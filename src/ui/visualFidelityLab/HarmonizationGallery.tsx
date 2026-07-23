import React, { useEffect, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import './matericSkin.css';
import { ErrorBoundary } from '@/ui/organisms/ErrorBoundary';
import { FIELD_BACKGROUND, FIELD_VIGNETTE } from './foundationRecipe';
// Real embedded contexts, imported DIRECTLY from each kit file — the barrel
// index (`frozen/kits/index.ts`) re-exports `slottedMedalKit`, whose
// `@/ui/idleVillage/components/SlottedMedal` import is broken upstream
// (pre-existing, not ours), so pulling the barrel fails the whole module.
//
// NB: the pgCard is NEVER shown solo in the product — the real context is the
// ROSTER (a list of embedded cards). The standalone card + its "no compatible
// slot" banner are testing-only artifacts, so we mount the real roster surface
// instead: `MatericRosterComponent` is exactly what `/minimal-roster` renders.
import { MatericRosterComponent } from '@/ui/idleVillage/components/MatericRosterComponent';
// The REAL Clock strip is `TimeEngineStrip` + `DayNightPoiSkin` (same as
// /minimal-clock) — NOT the bare `ClockWidgetStandalone` QA speed-control
// panel, which never had the Day/Night medallion. Same mistake pattern as
// PgCard-vs-Roster / ActivityCapsule-vs-Detail earlier: the bare kit widget
// is a testing artifact, not the player-facing composite.
import { TimeEngineStrip } from '@/ui/idleVillage/frozen/kits/clockKit';
import { DayNightPoiSkin, QuestPOIStandalone } from '@/ui/idleVillage/frozen/kits/poiKit';
// The REAL POI Detail (per user correction, reference = /poi-detail-verification)
// is `ActivityCapsuleDetailSkinAware` + `POI_DETAIL_SKIN_CONFIG` ("Dark Luxury"),
// NOT the bare `ActivityCapsule` — that earlier assumption was wrong. Reusing the
// exact same fixture source as the reference page (no forking/duplicating).
import { ActivityCapsuleDetailSkinAware } from '@/ui/idleVillage/skins/activityCapsuleDetail/ActivityCapsuleDetailSkinAware';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '@/balancing/config/idleVillage/defaultConfig';

/**
 * Harmonization Gallery — the BRIDGE surface (2026-07-18).
 *
 * Real, canonical components (mounted via their frozen kits, with fixture data)
 * shown so we can judge whether they belong to the same game as the Material
 * Language. HARMONIZATION IS A CSS-VARIABLE FLAG: the `.materic-skin` class
 * (see matericSkin.css) sets the material tokens; present = materico, absent =
 * "liscio". The components are UNTOUCHED — they read those tokens with their
 * own fallbacks (see matericSkinConfig.ts's `var(--mat-*, <current>)` hooks).
 *
 * Modes: "Coppie" (as-is | materico side by side), "Solo materico" (default
 * look), "Solo liscio" (revert). The last two ARE the trivial flag the game
 * would use — to ship materic as the default, add `.materic-skin` at the app
 * root; to revert, remove it.
 *
 * NOTE ON THE BLUE FIELD: the `FIELD_BACKGROUND` wrapper below is the lab's
 * validated blue-night atmosphere (Observatory), used here so each component
 * is judged in a consistent "world" frame, not on a neutral background. In the
 * real game a component's own field/surface token applies — this wrapper is a
 * gallery convenience, not a claim that e.g. the roster's real background
 * should become this blue.
 *
 * KNOWN HAZARD: this project's autonomous coordinator/ai-worker can perform
 * destructive git operations (an "undo accidental commit" wiped uncommitted
 * lab edits once already this session — see project memory). Uncommitted work
 * in this file and its sibling token files is at risk until committed.
 */

type Mode = 'pairs' | 'materic' | 'plain';

interface GalleryTab {
  id: string;
  label: string;
  note?: string;
  render: (instanceKey: string, materic: boolean) => ReactNode;
}

// Same fixture shape as PoiDetailVerificationPage.tsx (the reference page) —
// reusing the real quest config, not inventing new data.
const _questConfig = DEFAULT_IDLE_VILLAGE_CONFIG.activities.quest_dangerous_hunt;
const _questDurationMs = parseInt(_questConfig.durationFormula, 10);
const _questProgress = 0.65;
const _questElapsedMs = Math.floor(_questDurationMs * _questProgress);
const POI_DETAIL_FIXTURE = {
  pillar: 'wilderness' as const,
  activityId: _questConfig.id,
  name: _questConfig.label,
  type: 'quest' as const,
  questTags: _questConfig.tags,
  subtitle: _questConfig.description,
  status: 'in-progress' as const,
  progress: _questProgress,
  duration: _questDurationMs,
  elapsed: _questElapsedMs,
  slots: [
    { id: 'slot-1', state: 'empty' as const, initial: '', progress: 0 },
    { id: 'slot-2', state: 'empty' as const, initial: '', progress: 0 },
    {
      id: 'slot-3', state: 'active' as const, initial: 'GD', progress: 0.65,
      assignedWorkerName: 'Giggiolillo', assignedWorkerAvatarUrl: '/assets/portraits/giggiolillo.png',
    },
  ],
  maxSlots: _questConfig.maxSlots === 'infinite' ? 99 : _questConfig.maxSlots,
  durationDisplay: `${_questDurationMs / 1000}s`,
  telemetry: [
    { id: 'tel-1', timestamp: new Date(Date.now() - 3600000), message: 'Activity started', type: 'start' as const },
    { id: 'tel-2', timestamp: new Date(Date.now() - 1800000), message: 'Worker assigned to slot 3', type: 'assign' as const },
    { id: 'tel-3', timestamp: new Date(Date.now() - 600000), message: 'Progress update: 65%', type: 'done' as const },
  ],
  isOpen: true,
  showTelemetry: true,
  showSlots: true,
  showInfo: true,
  compact: false,
  inlineMode: false,
  ariaLabel: `POI Detail: ${_questConfig.label}`,
  ariaLive: 'polite' as const,
};

// Same ticking logic as pages/minimal-clock.tsx (the reference page) — reused
// here so the Gallery's Clock tab shows the REAL composite (dial + strip),
// not the bare debug widget.
const ClockGalleryDemo: React.FC = () => {
  const [isPaused, setIsPaused] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [currentDay, setCurrentDay] = useState(1);
  const [hour, setHour] = useState(6);
  const [progressFraction, setProgressFraction] = useState(0);

  useEffect(() => {
    if (isPaused) return;
    const id = setInterval(() => {
      setHour((h) => (h >= 23 ? 0 : h + 1));
      setProgressFraction((p) => (p + 1 / 24 >= 1 ? 0 : p + 1 / 24));
      if (hour >= 23) setCurrentDay((d) => d + 1);
    }, 1000 / speed);
    return () => clearInterval(id);
  }, [isPaused, speed, hour]);

  const isDayTime = hour >= 6 && hour < 20;

  return (
    <TimeEngineStrip
      phaseIcon={<DayNightPoiSkin isDayPhase={isDayTime} cycleProgress={progressFraction} isPaused={isPaused} />}
      isPlaying={!isPaused}
      progressFraction={progressFraction}
      totalSeconds={86400}
      onToggle={() => setIsPaused(!isPaused)}
      label="Day/Night Cycle"
      clockProps={{
        currentDay,
        isPaused,
        speedMultiplier: speed,
        defaultSpeedMultiplier: 1,
        maxSpeedMultiplier: 8,
        tickIntervalMs: 1000,
        warmupDelayMs: 0,
        accentHex: '#f59e0b',
        onSpeedChange: (s: number) => setSpeed(s),
        availableSpeeds: [1, 2, 4, 8],
      }}
      hudState={{
        activities: [], totalActive: 0, totalCompleted: 0,
        counts: { jobs: 0, quests: 0, maintenance: 0, total: 0 },
        hasActiveActivities: false,
        persistence: {
          lastSaveTime: null, isDirty: false,
          preferences: { collapsed: false, maxVisible: 5, sortBy: 'remaining-time' as const, showTypeBadges: true, compactMode: false },
          uiState: { selectedTypeFilter: 'all' as const, telemetryPanelOpen: false, position: 'top' as const },
          metadata: { lastSaved: 0, version: '1.0.0' },
        },
      }}
      villageState={{ resources: { gold: 0, wood: 0, stone: 0 } }}
      secondsPerTimeUnit={1}
      temporalDisplay={{ year: `ANNO ${currentDay}`, season: isDayTime ? 'GIORNO' : 'NOTTE', time: `ORA ${String(hour).padStart(2, '0')}:00` }}
      compact
    />
  );
};

const TABS: GalleryTab[] = [
  {
    id: 'roster',
    label: 'Roster',
    note: 'contesto reale del pgCard: MatericRosterComponent, come /minimal-roster — differenza = colore barre + card rialzata',
    render: (k) => <MatericRosterComponent componentId={`gallery-roster-${k}`} />,
  },
  {
    id: 'clock',
    label: 'Clock',
    note: 'FIX: mostrava ClockWidgetStandalone (pannello QA nudo, senza il dial giorno/notte) — corretto a TimeEngineStrip + DayNightPoiSkin, come /minimal-clock. Mapping materico del chrome ancora da fare.',
    render: (k) => <ClockGalleryDemo key={k} />,
  },
  {
    id: 'poidetail',
    label: 'POI Detail',
    note: 'VERDETTO: la skin "Dark Luxury" (POI_DETAIL_SKIN_CONFIG) è GIÀ vicina alla Material Language — bronzo/oro/quasi-nero, slot medaglione, stessi anti-pattern (no flat button, no wide glow). Nessun override costruito: le due colonne sono identiche di proposito. Bug SEPARATO trovato (non materico): chiavi i18n non tradotte visibili a schermo (ACTIVITYCAPSULE.STATUS.*).',
    render: (k) => (
      <ActivityCapsuleDetailSkinAware
        {...POI_DETAIL_FIXTURE}
        dataTestId={`gallery-poi-detail-${k}`}
      />
    ),
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
          maxWidth: 1200,
          margin: '0 auto',
          padding: 26,
          borderRadius: 14,
          background: FIELD_BACKGROUND,
          boxShadow: FIELD_VIGNETTE,
        }}
      >
        {mode === 'pairs' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
            <div>
              <p style={caption}>as-is (liscio)</p>
              <Skinned materic={false} tag={`${tab.id}-asis`}>{tab.render('asis', false)}</Skinned>
            </div>
            <div>
              <p style={caption}>materico (default)</p>
              <Skinned materic tag={`${tab.id}-mat`}>{tab.render('mat', true)}</Skinned>
            </div>
          </div>
        ) : (
          <div>
            <p style={caption}>{mode === 'materic' ? 'materico (default)' : 'liscio (revert)'}</p>
            <Skinned materic={mode === 'materic'} tag={`${tab.id}-solo`}>{tab.render('solo', mode === 'materic')}</Skinned>
          </div>
        )}
      </div>
    </div>
  );
};

export default HarmonizationGallery;
