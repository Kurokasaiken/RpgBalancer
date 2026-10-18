/**
 * stageZonesReducer — PLAN-043 WS-2 (artifact-r005 §B.1): the deterministic
 * state machine behind `useGameStageZones`. Owns occupancy stacks, `openSeq`
 * (assigned INSIDE the reducer so same-tick double-opens produce one
 * deterministic stack), the single global `activeDrag`, hysteresis memory,
 * committed placements and the `{state, revision}` commit protocol — every
 * transition bumps `revision`, and revision-guarded layout effects key their
 * side effects to it (§A.5).
 *
 * Visibility is never stored: whether a panel is expanded/suspended/strip is
 * DERIVED by `solveStageLayout` from occupancy + regime + collapsed.
 */

import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';
import { dropTargetZone, wingCollapseThresholds, type PanelPresentation, type StageOccupant, type StagePanelId, type StageRegime, type StageZoneId } from './solveStageLayout';
import type { StageLayout } from './solveStageLayout';

type StageZonesConfig = (typeof DEFAULT_GAME_FRAME_CONFIG)['stageZones'];

export interface StageZonesState {
  regime: StageRegime;
  /** Monotone commit counter owned by the reducer (§A.5). */
  revision: number;
  /** Allocation order counter — assigned inside the reducer, never by callers. */
  openSeqCounter: number;
  /** All open zone-managed panels per zone, ascending openSeq. */
  occupancy: Record<StageZoneId, StageOccupant[]>;
  pinned: ReadonlySet<StagePanelId>;
  /** Committed drop positions, raw px — never clamped, never overwritten by geometry. */
  placements: Partial<Record<StagePanelId, { x: number; y: number }>>;
  /** F5 cluster drag intent. */
  userCenterX: number | null;
  /** WS-4: vertical half of the cluster drag intent (companion to `userCenterX`). */
  userTopY: number | null;
  /** The single live stage drag; a second pointerdown during it is ignored.
   *  `startRevision` is the revision the DRAG_START itself landed on — a drop
   *  is stale iff any other commit happened during the drag. */
  activeDrag: { panelId: StagePanelId; pointerId: number; startRevision: number } | null;
  /** Wing collapse flags — the hysteresis memory (the contract's `prevCollapsed`). */
  collapsed: { leftWing: boolean; rightWing: boolean };
  viewport: { w: number; h: number };
  /** Session occupants retired at run start — never reappear at run end (BV-06). */
  retiredThisRun: ReadonlySet<StagePanelId>;
  /** Open/expand requests rejected because a run owns the stage (§D.3 — the
   *  page renders the "Available after the quest" toast off this). */
  rejectedAtRevision: { panelId: StagePanelId; revision: number } | null;
  /** Effect hints consumed by the provider's revision-guarded layout effects. */
  pendingEffects: {
    /** Panels whose live pointer capture must be cancelled (pointer + id so
     *  window listeners can match the event). */
    pointerCancel: Array<{ panelId: StagePanelId; pointerId: number }>;
    /** Revision a DRAG_CANCEL/REGIME_CHANGED landed on — drag hooks abort on it. */
    dragAbortedAt: number;
  };
}

export type StageZonesAction =
  | { type: 'OPEN'; panelId: StagePanelId }
  | { type: 'CLOSE'; panelId: StagePanelId }
  | { type: 'PIN'; panelId: StagePanelId }
  | { type: 'UNPIN'; panelId: StagePanelId }
  | { type: 'MINIMIZE'; panelId: StagePanelId }
  | { type: 'EXPAND'; panelId: StagePanelId }
  | { type: 'DROP'; panelId: StagePanelId; pointer: { x: number; y: number }; point: { x: number; y: number }; zones: StageLayout['zones']; nominalZones: StageLayout['nominalZones'] }
  | { type: 'VIEWPORT_CHANGED'; w: number; h: number }
  | { type: 'REGIME_CHANGED'; regime: StageRegime }
  | { type: 'DRAG_START'; panelId: StagePanelId; pointerId: number }
  | { type: 'DRAG_MOVE' }
  | { type: 'DRAG_CANCEL' }
  | { type: 'STAGE_DRAG'; userCenterX: number | null; userTopY: number | null }
  | { type: 'RESET_PLACEMENT'; panelId: StagePanelId }
  | { type: 'REJECTION_CONSUMED' };

