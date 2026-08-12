/**
 * Frame-time instrumentation for the World Surface map.
 *
 * Exists to answer one question with a number instead of an opinion: what does
 * the painted map actually cost on this machine? Every rendering budget in the
 * World Surface plans was authored as a placeholder ("da profilare"); this hook
 * is what turns those placeholders into measurements.
 *
 * Two deliberate choices:
 *
 * - The rAF loop writes to a ref, and React state is published on a slow
 *   interval (default 4x/sec). Measuring the frame rate must not itself cost a
 *   re-render per frame.
 * - `document.hidden` pauses sampling. A backgrounded WebView throttles rAF to
 *   a crawl, and counting those frames would report a stall that never happened
 *   to the player.
 */

import { useEffect, useRef, useState } from 'react';

/** Frames kept in the rolling window. ~2s at 60fps. */
const WINDOW_SIZE = 120;

/** A frame slower than this counts as a visible hitch, not just jitter. */
const LONG_FRAME_MS = 50;

/** How often the measured values are published to React. */
const PUBLISH_INTERVAL_MS = 250;

export interface FrameMetrics {
  /** Median frame time in ms. The typical experience. */
  p50: number;
  /** 95th percentile frame time in ms. Where the judder lives. */
  p95: number;
  /** Worst frame in the current window, ms. */
  worst: number;
  /** Frames over LONG_FRAME_MS since mount. */
  longFrames: number;
  /** Implied fps from p50. */
  fps: number;
  /** Frames sampled since mount. */
  samples: number;
}

const EMPTY: FrameMetrics = { p50: 0, p95: 0, worst: 0, longFrames: 0, fps: 0, samples: 0 };

function percentile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const rank = (sorted.length - 1) * q;
  const low = Math.floor(rank);
  const high = Math.ceil(rank);
  if (low === high) return sorted[low];
  return sorted[low] + (sorted[high] - sorted[low]) * (rank - low);
}

export function useFrameMetrics(enabled = true): FrameMetrics {
  const [metrics, setMetrics] = useState<FrameMetrics>(EMPTY);

  const state = useRef({
    /** Ring buffer of frame deltas. */
    frames: [] as number[],
    longFrames: 0,
    samples: 0,
    lastFrameAt: 0,
  });

  useEffect(() => {
    if (!enabled) return;

    const s = state.current;
    let rafId = 0;
    let publishId: ReturnType<typeof setInterval> | undefined;

    const onFrame = (now: number) => {
      // Skip the delta that straddles a hidden→visible transition: it measures
      // how long the tab was away, not how long a frame took.
      if (s.lastFrameAt !== 0 && !document.hidden) {
        const delta = now - s.lastFrameAt;
        s.frames.push(delta);
        if (s.frames.length > WINDOW_SIZE) s.frames.shift();
        if (delta > LONG_FRAME_MS) s.longFrames += 1;
        s.samples += 1;
      }
      s.lastFrameAt = now;
      rafId = requestAnimationFrame(onFrame);
    };

    const publish = () => {
      if (s.frames.length === 0) return;
      const sorted = [...s.frames].sort((a, b) => a - b);
      const p50 = percentile(sorted, 0.5);
      setMetrics({
        p50,
        p95: percentile(sorted, 0.95),
        worst: sorted[sorted.length - 1],
        longFrames: s.longFrames,
        fps: p50 > 0 ? 1000 / p50 : 0,
        samples: s.samples,
      });
    };

    // A hidden tab yields no frames; drop the stale anchor so the first frame
    // back does not register as one enormous delta.
    const onVisibility = () => {
      s.lastFrameAt = 0;
    };

    rafId = requestAnimationFrame(onFrame);
    publishId = setInterval(publish, PUBLISH_INTERVAL_MS);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelAnimationFrame(rafId);
      if (publishId !== undefined) clearInterval(publishId);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled]);

  return metrics;
}

export interface ImageFootprint {
  /** Number of <img> elements found inside the measured subtree. */
  count: number;
  /** Images that have finished decoding (naturalWidth > 0). */
  decoded: number;
  /** Sum of width*height*4 bytes across decoded images, in MB. */
  rgbaMb: number;
  /** Largest single edge in px across decoded images. */
  maxEdgePx: number;
  /** Images with an edge over the 4096px WebKit texture ceiling. */
  overTextureLimit: number;
}

const EMPTY_FOOTPRINT: ImageFootprint = {
  count: 0,
  decoded: 0,
  rgbaMb: 0,
  maxEdgePx: 0,
  overTextureLimit: 0,
};

/** WebKit refuses textures past this edge, and fails blank rather than throwing. */
export const TEXTURE_EDGE_LIMIT_PX = 4096;

/**
 * Measures the decoded pixel footprint of the map's layers.
 *
 * `rgbaMb` is what the layers cost once uncompressed — the figure that decides
 * whether the compositor can hold them or starts evicting tiles. It is not the
 * download size, and it is deliberately not the download size: a 7 MB PNG and a
 * 300 KB AVIF of the same dimensions occupy identical space here. That is why
 * an asset conversion must be judged on `maxEdgePx`, not on file weight alone.
 */
export function useImageFootprint(
  containerRef: React.RefObject<HTMLElement | null>,
  enabled = true,
): ImageFootprint {
  const [footprint, setFootprint] = useState<ImageFootprint>(EMPTY_FOOTPRINT);

  useEffect(() => {
    if (!enabled) return;

    const measure = () => {
      const root = containerRef.current;
      if (!root) return;

      const images = Array.from(root.querySelectorAll('img'));
      let bytes = 0;
      let decoded = 0;
      let maxEdge = 0;
      let over = 0;

      for (const img of images) {
        const { naturalWidth: w, naturalHeight: h } = img;
        if (w === 0 || h === 0) continue;
        decoded += 1;
        bytes += w * h * 4;
        const edge = Math.max(w, h);
        if (edge > maxEdge) maxEdge = edge;
        if (edge > TEXTURE_EDGE_LIMIT_PX) over += 1;
      }

      setFootprint({
        count: images.length,
        decoded,
        rgbaMb: bytes / (1024 * 1024),
        maxEdgePx: maxEdge,
        overTextureLimit: over,
      });
    };

    // Layers stream in, so re-measure until the count settles.
    measure();
    const id = setInterval(measure, 1000);
    return () => clearInterval(id);
  }, [containerRef, enabled]);

  return footprint;
}
