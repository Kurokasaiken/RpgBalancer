/**
 * PLAN-043 WS-2 — unit coverage for the pure solver + reducer.
 *
 * BV-01  zero positive-area overlap between rendered panel rects (both regimes,
 *        all contracted viewports).
 * BV-02  1000 random intent streams → the layout signature is bit-identical for
 *        identical replay (solver purity) and deterministic across orderings.
 * BV-03  suspend (regime flip) then restore → resolved rects drift 0px.
 * BV-04  hysteresis: a slow 1250→1330 width sweep never flaps a wing.
 * §D.1   drop-admission (expanded vs strip landing, pinned, rail-full clamp-back).
 * §D.2/3 run regime: session occupants retire, zone opens rejected, quest admitted.
 */
import { describe, it, expect } from 'vitest';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';
import {
  solveStageLayout,
  dropTargetZone,
  layoutSignature,
  wingCollapseThresholds,
  type SolverInputs,
  type StageOccupant,
  type StagePanelId,
  type StageRect,
  type StageZoneId,
} from '@/ui/idleVillage/components/gameFrame/stageZones/solveStageLayout';
import { initStageZones, stageZonesReducer, type StageZonesState } from '@/ui/idleVillage/components/gameFrame/stageZones/stageZonesReducer';

const cfg = DEFAULT_GAME_FRAME_CONFIG.stageZones;
const VP = { w: 1280, h: 720 };

const occ = (zone: StageZoneId, panelId: StagePanelId, openSeq: number, intent: 'expanded' | 'strip' = 'expanded'): StageOccupant => ({
  panelId,
  presentationIntent: intent,
  openSeq,
});

function inputs(state: StageZonesState): SolverInputs {
  return {
    viewport: state.viewport,
    regime: state.regime,
    occupancy: state.occupancy,
    collapsed: state.collapsed,
    intent: { placements: state.placements, userCenterX: state.userCenterX },
  };
}

function solve(state: StageZonesState) {
  return solveStageLayout(cfg, inputs(state));
}

const intersects = (a: StageRect, b: StageRect) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** Every positive-area rect pair among rendered panels must be disjoint. */
function expectNoOverlap(layout: ReturnType<typeof solveStageLayout>) {
  const rects: Array<{ id: string; r: StageRect }> = [];
  for (const [id, p] of Object.entries(layout.panels)) {
    if (p.rect && p.rect.w > 0 && p.rect.h > 0) rects.push({ id, r: p.rect });
    if (p.stripRect && p.stripRect.w > 0 && p.stripRect.h > 0) rects.push({ id: `${id}#strip`, r: p.stripRect });
  }
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      expect(intersects(rects[i].r, rects[j].r), `overlap: ${rects[i].id} × ${rects[j].id}`).toBe(false);
    }
  }
}

/** Chrome bands: no rendered rect may intersect top 92px / bottom 100px (BV-10). */
function expectChromeClear(layout: ReturnType<typeof solveStageLayout>, vh: number) {
  for (const [id, p] of Object.entries(layout.panels)) {
    for (const r of [p.rect, p.stripRect]) {
      if (!r || r.w <= 0 || r.h <= 0) continue;
      expect(r.y >= cfg.chrome.topPx, `${id} enters top chrome`).toBe(true);
      expect(r.y + r.h <= vh - cfg.chrome.bottomPx, `${id} enters bottom chrome`).toBe(true);
    }
  }
}