const ZONE_IDS: readonly StageZoneId[] = ['leftWing', 'centerStage', 'rightWing'];

/** Initial state — wings derive their collapse flag from the first viewport
 *  so the very first committed state is already coherent (no flash). */
export function initStageZones(config: StageZonesConfig, viewport: { w: number; h: number }, regime: StageRegime): StageZonesState {
  const t = wingCollapseThresholds(config);
  return {
    regime,
    revision: 0,
    openSeqCounter: 0,
    occupancy: { leftWing: [], centerStage: [], rightWing: [] },
    pinned: new Set(),
    placements: {},
    userCenterX: null,
    userTopY: null,
    activeDrag: null,
    collapsed: { leftWing: viewport.w < t.leftWing, rightWing: viewport.w < t.rightWing },
    viewport,
    retiredThisRun: new Set(),
    rejectedAtRevision: null,
    pendingEffects: { pointerCancel: [], dragAbortedAt: -1 },
  };
}

/** Remove a panel from every zone's occupancy list (occupancy is unique —
 *  a panel lives in exactly one zone at a time). */
function removeOccupant(occupancy: StageZonesState['occupancy'], panelId: StagePanelId): StageZonesState['occupancy'] {
  return {
    leftWing: occupancy.leftWing.filter((o) => o.panelId !== panelId),
    centerStage: occupancy.centerStage.filter((o) => o.panelId !== panelId),
    rightWing: occupancy.rightWing.filter((o) => o.panelId !== panelId),
  };
}

function findOccupant(state: StageZonesState, panelId: StagePanelId): StageOccupant | undefined {
  for (const zone of ZONE_IDS) for (const o of state.occupancy[zone]) if (o.panelId === panelId) return o;
  return undefined;
}

/** Strips per zone are capped (§A.3b): the reducer checks capacity for a new
 *  arrival before landing it; the solver enforces the cap at render (the most
 *  recently activated strips keep their slots — LRU demotion). */
function stripCapacityFree(config: StageZonesConfig, state: StageZonesState, zone: StageZoneId): boolean {
  const strips = state.occupancy[zone].filter((o) => o.presentationIntent === 'strip');
  return strips.length < config.strip.maxPerZone;
}

/**
 * "Drag to strip" (§A.3b): a drop whose POINTER lands on the target's strip
 * chrome region collapses the panel there — wings take the outer `wingRailPx`
 * edge of the NOMINAL zone (the rail's projected column, droppable even while
 * no strip paints it); centerStage takes the projected tab row — one
 * `centerTab` rect at zone top aligned to `userCenterX` (envelope center when
 * unset), the same spot the tab will paint. Anywhere else inside the zone the
 * normal expanded/strip landing rules apply.
 */
function pointerOnStripTarget(
  config: StageZonesConfig,
  state: StageZonesState,
  nominalZones: StageLayout['nominalZones'],
  zone: StageZoneId,
  pointer: { x: number; y: number },
): boolean {
  const nom = nominalZones[zone];
  if (pointer.y < nom.y || pointer.y > nom.y + nom.h) return false;
  if (zone === 'leftWing') return pointer.x >= nom.x && pointer.x <= nom.x + config.strip.wingRailPx;
  if (zone === 'rightWing') return pointer.x >= nom.x + nom.w - config.strip.wingRailPx && pointer.x <= nom.x + nom.w;
  const envCenterX = state.userCenterX ?? state.viewport.w / 2;
  const { wPx, hPx } = config.strip.centerTab;
  return pointer.y <= nom.y + hPx && pointer.x >= envCenterX - wPx / 2 && pointer.x <= envCenterX + wPx / 2;
}

