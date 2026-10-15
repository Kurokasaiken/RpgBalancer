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
  const latest = useRef(value);
  latest.current = value;
  useEffect(() => {
    const id = window.setInterval(() => {
      setShown((prev) => (Object.is(prev, latest.current) ? prev : latest.current));
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
