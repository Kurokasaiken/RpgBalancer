import { useCallback, useEffect, useRef } from 'react';

const SOUNDS = {
  arm:     '/assets/audio/astrolabe/arm.wav',
  spin:    '/assets/audio/astrolabe/spin.wav',
  snap:    '/assets/audio/astrolabe/snap.wav',
  success: '/assets/audio/astrolabe/success.wav',
  failure: '/assets/audio/astrolabe/failure.wav',
} as const;

type SoundKey = keyof typeof SOUNDS;

/** Lazy-loads and caches AudioBuffers. Returns a play() function. */
export function useAstrolabeAudio(muted: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  const buffers = useRef<Partial<Record<SoundKey, AudioBuffer>>>({});

  const getCtx = useCallback((): AudioContext => {
    if (!ctxRef.current) ctxRef.current = new AudioContext();
    return ctxRef.current;
  }, []);

  // Pre-warm buffers on mount (non-blocking)
  useEffect(() => {
    let cancelled = false;
    async function preload() {
      const ctx = getCtx();
      await Promise.all(
        (Object.entries(SOUNDS) as [SoundKey, string][]).map(async ([key, url]) => {
          if (cancelled) return;
          try {
            const res = await fetch(url);
            const ab = await res.arrayBuffer();
            if (!cancelled) buffers.current[key] = await ctx.decodeAudioData(ab);
          } catch {
            // silently ignore — placeholder sounds may not be available in every env
          }
        }),
      );
    }
    preload();
    return () => { cancelled = true; };
  }, [getCtx]);

  const play = useCallback((key: SoundKey, { volume = 1, when = 0 }: { volume?: number; when?: number } = {}) => {
    if (muted) return;
    const buf = buffers.current[key];
    if (!buf) return;
    try {
      const ctx = getCtx();
      if (ctx.state === 'suspended') ctx.resume();
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const gain = ctx.createGain();
      gain.gain.value = volume;
      src.connect(gain).connect(ctx.destination);
      src.start(ctx.currentTime + when);
    } catch {
      // AudioContext may be closed / unavailable in test env
    }
  }, [muted, getCtx]);

  useEffect(() => {
    return () => { ctxRef.current?.close(); };
  }, []);

  return play;
}