/**
 * Drop-admission rules (§D.1): EXPANDED iff the target's expanded set stays
 * legal (single occupant or an authorized pair) AND `panel.minWidth ≤
 * zoneWidth` AND the height solver fits — and the target's expanded top is
 * not pinned (a pinned occupant is never displaced by a drop). Otherwise the
 * panel lands as a STRIP — never rejected; only a full strip rail clamps it
 * back to source.
 */
function dropLanding(
  config: StageZonesConfig,
  state: StageZonesState,
  zones: StageLayout['zones'],
  panelId: StagePanelId,
  targetZone: StageZoneId,
): { presentation: PanelPresentation; allowed: boolean } {
  const panel = config.panels[panelId];
  const target = state.occupancy[targetZone];
  const zoneW = zones[targetZone].w;
  const stageH = zones[targetZone].h;
  const topExpanded = target.filter((o) => o.presentationIntent === 'expanded').sort((a, b) => b.openSeq - a.openSeq)[0];
  const targetPinned = topExpanded ? state.pinned.has(topExpanded.panelId) : false;

  /* Simulated expanded set if this panel lands expanded (it becomes the most
   *  recent expanded intent). */
  const expandedIntents = [...target.filter((o) => o.presentationIntent === 'expanded').map((o) => o.panelId), panelId];
  const legalExpanded =
    expandedIntents.length <= 1 ||
    config.authorizedPairs.some(([a, b]) => expandedIntents.length === 2 && ((expandedIntents[0] === a && expandedIntents[1] === b) || (expandedIntents[0] === b && expandedIntents[1] === a)));
  const widthFits = panel.minWidthPx <= (targetZone === 'centerStage' ? zoneW : Math.max(zoneW, config.zones[targetZone].minPx));
  const heightFits = expandedIntents.length <= 1 || expandedIntents.reduce((sum, id) => sum + config.panels[id].minHeightPx, 0) + config.outer.gutterPx * (expandedIntents.length - 1) <= stageH;

  if (legalExpanded && widthFits && heightFits && !targetPinned && !state.collapsed[targetZone as 'leftWing' | 'rightWing']) {
    return { presentation: 'expanded', allowed: true };
  }
  if (stripCapacityFree(config, state, targetZone)) {
    return { presentation: 'strip', allowed: true };
  }
  return { presentation: 'expanded', allowed: false };
}

/**
 * §A.4/§D.2 run entry, applied to an already-bumped state (the SAME commit):
 * a live drag cancels (pointer capture released via `pointerCancel`, its
 * uncommitted movement discarded) and `runPolicy: 'retire'` occupants leave
 * occupancy — placements/intent are kept, they never reappear at run end
 * (BV-06). `suspend` occupants stay in occupancy; the solver derives their
 * hidden presentation for the run regime.
 */
function enterRunRegime(config: StageZonesConfig, next: StageZonesState): StageZonesState {
  const pointerCancel = [...next.pendingEffects.pointerCancel];
  if (next.activeDrag) pointerCancel.push({ panelId: next.activeDrag.panelId, pointerId: next.activeDrag.pointerId });
  const retiredThisRun = new Set(next.retiredThisRun);
  const occupancy = { ...next.occupancy };
  for (const zone of ZONE_IDS) {
    occupancy[zone] = occupancy[zone].filter((o) => {
      if (config.panels[o.panelId]?.runPolicy === 'retire') {
        retiredThisRun.add(o.panelId);
        return false;
      }
      return true;
    });
  }
  /* WS-4: a fresh run re-centres the cluster — the previous run's drag
   *  intent must not leak into the new theatre (artifact-r003 §4.1.3). */
  return { ...next, regime: 'run', occupancy, activeDrag: null, retiredThisRun, userCenterX: null, userTopY: null, pendingEffects: { pointerCancel, dragAbortedAt: next.revision } };
}

