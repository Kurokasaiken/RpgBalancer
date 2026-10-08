import { useEffect, useState } from 'react';
import type { PoiType } from '@/ui/idleVillage/components/poi/PoiMarker';

/** Where the painted centre glyph of each POI family goes (512 px, transparent). Absent files fall back to the cross. */
export const poiTypeIconUrl = (type: PoiType) => `/assets/ui/poi/icon_${type}.webp`;

/** The family's painted glyph once it is known to exist; `undefined` until then (and for good if there is none). */
export function usePoiTypeIcon(type: PoiType): string | undefined {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    let alive = true;
    const candidate = poiTypeIconUrl(type);
    const image = new Image();
    image.onload = () => alive && setUrl(candidate);
    image.onerror = () => alive && setUrl(undefined);
    image.src = candidate;
    return () => {
      alive = false;
    };
  }, [type]);
  return url;
}
