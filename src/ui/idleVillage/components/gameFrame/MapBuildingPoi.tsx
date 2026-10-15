import React, { useEffect, useRef, useState } from 'react';
import PoiMatericV3_5, { poiMatericV3_5Styles } from '@/ui/idleVillage/components/poi/PoiMatericV3_5';
import type { VillageBuildingIconKey } from '@/balancing/config/idleVillage/villageStashConfig';
import { ENTER_MS, EXPIRE_FADE_MS } from './MapQuestPoi';

/**
 * Marker for a painted village building (PLAN-032 SP-2): the `PoiMatericV3_5`
 * medallion composed exactly like `MapDemoPoi` — `assigned` seal at 0,
 * grounded, the building glyph as `iconUrl` — but interactive like
 * `MapQuestPoi` (`role="button"`, Enter/Space, localized `aria-label`).
 * Activation is "open or focus" the building's HUD panel; it never toggles it
 * shut. SP-3 reuses this marker for the merchant: the `poiToPanel` map on the
 * page, not this component, decides which panel a building opens.
 */

/** Building-icon map: `iconKey` in the building configs keys this table (a typo fails the type check). */
export const BUILDING_ICON_URLS: Record<VillageBuildingIconKey, string> = {
  warehouse: '/assets/ui/poi/poi-warehouse.svg',
  market: '/assets/ui/poi/poi-merchant.svg',
};

/** A click shorter than this pointer travel counts as activation; longer is a map pan. */
const CLICK_DELTA_PX = 5;

export interface MapBuildingPoiProps {
  buildingId: string;
  /** Already-localized building name: `aria-label` and the hover/focus tooltip. */
  name: string;
  iconUrl?: string;
  sizePx: number;
  /** Receives the marker element so the page can return focus to it on panel close. */
  onActivate: (trigger: HTMLElement) => void;
  /** Set by `anchorGhosts` while the anchor list keeps the marker mounted for its exit beat. */
  exiting?: boolean;
}

export const MapBuildingPoi: React.FC<MapBuildingPoiProps> = ({ buildingId, name, iconUrl, sizePx, onActivate, exiting = false }) => {
  const [entered, setEntered] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const pointerDownAt = useRef<{ x: number; y: number } | null>(null);
  /* Coarse pointers get no hover tooltip — the first tap must open cleanly,
   * never fire hover then click as two gestures. */
  const coarsePointer = useRef(typeof window !== 'undefined' && Boolean(window.matchMedia?.('(pointer: coarse)').matches));
  const reducedMotion = useRef(typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches));

  useEffect(() => {
    const timer = window.setTimeout(() => setEntered(true), 30);
    return () => window.clearTimeout(timer);
  }, []);

  const duration = reducedMotion.current ? 0 : exiting ? EXPIRE_FADE_MS : ENTER_MS;
  const showTooltip = !coarsePointer.current && (hovered || focused) && !exiting;

  return (
    <div
      data-building-poi={buildingId}
      role="button"
      tabIndex={exiting ? -1 : 0}
      aria-label={name}
      /* An exiting ghost must not be a focus target: the page's close path
       * checks this before returning focus to the marker (SP-3 focus rule). */
      aria-hidden={exiting || undefined}
      data-exiting={exiting || undefined}
      onPointerDown={(event) => {
        pointerDownAt.current = { x: event.clientX, y: event.clientY };
      }}
      onClick={(event) => {
        const down = pointerDownAt.current;
        pointerDownAt.current = null;
        if (down && Math.hypot(event.clientX - down.x, event.clientY - down.y) >= CLICK_DELTA_PX) return;
        onActivate(event.currentTarget);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onActivate(event.currentTarget);
        }
      }}
      onPointerEnter={(event) => {
        if (event.pointerType === 'touch') return;
        setHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        position: 'relative',
        cursor: 'pointer',
        outline: 'none',
        opacity: exiting || !entered ? 0 : 1,
        transform: exiting || !entered ? 'scale(0.7)' : 'scale(1)',
        transition: `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`,
        pointerEvents: exiting ? 'none' : undefined,
      }}
    >
      <style>{poiMatericV3_5Styles}</style>
      <PoiMatericV3_5 sigillo type="job" state="assigned" progress={0} timerDirection="clockwise" size={sizePx} grounded iconUrl={iconUrl} />
      {showTooltip && (
        <span
          role="tooltip"
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: 6,
            padding: '4px 10px',
            whiteSpace: 'nowrap',
            font: '600 12px var(--skin-font-display)',
            letterSpacing: '0.08em',
            color: 'var(--skin-title-color)',
            background: 'var(--skin-hud-lacquer-deep)',
            border: '1px solid var(--skin-surface-border)',
            borderRadius: 'var(--skin-hud-row-radius)',
            pointerEvents: 'none',
          }}
        >
          {name}
        </span>
      )}
    </div>
  );
};

export default MapBuildingPoi;