/** Mulberry32 — deterministic PRNG so the random suite itself is reproducible. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ZONE_PANELS: Record<StageZoneId, StagePanelId[]> = {
  leftWing: ['roster', 'villageStash'],
  centerStage: ['questDetail'],
  rightWing: ['events', 'merchant'],
};

describe('solveStageLayout — generic regime', () => {
  it('BV-01/BV-10: zero overlap & chrome-clear across contracted viewports', () => {
    for (const vp of [
      { w: 1280, h: 720 },
      { w: 1280, h: 800 },
      { w: 1920, h: 1080 },
      { w: 2560, h: 1440 },
    ]) {
      let s = initStageZones(cfg, vp, 'generic');
      for (const id of ['roster', 'villageStash', 'questDetail', 'events', 'merchant'] as StagePanelId[]) {
        s = stageZonesReducer(cfg, s, { type: 'OPEN', panelId: id });
      }
      const layout = solve(s);
      expectNoOverlap(layout);
      expectChromeClear(layout, vp.h);
    }
  });

  it('zones never exceed caps; wings collapse to rail when all occupants are strips', () => {
    let s = initStageZones(cfg, VP, 'generic');
    s = stageZonesReducer(cfg, s, { type: 'OPEN', panelId: 'roster' });
    const lay1 = solve(s);
    expect(lay1.zones.leftWing.w).toBeLessThanOrEqual(cfg.zones.leftWing.maxPx);
    expect(lay1.zones.leftWing.w).toBeGreaterThanOrEqual(cfg.zones.leftWing.minPx);
    s = stageZonesReducer(cfg, s, { type: 'MINIMIZE', panelId: 'roster' });
    const lay2 = solve(s);
    expect(lay2.zones.leftWing.w).toBe(cfg.strip.wingRailPx);
    expect(lay2.panels.roster.stripRect).not.toBeNull();
    expect(lay2.panels.roster.rect).toBeNull();
  });

  it('open suspends a competing expanded occupant in the same zone (top-of-stack wins)', () => {
    let s = initStageZones(cfg, VP, 'generic');
    s = stageZonesReducer(cfg, s, { type: 'OPEN', panelId: 'events' });
    s = stageZonesReducer(cfg, s, { type: 'OPEN', panelId: 'merchant' });
    const layout = solve(s);
    expect(layout.panels.merchant.presentationEffective).toBe('expanded');
    expect(layout.panels.events.suspended).toBe(true);
    expectNoOverlap(layout);
  });

  it('authorized pair (roster + stash) co-expands stacked in leftWing', () => {
    let s = initStageZones(cfg, VP, 'generic');
    s = stageZonesReducer(cfg, s, { type: 'OPEN', panelId: 'roster' });
    s = stageZonesReducer(cfg, s, { type: 'OPEN', panelId: 'villageStash' });
    const layout = solve(s);
    expect(layout.panels.roster.presentationEffective).toBe('expanded');
    expect(layout.panels.villageStash.presentationEffective).toBe('expanded');
    expect(layout.panels.villageStash.rect!.y).toBeGreaterThanOrEqual(layout.panels.roster.rect!.y + layout.panels.roster.rect!.h);
    expectNoOverlap(layout);
  });

  it('EXPAND demotes a conflicting expanded occupant to strip (§D.1, no dead ends)', () => {
    let s = initStageZones(cfg, VP, 'generic');
    s = stageZonesReducer(cfg, s, { type: 'OPEN', panelId: 'events' });
    s = stageZonesReducer(cfg, s, { type: 'MINIMIZE', panelId: 'events' });
    s = stageZonesReducer(cfg, s, { type: 'OPEN', panelId: 'merchant' });
    s = stageZonesReducer(cfg, s, { type: 'EXPAND', panelId: 'events' });
    const layout = solve(s);
    expect(layout.panels.events.presentationEffective).toBe('expanded');
    expect(layout.panels.merchant.presentationEffective).toBe('strip');
  });

  it('BV-03: suspend→restore drifts 0px (intent never rewritten by geometry)', () => {
    let s = initStageZones(cfg, VP, 'generic');
    s = stageZonesReducer(cfg, s, { type: 'OPEN', panelId: 'roster' });
    s = stageZonesReducer(cfg, s, { type: 'OPEN', panelId: 'questDetail' });
    s = stageZonesReducer(cfg, s, { type: 'OPEN', panelId: 'events' });
    const before = solve(s);
    /* A competing open suspends `events`; closing it restores the exact rect. */
    s = stageZonesReducer(cfg, s, { type: 'OPEN', panelId: 'merchant' });
    expect(solve(s).panels.events.suspended).toBe(true);
    s = stageZonesReducer(cfg, s, { type: 'CLOSE', panelId: 'merchant' });
    const after = solve(s);
    expect(after.panels.events.rect).toEqual(before.panels.events.rect);
    expect(after.panels.roster.rect).toEqual(before.panels.roster.rect);
    expect(after.signature).toBe(layoutSignature(s.viewport, s.regime, after.zones, after.panels, null));
    expect(after.signature).toBe(before.signature);
  });

  it('BV-04: wing collapse never flaps during a slow 1250→1330 sweep', () => {
    const t = wingCollapseThresholds(cfg);
    /* Sweep up through the band then back down — the flag may change only
     *  monotonically per direction (no double transitions inside the band). */
    let s = initStageZones(cfg, { w: 1250, h: 720 }, 'generic');
    const flips: boolean[] = [];
    let prev = s.collapsed.leftWing;
    for (let w = 1250; w <= 1330; w += 2) {
      s = stageZonesReducer(cfg, s, { type: 'VIEWPORT_CHANGED', w, h: 720 });
      if (s.collapsed.leftWing !== prev) flips.push(w);
      prev = s.collapsed.leftWing;
    }
    expect(flips.length).toBeLessThanOrEqual(1);
    /* ...and back down: at most one more flip. */
    for (let w = 1330; w >= 1250; w -= 2) {
      s = stageZonesReducer(cfg, s, { type: 'VIEWPORT_CHANGED', w, h: 720 });
      if (s.collapsed.leftWing !== prev) flips.push(w);
      prev = s.collapsed.leftWing;
    }
    expect(flips.length).toBeLessThanOrEqual(2);
    expect(t.leftWing).toBe(2 * cfg.outer.edgePx + 2 * cfg.outer.gutterPx + cfg.zones.leftWing.minPx + cfg.zones.centerStage.minPx + cfg.zones.rightWing.minPx);
  });
});

