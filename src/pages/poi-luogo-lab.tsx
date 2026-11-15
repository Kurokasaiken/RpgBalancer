/**
 * /lab/poi-luogo — superficie di prova del layer opportunità (PLAN-117
 * rev. 5+, D-1, T2.4, sotto-piano F2 radial). Mappa2 reale + Luogo autoriale
 * fixture (villaggio `place_village_start`) con attività finte marcate
 * `fixture` (D-2: mai scambiarle per contenuto reale).
 *
 * Nuovo modello (ruling Director 2026-11-12): il Luogo è l'elemento dipinto
 * sulla mappa — il click target è la sagoma del villaggio, nessun sigillo/
 * marker sopra. Hover sul villaggio → scheda avorio (del Luogo stesso);
 * click → menu radiale inclinato. Dev-only page, no gameplay wiring.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PixiWorldMap, type PixiMapAnchor } from '@/ui/idleVillage/pixiSpike/PixiWorldMap';
import { villageZoneLive } from '@/ui/idleVillage/pixiSpike/villageZoneOverlay';
import { HudRealPanel } from '@/ui/idleVillage/hudReal/HudRealPanel';
import { PlaceRadial } from '@/ui/idleVillage/components/gameFrame/PlaceRadial';
import { PlaceFan, type PlaceFanActivity } from '@/ui/idleVillage/components/gameFrame/PlaceFan';
import { PlaceFanCards } from '@/ui/idleVillage/components/gameFrame/PlaceFanCards';
import { PLACES_CONFIG, placeById } from '@/balancing/config/idleVillage/placesConfig';
import type { MapQuestPoiView } from '@/ui/idleVillage/components/gameFrame/MapQuestPoi';

const MANIFEST_PATH = '/assets/world/mappa2/base/manifest.json';
const REGIONS_BASE = '/assets/world/mappa2/base';
const VILLAGE_PLACE = placeById('place_village_start', PLACES_CONFIG)!;

/** mappa2 canvas (manifest.coordinateSystem.canvas) — usato per focusRequest. */
const CANVAS = { width: 2752, height: 1536 };
/** Village zone rect in world px (fx/village/village.json). */
const VILLAGE_ZONE = { x: 1260, y: 505, w: 510, h: 390 };

type FixtureScenario = 'mixed' | 'allCalm' | 'allUrgent';

/** Fake activities on the village Place — content is fake on purpose (D-2). */
const FIXTURE_ACTIVITIES: (PlaceFanActivity & { iconUrl?: string })[] = [
  { id: 'act_quest_cassa', type: 'quest', titleKey: 'places.villageStart.act.cassa', iconUrl: '/assets/ui/poi/poi-goblin-camp-128.webp' },
  { id: 'act_job_farm', type: 'job', titleKey: 'places.villageStart.act.farm', iconUrl: '/assets/ui/poi/offer-forage-128.webp' },
  { id: 'act_job_smith', type: 'job', titleKey: 'places.villageStart.act.smith', iconUrl: '/assets/ui/hud-real/poi/poi-icon-logs.webp' },
  { id: 'act_event_fair', type: 'event', titleKey: 'places.villageStart.act.fair', iconUrl: '/assets/ui/poi/offer-caravan-128.webp' },
  { id: 'act_quest_ruins', type: 'quest', titleKey: 'places.villageStart.act.ruins', iconUrl: '/assets/ui/poi/poi-ruins-128.webp' },
  { id: 'act_job_mill', type: 'job', titleKey: 'places.villageStart.act.mill', iconUrl: '/assets/ui/poi/offer-people-128.webp' },
];

const v = (over: Partial<MapQuestPoiView>): MapQuestPoiView => ({
  state: 'assigned',
  progress: 0.5,
  deadlineWarn: false,
  direction: 'clockwise',
  done: false,
  ...over,
});

const SCENARIOS: Record<FixtureScenario, Record<string, MapQuestPoiView>> = {
  mixed: {
    act_quest_cassa: v({ state: 'expiring', progress: 0.2, deadlineWarn: true, direction: 'counterclockwise' }),
    act_job_farm: v({ progress: 0.7 }),
    act_job_smith: v({ done: true, progress: 1 }),
    act_event_fair: v({ state: 'expiring', progress: 0.6, deadlineWarn: true, direction: 'counterclockwise' }),
    act_quest_ruins: v({}),
    act_job_mill: v({ progress: 0.9 }),
  },
  allCalm: Object.fromEntries(FIXTURE_ACTIVITIES.map((a) => [a.id, v({})])),
  allUrgent: Object.fromEntries(
    FIXTURE_ACTIVITIES.map((a, i) => [
      a.id,
      v({ state: i % 2 ? 'expired' : 'expiring', progress: i * 0.15, deadlineWarn: true, direction: 'counterclockwise' }),
    ]),
  ),
};

