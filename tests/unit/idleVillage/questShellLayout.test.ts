/**
 * PLAN-043 WS-4 — `solveQuestClusterGeometry` unit coverage (artifact-r003
 * §4.1, BV-01..BV-03, BV-11).
 *
 * The solver is the ONE answer for the run cluster's three columns: render,
 * drag clamp and the bounding-box probe all read it, so identical inputs
 * must produce identical output and no two emitted rects may ever overlap.
 */
import { describe, it, expect } from 'vitest';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';
import {
  solveQuestClusterGeometry,
  type QuestClusterIntent,
  type QuestClusterRect,
  type QuestClusterWingState,
} from '@/ui/idleVillage/components/gameFrame/questShellLayout';
import { solveStageLayout } from '@/ui/idleVillage/components/gameFrame/stageZones/solveStageLayout';
import { initStageZones, stageZonesReducer } from '@/ui/idleVillage/components/gameFrame/stageZones/stageZonesReducer';

const cfg = DEFAULT_GAME_FRAME_CONFIG.questWindow.cluster;
const stageCfg = DEFAULT_GAME_FRAME_CONFIG.stageZones;

/** The envelope the run regime actually hands the cluster at this viewport. */
const envelopeAt = (w: number, h: number): QuestClusterRect => {
  let state = initStageZones(stageCfg, { w, h }, 'generic');
  state = stageZonesReducer(stageCfg, state, { type: 'OPEN', panelId: 'quest' });
  expect(state.regime).toBe('run');
  const layout = solveStageLayout(stageCfg, {
    viewport: state.viewport,
    regime: state.regime,
    occupancy: state.occupancy,
    collapsed: state.collapsed,
    intent: { placements: state.placements, userCenterX: state.userCenterX },
  });
  expect(layout.clusterEnvelope).not.toBeNull();
  return layout.clusterEnvelope!;
};

const noIntent: QuestClusterIntent = { userCenterX: null, userTopY: null };
const closed: QuestClusterWingState = { leftOpen: false, rightOpen: false, expanded: false };

const overlapArea = (a: QuestClusterRect | null, b: QuestClusterRect | null): number => {
  if (!a || !b) return 0;
  const x = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const y = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  return x * y;
};

const allRects = (g: ReturnType<typeof solveQuestClusterGeometry>): Array<[string, QuestClusterRect]> =>
  (
    [
      ['window', g.window],
      ['leftWing', g.leftWing],
      ['leftTab', g.leftTab],
      ['rightWing', g.rightWing],
    ] as const
  ).filter((e): e is [string, QuestClusterRect] => e[1] !== null);

const assertNoOverlap = (g: ReturnType<typeof solveQuestClusterGeometry>) => {
  const rects = allRects(g);
  for (let i = 0; i < rects.length; i += 1) {
    for (let j = i + 1; j < rects.length; j += 1) {
      expect(overlapArea(rects[i][1], rects[j][1]), `${rects[i][0]} ∩ ${rects[j][0]}`).toBe(0);
    }
  }
};

describe('solveQuestClusterGeometry — ratified width curve', () => {
  it('C = clamp(760, 50vw, 1040) at every contracted viewport', () => {
    const cases: Array<[number, number, number]> = [
      [1280, 720, 760],
      [1440, 900, 760],
      [1920, 1080, 960],
      [2560, 1440, 1040],
    ];
    for (const [w, h, want] of cases) {
      const g = solveQuestClusterGeometry({ w, h }, envelopeAt(w, h), noIntent, closed, cfg);
      expect(g.windowWidth, `vw=${w}`).toBe(want);
      expect(g.window.w).toBe(want);
    }
  });
});

describe('solveQuestClusterGeometry — zero overlap (BV-01 geometry)', () => {
  const viewports: Array<[number, number]> = [
    [1280, 720],
    [1280, 800],
    [1440, 900],
    [1920, 1080],
    [2560, 1440],
  ];
  const wingStates: QuestClusterWingState[] = [
    closed,
    { leftOpen: true, rightOpen: false, expanded: false },
    { leftOpen: false, rightOpen: true, expanded: false },
    { leftOpen: true, rightOpen: true, expanded: false },
    { leftOpen: true, rightOpen: false, expanded: true },
    { leftOpen: false, rightOpen: true, expanded: true },
    { leftOpen: true, rightOpen: true, expanded: true },
  ];
  const intents: QuestClusterIntent[] = [
    noIntent,
    { userCenterX: 200, userTopY: null }, // dragged hard left
    { userCenterX: 4000, userTopY: null }, // dragged hard right
    { userCenterX: 640, userTopY: 500 }, // dragged low
  ];
  for (const [w, h] of viewports) {
    for (const wings of wingStates) {
      for (const intent of intents) {
        it(`${w}×${h} wings=${JSON.stringify(wings)} intent=${JSON.stringify(intent)}`, () => {
          const env = envelopeAt(w, h);
          const g = solveQuestClusterGeometry({ w, h }, env, intent, wings, cfg);
          assertNoOverlap(g);
          /* Every emitted rect stays inside the viewport margins. */
          for (const [name, r] of allRects(g)) {
            expect(r.x, name).toBeGreaterThanOrEqual(cfg.marginPx - 0.5);
            expect(r.x + r.w, name).toBeLessThanOrEqual(w - cfg.marginPx + 0.5);
          }
        });
      }
    }
  }
});

