/**
 * HudScrollBandX — the horizontal sibling of `HudScrollBand` (Director 2026-11-21: «non voglio pulsanti per andare a destra o sinistra,
 * ma la barra come hanno già roster e stash»). Same engraved grammar — brass-rimmed well, emerald «gemma» thumb (variant A, the shipped
 * one) — rotated to lie under a row that scrolls sideways. Kept in its own file so the contracted vertical band is not touched.
 *
 * Mount it as a sibling of the scroller inside a positioned ancestor; the scroller carries `data-hud-scroll-band` so its native bar is
 * hidden. Hidden while the content fits. Wheel over the band scrolls the row; the thumb drags; a click in the well pages.
 *
 * // INV: renders only inside a positioned ancestor and never mutates layout.
 * // INV: thumb width ≈ client/scroll × track (clamped to `minThumbPx`); left ≈ scrollLeft / scrollable × (track − thumb).
 * // INV: not visible when the target is missing or the content fits.
 */
import { useCallback, useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { HUD_SCROLL_BAND } from '@/balancing/config/idleVillage/hudScrollBandConfig';

export interface HudScrollBandXProps {
  /** The sideways scroll container the band describes. */
  scrollRef: RefObject<HTMLElement | null>;
  /** Gap between the scroller's bottom edge and the band, in px (default: inside the scroller's bottom inset). */
  bottomOffsetPx?: number;
}

interface Metrics { top: number; left: number; trackW: number; thumbLeft: number; thumbW: number; overflowing: boolean }

export const HudScrollBandX: React.FC<HudScrollBandXProps> = ({ scrollRef, bottomOffsetPx = 0 }) => {
  const [band, setBand] = useState<HTMLDivElement | null>(null);
  const [m, setM] = useState<Metrics | null>(null);
  const dragRef = useRef<{ startX: number; startLeft: number; range: number } | null>(null);
  const bandH = HUD_SCROLL_BAND.widthPx;

  const sync = useCallback(() => {
    const target = scrollRef.current;
    if (!band || !target) { setM(null); return; }
    const parent = (band.offsetParent as HTMLElement | null) ?? band.parentElement;
    if (!parent) { setM(null); return; }
    const r = target.getBoundingClientRect();
    const p = parent.getBoundingClientRect();
    const inset = HUD_SCROLL_BAND.insetPx;
    const trackW = r.width - inset * 2;
    if (trackW < 24) { setM(null); return; }
    const left = r.left - p.left + inset;
    const top = r.bottom - p.top - inset - bandH - bottomOffsetPx;
    const scrollable = Math.max(0, target.scrollWidth - target.clientWidth);
    const overflowing = scrollable > 1;
    const thumbW = scrollable > 0 ? Math.max(HUD_SCROLL_BAND.minThumbPx, Math.min(trackW, (target.clientWidth / target.scrollWidth) * trackW)) : trackW;
    const thumbLeft = scrollable > 0 ? (target.scrollLeft / scrollable) * (trackW - thumbW) : 0;
    setM((prev) => (prev && prev.top === top && prev.left === left && prev.trackW === trackW && prev.thumbLeft === thumbLeft && prev.thumbW === thumbW && prev.overflowing === overflowing
      ? prev : { top, left, trackW, thumbLeft, thumbW, overflowing }));
  }, [band, scrollRef, bandH, bottomOffsetPx]);

  useEffect(() => {
    const target = scrollRef.current;
    if (!band || !target) return;
    const ro = new ResizeObserver(sync);
    ro.observe(target);
    if (target.firstElementChild) ro.observe(target.firstElementChild);
    if (band.parentElement) ro.observe(band.parentElement);
    target.addEventListener('scroll', sync, { passive: true });
    const raf = requestAnimationFrame(sync);
    return () => { ro.disconnect(); target.removeEventListener('scroll', sync); cancelAnimationFrame(raf); };
  }, [band, scrollRef, sync]);

  const scrollable = () => { const el = scrollRef.current; return el ? Math.max(0, el.scrollWidth - el.clientWidth) : 0; };
  const canScroll = scrollable() > 1;

  const onThumbPointerDown = (e: React.PointerEvent) => {
    const el = scrollRef.current;
    if (!el || !canScroll || !m) return;
    e.preventDefault(); e.stopPropagation();
    dragRef.current = { startX: e.clientX, startLeft: el.scrollLeft, range: scrollable() / Math.max(1, m.trackW - m.thumbW) };
    const move = (ev: PointerEvent) => { const d = dragRef.current; if (d) el.scrollLeft = d.startLeft + (ev.clientX - d.startX) * d.range; };
    const up = () => { dragRef.current = null; window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  };

  const onWellPointerDown = (e: React.PointerEvent) => {
    const el = scrollRef.current;
    if (!el || !canScroll || !m) return;
    const well = e.currentTarget.getBoundingClientRect();
    const dir = e.clientX < well.left + m.thumbLeft + m.thumbW / 2 ? -1 : 1;
    el.scrollBy({ left: dir * el.clientWidth * HUD_SCROLL_BAND.wellClickPageRatio, behavior: 'smooth' });
  };

  const onWheel = (e: React.WheelEvent) => { const el = scrollRef.current; if (el && canScroll) el.scrollLeft += e.deltaY || e.deltaX; };

  const bandStyle: CSSProperties = {
    position: 'absolute', top: m?.top ?? 0, left: m?.left ?? 0, width: m?.trackW ?? 0, height: bandH, zIndex: 30,
    visibility: m?.overflowing ? 'visible' : 'hidden', pointerEvents: m?.overflowing ? 'auto' : 'none',
  };

  return (
    <div ref={setBand} data-hud-band-x="" data-variant="a" style={bandStyle} aria-hidden="true" onWheel={onWheel}>
      {m && (
        <>
          <span className="hbx-well" onPointerDown={onWellPointerDown} />
          <span className="hbx-thumb" style={{ left: m.thumbLeft, width: m.thumbW, cursor: canScroll ? 'grab' : undefined }} onPointerDown={onThumbPointerDown} />
        </>
      )}
    </div>
  );
};

HudScrollBandX.displayName = 'HudScrollBandX';
