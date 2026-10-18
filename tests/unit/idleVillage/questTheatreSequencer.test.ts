/**
 * questTheatreSequencer + questTheatreAudio — PLAN-043 WS-4 (artifact-r003).
 *
 * Cue projection: authored `stageDirection.cut` wins over `cinema.cutOn`
 * defaults, `expanded` derives the wide stage, every beat kind maps to a
 * deterministic cue. Audio: the WebAudio singleton schedules each cue once,
 * cleans up sources on `onended` (no orphan oscillators), and the degraded
 * path (no ctor / suspended / resume refused) still returns nominal
 * durations so announcement order is preserved (BV-13).
 */
import { describe, expect, it } from 'vitest';
import {
  audioCueForBeat,
  theatreCueForBeat,
  cueHasTag,
} from '@/ui/idleVillage/questS1Lab/questTheatreSequencer';
import {
  createQuestTheatreAudio,
  THEATRE_CUE_MS,
  type TheatreAudioCue,
} from '@/ui/idleVillage/audio/questTheatreAudio';
import {
  DEFAULT_QUEST_THEATRE_FX,
  QuestTheatreFxSchema,
} from '@/balancing/config/idleVillage/quests/questTheatreFx';
import type { QuestBeat } from '@/ui/idleVillage/questS1Lab/beatSequencer';
import type { QuestNode } from '@/ui/idleVillage/questS1Lab/questScenario';
import type { ResolvedCheck } from '@/ui/idleVillage/questS1Lab/questRun';
import type { HarmEvent } from '@/ui/idleVillage/questS1Lab/questRun';

const FX = DEFAULT_QUEST_THEATRE_FX;
const noNode = () => undefined;

const sceneBeat = (id = 'scene-1'): QuestBeat => ({
  id,
  kind: 'scene',
  nodeId: 'n1',
  title: 'Scena',
  body: 'Corpo.',
  nodeKind: 'choice',
});

const checkBeat = (): QuestBeat => ({
  id: 'chk-1',
  kind: 'check',
  check: {
    id: 'chk-1',
    title: 'Prova',
    verdict: 'win',
    score: 70,
    rollPct: 40,
    harm: 'none',
    woundPct: 0,
    deathPct: 0,
    killed: 0,
    harms: [],
    outcomeText: 'ok',
    next: 'n2',
  } as unknown as ResolvedCheck,
});

const harmBeat = (kind: HarmEvent['kind']): QuestBeat => ({
  id: `harm-${kind}`,
  kind: 'harm',
  harm: { seq: 1, kind, memberId: 'm1', amount: 3 } as HarmEvent,
  memberName: 'Mastro Beppe',
  line: 'ferita',
});

const endBeat = (): QuestBeat => ({
  id: 'end',
  kind: 'end',
  outcome: 'reward',
  text: 'fine',
});

describe('theatreCueForBeat', () => {
  it('returns null for no beat on stage', () => {
    expect(theatreCueForBeat(null, noNode, FX)).toBeNull();
  });

  it('defaults per beat kind from cinema.cutOn', () => {
    const scene = theatreCueForBeat(sceneBeat(), noNode, FX)!;
    expect(scene.tags).toEqual(['reveal', 'push']);
    expect(scene.expanded).toBe(false);
    const check = theatreCueForBeat(checkBeat(), noNode, FX)!;
    expect(check.tags).toEqual(['impact', 'breath', 'j-cut']);
    const harm = theatreCueForBeat(harmBeat('wound'), noNode, FX)!;
    expect(harm.tags).toEqual(['impact']);
    const end = theatreCueForBeat(endBeat(), noNode, FX)!;
    expect(end.tags).toEqual(['bars', 'reveal']);
  });

  it('authored stageDirection.cut overrides the kind default', () => {
    const node = { stageDirection: { cut: ['expanded', 'bars'] } } as unknown as QuestNode;
    const cue = theatreCueForBeat(sceneBeat(), () => node, FX)!;
    expect(cue.tags).toEqual(['expanded', 'bars']);
    expect(cue.expanded).toBe(true);
  });

  it('empty authored cut falls back to defaults', () => {
    const node = { stageDirection: { cut: [] } } as unknown as QuestNode;
    const cue = theatreCueForBeat(sceneBeat(), () => node, FX)!;
    expect(cue.tags).toEqual(['reveal', 'push']);
  });

  it('key is the stable beat id — layers re-fire per beat', () => {
    expect(theatreCueForBeat(sceneBeat('scene-9'), noNode, FX)!.key).toBe('scene-9');
  });

  it('cueHasTag reads one layer', () => {
    const cue = theatreCueForBeat(endBeat(), noNode, FX);
    expect(cueHasTag(cue, 'bars')).toBe(true);
    expect(cueHasTag(cue, 'push')).toBe(false);
  });
});

