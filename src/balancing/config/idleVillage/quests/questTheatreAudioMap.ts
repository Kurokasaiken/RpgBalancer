/**
 * R-254 — Quest theatre sample map: cue id → real audio asset.
 *
 * The cinema grammar (cue ids, nominal durations, when each fires) is
 * unchanged; this table only replaces the *timbre* — synthesized
 * oscillators/noise (judged too generic for the dark-fantasy mood) with
 * CC0 field/foley recordings chosen for the forest/goblin setting.
 *
 * Asset provenance (all CC0 — no attribution required; search log and
 * ffmpeg recipes in `.mw/bugs/20261022-quest-audio-samples/bug.md`):
 *   choice_commit  — sinny «small metal clasp» (OGA, CC0): real metallic
 *     closure click for the commit gesture.
 *   cut_reveal     — Kresiek The Furry «Dark Stinger 1» (OGA, CC0):
 *     purpose-made dark cinematic stinger.
 *   cut_impact     — Eldritch Grim «Impacts/Gun/sfx» (OGA, CC0): recorded
 *     foley impacts, bass-boosted.
 *   cut_breath     — bart «Heartbeat sounds» slow_reverb (OGA, CC0):
 *     reverb-soaked lub-dub under the snap.
 *   cut_j          — Vehicle «Fantasy Weapons and Apparel SFX Library»
 *     seax-unsheathe-03 (OGA, CC0): real blade draw (seax = germanic
 *     forest blade).
 *   cut_bars       — congusbongus «Abandoned passages» horror ambience
 *     loop (OGA, CC0): unsettling passage bed for the recap letterbox.
 *   shot_settle    — rubberduck «100 CC0 metal and wood SFX» wood_hit_07
 *     (OGA, CC0): real wood hit — the frame "sits".
 *   tension_riser  — congusbongus «Cathedral in the forest» ambient loop
 *     (OGA, CC0): dark pads+bells, seam-crossfaded to a 6s loop.
 *   verdict_bigwin — gchoc «Trumpet Fanfare» (OGA, CC0): "a fanfare to
 *     signal the return of the king".
 *   verdict_win    — Eldritch Grim «War Horns» (OGA, CC0): suspenseful
 *     war-horn climax.
 *   verdict_almost — PWL «Bell dings/chimes» bell_ding4 (OGA, CC0): thin
 *     suspended chime = "per un pelo".
 *   verdict_fail   — same PWL chime pitched −12st (OGA, CC0): deep bronze
 *     doom toll, dark sibling of the almost-ring.
 *   verdict_epicfail — congusbongus «abyss» horror sting (OGA, CC0).
 *
 * Local copies were trimmed/normalized into
 * `public/assets/audio/questTheatre/` (mp3 one-shots; wav for the looped
 * riser so the loop point is sample-exact — mp3 edge padding would click).
 */

import type { TheatreAudioCue } from '@/ui/idleVillage/audio/questTheatreAudio';

/** One sample binding: asset url (public/), peak gain, optional loop. */
export interface TheatreAudioSample {
  /** Public-path url fetched at runtime (e.g. `/assets/audio/questTheatre/x.mp3`). */
  src: string;
  /** Peak gain applied to the buffer voice (0..1). */
  gain: number;
  /** Loop the buffer (continuous beds like the tension riser). */
  loop?: boolean;
}

const BASE = '/assets/audio/questTheatre';

/**
 * Cue → sample. A cue missing from the map (or whose fetch/decode fails)
 * keeps the synthesized voice — BV-13 graceful degradation is preserved.
 */
export const QUEST_THEATRE_AUDIO_MAP: Record<TheatreAudioCue, TheatreAudioSample> = {
  /* Commit gesture — short metallic click (metalLatch/brass feel). */
  choice_commit: { src: `${BASE}/choice_commit.mp3`, gain: 0.5 },
  /* Scene reveal — the cinematic low braam, trimmed to the first hit. */
  cut_reveal: { src: `${BASE}/cut_reveal.mp3`, gain: 0.5 },
  /* Harm impact — deep foley punch. */
  cut_impact: { src: `${BASE}/cut_impact.mp3`, gain: 0.6 },
  /* Magnetic-snap breath — real muffled double heartbeat. */
  cut_breath: { src: `${BASE}/cut_breath.mp3`, gain: 0.6 },
  /* J-cut swell-in — blade-draw whoosh (organic, fits the cut lead). */
  cut_j: { src: `${BASE}/cut_j.mp3`, gain: 0.5 },
  /* Recap letterbox — night-wind bed (faded 3.5s window). */
  cut_bars: { src: `${BASE}/cut_bars.mp3`, gain: 0.35 },
  /* Entrance landing — soft wood seat thump. */
  shot_settle: { src: `${BASE}/shot_settle.mp3`, gain: 0.5 },
  /* Skill-check spin — real wind loop, still swept by the bandpass
   *  automation in the scheduler (start/stop handled there). */
  tension_riser: { src: `${BASE}/tension_riser.wav`, gain: 0.4, loop: true },
  /* Verdict stingers — tier-matched: victory flourish (bigwin), war-horn
   *  call (win), suspended metallic ring (almost), bronze doom toll
   *  (fail), darkest braam hit (epicfail). */
  verdict_bigwin: { src: `${BASE}/verdict_bigwin.mp3`, gain: 0.55 },
  verdict_win: { src: `${BASE}/verdict_win.mp3`, gain: 0.5 },
  verdict_almost: { src: `${BASE}/verdict_almost.mp3`, gain: 0.45 },
  verdict_fail: { src: `${BASE}/verdict_fail.mp3`, gain: 0.55 },
  verdict_epicfail: { src: `${BASE}/verdict_epicfail.mp3`, gain: 0.6 },
};
