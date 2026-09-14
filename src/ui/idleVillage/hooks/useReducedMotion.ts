import { useEffect, useState } from 'react';

/**
 * Tracks `prefers-reduced-motion: reduce`, and keeps tracking it — the user can flip
 * the OS setting while the page is open.
 *
 * Shared rather than per-component: `WorldSurfaceGlassOverlay` had its own copy, and
 * the sea ripple needs the same answer as the renderer that references its filter. Two
 * independent copies of this could disagree for a frame, and for the ripple that
 * matters: the renderer must not point the sea layer at a filter the ripple component
 * decided not to render, because `filter: url(#missing)` does not degrade to "no
 * filter" — per spec the element is not rendered at all.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return reduced;
}

export default useReducedMotion;
