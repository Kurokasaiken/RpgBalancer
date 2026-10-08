/**
 * PLAN-023 — presented-vs-committed presentation pipeline.
 *
 * The engine commits instantly; this module replays the committed state as
 * a timed sequence the player can watch, skip or flush. Every fast-forward
 * path funnels through the same reducer — there is exactly one way to reach
 * `settled`, and on drain the invariant `presentedHp == committedHp` holds
 * (property-tested; see questGoblin.test.ts / presentationTimeline.test.ts).
 *
 * Pure reducer + a thin timed hook. All durations come from
 * `questLabPresentation` config — nothing hardcoded here.
 */

import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { DEFAULT_QUEST_LAB_PRESENTATION } from '@/balancing/config/idleVillage/quests/questLabPresentation';
import type { HarmEvent, ResolvedCheck } from './questRun';

/** Beat the presentation is currently showing. `presenting` covers the
 *  astrolabe cinematic; `verdict`..`harm` are the consequence beats. */
export type PresentationPhase =
  | 'cinematic'
  | 'verdict'
  | 'kills'
  | 'harm'
  | 'settle'
  | 'settled';

export interface PresentationState {
  /** `resolution.id` (or `ambient-N`) — StrictMode re-effects must be
   *  idempotent: re-initializing with the same id is a no-op. */
  key: string;
  phase: PresentationPhase;
  /** Presented HP per member — starts pre-harm, catches up on each event. */
  hp: Record<string, number>;
  /** Index into `harms` — events [0..harmCursor) have been presented. */
  harmCursor: number;
  /** Whether the kills beat (horde tokens shattering) has played. */
  killsShown: boolean;
}

export type PresentationAction =
  | { type: 'init'; key: string; hp: Record<string, number>; harms: HarmEvent[]; kills: number }
  | { type: 'advance'; harms: HarmEvent[]; kills: number }
  | { type: 'flush'; harms: HarmEvent[] };

/** Build the pre-harm presented-HP map: each harmed member starts at the
 *  hpBefore of its FIRST event; unharmed members start at committed hp. */
export function initialPresentedHp(
  committedHp: Record<string, number>,
  harms: HarmEvent[],
): Record<string, number> {
  const hp = { ...committedHp };
  for (const h of harms) {
    if (!(h.memberId in hp)) continue;
    // earliest event wins — hp only moves forward from there
    const first = harms.find((e) => e.memberId === h.memberId);
    if (first) hp[h.memberId] = first.hpBefore;
  }
  return hp;
}

/** Phase order: cinematic → verdict → kills (if any) → harm ×N → settle →
 *  settled. Harm beats present one event each; the last harm's next beat is
 *  `settle`. */

/** Pure reducer — the ONLY way presentation state advances. */
export function presentationReducer(
  state: PresentationState,
  action: PresentationAction,
): PresentationState {
  switch (action.type) {
    case 'init':
      // Idempotent: same key re-init is a no-op (StrictMode double effects).
      if (state.key === action.key) return state;
      return {
        key: action.key,
        phase: 'cinematic',
        hp: { ...action.hp },
        harmCursor: 0,
        killsShown: action.kills <= 0,
      };
    case 'advance': {
      switch (state.phase) {
        case 'cinematic':
          return { ...state, phase: 'verdict' };
        case 'verdict':
          return {
            ...state,
            phase: action.kills > 0 ? 'kills' : action.harms.length > 0 ? 'harm' : 'settle',
          };
        case 'kills':
          return {
            ...state,
            phase: action.harms.length > 0 ? 'harm' : 'settle',
            killsShown: true,
          };
        case 'harm': {
          if (state.harmCursor < action.harms.length) {
            const ev = action.harms[state.harmCursor];
            return {
              ...state,
              hp: { ...state.hp, [ev.memberId]: ev.hpAfter },
              harmCursor: state.harmCursor + 1,
            };
          }
          return { ...state, phase: 'settle' };
        }
        case 'settle':
          return { ...state, phase: 'settled' };
        default:
          return state;
      }
    }
    case 'flush': {
      // Jump to committed: present every remaining harm, then settled.
      const hp = { ...state.hp };
      for (const ev of action.harms) hp[ev.memberId] = ev.hpAfter;
      return { ...state, phase: 'settled', hp, harmCursor: action.harms.length, killsShown: true };
    }
    default:
      return state;
  }
}

