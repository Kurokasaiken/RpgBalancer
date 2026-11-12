/**
 * PlaceFan — ventaglio a due anelli del Luogo (PLAN-117 rev. 5, T2.2, D-6).
 *
 * Clic sul Luogo → i sigilli delle sue attività si aprono a ventaglio attorno
 * al marker su DUE anelli concentrici: l'anello interno porta gli urgenti
 * (`orderPlaceActivities`), l'esterno il resto. Anchored, non modale né
 * bloccante (GX-0042): l'overlay non intercetta la mappa — solo i sigilli
 * prendono pointer events — e il dettaglio dell'attività apre in sezione
 * dedicata, mai in popup.
 *
 * I sigilli usano `PoiMatericV3_5` come superficie: la pelle Zanara finale è
 * il workstream POI (sessione parallela); qui conta la disposizione anelli.
 */
import React, { useMemo } from 'react';
import { PoiMatericV3_5, poiMatericV3_5Styles } from '@/ui/idleVillage/components/poi/PoiMatericV3_5';
import type { MapQuestPoiView } from './MapQuestPoi';
import type { PoiType } from '@/ui/idleVillage/components/poi/PoiMarker';
import { orderPlaceActivities } from './placeOrdering';
import { PLACES_CONFIG } from '@/balancing/config/idleVillage/placesConfig';

export interface PlaceFanActivity {
  id: string;
  type: PoiType;
  titleKey?: string;
}

export interface PlaceFanProps {
  activities: readonly PlaceFanActivity[];
  views: Readonly<Record<string, MapQuestPoiView>>;
  /** Seal size in px — hit area never below 32px. */
  sealPx?: number;
  onSelect?: (activityId: string) => void;
}

/** Evenly spread seals on a ring; inner starts at -90° (top). */
function ringPositions(count: number, radiusPx: number): { x: number; y: number }[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / Math.max(count, 1);
    return { x: Math.cos(angle) * radiusPx, y: Math.sin(angle) * radiusPx };
  });
}

export const PlaceFan: React.FC<PlaceFanProps> = ({ activities, views, sealPx = 44, onSelect }) => {
  const { inner, outer } = useMemo(
    () => orderPlaceActivities(activities, views),
    [activities, views],
  );

  const innerR = sealPx + 30;
  const outerR = innerR + sealPx + 18;
  const ringStyle = (px: number): React.CSSProperties => ({
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: px * 2,
    height: px * 2,
    marginLeft: -px,
    marginTop: -px,
    borderRadius: '50%',
    border: '1px dashed rgba(232,221,192,.18)',
    pointerEvents: 'none',
  });

  const renderSeal = (a: PlaceFanActivity, x: number, y: number, ring: 'inner' | 'outer') => {
    const view = views[a.id];
    return (
      <button
        key={a.id}
        type="button"
        data-testid={`place-fan-seal-${ring}`}
        data-activity-id={a.id}
        aria-label={a.titleKey ?? a.id}
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.(a.id);
        }}
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: Math.max(sealPx, 32),
          height: Math.max(sealPx, 32),
          marginLeft: x - Math.max(sealPx, 32) / 2,
          marginTop: y - Math.max(sealPx, 32) / 2,
          padding: 0,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          pointerEvents: 'auto',
        }}
      >
        <PoiMatericV3_5
          sigillo
          type={a.type}
          state={view?.state ?? 'assigned'}
          progress={view?.progress ?? 0}
          timerDirection={view?.direction ?? 'clockwise'}
          pulse={view?.done}
          size={Math.max(sealPx, 32)}
        />
      </button>
    );
  };

  return (
    <div data-testid="place-fan" style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}>
      <style>{poiMatericV3_5Styles}</style>
      <div style={ringStyle(innerR)} />
      {outer.length > 0 && outer.length <= PLACES_CONFIG.fan.outerRingCapacity ? (
        <div style={ringStyle(outerR)} />
      ) : null}
      {ringPositions(inner.length, innerR).map((p, i) => renderSeal(inner[i], p.x, p.y, 'inner'))}
      {ringPositions(Math.min(outer.length, PLACES_CONFIG.fan.outerRingCapacity), outerR).map((p, i) =>
        renderSeal(outer[i], p.x, p.y, 'outer'),
      )}
    </div>
  );
};

export default PlaceFan;
