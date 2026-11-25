import React, { useEffect, useState } from 'react';
import PoiMatericV3_5, { poiMatericV3_5Styles } from '@/ui/idleVillage/components/poi/PoiMatericV3_5';
import { PoiZanara } from '@/ui/idleVillage/components/poi/PoiZanara';
import { POI_ZANARA_CONFIG } from '@/balancing/config/idleVillage/poiZanaraConfig';
import { usePoiTypeIcon } from './usePoiTypeIcon';
import { ENTER_MS, EXPIRE_FADE_MS } from './MapQuestPoi';
import type { PoiType } from '@/ui/idleVillage/components/poi/PoiMarker';
import { poiSizePx, type PoiSizeClass } from './poiSigillo';

/** Baptized work-family emblem (logging diorama, R-367 2026-11-24) — fallback dome glyph for the job exemplar. */
const JOB_ZANARA_ICON = '/assets/ui/poi/emblems/emblem-logs-128.webp';

/**
 * A POI of any type resting on the map with no session behind it: a Director instrument to judge how each
 * marker family reads on the painted terrain (palette, rim, glyph) before real jobs and events exist.
 * It reads as a freshly placed marker — the seal is empty (`assigned` at 0, never `available`/`new`,
 * which the family draws as a fully written circle) and it eases in like a real quest POI does.
 * The `job`/`quest` families ride the painted Zanara frame (PLAN-117 rulings); the caller may pass a live
 * `fraction` (elapsed share for job, remaining share for quest) to review the ring on the real terrain.
 */
/** `magnitude` is the weight of the stake (S/M/L, threats only): it scales the authored base size. */
export const MapDemoPoi: React.FC<{ type: PoiType; sizePx: number; magnitude?: PoiSizeClass; exiting?: boolean; fraction?: number; iconUrl?: string; iconOverflow?: boolean; iconOverflowFactor?: number }> = ({ type, sizePx: baseSizePx, magnitude = 'M', exiting = false, fraction = 0, iconUrl: iconUrlProp, iconOverflow = false, iconOverflowFactor }) => {
  const sizePx = poiSizePx(baseSizePx, magnitude);
  const familyIconUrl = usePoiTypeIcon(type);
  const iconUrl = iconUrlProp ?? familyIconUrl;
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setEntered(true), 30);
    return () => window.clearTimeout(timer);
  }, []);
  return (
  <div
    data-testid={`map-demo-poi-${type}`}
    style={{
      pointerEvents: 'none',
      opacity: exiting ? 0 : entered ? 1 : 0,
      transform: exiting || !entered ? 'scale(0.7)' : 'scale(1)',
      transition: `opacity ${exiting ? EXPIRE_FADE_MS : ENTER_MS}ms ease-out, transform ${exiting ? EXPIRE_FADE_MS : ENTER_MS}ms ease-out`,
    }}
  >
    <style>{poiMatericV3_5Styles}</style>
    {type === 'job' || type === 'quest' ? (
      /* The two production families ride the painted Zanara frame (PLAN-117
       *  rulings): job fills CW with elapsed, quest drains CCW with remaining. */
      <PoiZanara
        family={type}
        fraction={fraction}
        sizePx={sizePx * POI_ZANARA_CONFIG.markerScale}
        iconUrl={type === 'job' ? (iconUrl ?? JOB_ZANARA_ICON) : iconUrl}
        iconOverflow={iconOverflow}
        iconOverflowFactor={iconOverflowFactor}
        data-testid="map-demo-poi-zanara"
      />
    ) : (
      <PoiMatericV3_5 sigillo type={type} state="assigned" progress={0} timerDirection="clockwise" size={sizePx} grounded iconUrl={iconUrl} />
    )}
  </div>
  );
};

export default MapDemoPoi;