describe('solveQuestClusterGeometry — 1280p mutual exclusion (BV-03)', () => {
  it('at 1280 a live check folds the requested left wing to its tab', () => {
    const g = solveQuestClusterGeometry(
      { w: 1280, h: 720 },
      envelopeAt(1280, 720),
      noIntent,
      { leftOpen: true, rightOpen: true, expanded: false },
      cfg,
    );
    expect(g.leftWing).toBeNull();
    expect(g.leftFolded).toBe(true);
    expect(g.leftTab).not.toBeNull();
    expect(g.rightWing).not.toBeNull();
    assertNoOverlap(g);
  });

  it('at ≥1440 both wings coexist', () => {
    const g = solveQuestClusterGeometry(
      { w: 1440, h: 900 },
      envelopeAt(1440, 900),
      noIntent,
      { leftOpen: true, rightOpen: true, expanded: false },
      cfg,
    );
    expect(g.leftWing).not.toBeNull();
    expect(g.rightWing).not.toBeNull();
    expect(g.leftFolded).toBe(false);
    assertNoOverlap(g);
  });

  it('closing the check restores the left wing in the same solve', () => {
    const env = envelopeAt(1280, 720);
    const g = solveQuestClusterGeometry({ w: 1280, h: 720 }, env, noIntent, { leftOpen: true, rightOpen: false, expanded: false }, cfg);
    expect(g.leftWing).not.toBeNull();
    expect(g.leftFolded).toBe(false);
    expect(g.leftTab).toBeNull();
    assertNoOverlap(g);
  });
});

describe('solveQuestClusterGeometry — drag reconciliation (BV-02)', () => {
  it('shiftX is purely derived: closing the wing restores windowLeft exactly', () => {
    const env = envelopeAt(1280, 720);
    /* User drags toward the right edge — the committed center is what the
     * drag clamp allows (window center, not the union's). */
    const intent: QuestClusterIntent = { userCenterX: 1100, userTopY: null };
    const before = solveQuestClusterGeometry({ w: 1280, h: 720 }, env, intent, { leftOpen: false, rightOpen: false, expanded: false }, cfg);
    const open = solveQuestClusterGeometry({ w: 1280, h: 720 }, env, intent, { leftOpen: false, rightOpen: true, expanded: false }, cfg);
    const after = solveQuestClusterGeometry({ w: 1280, h: 720 }, env, intent, { leftOpen: false, rightOpen: false, expanded: false }, cfg);
    /* The wing pulled the group inside the margins… */
    expect(open.shiftX).not.toBe(0);
    /* …and closing it re-derives the same position — zero drift. */
    expect(after.window.x).toBe(before.window.x);
    expect(after.window.y).toBe(before.window.y);
    expect(after.shiftX).toBe(before.shiftX);
  });

  it('centred intent puts window center at the envelope center', () => {
    const env = envelopeAt(1280, 720);
    const g = solveQuestClusterGeometry({ w: 1280, h: 720 }, env, noIntent, closed, cfg);
    expect(g.window.x + g.window.w / 2).toBeCloseTo(env.x + env.w / 2, 5);
  });
});

describe('solveQuestClusterGeometry — expanded stage (BV-11)', () => {
  it('expanded widens to min(1180, env − 2m) and folds the left wing', () => {
    const env = envelopeAt(1280, 720);
    const g = solveQuestClusterGeometry({ w: 1280, h: 720 }, env, noIntent, { leftOpen: true, rightOpen: false, expanded: true }, cfg);
    expect(g.expandedEffective).toBe(true);
    expect(g.windowWidth).toBe(Math.min(cfg.expandedWidthPx, env.w - 2 * cfg.marginPx));
    expect(g.leftWing).toBeNull();
    expect(g.leftFolded).toBe(true);
    assertNoOverlap(g);
  });

  it('a live check suppresses expanded — nominal C before the column slides in', () => {
    const env = envelopeAt(1280, 720);
    const g = solveQuestClusterGeometry({ w: 1280, h: 720 }, env, noIntent, { leftOpen: true, rightOpen: true, expanded: true }, cfg);
    expect(g.expandedEffective).toBe(false);
    expect(g.windowWidth).toBe(760);
    expect(g.rightWing).not.toBeNull();
    assertNoOverlap(g);
  });
});

describe('solveQuestClusterGeometry — purity', () => {
  it('identical inputs produce an identical geometry object', () => {
    const env = envelopeAt(1440, 900);
    const intent: QuestClusterIntent = { userCenterX: 700, userTopY: 140 };
    const wings: QuestClusterWingState = { leftOpen: true, rightOpen: true, expanded: false };
    expect(solveQuestClusterGeometry({ w: 1440, h: 900 }, env, intent, wings, cfg)).toEqual(
      solveQuestClusterGeometry({ w: 1440, h: 900 }, env, intent, wings, cfg),
    );
  });
});
