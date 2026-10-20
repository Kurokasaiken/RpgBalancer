/**
 * HeroLevelDecor — the rosterV2 decorative layer for hero level-up
 * (PLAN-032 SP-5, artifact r009). pgcardKit is untouched: this mounts as a
 * sibling INSIDE each card's `[data-resident-id]` wrapper and draws over the
 * portrait bounds it measures at runtime.
 *
 * Contract:
 * - The badge slot is ALWAYS mounted; its contents render only when
 *   `heroLevelView().level !== null` — a non-hero or level-less card keeps the
 *   slot but carries zero `[data-hero-level]` elements and no "Lv" text.
 * - Ring: `level null` → the arc element is NOT mounted; `level >= 1` idle →
 *   resting lit ring; a level-up event → transient IGNITION overlay for
 *   `ringMs`, then resting. Retrigger remounts the overlay keyed by `eventId`
 *   — keyframes restart, no timer races.
 * - Floater: text variant of `DamageFloater` (same lifecycle), ported to
 *   `document.body` at the portrait's viewport rect so the rise is never
 *   clipped by the roster scroll container. Supersede by `eventId` — never
 *   merge, never stack.
 * - The module-level card registry is fed from here: a mounted card is the
 *   whole "on-screen" predicate the staging command reads.
 */

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { HERO_LEVEL_CONFIG } from '@/balancing/config/idleVillage/heroLevelConfig';
import { TextFloater, prefersReducedMotion } from '@/ui/idleVillage/skins/primitives';
import { heroLevelView } from './heroLevelViewModel';
import { subscribeHeroLevelUp, type HeroLevelUpEvent } from './heroLevelUpEvents';
import { registerMountedCard } from './mountedCardRegistry';

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Ignition overlay keyed by `eventId`: a WAAPI pulse over the resting ring. */
const IgnitionRing: React.FC<{ rect: Rect; eventId: string; reducedMotion: boolean }> = ({ rect, eventId, reducedMotion }) => {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el?.animate || reducedMotion) return undefined;
    const anim = el.animate(
      [
        { transform: 'scale(0.9)', opacity: 1, filter: 'brightness(1.8)' },
        { transform: 'scale(1.18)', opacity: 0 },
      ],
      { duration: HERO_LEVEL_CONFIG?.fx.ringMs ?? 1400, easing: 'ease-out', fill: 'forwards' },
    );
    return () => anim.cancel();
  }, [eventId, reducedMotion]);
  return (
    <span
      ref={ref}
      data-hero-level-ignition={eventId}
      aria-hidden
      style={{
        position: 'absolute',
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        borderRadius: '50%',
        border: '1.5px solid var(--skin-title-color)',
        boxShadow: '0 0 14px var(--skin-title-color)',
        pointerEvents: 'none',
      }}
    />
  );
};

/** How far the badge may hang past the portrait's right edge. */
const BADGE_OVERHANG_PX = 6;
/** Minimum air between the badge and the first letter of the name. */
const BADGE_NAME_GAP_PX = 2;

export interface HeroLevelDecorProps {
  /** The canonical resident this card renders. */
  resident: ResidentState;
}