describe('audioCueForBeat', () => {
  it('maps beats to their lead cue', () => {
    expect(audioCueForBeat(sceneBeat())).toBe('cut_reveal');
    expect(audioCueForBeat(checkBeat())).toBe('tension_riser');
    expect(audioCueForBeat(harmBeat('wound'))).toBe('cut_impact');
    expect(audioCueForBeat(harmBeat('death'))).toBe('verdict_epicfail');
    expect(audioCueForBeat(endBeat())).toBe('cut_bars');
    expect(audioCueForBeat({ id: 'r', kind: 'recap', scenes: 1, checks: 0, deaths: 0, wounds: 0 })).toBeNull();
  });
});

describe('questTheatreFx.cinema config', () => {
  it('ships the ratified tag vocabulary', () => {
    expect(FX.cinema.revealMs).toBe(1400);
    expect(FX.cinema.reducedMotionFadeMs).toBe(150);
    expect(FX.cinema.jCutLeadMs).toBe(450);
    expect(FX.cinema.breath.usesFilter).toBe(true);
  });

  it('schema parses overrides without breaking defaults', () => {
    const fx = QuestTheatreFxSchema.parse({ cinema: { jCutLeadMs: 300, breath: { usesFilter: false } } });
    expect(fx.cinema.jCutLeadMs).toBe(300);
    expect(fx.cinema.breath.usesFilter).toBe(false);
    expect(fx.cinema.cutOn.check).toEqual(['impact', 'breath', 'j-cut']);
  });
});

/* -------------------------------------------------------------- */
/* Audio — BV-13 fallback + BV-08 no-orphans.                        */
/* -------------------------------------------------------------- */

class FakeParam {
  value = 0;
  setValueAtTime = () => undefined;
  linearRampToValueAtTime = () => undefined;
  exponentialRampToValueAtTime = () => undefined;
}

class FakeNode {
  onended: (() => void) | null = null;
  connect<T extends FakeNode>(dest: T): T {
    return dest;
  }
  disconnect() {
    /* noop */
  }
}

class FakeSource extends FakeNode {
  buffer: unknown = null;
  loop = false;
  frequency = new FakeParam();
  gain = new FakeParam();
  Q = new FakeParam();
  type = 'sine';
  start() {
    /* scheduled */
  }
  stop() {
    /* Real WebAudio fires onended asynchronously — defer so `track()` has
     * attached the handler (mirrors the engine's contract). */
    queueMicrotask(() => this.onended?.());
  }
}

class FakeCtx extends FakeNode {
  state = 'running';
  currentTime = 0;
  sampleRate = 44100;
  destination = new FakeNode();
  gain = { value: 0 };
  created: string[] = [];
  createOscillator() {
    this.created.push('osc');
    return new FakeSource();
  }
  createBufferSource() {
    this.created.push('buf');
    return new FakeSource();
  }
  createBiquadFilter() {
    this.created.push('filter');
    return new FakeSource() as unknown as BiquadFilterNode;
  }
  createGain() {
    this.created.push('gain');
    return new FakeSource() as unknown as GainNode;
  }
  createBuffer(_ch: number, len: number, _rate: number) {
    return { getChannelData: () => new Float32Array(len) } as unknown as AudioBuffer;
  }
  resume() {
    return Promise.resolve();
  }
  close() {
    return Promise.resolve();
  }
}

describe('questTheatreAudio', () => {
  it('degrades without an AudioContext ctor, still returning cue durations', () => {
    const audio = createQuestTheatreAudio({ audioContextCtor: undefined });
    expect(audio.degraded()).toBe(true);
    const order: TheatreAudioCue[] = ['cut_reveal', 'tension_riser', 'cut_impact', 'verdict_epicfail', 'cut_bars'];
    const durations = order.map((cue) => audio.play(cue));
    expect(durations).toEqual(order.map((cue) => THEATRE_CUE_MS[cue]));
    expect(audio.activeNodes()).toBe(0);
  });

  it('schedules every cue on the shared context and leaves no orphan nodes', async () => {
    const fake = new FakeCtx();
    const Ctor = function (this: unknown) {
      return fake;
    } as unknown as typeof AudioContext;
    const audio = createQuestTheatreAudio({ audioContextCtor: Ctor });
    expect(audio.degraded()).toBe(false);
    const cues: TheatreAudioCue[] = ['cut_reveal', 'cut_bars', 'cut_j', 'cut_impact', 'verdict_win'];
    cues.forEach((cue) => audio.play(cue));
    /* Each cue schedules ≥1 source; all stop()s fire onended immediately in
     * the fake — the live counter must drain to zero (BV-08). */
    expect(fake.created.length).toBeGreaterThanOrEqual(cues.length);
    await Promise.resolve();
    expect(audio.activeNodes()).toBe(0);
    audio.dispose();
  });

  it('never constructs a second context across plays (singleton contract)', () => {
    let builds = 0;
    const Ctor = class {
      constructor() {
        builds += 1;
        return new FakeCtx() as unknown as AudioContext;
      }
    };
    const audio = createQuestTheatreAudio({ audioContextCtor: Ctor as unknown as new () => AudioContext });
    audio.play('cut_impact');
    audio.play('cut_impact');
    audio.play('cut_reveal');
    expect(builds).toBe(1);
  });
});