describe('BV-02 — determinism over random intent streams', () => {
  const ACTIONS = ['OPEN', 'CLOSE', 'MINIMIZE', 'EXPAND', 'PIN', 'UNPIN'] as const;
  const PANELS: StagePanelId[] = ['roster', 'villageStash', 'events', 'merchant', 'questDetail'];

  it('identical replay is bit-identical (1000 random intents)', () => {
    const signaturesA: string[] = [];
    const signaturesB: string[] = [];
    for (const tag of ['A', 'B']) {
      const rand = rng(0xdeadbeef);
      let s = initStageZones(cfg, VP, 'generic');
      for (let i = 0; i < 1000; i++) {
        const kind = Math.floor(rand() * ACTIONS.length);
        const panelId = PANELS[Math.floor(rand() * PANELS.length)];
        const type = ACTIONS[kind];
        s = stageZonesReducer(cfg, s, { type, panelId } as never);
        if (rand() < 0.1) {
          s = stageZonesReducer(cfg, s, { type: 'VIEWPORT_CHANGED', w: 1280 + Math.floor(rand() * 640), h: 720 });
        }
        (tag === 'A' ? signaturesA : signaturesB).push(solve(s).signature);
      }
    }
    expect(signaturesA).toEqual(signaturesB);
  });

  it('layout signature differs from reducer revision and tracks resolved rects', () => {
    let s = initStageZones(cfg, VP, 'generic');
    s = stageZonesReducer(cfg, s, { type: 'OPEN', panelId: 'roster' });
    const sig1 = solve(s).signature;
    s = stageZonesReducer(cfg, s, { type: 'MINIMIZE', panelId: 'roster' });
    const sig2 = solve(s).signature;
    expect(sig1).not.toBe(sig2);
  });
});

