/**
 * HudScrollBand — the shared engraved scroll indicator (PLAN-125 Fase 7a,
 * PLAN-127 N=3 #1; golden `.mw/specs/expedition-ui/refs/scroll-band-oro-inciso.png`).
 *
 * Mount it as a sibling of the scroll container inside a positioned ancestor
 * (`position: relative`), passing a ref to the scroller. It draws an engraved
 * well + thumb over the list's right gutter and keeps the real scroll — the
 * native bar is hidden on the scroller via `data-hud-scroll-band`, wheel and
 * keyboard still work, the thumb is a pointer affordance on top. The whole
 * overlay is `aria-hidden`: it duplicates information the scroll position
 * already carries.
 *
 * Variants (fork `.mw/runs/20261120-scroll-band/`): `a` smalto (teal enamel
 * thumb in brass-rimmed well), `b` oro inciso (engraved champagne thumb +
 * end studs), `c` filare (hairline channel + sliding lozenge). The default
 * lives in `HUD_SCROLL_BAND`; `?band=a|b|c` overrides it in dev for ruling.
 *
 * // INV: the band renders only inside a positioned ancestor; it never
 * //      mutates layout — the scroller keeps its own box and scroll flow.
 * // INV: thumb geometry is proportional — height ≈ client/scroll × track
 * //      (clamped to `minThumbPx`), position ≈ scrollTop / scrollable ×
 * //      (track − thumb); the mapping is the native scrollbar's own.
 * // INV: hidden when the target is missing or shorter than the minimum
 * //      useful height — a 0-height collapsed list shows no band.
 */

