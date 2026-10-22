import { useEffect, useRef, useState } from 'react';

/**
 * Returns `value` re-published at most once every `ms` wall-clock milliseconds.
 *
 * Used where a fast-ticking source (the integer game clock) feeds an expensive
 * subtree (the POI medallion SVG): downstream memos and element identity stay
 * stable between samples, so React bails out of the subtree on the in-between
 * ticks. The sampler never drops the latest value — a change landing while the
 * source is idle is published on the next window; nothing is lost, only
 * deferred by at most `ms`.
 */
export function useThrottledValue<T>(value: T, ms: number): T {
  const [shown, setShown] = useState(value);
  const shownRef = useRef(value);
  const latest = useRef(value);
  latest.current = value;
  useEffect(() => {
    const id = window.setInterval(() => {
      /* R-265: skip the dispatch itself when nothing changed — an updater
       *  that returns `prev` still schedules a render pass (the eager bail
       *  is defeated whenever another lane is pending), which made every
       *  sampler instance re-render its host page ~2×/s while idle. */
      if (Object.is(shownRef.current, latest.current)) return;
      shownRef.current = latest.current;
      setShown(latest.current);
    }, ms);
    return () => window.clearInterval(id);
  }, [ms]);
  return shown;
}

/**
 * Returns `value` but keeps the previous reference while `isEqual(prev, next)`
 * holds — the classic "structural sharing by hand" for objects recomputed every
 * render (e.g. a derived availability value that only matters at day
 * granularity). Downstream memos see a stable identity and bail out.
 */
export function useStableValue<T>(value: T, isEqual: (prev: T, next: T) => boolean): T {
  const ref = useRef(value);
  if (!isEqual(ref.current, value)) ref.current = value;
  return ref.current;
}