/** Decorative layer for one roster card — badge slot, lit ring, ignition, floater. */
export const HeroLevelDecor: React.FC<HeroLevelDecorProps> = ({ resident }) => {
  const { t } = useTranslation('idleVillage');
  const slotRef = useRef<HTMLSpanElement>(null);
  const [portraitRect, setPortraitRect] = useState<Rect | null>(null);
  /** Badge right edge (wrapper-relative) and the wrapper width it is measured against. */
  const [badgeAnchor, setBadgeAnchor] = useState<{ right: number; wrapperWidth: number } | null>(null);
  const [flare, setFlare] = useState<HeroLevelUpEvent | null>(null);
  const [floater, setFloater] = useState<{ eventId: string; text: string; rect: Rect } | null>(null);
  const reducedMotion = useRef(prefersReducedMotion()).current;

  const { level } = heroLevelView(resident);
  const fx = HERO_LEVEL_CONFIG?.fx ?? { ringMs: 1400, floaterMs: 1800 };

  // The card layer owns the "mounted" predicate: register on mount.
  useEffect(() => registerMountedCard(resident.id), [resident.id]);

  // Anchor rule: badge at the top-right corner of the portrait bounds — measured
  // against the stable `data-wanderlust-portrait` anchor, relative to the card
  // wrapper. It grows LEFTWARDS over the portrait and its right edge stops 2 px
  // before the name (`data-roster-name`): in the dense strip «Lv 3» covered the
  // first letters of the name (R-234, PLAN-067 T-A6).
  useLayoutEffect(() => {
    const wrapper = slotRef.current?.parentElement;
    const portrait = wrapper?.querySelector<HTMLElement>('[data-wanderlust-portrait]');
    if (!wrapper || !portrait) return undefined;
    const measure = () => {
      const wr = wrapper.getBoundingClientRect();
      const pr = portrait.getBoundingClientRect();
      setPortraitRect({ left: pr.left - wr.left, top: pr.top - wr.top, width: pr.width, height: pr.height });
      const corner = pr.right - wr.left + BADGE_OVERHANG_PX;
      const name = wrapper.querySelector<HTMLElement>('[data-roster-name]');
      const right = name ? Math.min(corner, name.getBoundingClientRect().left - wr.left - BADGE_NAME_GAP_PX) : corner;
      setBadgeAnchor({ right, wrapperWidth: wr.width });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(portrait);
    ro.observe(wrapper);
    return () => ro.disconnect();
  }, []);

  // Presentation events for THIS card: ignition keyed by eventId, floater
  // superseded by eventId (newest wins — never merged).
  useEffect(
    () =>
      subscribeHeroLevelUp((event) => {
        if (event.residentId !== resident.id) return;
        setFlare(event);
        const wrapper = slotRef.current?.parentElement;
        const portrait = wrapper?.querySelector<HTMLElement>('[data-wanderlust-portrait]');
        if (portrait) {
          const pr = portrait.getBoundingClientRect();
          setFloater({
            eventId: event.eventId,
            text: t('gameFrame.heroLevel.floater', { n: event.level }),
            rect: { left: pr.left + pr.width / 2, top: pr.top, width: pr.width, height: pr.height },
          });
        }
      }),
    [resident.id, t],
  );

  // Ignition lives `ringMs`, floater `floaterMs` — then both return to rest.
  useEffect(() => {
    if (!flare) return undefined;
    const id = window.setTimeout(() => setFlare(null), fx.ringMs);
    return () => window.clearTimeout(id);
  }, [flare, fx.ringMs]);

  useEffect(() => {
    if (!floater) return undefined;
    const id = window.setTimeout(() => setFloater(null), fx.floaterMs);
    return () => window.clearTimeout(id);
  }, [floater, fx.floaterMs]);

  return (
    <>
      {/* Badge slot — always mounted; contents only for a leveled hero. */}
      <span
        ref={slotRef}
        data-hero-level-slot={resident.id}
        aria-hidden={level === null ? true : undefined}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2 }}
      >
        {level !== null && portraitRect && (
          <>
            {/* Resting lit ring (the arc is NOT mounted when level is null). */}
            <span
              data-hero-level-ring={resident.id}
              aria-hidden
              style={{
                position: 'absolute',
                left: portraitRect.left - 2,
                top: portraitRect.top - 2,
                width: portraitRect.width + 4,
                height: portraitRect.height + 4,
                borderRadius: '50%',
                border: '1.5px solid var(--skin-icon-color)',
                boxShadow: '0 0 8px var(--skin-glow-primary), inset 0 0 4px var(--skin-glow-primary)',
              }}
            />
            {flare && <IgnitionRing rect={{ left: portraitRect.left - 2, top: portraitRect.top - 2, width: portraitRect.width + 4, height: portraitRect.height + 4 }} eventId={flare.eventId} reducedMotion={reducedMotion} />}
            {/* Badge: top-right corner of the portrait, growing leftwards, clear of the name. */}
            <span
              data-hero-level={resident.id}
              role="img"
              aria-label={t('gameFrame.heroLevel.a11y', { n: level })}
              style={{
                position: 'absolute',
                right: badgeAnchor ? badgeAnchor.wrapperWidth - badgeAnchor.right : undefined,
                top: portraitRect.top - 7,
                whiteSpace: 'nowrap',
                fontFamily: 'var(--skin-font-display)',
                fontSize: 12,
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1,
                color: 'var(--skin-title-color)',
                background: 'var(--skin-hud-lacquer-deep)',
                border: '1px solid var(--skin-icon-color)',
                borderRadius: 4,
                padding: '1px 3px',
              }}
            >
              {t('gameFrame.heroLevel.badge', { n: level })}
            </span>
          </>
        )}
      </span>
      {/* Floater — portal above card bounds (never clipped by the scroll list). */}
      {floater &&
        createPortal(
          <span style={{ position: 'fixed', left: floater.rect.left, top: floater.rect.top - 4, transform: 'translateX(-50%)', pointerEvents: 'none', zIndex: 90 }}>
            <TextFloater
              floatKey={floater.eventId}
              text={floater.text}
              color="var(--skin-title-color)"
              durationMs={fx.floaterMs}
              risePx={26}
              reducedMotion={reducedMotion}
            />
          </span>,
          document.body,
        )}
    </>
  );
};