import { useCallback, useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { HUD_SCROLL_BAND, type HudScrollBandVariant } from '@/balancing/config/idleVillage/hudScrollBandConfig';

export interface HudScrollBandProps {
  /** The scroll container the band describes (its `data-hud-scroll-band` element). */
  scrollRef: RefObject<HTMLElement | null>;
  /** Fork override; defaults to `HUD_SCROLL_BAND.variant` (or `?band=` in dev). */
  variant?: HudScrollBandVariant;
}

interface BandMetrics {
  top: number;
  left: number;
  trackH: number;
  thumbTop: number;
  thumbH: number;
  /** false when the content fits — the band stays hidden (Director 2026-11-20:
   *  «quando non ce n'è bisogno non deve apparire»). The shell keeps measuring
   *  so it appears as soon as the content starts overflowing. */
  overflowing: boolean;
}

const resolveVariant = (prop?: HudScrollBandVariant): HudScrollBandVariant => {
  if (prop) return prop;
  if (import.meta.env.DEV) {
    const q = new URLSearchParams(window.location.search).get('band');
    if (q === 'a' || q === 'b' || q === 'c') return q;
  }
  return HUD_SCROLL_BAND.variant;
};

export const HudScrollBand: React.FC<HudScrollBandProps> = ({ scrollRef, variant }) => {
  const v = resolveVariant(variant);
  const [band, setBand] = useState<HTMLDivElement | null>(null);
  const [m, setM] = useState<BandMetrics | null>(null);
  const dragRef = useRef<{ startY: number; startTop: number; range: number } | null>(null);

  const sync = useCallback(() => {
    const target = scrollRef.current;
    if (!band || !target) { setM(null); return; }
    /* The band is absolutely positioned inside a positioned ancestor —
     * `offsetParent` is that ancestor; measure both rects in its space so
     * panel drags (translate/left-top moves) need no re-measure. */
    const parent = (band.offsetParent as HTMLElement | null) ?? band.parentElement;
    if (!parent) { setM(null); return; }
    const r = target.getBoundingClientRect();
    const p = parent.getBoundingClientRect();
    const inset = HUD_SCROLL_BAND.insetPx;
    const trackH = r.height - inset * 2;
    if (trackH < 24) { setM(null); return; }
    const left = r.right - p.left - inset - HUD_SCROLL_BAND.widthPx;
    const top = r.top - p.top + inset;
    const scrollable = Math.max(0, target.scrollHeight - target.clientHeight);
    const overflowing = scrollable > 1;
    const thumbH = scrollable > 0
      ? Math.max(HUD_SCROLL_BAND.minThumbPx, Math.min(trackH, (target.clientHeight / target.scrollHeight) * trackH))
      : trackH;
    const thumbTop = scrollable > 0 ? (target.scrollTop / scrollable) * (trackH - thumbH) : 0;
    setM((prev) =>
      prev && prev.top === top && prev.left === left && prev.trackH === trackH && prev.thumbTop === thumbTop && prev.thumbH === thumbH && prev.overflowing === overflowing
        ? prev
        : { top, left, trackH, thumbTop, thumbH, overflowing },
    );
  }, [band, scrollRef]);

  useEffect(() => {
    const target = scrollRef.current;
    if (!band || !target) return;
    const ro = new ResizeObserver(sync);
    ro.observe(target);
    if (band.parentElement) ro.observe(band.parentElement);
    target.addEventListener('scroll', sync, { passive: true });
    const raf = requestAnimationFrame(sync);
    return () => {
      ro.disconnect();
      target.removeEventListener('scroll', sync);
      cancelAnimationFrame(raf);
    };
  }, [band, scrollRef, sync]);

  /* The shell div must always render — it carries the measuring ref (a
   *  `null` early-return would never mount it and `m` would stay null). */
  const target = () => scrollRef.current;
  const scrollable = () => {
    const el = target();
    return el ? Math.max(0, el.scrollHeight - el.clientHeight) : 0;
  };
  const canScroll = scrollable() > 1;

  const onThumbPointerDown = (e: React.PointerEvent) => {
    const el = target();
    if (!el || !canScroll || !m) return;
    e.preventDefault();
    e.stopPropagation();
    const range = scrollable() / Math.max(1, m.trackH - m.thumbH);
    dragRef.current = { startY: e.clientY, startTop: el.scrollTop, range };
    const move = (ev: PointerEvent) => {
      const d = dragRef.current;
      if (d) el.scrollTop = d.startTop + (ev.clientY - d.startY) * d.range;
    };
    const up = () => {
      dragRef.current = null;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const onWellPointerDown = (e: React.PointerEvent) => {
    const el = target();
    if (!el || !canScroll || !m) return;
    const well = e.currentTarget.getBoundingClientRect();
    const dir = e.clientY < well.top + m.thumbTop + m.thumbH / 2 ? -1 : 1;
    el.scrollBy({ top: dir * el.clientHeight * HUD_SCROLL_BAND.wellClickPageRatio, behavior: 'smooth' });
  };

  /* The band sits over the list, not inside it — wheel over it would bubble
   * to the (non-scrolling) parent, so forward the delta to the scroller. */
  const onWheel = (e: React.WheelEvent) => {
    const el = target();
    if (el && canScroll) el.scrollTop += e.deltaY;
  };

  const bandStyle: CSSProperties = {
    position: 'absolute',
    top: m?.top ?? 0,
    left: m?.left ?? 0,
    width: HUD_SCROLL_BAND.widthPx,
    height: m?.trackH ?? 0,
    zIndex: 30,
    visibility: m?.overflowing ? 'visible' : 'hidden',
    pointerEvents: m?.overflowing ? 'auto' : 'none',
  };

  const thumbStyle: CSSProperties = { top: m?.thumbTop ?? 0, height: m?.thumbH ?? 0 };
  const lozTop = m ? (m.trackH > m.thumbH ? m.thumbTop + m.thumbH / 2 : m.trackH / 2) : 0;

  return (
    <div ref={setBand} data-hud-band="" data-variant={v} style={bandStyle} aria-hidden="true" onWheel={onWheel}>
      {!m ? null : v === 'c' ? (
        <>
          <span className="hb-channel" />
          <span
            className="hb-loz"
            style={{ top: lozTop, cursor: canScroll ? 'grab' : undefined }}
            onPointerDown={onThumbPointerDown}
          />
        </>
      ) : (
        <>
          <span className="hb-well" onPointerDown={onWellPointerDown} />
          {v === 'b' && (
            <>
              <span className="hb-stud hb-stud-top" />
              <span className="hb-stud hb-stud-bot" />
            </>
          )}
          <span
            className="hb-thumb"
            style={{ ...thumbStyle, cursor: canScroll ? 'grab' : undefined }}
            onPointerDown={onThumbPointerDown}
          />
        </>
      )}
    </div>
  );
};

HudScrollBand.displayName = 'HudScrollBand';
