/**
 * PLAN-043 WS-4 — Quest theatre cue projection (artifact-r003 §4).
 *
 * The `BeatSequencer` paces *what happened*; this module paces *how it is
 * cut*. For the beat currently on stage it produces a `QuestTheatreCue` —
 * a stable key plus the ordered set of cinema tags
 * (`reveal|impact|breath|push|bars|j-cut|expanded`) the stage layers
 * render. Each tag maps to exactly one primitive in `cinemaFx.tsx` and one
 * optional audio cue in `questTheatreAudio.ts`; keyed layers re-fire only
 * when the beat key changes, so rapid skips can never stack overlapping
 * transitions on the same beat.
 *
 * Sources of truth, in order:
 *   1. authored `QuestNode.stageDirection.cut` (per-node override),
 *   2. `questTheatreFx.cinema.cutOn[beatKind]` defaults.
 * `expanded` is a tag like any other — the cluster solver reads it to take
 * the wide stage (BV-11); nothing else may widen the window.
 */
import type {
  CinemaCutTag,
  QuestTheatreFxConfig,
} from '@/balancing/config/idleVillage/quests/questTheatreFx';
import type { TheatreAudioCue } from '@/ui/idleVillage/audio/questTheatreAudio';
import type { QuestBeat } from './beatSequencer';
import type { QuestNode } from './questScenario';

/** One presentation cue — what the stage plays while `beat` is current. */
export interface QuestTheatreCue {
  /** Stable beat key (`beat.id`) — fx layers keyed on it re-fire per beat. */
  key: string;
  /** Ordered cinema tags for this beat's stage. */
  tags: CinemaCutTag[];
  /** True when the `expanded` tag is present — the wide stage (BV-11). */
  expanded: boolean;
  /** The audio cue this beat leads with, if any. `j-cut` moves *when* it
   *  fires (lead ms before the visual cut), not *which* cue plays. */
  audio: TheatreAudioCue | null;
}

/**
 * The audio cue a beat leads with — presentation mapping only, engine state
 * is never consulted:
 *   scene → cut_reveal (the brass swell), check → tension_riser (the spin),
 *   harm(wound) → cut_impact, harm(death) → the grave stinger,
 *   end → cut_bars (night-wind under the letterbox), recap → silence.
 * The riser and the verdict stinger are owned by the check surface itself
 * (start on spin, ramp out on magnetic-snap, stinger on resolve).
 */
export function audioCueForBeat(beat: QuestBeat): TheatreAudioCue | null {
  switch (beat.kind) {
    case 'scene':
      return 'cut_reveal';
    case 'check':
      return 'tension_riser';
    case 'harm':
      return beat.harm.kind === 'death' ? 'verdict_epicfail' : 'cut_impact';
    case 'end':
      return 'cut_bars';
    case 'recap':
      return null;
  }
}

/**
 * Project the current beat into its cinema cue. Pure + deterministic:
 * the same beat always yields the same cue, so the projection is safe to
 * run per render and to memoize on `beat.id`.
 *
 * @param beat   beat on stage (null → null cue: nothing playing)
 * @param nodeFor resolver beat → authored node (scene beats carry nodeId;
 *                other kinds may resolve through their check/harm node —
 *                pass a function returning `undefined` for node-less beats)
 * @param fx     the theatre fx config (defaults live in `cinema.cutOn`)
 */
export function theatreCueForBeat(
  beat: QuestBeat | null,
  nodeFor: (beat: QuestBeat) => QuestNode | undefined,
  fx: QuestTheatreFxConfig,
): QuestTheatreCue | null {
  if (!beat) return null;
  const authored = nodeFor(beat)?.stageDirection?.cut;
  const tags =
    authored && authored.length > 0 ? [...authored] : [...(fx.cinema.cutOn[beat.kind] ?? [])];
  return {
    key: beat.id,
    tags,
    expanded: tags.includes('expanded'),
    audio: audioCueForBeat(beat),
  };
}

/** True when a beat's stage renders the given tag. Convenience for
 *  renderers that branch on one layer (e.g. letterbox bars). */
export function cueHasTag(cue: QuestTheatreCue | null, tag: CinemaCutTag): boolean {
  return cue?.tags.includes(tag) ?? false;
}
