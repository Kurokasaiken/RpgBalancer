import React from 'react';
import PoiMatericV3_5, { poiMatericV3_5Styles } from '@/ui/idleVillage/components/poi/PoiMatericV3_5';
import { usePoiTypeIcon } from './usePoiTypeIcon';
import type { PoiType } from '@/ui/idleVillage/components/poi/PoiMarker';

/**
 * A POI of any type resting on the map with no session behind it: a Director instrument to judge how each
 * marker family reads on the painted terrain (palette, rim, glyph) before real jobs and events exist.
 */
export const MapDemoPoi: React.FC<{ type: PoiType; sizePx: number }> = ({ type, sizePx }) => {
  const iconUrl = usePoiTypeIcon(type);
  return (
  <div data-testid={`map-demo-poi-${type}`} style={{ pointerEvents: 'none' }}>
    <style>{poiMatericV3_5Styles}</style>
    <PoiMatericV3_5 type={type} state="available" progress={1} timerDirection="clockwise" size={sizePx} grounded iconUrl={iconUrl} />
  </div>
  );
};

export default MapDemoPoi;
