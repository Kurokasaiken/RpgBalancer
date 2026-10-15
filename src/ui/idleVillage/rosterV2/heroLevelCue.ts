/**
 * `level_up` cue for the hero level-up staging beat (PLAN-032 SP-5).
 *
 * Shared AudioContext + synthesized arpeggio — the same pattern as the
 * invasion landing thud (`WorldSurfaceEventCard.playThud`): creating an
 * AudioContext blocks the main thread (~1.1 s measured, PLAN-034 T-004/RC-2),
 * so the context is created once and reused; a Director button press is a
 * user gesture, which satisfies the autoplay policy.
 */

let levelUpAudioContext: AudioContext | null = null;

/** Creates (once) the shared cue AudioContext. Null when WebAudio is unavailable. */
const ensureLevelUpAudioContext = (): AudioContext | null => {
  if (levelUpAudioContext) return levelUpAudioContext;
  const AudioContextCtor =
    (window as never as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext ||
    (window as never as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return null;
  levelUpAudioContext = new AudioContextCtor();
  return levelUpAudioContext;
};

/**
 * Short rising arpeggio (E5 → A5 → E6) — the `level_up` cue's beat spine.
 * `fx.ringMs` in heroLevelConfig stays under this duration by intent; the
 * floater may outlast it.
 */
export const playLevelUpCue = (): void => {
  const ctx = ensureLevelUpAudioContext();
  if (!ctx) return;
  void ctx.resume();
  const notes = [659.25, 880.0, 1318.51];
  notes.forEach((frequency, index) => {
    const startAt = ctx.currentTime + index * 0.11;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(frequency, startAt);
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(0.35, startAt + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startAt + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startAt);
    osc.stop(startAt + 0.4);
  });
};
