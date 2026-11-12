/**
 * /lab/poi-luogo — superficie di prova del layer opportunità (PLAN-117
 * rev. 5, D-1, T2.4). Mappa2 reale + Luogo autoriale fixture (villaggio,
 * `place_village_start`) con attività finte marcate `fixture` (D-2: mai
 * scambiarle per contenuto reale).
 *
 * Serve al fork F2 (scheda hover, ventaglio due anelli, Luogo chiuso) e alle
 * misure sul vivo — nessun montaggio su `/game` (flusso POI→quest = PLAN-116
 * D8). Dev-only page, no gameplay wiring.
 */
import React, { useMemo, useState } from 'react';
import { PixiWorldMap, type PixiMapAnchor } from '@/ui/idleVillage/pixiSpike/PixiWorldMap';
import { MapPlace } from '@/ui/idleVillage/components/gameFrame/MapPlace';
import { MapDemoPoi } from '@/ui/idleVillage/components/gameFrame/MapDemoPoi';
import { PlaceHoverCard } from '@/ui/idleVillage/components/gameFrame/PlaceHoverCard';
import { PLACES_CONFIG, placeById } from '@/balancing/config/idleVillage/placesConfig';
import { POI_CONFIG } from '@/balancing/config/idleVillage/poiConfig';
import type { MapQuestPoiView } from '@/ui/idleVillage/components/gameFrame/MapQuestPoi';
import type { PlaceFanActivity } from '@/ui/idleVillage/components/gameFrame/PlaceFan';

const MANIFEST_PATH = '/assets/world/mappa2/base/manifest.json';
const REGIONS_BASE = '/assets/world/mappa2/base';
const VILLAGE_PLACE = placeById('place_village_start', PLACES_CONFIG)!;

type FixtureScenario = 'mixed' | 'allCalm' | 'allUrgent';

/** Fake activities on the village Place — content is fake on purpose (D-2). */
const FIXTURE_ACTIVITIES: PlaceFanActivity[] = [
  { id: 'act_quest_cassa', type: 'quest', titleKey: 'idleVillage.places.villageStart.act.cassa' },
  { id: 'act_job_farm', type: 'job', titleKey: 'idleVillage.places.villageStart.act.farm' },
  { id: 'act_job_smith', type: 'job', titleKey: 'idleVillage.places.villageStart.act.smith' },
  { id: 'act_event_fair', type: 'event', titleKey: 'idleVillage.places.villageStart.act.fair' },
  { id: 'act_quest_ruins', type: 'quest', titleKey: 'idleVillage.places.villageStart.act.ruins' },
  { id: 'act_job_mill', type: 'job', titleKey: 'idleVillage.places.villageStart.act.mill' },
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
  const [placeOpen, setPlaceOpen] = useState(true);
  const [scenario, setScenario] = useState<FixtureScenario>('mixed');
  const [hoverCardOnly, setHoverCardOnly] = useState(false);
  const views = SCENARIOS[scenario];

  const anchors = useMemo<PixiMapAnchor[]>(() => {
    const list: PixiMapAnchor[] = [
      {
        id: VILLAGE_PLACE.placeId,
        x: VILLAGE_PLACE.worldPoint.x,
        y: VILLAGE_PLACE.worldPoint.y,
        node: (
          <MapPlace
            place={VILLAGE_PLACE}
            activities={FIXTURE_ACTIVITIES}
            views={views}
            open={placeOpen}
            onSelectActivity={(id) => console.info('[poi-luogo-lab] select', id)}
          />
        ),
      },
    ];
    /* Fixture POI markers near the place (from poiConfig) — same world px. */
    for (const [i, poi] of POI_CONFIG.pois.entries()) {
      list.push({
        id: poi.id,
        x: (poi.worldPoint?.x ?? VILLAGE_PLACE.worldPoint.x) + 140 * (i + 1),
        y: (poi.worldPoint?.y ?? VILLAGE_PLACE.worldPoint.y) - 60,
        node: <MapDemoPoi type={poi.type} sizePx={55} />,
      });
    }
    return list;
  }, [views, placeOpen]);

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <PixiWorldMap manifestPath={MANIFEST_PATH} regions={{ assetBase: REGIONS_BASE }} anchors={anchors} />

      {hoverCardOnly ? (
        <div style={{ position: 'absolute', left: 24, bottom: 24, zIndex: 10 }}>
          <PlaceHoverCard place={VILLAGE_PLACE} widthPx={280} />
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
          <input type="checkbox" checked={placeOpen} onChange={(e) => setPlaceOpen(e.target.checked)} />
          luogo aperto
        </label>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="checkbox" checked={hoverCardOnly} onChange={(e) => setHoverCardOnly(e.target.checked)} />
          mostra scheda hover (fissa)
        </label>
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