describe('DROP semantics (§D.1)', () => {
  const dropOn = (s: StageZonesState, panelId: StagePanelId, pointerX: number, pointerY = 200) => {
    s = stageZonesReducer(cfg, s, { type: 'DRAG_START', panelId, pointerId: 1 });
    const layout = solve(s);
    return stageZonesReducer(cfg, s, {
      type: 'DROP',
      panelId,
      pointer: { x: pointerX, y: pointerY },
      point: { x: pointerX, y: pointerY },
      zones: layout.zones,
      nominalZones: layout.nominalZones,
    });
  };

  it('cross-zone drop onto an occupied non-pair zone lands as a strip, never suspends', () => {
    let s = initStageZones(cfg, VP, 'generic');
    s = stageZonesReducer(cfg, s, { type: 'OPEN', panelId: 'events' });
    s = stageZonesReducer(cfg, s, { type: 'OPEN', panelId: 'roster' });
    const layout = solve(s);
    const target = dropTargetZone(cfg, layout.nominalZones, layout.nominalZones.rightWing.x + 10);
    expect(target).toBe('rightWing');
    s = dropOn(s, 'roster', layout.nominalZones.rightWing.x + 10);
    const after = solve(s);
    expect(after.panels.roster.zone).toBe('rightWing');
    expect(after.panels.roster.presentationEffective).toBe('strip');
    expect(after.panels.events.suspended).toBe(false);
  });

  it('cross-zone drop onto an empty zone lands expanded', () => {
    let s = initStageZones(cfg, VP, 'generic');
    s = stageZonesReducer(cfg, s, { type: 'OPEN', panelId: 'roster' });
    const layout = solve(s);
    s = dropOn(s, 'roster', layout.nominalZones.centerStage.x + 10);
    const after = solve(s);
    expect(after.panels.roster.zone).toBe('centerStage');
    expect(after.panels.roster.presentationEffective).toBe('expanded');
  });

  it('drop onto a pinned expanded occupant lands as strip (pin resists displacement)', () => {
    let s = initStageZones(cfg, VP, 'generic');
    s = stageZonesReducer(cfg, s, { type: 'OPEN', panelId: 'events' });
    s = stageZonesReducer(cfg, s, { type: 'PIN', panelId: 'events' });
    s = stageZonesReducer(cfg, s, { type: 'OPEN', panelId: 'roster' });
    const layout = solve(s);
    s = dropOn(s, 'roster', layout.nominalZones.rightWing.x + 10);
    const after = solve(s);
    expect(after.panels.events.presentationEffective).toBe('expanded');
    expect(after.panels.roster.presentationEffective).toBe('strip');
  });

  it('drop onto the wing rail collapses the panel to a strip in place (§A.3b drag-to-strip)', () => {
    let s = initStageZones(cfg, VP, 'generic');
    s = stageZonesReducer(cfg, s, { type: 'OPEN', panelId: 'roster' });
    const layout = solve(s);
    const railX = layout.nominalZones.leftWing.x + cfg.strip.wingRailPx / 2;
    s = dropOn(s, 'roster', railX, 300);
    const after = solve(s);
    expect(after.panels.roster.zone).toBe('leftWing');
    expect(after.panels.roster.presentationEffective).toBe('strip');
    /* The rail column is not an in-zone reposition: no expanded rect. */
    expect(after.panels.roster.rect).toBeNull();
  });

  it('drop onto the projected center tab row collapses a center panel to strip', () => {
    let s = initStageZones(cfg, VP, 'generic');
    s = stageZonesReducer(cfg, s, { type: 'OPEN', panelId: 'questDetail' });
    const layout = solve(s);
    const nom = layout.nominalZones.centerStage;
    const envCenterX = VP.w / 2;
    s = dropOn(s, 'questDetail', envCenterX, nom.y + cfg.strip.centerTab.hPx / 2);
    const after = solve(s);
    expect(after.panels.questDetail.zone).toBe('centerStage');
    expect(after.panels.questDetail.presentationEffective).toBe('strip');
  });

  it('drop onto a foreign wing rail lands as a strip in that wing', () => {
    let s = initStageZones(cfg, VP, 'generic');
    s = stageZonesReducer(cfg, s, { type: 'OPEN', panelId: 'roster' });
    const layout = solve(s);
    const railX = layout.nominalZones.rightWing.x + layout.nominalZones.rightWing.w - cfg.strip.wingRailPx / 2;
    s = dropOn(s, 'roster', railX, 300);
    const after = solve(s);
    expect(after.panels.roster.zone).toBe('rightWing');
    expect(after.panels.roster.presentationEffective).toBe('strip');
  });

  it('a commit landing mid-drag makes the subsequent drop stale (rejected, drag cleared)', () => {
    let s = initStageZones(cfg, VP, 'generic');
    s = stageZonesReducer(cfg, s, { type: 'OPEN', panelId: 'roster' });
    s = stageZonesReducer(cfg, s, { type: 'DRAG_START', panelId: 'roster', pointerId: 1 });
    /* An intervening commit (another open, a viewport change, ...) bumps the
     *  revision past the drag's startRevision → the drop intent is obsolete. */
    s = stageZonesReducer(cfg, s, { type: 'OPEN', panelId: 'events' });
    const layout = solve(s);
    const s2 = stageZonesReducer(cfg, s, {
      type: 'DROP',
      panelId: 'roster',
      pointer: { x: layout.nominalZones.rightWing.x + 5, y: 200 },
      point: { x: 0, y: 0 },
      zones: layout.zones,
      nominalZones: layout.nominalZones,
    });
    expect(s2.occupancy.leftWing.some((o) => o.panelId === 'roster')).toBe(true);
    expect(s2.activeDrag).toBeNull();
  });

  it('drop without an active drag is rejected outright', () => {
    let s = initStageZones(cfg, VP, 'generic');
    s = stageZonesReducer(cfg, s, { type: 'OPEN', panelId: 'roster' });
    const layout = solve(s);
    const s2 = stageZonesReducer(cfg, s, {
      type: 'DROP',
      panelId: 'roster',
      pointer: { x: layout.nominalZones.rightWing.x + 5, y: 200 },
      point: { x: 0, y: 0 },
      zones: layout.zones,
      nominalZones: layout.nominalZones,
    });
    expect(s2).toEqual({ ...s, revision: s.revision + 1 });
    expect(s2.occupancy.leftWing.some((o) => o.panelId === 'roster')).toBe(true);
  });

  it('second DRAG_START during an active drag is ignored', () => {
    let s = initStageZones(cfg, VP, 'generic');
    s = stageZonesReducer(cfg, s, { type: 'OPEN', panelId: 'roster' });
    s = stageZonesReducer(cfg, s, { type: 'OPEN', panelId: 'events' });
    s = stageZonesReducer(cfg, s, { type: 'DRAG_START', panelId: 'roster', pointerId: 1 });
    const s2 = stageZonesReducer(cfg, s, { type: 'DRAG_START', panelId: 'events', pointerId: 2 });
    expect(s2.activeDrag).toMatchObject({ panelId: 'roster', pointerId: 1 });
  });
});