export default function PoiLuogoLabPage() {
  const { t } = useTranslation('idleVillage');
  const [villageHover, setVillageHover] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scenario, setScenario] = useState<FixtureScenario>('mixed');
  const [hoverCardOnly, setHoverCardOnly] = useState(false);
  const [menuMode, setMenuMode] = useState<'fan' | 'radial' | 'fancards'>('fancards');
  const [tiltDeg, setTiltDeg] = useState(49);
  const [activityCount, setActivityCount] = useState(6);
  const [emptyMode, setEmptyMode] = useState<'glass' | 'open' | 'arc'>('glass');
  const [focusRequest, setFocusRequest] = useState<{ x: number; y: number; n: number } | null>(null);
  const views = SCENARIOS[scenario];
  const labActivities = FIXTURE_ACTIVITIES.slice(0, activityCount);

  /* Il villaggio con palizzata + torri legno — il Luogo dipinto (misura
   * dell'ellisse della palizzata → candidato tilt ~49°). */
  useEffect(() => {
    villageZoneLive.visible = true;
    villageZoneLive.growth = 'stone';
    villageZoneLive.defence = 'palisade';
    villageZoneLive.tower1 = 'wood';
    villageZoneLive.tower2 = 'wood';
    villageZoneLive.mode = 'plates';
  }, []);

  const onMapReady = useCallback(() => {
    setFocusRequest((c) => ({
      x: VILLAGE_PLACE.worldPoint.x / CANVAS.width,
      y: VILLAGE_PLACE.worldPoint.y / CANVAS.height,
      n: (c?.n ?? 0) + 1,
    }));
  }, []);

  /* Esc chiude anche in fan mode (il radiale lo gestisce da solo). */
  useEffect(() => {
    if (!menuOpen || menuMode !== 'fan') return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen, menuMode]);

  const anchors = useMemo<PixiMapAnchor[]>(
    () => [
      {
        id: VILLAGE_PLACE.placeId,
        x: VILLAGE_PLACE.worldPoint.x,
        y: VILLAGE_PLACE.worldPoint.y,
        node: (
          <div style={{ width: 0, height: 0 }}>
            {menuOpen ? (
              menuMode === 'radial' ? (
                <PlaceRadial
                  activities={labActivities}
                  views={views}
                  tiltDeg={tiltDeg}
                  emptySlots={emptyMode}
                  onSelect={(id) => console.info('[poi-luogo-lab] select', id)}
                  onRequestClose={() => setMenuOpen(false)}
                />
              ) : menuMode === 'fancards' ? (
                <PlaceFanCards
                  activities={labActivities}
                  views={views}
                  onSelect={(id) => console.info('[poi-luogo-lab] select', id)}
                  onRequestClose={() => setMenuOpen(false)}
                />
              ) : (
                <div style={{ position: 'absolute', left: 0, top: 0 }}>
                  <PlaceFan activities={labActivities} views={views} onSelect={(id) => console.info('[poi-luogo-lab] select', id)} />
                </div>
              )
            ) : null}
          </div>
        ),
      },
    ],
    [views, menuOpen, labActivities, menuMode, tiltDeg, emptyMode],
  );

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <PixiWorldMap
        manifestPath={MANIFEST_PATH}
        regions={{ assetBase: REGIONS_BASE }}
        anchors={anchors}
        focusRequest={focusRequest}
        onReady={onMapReady}
        worldLayer={() => (
          <>
            {/* Hit-zone: il villaggio dipinto E' il Luogo — ellisse sul
                footprint della zona, nessun marker sopra. */}
            <div
              data-testid="place-village-hit"
              data-place-id={VILLAGE_PLACE.placeId}
              role="button"
              tabIndex={0}
              aria-label={t(VILLAGE_PLACE.titleKey)}
              aria-expanded={menuOpen}
              onMouseEnter={() => setVillageHover(true)}
              onMouseLeave={() => setVillageHover(false)}
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((v) => !v);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setMenuOpen((v) => !v);
                }
              }}
              style={{
                position: 'absolute',
                left: VILLAGE_ZONE.x,
                top: VILLAGE_ZONE.y,
                width: VILLAGE_ZONE.w,
                height: VILLAGE_ZONE.h,
                borderRadius: '50%',
                /* worldLayer (z7) sta SOPRA gli anchor (z5): a menu aperto la
                   hit-zone deve passare, altrimenti copre le slice. */
                pointerEvents: menuOpen ? 'none' : 'auto',
                cursor: 'pointer',
              }}
            />
          </>
        )}
      />

      {/* Scheda del Luogo — HudRealPanel (frame statue/smeraldo), screen-space
          a dimensione fissa: segue la regola "posizione fissa, non segue il
          cursore"; display puro, niente CTA. */}
      {villageHover && !menuOpen ? (
        <div style={{ position: 'absolute', right: 24, top: 80, zIndex: 30, pointerEvents: 'none' }}>
          <HudRealPanel
            kicker={t('places.villageStart.kicker', { defaultValue: 'Luogo' })}
            title={t(VILLAGE_PLACE.titleKey)}
            body={VILLAGE_PLACE.bodyKey ? t(VILLAGE_PLACE.bodyKey) : undefined}
          />
        </div>
      ) : null}

      {hoverCardOnly ? (
        <div style={{ position: 'absolute', left: 24, bottom: 24, zIndex: 10 }}>
          <HudRealPanel
            kicker={t('places.villageStart.kicker', { defaultValue: 'Luogo' })}
            title={t(VILLAGE_PLACE.titleKey)}
            body={VILLAGE_PLACE.bodyKey ? t(VILLAGE_PLACE.bodyKey) : undefined}
          />
        </div>
      ) : null}

      <div
        data-testid="poi-luogo-lab-controls"
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          zIndex: 40,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          padding: 12,
          borderRadius: 10,
          background: 'rgba(8,16,14,.85)',
          border: '1px solid rgba(201,164,74,.35)',
          color: '#e8ddc0',
          fontFamily: 'serif',
          fontSize: 13,
        }}
      >
        <div style={{ letterSpacing: '.06em', opacity: 0.8 }}>poi-luogo lab (fixture)</div>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="checkbox" checked={hoverCardOnly} onChange={(e) => setHoverCardOnly(e.target.checked)} />
          anteprima scheda del Luogo
        </label>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['fan', 'radial', 'fancards'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMenuMode(m)}
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                border: menuMode === m ? '1px solid #c9a44a' : '1px solid rgba(232,221,192,.25)',
                background: menuMode === m ? 'rgba(201,164,74,.18)' : 'transparent',
                color: 'inherit',
                cursor: 'pointer',
                font: 'inherit',
              }}
            >
              {m}
            </button>
          ))}
        </div>
        {menuMode === 'radial' ? (
          <>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              tilt {tiltDeg}°
              <input type="range" min={15} max={55} value={tiltDeg} onChange={(e) => setTiltDeg(Number(e.target.value))} />
            </label>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              attività {activityCount}
              <input type="range" min={1} max={8} value={activityCount} onChange={(e) => setActivityCount(Number(e.target.value))} />
            </label>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              vuoti:
              {(['glass', 'open', 'arc'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setEmptyMode(m)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: emptyMode === m ? '1px solid #c9a44a' : '1px solid rgba(232,221,192,.25)',
                    background: emptyMode === m ? 'rgba(201,164,74,.18)' : 'transparent',
                    color: 'inherit',
                    cursor: 'pointer',
                    font: 'inherit',
                  }}
                >
                  {m === 'glass' ? 'vetro' : m === 'open' ? 'aperto' : 'arco'}
                </button>
              ))}
            </div>
          </>
        ) : null}
        <div style={{ display: 'flex', gap: 6 }}>
          {(['mixed', 'allCalm', 'allUrgent'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setScenario(s)}
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                border: scenario === s ? '1px solid #c9a44a' : '1px solid rgba(232,221,192,.25)',
                background: scenario === s ? 'rgba(201,164,74,.18)' : 'transparent',
                color: 'inherit',
                cursor: 'pointer',
                font: 'inherit',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
