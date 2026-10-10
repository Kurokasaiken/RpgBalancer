import React, { useEffect, useState } from 'react';
import PoiMatericV3_5, { poiMatericV3_5Styles } from '@/ui/idleVillage/components/poi/PoiMatericV3_5';
import { usePoiTypeIcon } from './usePoiTypeIcon';
import { ENTER_MS } from './MapQuestPoi';
import type { PoiType } from '@/ui/idleVillage/components/poi/PoiMarker';

/**
 * A POI of any type resting on the map with no session behind it: a Director instrument to judge how each
 * marker family reads on the painted terrain (palette, rim, glyph) before real jobs and events exist.
 * It reads as a freshly placed marker — the seal is empty (`assigned` at 0, never `available`/`new`,
 * which the family draws as a fully written circle) and it eases in like a real quest POI does.
 */
export const MapDemoPoi: React.FC<{ type: PoiType; sizePx: number }> = ({ type, sizePx }) => {
  const iconUrl = usePoiTypeIcon(type);
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
      opacity: entered ? 1 : 0,
      transform: entered ? 'scale(1)' : 'scale(0.7)',
      transition: `opacity ${ENTER_MS}ms ease-out, transform ${ENTER_MS}ms ease-out`,
    }}
  >
    <style>{poiMatericV3_5Styles}</style>
    <PoiMatericV3_5 type={type} state="assigned" progress={0} timerDirection="clockwise" size={sizePx} grounded iconUrl={iconUrl} />
  </div>
  );
};

export default MapDemoPoi;