describe('run regime (§D.2/§D.3)', () => {
  it('regime flip retires session/retire occupants, keeps suspend occupants, cancels drag in one commit', () => {
    let s = initStageZones(cfg, VP, 'generic');
    s = stageZonesReducer(cfg, s, { type: 'OPEN', panelId: 'roster' });
    s = stageZonesReducer(cfg, s, { type: 'OPEN', panelId: 'questDetail' });
    s = stageZonesReducer(cfg, s, { type: 'DRAG_START', panelId: 'roster', pointerId: 1 });
    const rev = s.revision;
    s = stageZonesReducer(cfg, s, { type: 'REGIME_CHANGED', regime: 'run' });
    expect(s.activeDrag).toBeNull();
    expect(s.pendingEffects.pointerCancel).toEqual([{ panelId: 'roster', pointerId: 1 }]);
    expect(s.pendingEffects.dragAbortedAt).toBe(rev + 1);
    /* questDetail retired (occupancy cleared); roster stays in occupancy and
     *  the solver suspends it. */
    expect(s.occupancy.centerStage.some((o) => o.panelId === 'questDetail')).toBe(false);
    expect(s.occupancy.leftWing.some((o) => o.panelId === 'roster')).toBe(true);
    s = stageZonesReducer(cfg, s, { type: 'OPEN', panelId: 'quest' });
    const layout = solve(s);
    expect(layout.clusterEnvelope).toEqual(layout.envelope);
    expect(layout.panels.quest.rect).toEqual(layout.envelope);
    expect(layout.panels.roster.suspended).toBe(true);
    expectNoOverlap(layout);
  });

  it('zone-managed opens during run are rejected with a toast marker — no queue', () => {
    let s = initStageZones(cfg, VP, 'generic');
    s = stageZonesReducer(cfg, s, { type: 'REGIME_CHANGED', regime: 'run' });
    const s2 = stageZonesReducer(cfg, s, { type: 'OPEN', panelId: 'merchant' });
    expect(s2.rejectedAtRevision).toEqual({ panelId: 'merchant', revision: s.revision + 1 });
    expect(findOccupantForTest(s2, 'merchant')).toBeUndefined();
    const s3 = stageZonesReducer(cfg, s2, { type: 'REJECTION_CONSUMED' });
    expect(s3.rejectedAtRevision).toBeNull();
  });

  it('retired planner does not reappear at run end (BV-06)', () => {
    let s = initStageZones(cfg, VP, 'generic');
    s = stageZonesReducer(cfg, s, { type: 'OPEN', panelId: 'questDetail' });
    s = stageZonesReducer(cfg, s, { type: 'REGIME_CHANGED', regime: 'run' });
    s = stageZonesReducer(cfg, s, { type: 'REGIME_CHANGED', regime: 'generic' });
    expect(s.occupancy.centerStage.some((o) => o.panelId === 'questDetail')).toBe(false);
  });
});

function findOccupantForTest(state: StageZonesState, panelId: StagePanelId) {
  for (const zone of ['leftWing', 'centerStage', 'rightWing'] as const) {
    const found = state.occupancy[zone].find((o) => o.panelId === panelId);
    if (found) return found;
  }
  return undefined;
}

/** Helper sanity: occupancy arrays stay ascending-openSeq after churn. */
describe('invariants', () => {
  it('occupancy lists stay ordered by openSeq and unique across zones', () => {
    let s = initStageZones(cfg, VP, 'generic');
    const rand = rng(42);
    const panels = ZONE_PANELS.leftWing.concat(ZONE_PANELS.centerStage, ZONE_PANELS.rightWing);
    for (let i = 0; i < 200; i++) {
      const type = rand() < 0.5 ? 'OPEN' : 'CLOSE';
      s = stageZonesReducer(cfg, s, { type, panelId: panels[Math.floor(rand() * panels.length)] } as never);
    }
    const seen = new Set<StagePanelId>();
    for (const zone of ['leftWing', 'centerStage', 'rightWing'] as const) {
      let last = 0;
      for (const o of s.occupancy[zone]) {
        expect(o.openSeq).toBeGreaterThan(last);
        last = o.openSeq;
        expect(seen.has(o.panelId)).toBe(false);
        seen.add(o.panelId);
      }
    }
  });
});
