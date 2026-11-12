/**
 * MapPlace — il marker del Luogo autoriale sulla mappa (PLAN-117 rev. 5,
 * F2/T2.4, D-13). Nodo per `PixiMapAnchor`: centrato sul `worldPoint` del
 * Place, tiene la sua dimensione schermo (hit-area ≥ 32px).
 *
 * Interazioni (decisioni 2026-11-11, veto modali GX-0042 esteso al core):
 * - hover → `PlaceHoverCard` ancorata (non modale, pointer-events none)
 * - clic  → `PlaceFan` a due anelli (non bloccante: l'overlay non copre la
 *   mappa, solo i sigilli prendono eventi; reclic/Esc chiude)
 * - `open=false` → Luogo chiuso: sigillo spento (D-7, variante «sigillo»)
 *
 * La forma del sigillo-luogo è provvisoria in attesa della pelle Zanara dei
 * POI (workstream parallelo): cornice ottagonale scura con gemma — distinta
 * dai marker POI (3 sagome) per non confondere gerarchia.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { PlaceDefinition } from '@/balancing/config/idleVillage/placesConfig';
import type { MapQuestPoiView } from './MapQuestPoi';
import { PlaceHoverCard } from './PlaceHoverCard';
import { PlaceFan, type PlaceFanActivity } from './PlaceFan';

export interface MapPlaceProps {
  place: PlaceDefinition;
  /** Activities offered by the place (fixture or real ids). */
  activities?: readonly PlaceFanActivity[];
  /** Live seal views by activity id (drives fan ring ordering). */
  views?: Readonly<Record<string, MapQuestPoiView>>;
  /** Open place offers its fan; closed = dormant seal (D-7). */
  open?: boolean;
  /** Marker diameter in px — never below 32 (hit area). */
  sizePx?: number;
  onSelectActivity?: (activityId: string) => void;
}

export const MapPlace: React.FC<MapPlaceProps> = ({
  place,
  activities = [],
  views = {},
  open = true,
  sizePx = 56,
  onSelectActivity,
}) => {
  const { t } = useTranslation('idleVillage');
  const [hovered, setHovered] = useState(false);
  const [fanOpen, setFanOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const size = Math.max(sizePx, 32);

  const closeFan = useCallback(() => setFanOpen(false), []);

  /* Esc closes the fan — the only keyboard path besides Tab+Enter on seals. */
  useEffect(() => {
    if (!fanOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeFan();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fanOpen, closeFan]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!open) return;
    setFanOpen((v) => !v);
  };

  const half = size / 2;
  return (
    <div
      ref={rootRef}
      data-testid="map-place"
      data-place-id={place.placeId}
      data-open={open}
      role="button"
      tabIndex={0}
      aria-label={t(place.titleKey)}
      aria-expanded={fanOpen}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (open) setFanOpen((v) => !v);
        }
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ position: 'relative', width: size, height: size, cursor: open ? 'pointer' : 'default' }}
    >
      {/* Sigillo-luogo: ottagono scuro + gemma — gerarchia distinta dai POI */}
      <svg
        data-testid="map-place-seal"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ display: 'block', filter: 'drop-shadow(0 3px 8px rgba(0,0,0,.55))', opacity: open ? 1 : 0.55 }}
        aria-hidden
      >
        <polygon
          points={`${half},2 ${size - 8},${size * 0.22} ${size - 2},${half} ${size - 8},${size * 0.78} ${half},${size - 2} 8,${size * 0.78} 2,${half} 8,${size * 0.22}`}
          fill="#0c1a16"
          stroke="#c9a44a"
          strokeWidth={2}
        />
        <polygon
          points={`${half},8 ${size - 14},${size * 0.28} ${size - 8},${half} ${size - 14},${size * 0.72} ${half},${size - 8} 14,${size * 0.72} 8,${half} 14,${size * 0.28}`}
          fill="none"
          stroke="rgba(201,164,74,.45)"
          strokeWidth={1}
        />
        <rect
          x={half - size * 0.16}
          y={half - size * 0.16}
          width={size * 0.32}
          height={size * 0.32}
          transform={`rotate(45 ${half} ${half})`}
          fill={open ? '#1f6e4a' : '#2a3830'}
          stroke="#0a140f"
          strokeWidth={1.5}
        />
      </svg>

      {hovered && !fanOpen ? (
        <div style={{ position: 'absolute', left: '50%', bottom: size + 8, transform: 'translateX(-50%)', zIndex: 30 }}>
          <PlaceHoverCard place={place} />
        </div>
      ) : null}

      {fanOpen && open ? (
        <div style={{ position: 'absolute', left: '50%', top: '50%', zIndex: 25 }}>
          <PlaceFan activities={activities} views={views} onSelect={onSelectActivity} />
        </div>
      ) : null}
    </div>
  );
};

export default MapPlace;
