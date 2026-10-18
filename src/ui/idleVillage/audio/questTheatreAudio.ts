/**
 * PLAN-043 WS-4 / artifact-r003 §4.1 — Quest theatre audio core.
 *
 * One AudioContext per surface, created lazily (never inside a rAF/beat
 * handler — T-10). Synthesized cue roles drive the cinema grammar:
 *
 *   choice_commit  — short brass click on commit
 *   cut_reveal     — low brass/drone swell on reveal & scene cuts
 *   cut_impact     — sub-bass thud on harm impact
 *   cut_breath     — muffled double heartbeat under the magnetic-snap breath
 *   cut_j          — soft noise whoosh for the j-cut swell-in
 *   verdict_*      — tier-matched resolve stinger (bigwin/win/almost/fail/epicfail)
 *   tension_riser  — continuous noise+sub swell under the spin (start/stop)
 *   cut_bars       — night-wind bed under the recap card
 *
 * Every start() is scheduled against ctx.currentTime (+delayMs when the
 * cinema layer pre-arms a cue). cancelCurrentBeatAudio() ramps all active
 * nodes to 0.0001 over 60ms — no pops, and onended disconnect frees the
 * nodes so no beat leaves orphaned audio behind (BV-08).
 *
 * Degraded paths (BV-09/BV-13):
 *   - no WebAudio (jsdom, silent previews) → every call is a no-op, the
 *     scheduler still returns nominal ms so narrative beats stay ordered;
 *   - context `suspended` (autoplay gate, muted tab) → resume() is attempted
 *     inside the user's commit gesture; if it stays suspended the cues are
 *     scheduled and silently dropped — the cue intent is never lost.
 */

/** Beat-typed cue ids — the sequencer maps one onto each beat via `audioCueForBeat`. */
export type TheatreAudioCue =
  | 'choice_commit'
  | 'cut_reveal'
  | 'cut_impact'
  | 'cut_breath'
  | 'cut_j'
  | 'cut_bars'
  | 'tension_riser'
  | 'verdict_bigwin'
  | 'verdict_win'
  | 'verdict_almost'
  | 'verdict_fail'
  | 'verdict_epicfail';

/** Nominal cue durations (ms) — used for sequencing even when audio is muted. */
export const THEATRE_CUE_MS: Record<TheatreAudioCue, number> = {
  choice_commit: 180,
  cut_reveal: 1400,
  cut_impact: 340,
  cut_breath: 360,
  cut_j: 520,
  cut_bars: 1000,
  tension_riser: 0, // continuous — governed by stopRiser()
  verdict_bigwin: 1100,
  verdict_win: 900,
  verdict_almost: 700,
  verdict_fail: 950,
  verdict_epicfail: 1200,
};

const NOMINAL_SR = 48000;
const CANCEL_RAMP_SEC = 0.06;
const PREWARM_MS = 300;

/**
 * Minimal AudioContext surface — widened only to what the scheduler calls.
 * Real contexts satisfy this verbatim; unit tests inject a fake ctor.
 */
interface TheatreAudioContext {
  state: string;
  currentTime: number;
  destination: object;
  resume: () => Promise<void> | void;
  createGain: () => GainNode;
  createOscillator: () => OscillatorNode;
  createBiquadFilter: () => BiquadFilterNode;
  createBuffer: (ch: number, frames: number, sr: number) => AudioBuffer;
  createBufferSource: () => AudioBufferSourceNode;
}