/** True when the presented snapshot equals the committed one (drain invariant). */
export function isDrained(state: PresentationState, committedHp: Record<string, number>): boolean {
  return Object.keys(committedHp).every((id) => state.hp[id] === committedHp[id]);
}

/** Duration of the current beat, scaled by the single speed factor. */
export function beatDurationMs(phase: PresentationPhase, speed: number): number {
  const t = DEFAULT_QUEST_LAB_PRESENTATION.timeline;
  const base =
    phase === 'cinematic'
      ? t.cinematicMs
      : phase === 'verdict'
        ? t.verdictHoldMs
        : phase === 'kills'
          ? t.killsMs
          : phase === 'harm'
            ? Math.min(t.maxHarmPhaseMs, t.maxHarmPhaseMs)
            : t.settleMs;
  return Math.round(base / speed);
}

export interface PresentationTimeline {
  state: PresentationState;
  /** Advance to the next beat (progressive skip: spin → verdict → …). */
  advance: () => void;
  /** Flush the whole queue: presented jumps to committed. */
  flush: () => void;
  /** The harm event being presented right now (drives floaters/ghosts). */
  activeHarm: HarmEvent | null;
  /** Harms already presented — drives the durable delta chips. */
  shownHarms: HarmEvent[];
}

/**
 * Timed driver over the pure reducer. Receives the committed snapshot
 * (memberId → hp) plus the harms/kills of the current beat; replays them
 * against `speed` (the pre-check pace, Director D1) until `settled`.
 * Flushes on unmount and on `visibilitychange` (background-tab safety).
 */
export function usePresentationTimeline(input: {
  resolution: ResolvedCheck | null;
  committedHp: Record<string, number>;
  ambientHarms?: HarmEvent[];
  speed: number;
  enabled: boolean;
  /** Phases that DON'T auto-advance on the beat timer — the astrolabe holds
   *  `cinematic` until it resolves (or is skipped), `verdict` holds until the
   *  player acks the card. Ambient beats pass []: pure timed flow. */
  gatePhases?: PresentationPhase[];
}): PresentationTimeline {
  const { resolution, committedHp, ambientHarms = [], speed, enabled, gatePhases = [] } = input;
  const harms = useMemo(
    () => (resolution ? resolution.harms : ambientHarms),
    [resolution, ambientHarms],
  );
  const kills = resolution?.kills ?? 0;
  /* Ambient key tracks the LAST appended harm — the bucket holds only the
     current action's harms (applyChoice clears it on entry), so a new beat
     gets a new key and re-init replays exactly that action's damage. */
  const key =
    resolution?.id ??
    (ambientHarms.length ? `ambient-${ambientHarms[ambientHarms.length - 1]?.seq ?? 0}` : 'idle');

  const [state, dispatch] = useReducer(presentationReducer, {
    key: 'idle',
    phase: 'settled',
    hp: committedHp,
    harmCursor: 0,
    killsShown: true,
  });

  // (Re)initialize on a new beat — idempotent via the reducer's key check.
  useEffect(() => {
    if (!enabled || key === 'idle') return;
    dispatch({
      type: 'init',
      key,
      hp: initialPresentedHp(committedHp, harms),
      harms,
      kills,
    });
  }, [enabled, key]); // eslint-disable-line react-hooks/exhaustive-deps

  const advance = useCallback(
    () => dispatch({ type: 'advance', harms, kills }),
    [harms, kills],
  );
  const flush = useCallback(() => dispatch({ type: 'flush', harms }), [harms]);

  // Timed progression — every beat schedules the next via the config budget,
  // except gated phases (cinematic waits on the astrolabe, verdict on the player).
  useEffect(() => {
    if (!enabled || state.key !== key || state.phase === 'settled') return;
    if (gatePhases.includes(state.phase)) return;
    const id = setTimeout(advance, beatDurationMs(state.phase, speed));
    return () => clearTimeout(id);
  }, [enabled, state.key, state.phase, state.harmCursor, key, speed, advance, gatePhases]);

  // Lifecycle hardening: never leave the presented state behind (spoilers,
  // background tabs, unmount mid-timeline all converge on flush).
  const flushRef = useRef(flush);
  flushRef.current = flush;
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') flushRef.current();
    };
    document.addEventListener('visibilitychange', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      flushRef.current();
    };
  }, []);

  return {
    state,
    advance,
    flush,
    activeHarm: state.phase === 'harm' ? (harms[state.harmCursor - 1] ?? null) : null,
    shownHarms: harms.slice(0, state.harmCursor),
  };
}
