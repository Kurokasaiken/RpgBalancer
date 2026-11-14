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
import { useTranslation } from 'react-i18next';
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

/**
 * Fan layout: seals spread along an ARC opening upward from the place marker
 * (like an opening hand-fan), centred on -90°. A single seal sits dead top;
 * N seals spread symmetric over `spreadRad`.
 */
function arcPositions(count: number, radiusPx: number, spreadRad: number): { x: number; y: number }[] {
  if (count <= 0) return [];
  if (count === 1) return [{ x: 0, y: -radiusPx }];
  return Array.from({ length: count }, (_, i) => {
    const angle = -Math.PI / 2 - spreadRad / 2 + (i * spreadRad) / (count - 1);
    return { x: Math.cos(angle) * radiusPx, y: Math.sin(angle) * radiusPx };
  });
}

/** Fan aperture per ring — outer opens wider so seals never overlap the inner row. */
const INNER_SPREAD = (150 * Math.PI) / 180;
const OUTER_SPREAD = (200 * Math.PI) / 180;

export const PlaceFan: React.FC<PlaceFanProps> = ({ activities, views, sealPx = 44, onSelect }) => {
  const { t } = useTranslation('idleVillage');
  const { inner, outer } = useMemo(
    () => orderPlaceActivities(activities, views),
    [activities, views],
  );

  const innerR = sealPx + 30;
  const outerR = innerR + sealPx + 18;
  /** Dashed arc guide under a ring — same aperture as the seals' spread. */
  const ringGuide = (px: number, spreadRad: number) => {
    const a0 = -Math.PI / 2 - spreadRad / 2;
    const a1 = -Math.PI / 2 + spreadRad / 2;
    const x0 = px + Math.cos(a0) * px, y0 = px + Math.sin(a0) * px;
    const x1 = px + Math.cos(a1) * px, y1 = px + Math.sin(a1) * px;
    const large = spreadRad > Math.PI ? 1 : 0;
    return (
      <svg
        key={`guide-${px}`}
        style={{ position: 'absolute', left: '50%', top: '50%', marginLeft: -px, marginTop: -px, pointerEvents: 'none' }}
        width={px * 2}
        height={px * 2}
      >
        <path
          d={`M ${x0} ${y0} A ${px} ${px} 0 ${large} 1 ${x1} ${y1}`}
          fill="none"
          stroke="rgba(232,221,192,.18)"
          strokeDasharray="4 5"
          strokeWidth={1}
        />
      </svg>
    );
  };

  const renderSeal = (a: PlaceFanActivity, x: number, y: number, ring: 'inner' | 'outer') => {
    const view = views[a.id];
    return (
      <button
        key={a.id}
        type="button"
        data-testid={`place-fan-seal-${ring}`}
        data-activity-id={a.id}
        aria-label={a.titleKey ? t(a.titleKey) : a.id}
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
      {inner.length > 0 ? ringGuide(innerR, INNER_SPREAD) : null}
      {outer.length > 0 && outer.length <= PLACES_CONFIG.fan.outerRingCapacity
        ? ringGuide(outerR, OUTER_SPREAD)
        : null}
      {arcPositions(inner.length, innerR, INNER_SPREAD).map((p, i) => renderSeal(inner[i], p.x, p.y, 'inner'))}
      {arcPositions(Math.min(outer.length, PLACES_CONFIG.fan.outerRingCapacity), outerR, OUTER_SPREAD).map((p, i) =>
        renderSeal(outer[i], p.x, p.y, 'outer'),
      )}
    </div>
  );
};

export default PlaceFan;