const defaultCtxCtor = (): (new () => TheatreAudioContext) | undefined => {
  if (typeof window === 'undefined') return undefined;
  return (window.AudioContext ??
    (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) as
    | (new () => TheatreAudioContext)
    | undefined;
};

/** A scheduled node pair (source + its gain) that cancel/fade can silence. */
interface LiveVoice {
  source: { stop: (when?: number) => void; onended: (() => void) | null; disconnect: () => void };
  gain: { gain: AudioParam; disconnect: () => void };
}

/** The per-surface audio handle — cue scheduling + lifecycle. */
export interface QuestTheatreAudio {
  /** Call inside the user's commit gesture to satisfy the autoplay gate. */
  resume: () => void;
  /** Pre-warm the context ~300ms after mount so the first cue hits an unlocked bus. */
  prewarm: () => void;
  /**
   * Schedule a cue at `ctx.currentTime + delayMs`. Returns nominal ms for
   * sequencing — always, even when degraded, so callers can keep beat order.
   */
  play: (cue: TheatreAudioCue, opts?: { delayMs?: number }) => number;
  /** Continuous noise+sub swell under the spin — call stopRiser() on snap/exit. */
  startRiser: () => void;
  /** Ramp the riser out over ~80ms (call on magnetic-snap or beat advance). */
  stopRiser: () => void;
  /**
   * Progressive-skip contract (BV-08): kill every node this beat scheduled.
   * New beat audio is scheduled by the caller right after — no overlap, no pops.
   */
  cancelCurrentBeatAudio: () => void;
  /** Diagnostic — count of currently routed voices (0 after a skip + tail). */
  activeNodes: () => number;
  /** True when WebAudio is unavailable in this environment. */
  degraded: () => boolean;
  /** Teardown — used by surface unmount so no context leaks across quests. */
  dispose: () => void;
}

export interface QuestTheatreAudioDeps {
  /** Ctor override for tests — defaults to window.AudioContext/webkitAudioContext. */
  audioContextCtor?: (new () => TheatreAudioContext) | undefined;
}

/**
 * Build the surface audio instance. The context is NOT created here — it is
 * created lazily inside `resume()`/`prewarm()`/first `play()`, i.e. on a user
 * gesture or an idle tick, never inside a rAF/beat handler (T-10).
 */
export function createQuestTheatreAudio(deps: QuestTheatreAudioDeps = {}): QuestTheatreAudio {
  let ctx: TheatreAudioContext | undefined;
  let ctxFailed = false;
  let master: GainNode | undefined;
  const live = new Set<LiveVoice>();
  let noiseBuffer: AudioBuffer | undefined;
  let riserVoice: LiveVoice | undefined;
  let prewarmTimer: ReturnType<typeof setTimeout> | undefined;

  /** Lazily create the surface's single context. */
  const ensureCtx = (): TheatreAudioContext | undefined => {
    if (ctx || ctxFailed) return ctx;
    const Ctor = 'audioContextCtor' in deps ? deps.audioContextCtor : defaultCtxCtor();
    if (!Ctor) {
      ctxFailed = true;
      return undefined;
    }
    try {
      ctx = new Ctor();
      master = ctx.createGain();
      master.gain.value = 0.9;
      master.connect(ctx.destination as AudioNode);
      if (ctx.state === 'suspended') void ctx.resume();
    } catch {
      ctxFailed = true;
      ctx = undefined;
      master = undefined;
    }
    return ctx;
  };

  const getNoiseBuffer = (c: TheatreAudioContext): AudioBuffer => {
    if (!noiseBuffer) {
      const frames = Math.floor(NOMINAL_SR * 1.5);
      const buf = c.createBuffer(1, frames, NOMINAL_SR);
      const data = buf.getChannelData(0);
      let brown = 0;
      for (let i = 0; i < frames; i += 1) {
        brown = (brown + (Math.random() * 2 - 1) * 0.04) * 0.98;
        data[i] = brown;
      }
      noiseBuffer = buf;
    }
    return noiseBuffer;
  };

  /** Connect `gain → master` and track the voice for cancellation. */
  const route = (
    source: AudioScheduledSourceNode,
    gain: GainNode,
    tail?: AudioNode,
  ): LiveVoice => {
    const voice: LiveVoice = { source, gain };
    if (tail) {
      source.connect(tail);
      tail.connect(gain);
    } else {
      source.connect(gain);
    }
    gain.connect(master as AudioNode);
    source.onended = () => {
      live.delete(voice);
      try {
        gain.disconnect();
        source.disconnect();
      } catch {
        /* already detached */
      }
    };
    live.add(voice);
    return voice;
  };

  const fadeOutVoice = (v: LiveVoice, seconds: number): void => {
    const c = ctx;
    /* Wall-clock backstop: while the context is suspended `currentTime`
     *  freezes, the scheduled stop()/onended never fires and the voice would
     *  be counted live forever (BV-08). */
    const deadline = Math.max(60, Math.ceil((seconds + 0.05) * 1000));
    setTimeout(() => live.delete(v), deadline);
    if (!c) {
      live.delete(v);
      return;
    }
    try {
      const t = c.currentTime;
      v.gain.gain.cancelScheduledValues(t);
      v.gain.gain.setValueAtTime(Math.max(0.0001, v.gain.gain.value), t);
      v.gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
      v.source.stop(t + seconds + 0.01);
    } catch {
      live.delete(v);
    }
  };

  const play = (cue: TheatreAudioCue, opts: { delayMs?: number } = {}): number => {
    const nominal = THEATRE_CUE_MS[cue];
    const c = ensureCtx();
    if (!c || !master) return nominal;
    if (c.state === 'suspended') void c.resume();
    const t0 = c.currentTime + Math.max(0, opts.delayMs ?? 0) / 1000;
    const gain = c.createGain();
    gain.gain.value = 0;

    switch (cue) {
      case 'choice_commit': {
        // brass click: one pitched triangle, fast decay
        const osc = c.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520, t0);
        osc.frequency.exponentialRampToValueAtTime(190, t0 + 0.1);
        gain.gain.setValueAtTime(0.001, t0);
        gain.gain.exponentialRampToValueAtTime(0.35, t0 + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
        route(osc, gain);
        osc.start(t0);
        osc.stop(t0 + 0.2);
        break;
      }
      case 'cut_reveal': {
        // low brass/drone swell — the cut "locks" the frame
        const osc = c.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = 82.5;
        const filt = c.createBiquadFilter();
        filt.type = 'lowpass';
        filt.frequency.setValueAtTime(240, t0);
        filt.frequency.exponentialRampToValueAtTime(900, t0 + 0.4);
        filt.frequency.exponentialRampToValueAtTime(200, t0 + 1.2);
        gain.gain.setValueAtTime(0.001, t0);
        gain.gain.exponentialRampToValueAtTime(0.3, t0 + 0.35);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + nominal / 1000);
        route(osc, gain, filt as unknown as AudioNode);
        osc.start(t0);
        osc.stop(t0 + nominal / 1000 + 0.05);
        break;
      }
      case 'cut_impact': {
        // sub-bass thud on the harm hit
        const osc = c.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(96, t0);
        osc.frequency.exponentialRampToValueAtTime(38, t0 + 0.22);
        gain.gain.setValueAtTime(0.001, t0);
        gain.gain.exponentialRampToValueAtTime(0.55, t0 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + nominal / 1000);
        route(osc, gain);
        osc.start(t0);
        osc.stop(t0 + nominal / 1000 + 0.05);
        break;
      }
      case 'cut_breath': {
        // muffled double heartbeat under the snap
        const osc = c.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 58;
        gain.gain.setValueAtTime(0.001, t0);
        gain.gain.exponentialRampToValueAtTime(0.32, t0 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.02, t0 + 0.12);
        gain.gain.exponentialRampToValueAtTime(0.24, t0 + 0.21);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + nominal / 1000);
        route(osc, gain);
        osc.start(t0);
        osc.stop(t0 + nominal / 1000 + 0.05);
        break;
      }
      case 'cut_j': {
        // soft noise whoosh — the swell arrives before the next visual beat
        const src = c.createBufferSource();
        src.buffer = getNoiseBuffer(c);
        const filt = c.createBiquadFilter();
        filt.type = 'bandpass';
        filt.Q.value = 0.8;
        filt.frequency.setValueAtTime(400, t0);
        filt.frequency.exponentialRampToValueAtTime(1600, t0 + nominal / 1000);
        gain.gain.setValueAtTime(0.001, t0);
        gain.gain.exponentialRampToValueAtTime(0.18, t0 + (nominal / 1000) * 0.7);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + nominal / 1000);
        route(src, gain, filt as unknown as AudioNode);
        src.start(t0);
        src.stop(t0 + nominal / 1000 + 0.05);
        break;
      }
      case 'cut_bars': {
        // night-wind bed under the recap card
        const src = c.createBufferSource();
        src.buffer = getNoiseBuffer(c);
        const filt = c.createBiquadFilter();
        filt.type = 'lowpass';
        filt.frequency.value = 320;
        gain.gain.setValueAtTime(0.001, t0);
        gain.gain.linearRampToValueAtTime(0.1, t0 + 0.3);
        gain.gain.linearRampToValueAtTime(0.0001, t0 + nominal / 1000);
        route(src, gain, filt as unknown as AudioNode);
        src.start(t0);
        src.stop(t0 + nominal / 1000 + 0.05);
        break;
      }
      case 'tension_riser': {
        // continuous — handled by startRiser()/stopRiser()
        break;
      }
      default: {
        // verdict_* stingers — one chord, tier-matched brightness
        if (!cue.startsWith('verdict_')) break;
        const tone = cue.slice('verdict_'.length);
        const freqs: Record<string, number[]> = {
          bigwin: [523.25, 659.25, 784.0],
          win: [392.0, 523.25, 659.25],
          almost: [440.0, 466.16],
          fail: [233.08, 220.0],
          epicfail: [110.0, 116.54],
        };
        const base = freqs[tone] ?? freqs.fail;
        base.forEach((f, i) => {
          const osc = c.createOscillator();
          osc.type = tone === 'bigwin' || tone === 'win' ? 'triangle' : 'sawtooth';
          osc.frequency.value = f;
          const g = c.createGain();
          g.gain.setValueAtTime(0.001, t0);
          g.gain.exponentialRampToValueAtTime(i === 0 ? 0.3 : 0.18, t0 + 0.02 + i * 0.03);
          g.gain.exponentialRampToValueAtTime(0.0001, t0 + nominal / 1000);
          route(osc, g);
          osc.start(t0 + i * 0.02);
          osc.stop(t0 + nominal / 1000 + 0.05);
        });
        break;
      }
    }
    return nominal;
  };

  const startRiser = (): void => {
    stopRiser();
    const c = ensureCtx();
    if (!c || !master) return;
    const t0 = c.currentTime;
    const gain = c.createGain();
    gain.gain.setValueAtTime(0.001, t0);
    gain.gain.exponentialRampToValueAtTime(0.16, t0 + 1.6);
    const src = c.createBufferSource();
    src.buffer = getNoiseBuffer(c);
    src.loop = true;
    const filt = c.createBiquadFilter();
    filt.type = 'bandpass';
    filt.Q.value = 1.2;
    filt.frequency.setValueAtTime(300, t0);
    filt.frequency.linearRampToValueAtTime(1100, t0 + 2.2);
    src.connect(filt as unknown as AudioNode);
    (filt as unknown as AudioNode).connect(gain);
    gain.connect(master as AudioNode);
    const voice: LiveVoice = { source: src, gain };
    riserVoice = voice;
    src.onended = () => {
      live.delete(voice);
      try {
        gain.disconnect();
        src.disconnect();
      } catch {
        /* already detached */
      }
    };
    live.add(voice);
    src.start(t0);
  };

  const stopRiser = (): void => {
    if (!riserVoice) return;
    const v = riserVoice;
    riserVoice = undefined;
    fadeOutVoice(v, 0.08);
  };

  const cancelCurrentBeatAudio = (): void => {
    riserVoice = undefined;
    for (const v of Array.from(live)) fadeOutVoice(v, CANCEL_RAMP_SEC);
  };

  return {
    resume: () => {
      const c = ensureCtx();
      if (c && c.state === 'suspended') void c.resume();
    },
    prewarm: () => {
      if (prewarmTimer !== undefined || ctx || ctxFailed) return;
      prewarmTimer = setTimeout(() => {
        prewarmTimer = undefined;
        const c = ensureCtx();
        if (c && c.state === 'suspended') void c.resume();
      }, PREWARM_MS);
    },
    play,
    startRiser,
    stopRiser,
    cancelCurrentBeatAudio,
    activeNodes: () => live.size,
    degraded: () => {
      ensureCtx();
      return ctxFailed;
    },
    dispose: () => {
      if (prewarmTimer !== undefined) {
        clearTimeout(prewarmTimer);
        prewarmTimer = undefined;
      }
      cancelCurrentBeatAudio();
    },
  };
}

/* ---------------------------------------------------------------------------
 * Module default instance — the /game surface calls the singleton so a
 * remount reuses the already-unlocked context (autoplay gate survives
 * StrictMode remounts).
 * ------------------------------------------------------------------------- */

let shared: QuestTheatreAudio | undefined;

/** The surface-level singleton — one context per quest stage mount. */
export const getQuestTheatreAudio = (): QuestTheatreAudio => {
  if (!shared) {
    shared = createQuestTheatreAudio();
    /* BV-08/BV-13 witness surface (read-only): the probe counts live voices
     *  to prove a skip ladder leaves no orphaned oscillators. Same global
     *  naming convention as `__idleVillageTestHooks`. */
    if (typeof window !== 'undefined') {
      const inst = shared;
      (window as unknown as { __questTheatreAudioDebug?: { liveSources: () => number } }).__questTheatreAudioDebug = {
        liveSources: () => inst.activeNodes(),
      };
    }
  }
  return shared;
};

/** Test-only — drop the shared instance between specs. */
export const __resetQuestTheatreAudioForTest = (): void => {
  shared?.dispose();
  shared = undefined;
};