/** §A.4 generic re-entry, same-commit: live drags cancel; the retired set is
 *  cleared (it is per-run bookkeeping, not memory of what to restore). */
function enterGenericRegime(next: StageZonesState): StageZonesState {
  const pointerCancel = [...next.pendingEffects.pointerCancel];
  if (next.activeDrag) pointerCancel.push({ panelId: next.activeDrag.panelId, pointerId: next.activeDrag.pointerId });
  return { ...next, regime: 'generic', activeDrag: null, retiredThisRun: new Set(), pendingEffects: { pointerCancel, dragAbortedAt: next.revision } };
}

/** The atomic transition. Every action bumps `revision` — even a rejected
 *  drop, so stale revision guards see the commit they raced. */
export function stageZonesReducer(config: StageZonesConfig, state: StageZonesState, action: StageZonesAction): StageZonesState {
  const bump = (next: Partial<StageZonesState>): StageZonesState => ({
    ...state,
    ...next,
    revision: state.revision + 1,
  });

  switch (action.type) {
    case 'OPEN': {
      const panel = config.panels[action.panelId];
      if (!panel || panel.overlay) return state;
      /* §D.3: zone-managed opens during `run` are REJECTED, not queued — the
       *  run window itself (`quest`) is the regime's owner and always
       *  admitted. The provider renders the localized toast off
       *  `rejectedAtRevision`. */
      if (state.regime === 'run' && action.panelId !== 'quest') {
        return bump({ rejectedAtRevision: { panelId: action.panelId, revision: state.revision + 1 } });
      }
      const existing = findOccupant(state, action.panelId);
      const seq = state.openSeqCounter + 1;
      /* Re-open of an already-open panel = re-activation: new openSeq, same
       *  zone, expanded intent restored (a strip re-expands on open). */
      const zone = existing ? existingZone(state, action.panelId)! : panel.zone;
      const occupant: StageOccupant = { panelId: action.panelId, presentationIntent: 'expanded', openSeq: seq };
      const occupancy = removeOccupant(state.occupancy, action.panelId);
      occupancy[zone] = [...occupancy[zone], occupant];
      /* `quest` opening flips the regime in the SAME commit — the run cluster
       *  never renders as a generic zone occupant for even one frame (§A.4). */
      const base = bump({ occupancy, openSeqCounter: seq });
      return action.panelId === 'quest' && state.regime !== 'run' ? enterRunRegime(config, base) : base;
    }

    case 'CLOSE': {
      /* Close active and suspended alike — occupancy entry removed; committed
       *  placement intent is kept so a later open restores position (§D.4). */
      if (!findOccupant(state, action.panelId)) return state;
      const base = bump({ occupancy: removeOccupant(state.occupancy, action.panelId) });
      /* Closing the run window returns the stage to `generic` atomically. */
      return action.panelId === 'quest' && state.regime === 'run' ? enterGenericRegime(base) : base;
    }

    case 'PIN':
    case 'UNPIN': {
      if (!findOccupant(state, action.panelId)) return state;
      const pinned = new Set(state.pinned);
      if (action.type === 'PIN') pinned.add(action.panelId);
      else pinned.delete(action.panelId);
      return bump({ pinned });
    }

    case 'MINIMIZE': {
      if (!findOccupant(state, action.panelId)) return state;
      const occupancy = mapOccupant(state.occupancy, action.panelId, (o) => ({ ...o, presentationIntent: 'strip' as const }));
      return bump({ occupancy });
    }

    case 'EXPAND': {
      const occupant = findOccupant(state, action.panelId);
      if (!occupant) return state;
      if (state.regime === 'run') {
        /* Expand-vs-flip race (§D.1): expand dispatched after the regime
         *  commit is rejected with toast, never queued. */
        return bump({ rejectedAtRevision: { panelId: action.panelId, revision: state.revision + 1 } });
      }
      const zone = existingZone(state, action.panelId)!;
      const seq = state.openSeqCounter + 1;
      /* Activate the expander on top, then demote every expanded-intent
       *  occupant that cannot co-expand with it (§D.1: LRU → strip, never a
       *  dead end). The authorized-pair partner keeps expanded intent — the
       *  solver co-expands it; a pinned conflict keeps its intent and the
       *  solver suspends it (pin resists demotion, not the stack). */
      let occupancy = mapOccupant(state.occupancy, action.panelId, (o) => ({ ...o, presentationIntent: 'expanded' as const, openSeq: seq }));
      const conflicts = occupancy[zone]
        .filter((o) => o.panelId !== action.panelId && o.presentationIntent === 'expanded')
        .sort((a, b) => a.openSeq - b.openSeq);
      const partnerKept = { done: false };
      for (const conflict of conflicts) {
        const isPartner =
          zone === 'leftWing' &&
          !partnerKept.done &&
          config.authorizedPairs.some(([a, b]) => (a === action.panelId && b === conflict.panelId) || (b === action.panelId && a === conflict.panelId));
        if (isPartner) {
          partnerKept.done = true;
          continue;
        }
        /* Pin resists drop-displacement, not an explicit expand — every
         *  conflicting expanded intent demotes to strip. */
        occupancy = mapOccupant(occupancy, conflict.panelId, (o) => ({ ...o, presentationIntent: 'strip' as const }));
      }
      return bump({ occupancy, openSeqCounter: seq });
    }

    case 'DROP': {
      /* Stale-drag guard: the drop is valid only if no commit landed between
       *  DRAG_START and now (a viewport change, another open, a regime flip
       *  would make the zone math the drag saw obsolete). Checking the drag's
       *  own start revision — not a caller-supplied snapshot — keeps a quick
       *  down/up inside one React batch from self-rejecting. */
      if (!state.activeDrag || action.panelId !== state.activeDrag.panelId || state.revision !== state.activeDrag.startRevision) {
        return bump({ activeDrag: null });
      }
      const panel = config.panels[action.panelId];
      const occupant = findOccupant(state, action.panelId);
      if (!panel || !occupant || panel.overlay) return bump({ activeDrag: null });
      const sourceZone = existingZone(state, action.panelId)!;
      const targetZone = dropTargetZone(config, action.nominalZones, action.pointer.x);

      /* Drop onto the strip chrome region: collapse to strip — in place when
       *  the rail belongs to the source zone, into the target's rail across
       *  zones. Capacity is the only veto (full rail → clamp-back). */
      if (pointerOnStripTarget(config, state, action.nominalZones, targetZone, action.pointer)) {
        if (!stripCapacityFree(config, state, targetZone)) return bump({ activeDrag: null });
        const occupancy = removeOccupant(state.occupancy, action.panelId);
        const seq = state.openSeqCounter + 1;
        occupancy[targetZone] = [...occupancy[targetZone], { ...occupant, presentationIntent: 'strip', openSeq: seq }];
        return bump({ occupancy, openSeqCounter: seq, placements: { ...state.placements, [action.panelId]: action.point }, activeDrag: null });
      }

      if (targetZone === sourceZone) {
        /* In-zone reposition: commit the raw point as placement intent. */
        return bump({ placements: { ...state.placements, [action.panelId]: action.point }, activeDrag: null });
      }

      /* Cross-zone transfer. A drop NEVER suspends another occupant — strip
       *  landing or clamp-back are the only outcomes besides the transfer.
       *  `action.zones` is the solver's committed snapshot the drag saw. */
      /* Fit is checked against NOMINAL zone bounds (§D.1 rule b: `zoneWidth(vw)`
       *  is the allocation, not the current effective shrink — an empty zone's
       *  effective width is 0 yet still accepts an expanded landing). */
      const landing = dropLanding(config, state, action.nominalZones, action.panelId, targetZone);
      if (!landing.allowed) {
        /* No strip capacity on the target rail — clamp back: the panel keeps
         *  its source zone and its last committed placement (the raw point is
         *  discarded — it was out of legal space). */
        return bump({ activeDrag: null });
      }
      const occupancy = removeOccupant(state.occupancy, action.panelId);
      const seq = state.openSeqCounter + 1;
      occupancy[targetZone] = [...occupancy[targetZone], { ...occupant, presentationIntent: landing.presentation, openSeq: seq }];
      return bump({ occupancy, openSeqCounter: seq, placements: { ...state.placements, [action.panelId]: action.point }, activeDrag: null });
    }

    case 'VIEWPORT_CHANGED': {
      const t = wingCollapseThresholds(config);
      const hyst = config.hysteresisPx;
      /* Hysteresis (§B): collapse when vw < threshold, re-expand at
       *  threshold + hysteresisPx — inside the band the committed flag
       *  holds, so a slow sweep never flaps. */
      const wing = (current: boolean, threshold: number) =>
        action.w < threshold ? true : action.w >= threshold + hyst ? false : current;
      const collapsed = { leftWing: wing(state.collapsed.leftWing, t.leftWing), rightWing: wing(state.collapsed.rightWing, t.rightWing) };
      return bump({ viewport: { w: action.w, h: action.h }, collapsed });
    }

    case 'REGIME_CHANGED': {
      if (action.regime === state.regime) return state;
      const base = bump({ regime: action.regime });
      /* The explicit transition shares the same atomic entry path OPEN/
       *  CLOSE(quest) uses — DRAG_CANCEL + retire/suspend land in one commit. */
      return action.regime === 'run' ? enterRunRegime(config, base) : enterGenericRegime(base);
    }

    case 'DRAG_START': {
      /* Single global drag: a second pointerdown while one is live is ignored. */
      if (state.activeDrag) return state;
      if (!findOccupant(state, action.panelId)) return state;
      return bump({ activeDrag: { panelId: action.panelId, pointerId: action.pointerId, startRevision: state.revision + 1 } });
    }

    case 'DRAG_MOVE':
      /* Movement is committed at DROP; DRAG_MOVE exists for instrumentation
       *  and future constraints — intentionally state-identical. */
      return state;

    case 'DRAG_CANCEL': {
      if (!state.activeDrag) return state;
      return bump({
        activeDrag: null,
        pendingEffects: { pointerCancel: [{ panelId: state.activeDrag.panelId, pointerId: state.activeDrag.pointerId }], dragAbortedAt: state.revision + 1 },
      });
    }

    case 'STAGE_DRAG':
      return bump({ userCenterX: action.userCenterX, userTopY: action.userTopY });

    case 'RESET_PLACEMENT': {
      /* Double-click on the handle: the panel returns to its zone home —
       *  placement intent cleared, not clamped back. */
      if (!(action.panelId in state.placements)) return state;
      const placements = { ...state.placements };
      delete placements[action.panelId];
      return bump({ placements });
    }

    case 'REJECTION_CONSUMED':
      return state.rejectedAtRevision ? bump({ rejectedAtRevision: null }) : state;

    default:
      return state;
  }
}

/** The zone an occupant currently lives in. */
function existingZone(state: StageZonesState, panelId: StagePanelId): StageZoneId | null {
  for (const zone of ZONE_IDS) if (state.occupancy[zone].some((o) => o.panelId === panelId)) return zone;
  return null;
}

function mapOccupant(occupancy: StageZonesState['occupancy'], panelId: StagePanelId, fn: (o: StageOccupant) => StageOccupant): StageZonesState['occupancy'] {
  return {
    leftWing: occupancy.leftWing.map((o) => (o.panelId === panelId ? fn(o) : o)),
    centerStage: occupancy.centerStage.map((o) => (o.panelId === panelId ? fn(o) : o)),
    rightWing: occupancy.rightWing.map((o) => (o.panelId === panelId ? fn(o) : o)),
  };
}


