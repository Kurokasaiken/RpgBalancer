/**
 * solveStageLayout — PLAN-043 WS-2 (ratified artifact-r005): the pure solver
 * behind the three-zone stage. Render positions, the drag clamp and the BV
 * probes all consume this one answer, so the same inputs must always produce
 * the same layout (bit-identical — no DOM reads, no clocks, no Math.random).
 *
 * Zones are logical allocation regions between the fixed chrome bands:
 * `leftWing` (roster/stash — the authorized vertical stack), `centerStage`
 * (planner, or the whole-stage quest cluster in `run` regime), `rightWing`
 * (ledger/merchant). A wing is collapsed to its 32px strip rail when the
 * viewport is under budget or every occupant is a strip; an empty zone takes
 * no width at all. Suspended occupants stay mounted but get no rect.
 *
 * Stored user intent (`placements`, `userCenterX`, `presentationIntent`) is
 * never rewritten by derived geometry: the solver clamps a copy.
 */

import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';

type StageZonesConfig = (typeof DEFAULT_GAME_FRAME_CONFIG)['stageZones'];
type StageZonesPanels = StageZonesConfig['panels'];

export type StageZoneId = 'leftWing' | 'centerStage' | 'rightWing';
export type StageRegime = 'generic' | 'run';
export type PanelPresentation = 'expanded' | 'strip';
/** Zone-managed + overlay panel ids — keys of `stageZones.panels`. */
export type StagePanelId = keyof StageZonesPanels & string;

export interface StageRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** One zone occupancy entry (ordered by `openSeq` inside the zone list). */
export interface StageOccupant {
  panelId: StagePanelId;
  /** User choice — never overwritten by the solver. */
  presentationIntent: PanelPresentation;
  /** Reducer-assigned activation order (higher = more recent). */
  openSeq: number;
}

export interface StageIntent {
  /** Per-panel committed drop position (raw px, never clamped at rest). */
  placements: Partial<Record<StagePanelId, { x: number; y: number } | null>>;
  /** F5 cluster drag intent — the run-cluster's user-chosen center x. */
  userCenterX: number | null;
}

export interface SolverInputs {
  viewport: { w: number; h: number };
  regime: StageRegime;
  /** Ordered occupancy stacks per zone (all open panels, incl. suspended). */
  occupancy: Record<StageZoneId, readonly StageOccupant[]>;
  /** Wing collapse flags — reducer-owned input (hysteresis lives there). */
  collapsed: { leftWing: boolean; rightWing: boolean };
  intent: StageIntent;
}

export interface PanelResolution {
  /** Expanded rect — `null` unless the panel renders expanded. */
  rect: StageRect | null;
  /** Strip chrome rect — `null` unless the panel renders as a strip. */
  stripRect: StageRect | null;
  /** What the panel actually paints as; `null` when suspended/closed. */
  presentationEffective: PanelPresentation | null;
  /** Mounted but hidden: inert, aria-hidden, unregistered from the stack. */
  suspended: boolean;
  zone: StageZoneId;
}

export interface StageLayout {
  /** Effective allocation rects (collapsed/all-strip wings shrink to the rail). */
  zones: Record<StageZoneId, StageRect>;
  /** Uncollapsed allocation rects — drop hit-testing uses these (§A.3b). */
  nominalZones: Record<StageZoneId, StageRect>;
  /** The whole stage region between the chrome bands. */
  envelope: StageRect;
  panels: Record<StagePanelId, PanelResolution>;
  /** Run regime: the F5 cluster's allocation (the whole stage). */
  clusterEnvelope: StageRect | null;
  /** Deterministic signature of the resolved rect set (diagnostics/probes). */
  signature: string;
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(v, max));

const ZONE_IDS: readonly StageZoneId[] = ['leftWing', 'centerStage', 'rightWing'];

/** Wing collapse thresholds derived from the declared floors: the left wing
 *  yields first once the viewport cannot fund `left.min + center.min +
 *  right.min + overhead`; the right wing follows once the viewport cannot
 *  fund `rail + center.min + right.min + overhead`. */
export function wingCollapseThresholds(config: StageZonesConfig): { leftWing: number; rightWing: number } {
  const overhead = 2 * config.outer.edgePx + 2 * config.outer.gutterPx;
  return {
    leftWing: overhead + config.zones.leftWing.minPx + config.zones.centerStage.minPx + config.zones.rightWing.minPx,
    rightWing: overhead + config.strip.wingRailPx + config.zones.centerStage.minPx + config.zones.rightWing.minPx,
  };
}

/** Whether the unordered pair {a, b} is an authorized co-expansion pair. */
function isAuthorizedPair(config: StageZonesConfig, a: StagePanelId, b: StagePanelId): boolean {
  return config.authorizedPairs.some(
    ([x, y]) => (x === a && y === b) || (x === b && y === a),
  );
}

/**
 * Nominal zone widths for one viewport: the full-allocation answer with
 * collapse computed at the pure funding thresholds (no hysteresis — the
 * committed flags and their hysteresis band live in the reducer). Drop
 * hit-testing reads these bounds so a collapsed rail stays droppable.
 */
function solveZoneWidths(config: StageZonesConfig, vw: number): Record<StageZoneId, number> {
  const { outer, zones, strip } = config;
  const overhead = 2 * outer.edgePx + 2 * outer.gutterPx;
  const thresholds = wingCollapseThresholds(config);

  /* Yield order left → right; center never dips below its floor while a wing
   * is visible. */
  const nominalLeftCollapsed = vw < thresholds.leftWing;
  const nominalRightCollapsed = nominalLeftCollapsed && vw < thresholds.rightWing;
  const nominalLeft = nominalLeftCollapsed ? strip.wingRailPx : clamp(vw - overhead - zones.centerStage.minPx - zones.rightWing.minPx, zones.leftWing.minPx, zones.leftWing.maxPx);
  const nominalRight = nominalRightCollapsed ? strip.wingRailPx : zones.rightWing.minPx;
  const nominalCenter = clamp(vw - overhead - nominalLeft - nominalRight, zones.centerStage.minPx, zones.centerStage.maxPx);
  return { leftWing: nominalLeft, centerStage: nominalCenter, rightWing: nominalRight };
}

/** Zone x positions once the effective widths are known — residual slack goes
 *  to symmetric outer margins (never inflates zones past their caps). */
function zoneRects(config: StageZonesConfig, vw: number, stageTop: number, stageH: number, widths: Record<StageZoneId, number>): Record<StageZoneId, StageRect> {
  const { outer } = config;
  const zonesW = widths.leftWing + widths.centerStage + widths.rightWing;
  const residual = Math.max(0, vw - 2 * outer.edgePx - 2 * outer.gutterPx - zonesW);
  const bandLeft = outer.edgePx + residual / 2;
  const leftX = bandLeft;
  const centerX = leftX + widths.leftWing + outer.gutterPx;
  const rightX = centerX + widths.centerStage + outer.gutterPx;
  return {
    leftWing: { x: leftX, y: stageTop, w: widths.leftWing, h: stageH },
    centerStage: { x: centerX, y: stageTop, w: widths.centerStage, h: stageH },
    rightWing: { x: rightX, y: stageTop, w: widths.rightWing, h: stageH },
  };
}

/** Default committed position for an expanded panel that never recorded a
 *  placement: wings hug their outer edge, center stage centers horizontally. */
function defaultPlacement(config: StageZonesConfig, panelId: StagePanelId, zone: StageZoneId, zoneRect: StageRect, panelW: number): { x: number; y: number } {
  if (zone === 'rightWing') return { x: zoneRect.x + zoneRect.w - panelW, y: zoneRect.y };
  if (zone === 'centerStage') return { x: zoneRect.x + Math.max(0, (zoneRect.w - panelW) / 2), y: zoneRect.y };
  return { x: zoneRect.x, y: zoneRect.y };
}

/** Expanded panel width inside a zone: `zone-fill` panels take the zone's
 *  width, `natural` panels keep their own width clamped to it. */
function expandedWidth(config: StageZonesConfig, panelId: StagePanelId, zoneW: number): number {
  const panel = config.panels[panelId];
  return panel.widthMode === 'zone-fill' ? zoneW : Math.min(panel.naturalWidthPx, zoneW);
}

/**
 * Strip chrome rects for one zone, assigned in `openSeq` order (the most
 * recent occupants keep their rail slots; the contract caps strips per zone).
 * Returns [panelId → rect] plus the ids that overflowed the cap.
 */
function assignStripRects(
  config: StageZonesConfig,
  zone: StageZoneId,
  zoneRect: StageRect,
  strips: readonly StageOccupant[],
  envelopeCenterX: number,
): { rects: Map<StagePanelId, StageRect>; overflow: Set<StagePanelId> } {
  const { strip } = config;
  const rects = new Map<StagePanelId, StageRect>();
  const overflow = new Set<StagePanelId>();
  /* Most-recently-activated strips keep their slots — demotion is LRU. */
  const byRecency = [...strips].sort((a, b) => b.openSeq - a.openSeq);
  const kept = byRecency.slice(0, strip.maxPerZone).sort((a, b) => a.openSeq - b.openSeq);
  for (const extra of byRecency.slice(strip.maxPerZone)) overflow.add(extra.panelId);
  if (zone === 'centerStage') {
    const { wPx, hPx } = strip.centerTab;
    const rowW = kept.length * wPx + Math.max(0, kept.length - 1) * strip.gapPx;
    const rowX = clamp(envelopeCenterX - rowW / 2, zoneRect.x, Math.max(zoneRect.x, zoneRect.x + zoneRect.w - rowW));
    kept.forEach((o, i) => rects.set(o.panelId, { x: rowX + i * (wPx + strip.gapPx), y: zoneRect.y, w: wPx, h: hPx }));
  } else {
    const { wPx, hPx } = strip.wingTabPx;
    const x = zone === 'leftWing' ? zoneRect.x : zoneRect.x + zoneRect.w - strip.wingRailPx;
    kept.forEach((o, i) => rects.set(o.panelId, { x, y: zoneRect.y + i * (hPx + strip.gapPx), w: strip.wingRailPx, h: hPx }));
  }
  return { rects, overflow };
}

/**
 * The expanded set of one zone: at most one expanded occupant, except the
 * authorized pair (roster + stash) which may co-expand in `leftWing`. Walks
 * occupants by descending `openSeq` — the most recent expanded-intent occupant
 * wins; earlier expanded-intent occupants suspend.
 */
function expandedSetForZone(config: StageZonesConfig, zone: StageZoneId, occupants: readonly StageOccupant[]): { expanded: StageOccupant[]; suspended: StageOccupant[] } {
  const expanded: StageOccupant[] = [];
  const suspended: StageOccupant[] = [];
  const byRecency = [...occupants].sort((a, b) => b.openSeq - a.openSeq);
  for (const o of byRecency) {
    if (o.presentationIntent !== 'expanded') continue;
    if (expanded.length === 0) {
      expanded.push(o);
      continue;
    }
    if (zone === 'leftWing' && expanded.length === 1 && isAuthorizedPair(config, expanded[0].panelId, o.panelId)) {
      expanded.push(o);
      continue;
    }
    suspended.push(o);
  }
  return { expanded, suspended };
}

/**
 * Solve the stage for one input snapshot. Pure: identical inputs → identical
 * output, so render, drag-clamp and the 0px² probe all agree bit-for-bit.
 */
export function solveStageLayout(config: StageZonesConfig, inputs: SolverInputs): StageLayout {
  const { viewport, regime, occupancy, collapsed, intent } = inputs;
  const stageTop = config.chrome.topPx;
  const stageH = Math.max(0, viewport.h - config.chrome.topPx - config.chrome.bottomPx);
  const envelope: StageRect = { x: config.outer.edgePx, y: stageTop, w: Math.max(0, viewport.w - 2 * config.outer.edgePx), h: stageH };

  const panels = {} as Record<StagePanelId, PanelResolution>;

  if (regime === 'run') {
    /* §A.2: the quest cluster claims the WHOLE stage envelope as one occupant;
     * every zone-managed panel suspends (mounted, no rect). F5 internals own
     * the cluster's internal columns — WS-2 only hands it the envelope. */
    const zoneRect = { x: 0, y: stageTop, w: 0, h: stageH };
    const zones = { leftWing: { ...zoneRect }, centerStage: { ...zoneRect }, rightWing: { ...zoneRect } };
    const nominalZones = { leftWing: { ...zoneRect }, centerStage: { ...zoneRect }, rightWing: { ...zoneRect } };
    /* R-253: the run cluster is modal-grade — it may paint over the fixed
     * chrome bands by `questChromeOverlap` so art + copy + choices all fit
     * inside one window (Director ruling: «il componente quest può andare
     * sopra l'HUD»). `panels` z-layer (12) already sits above `chrome` (10). */
    const ovl = config.questChromeOverlap;
    const clusterTop = Math.max(0, config.chrome.topPx - ovl.topPx);
    const clusterH = Math.max(0, viewport.h - clusterTop - Math.max(0, config.chrome.bottomPx - ovl.bottomPx));
    const clusterEnvelope = { x: envelope.x, y: clusterTop, w: envelope.w, h: clusterH };
    for (const zone of ZONE_IDS) {
      for (const o of occupancy[zone]) {
        if (o.panelId === 'quest') {
          panels[o.panelId] = { rect: { ...clusterEnvelope }, stripRect: null, presentationEffective: 'expanded', suspended: false, zone };
        } else {
          panels[o.panelId] = { rect: null, stripRect: null, presentationEffective: null, suspended: true, zone };
        }
      }
    }
    fillAbsentPanels(config, panels);
    return { zones, nominalZones, envelope, panels, clusterEnvelope, signature: layoutSignature(viewport, regime, zones, panels, clusterEnvelope) };
  }

  /* ── generic regime ─────────────────────────────────────────────────── */

  /* Zone-strip shrink: a zone whose occupants are all strips (or which is
   * collapsed) renders as the rail; an empty zone contributes no width. */
  const zoneAllStrips: Record<StageZoneId, boolean> = { leftWing: false, centerStage: false, rightWing: false };
  const expandedByZone = {} as Record<StageZoneId, { expanded: StageOccupant[]; suspended: StageOccupant[] }>;
  for (const zone of ZONE_IDS) {
    const res = expandedSetForZone(config, zone, occupancy[zone]);
    expandedByZone[zone] = res;
    zoneAllStrips[zone] = occupancy[zone].length > 0 && res.expanded.length === 0;
  }

  const nominal = solveZoneWidths(config, viewport.w);
  const effective: Record<StageZoneId, number> = { ...nominal };
  for (const wing of ['leftWing', 'rightWing'] as const) {
    const hasOccupants = occupancy[wing].length > 0;
    if (!hasOccupants) effective[wing] = 0;
    else if (collapsed[wing] || zoneAllStrips[wing]) effective[wing] = config.strip.wingRailPx;
  }
  /* Freed wing width flows to center, capped at centerStage.maxPx; an empty
   *  center stage contributes no width at all. */
  effective.centerStage =
    occupancy.centerStage.length === 0
      ? 0
      : clamp(viewport.w - 2 * config.outer.edgePx - 2 * config.outer.gutterPx - effective.leftWing - effective.rightWing, config.zones.centerStage.minPx, config.zones.centerStage.maxPx);

  const zones = zoneRects(config, viewport.w, stageTop, stageH, effective);
  const nominalZones = zoneRects(config, viewport.w, stageTop, stageH, nominal);

  /* Center strips anchor the row at userCenterX (cluster drag intent) or the
   * stage center when unset. */
  const envelopeCenterX = intent.userCenterX ?? envelope.x + envelope.w / 2;

  for (const zone of ZONE_IDS) {
    const { expanded, suspended } = expandedByZone[zone];
    const zoneRect = zones[zone];
    const stripOccupants = occupancy[zone].filter((o) => o.presentationIntent === 'strip');

    /* Fit gates on the expanded set (§D.1): minWidth vs zone width, and the
     * leftWing pair's vertical stack height. A failure force-strips — intent
     * is preserved, so the panel re-expands when space returns. A collapsed
     * wing strips every occupant (the rail is the collapse presentation). */
    let expandedFinal = collapsed[zone as 'leftWing' | 'rightWing'] ? [] : [...expanded];
    const forcedStrips: StageOccupant[] = collapsed[zone as 'leftWing' | 'rightWing'] ? [...expanded] : [];
    expandedFinal = expandedFinal.filter((o) => {
      if (config.panels[o.panelId].minWidthPx > zoneRect.w) {
        forcedStrips.push(o);
        return false;
      }
      return true;
    });
    if (zone === 'leftWing' && expandedFinal.length === 2) {
      const [a, b] = expandedFinal;
      const needed = config.panels[a.panelId].minHeightPx + config.outer.gutterPx + config.panels[b.panelId].minHeightPx;
      if (needed > zoneRect.h) {
        const lru = a.openSeq < b.openSeq ? a : b;
        expandedFinal = expandedFinal.filter((o) => o !== lru);
        forcedStrips.push(lru);
      }
    }

    const allStrips = [...stripOccupants, ...forcedStrips];
    const { rects: stripRects, overflow } = assignStripRects(config, zone, zoneRect, allStrips, envelopeCenterX);

    for (const o of occupancy[zone]) {
      const panel = config.panels[o.panelId];
      const isExpanded = expandedFinal.includes(o);
      const stripRect = stripRects.get(o.panelId) ?? null;
      const isSuspended = suspended.includes(o) || overflow.has(o.panelId) || (!isExpanded && !stripRect);
      if (isExpanded) {
        if (zone === 'leftWing' && expandedFinal.length === 2) {
          /* Authorized pair: vertical stack, roster on top (DIRECTOR R-184).
           *  Roster's slot takes its natural height; stash gets the rest. */
          const roster = expandedFinal.find((p) => p.panelId === 'roster') ?? expandedFinal[0];
          const stash = expandedFinal.find((p) => p !== roster)!;
          const rosterH = clamp(panel.naturalHeightPx, panel.minHeightPx, zoneRect.h - config.outer.gutterPx - config.panels[stash.panelId].minHeightPx);
          const slots = new Map<StagePanelId, StageRect>([
            [roster.panelId, { x: zoneRect.x, y: zoneRect.y, w: zoneRect.w, h: rosterH }],
            [stash.panelId, { x: zoneRect.x, y: zoneRect.y + rosterH + config.outer.gutterPx, w: zoneRect.w, h: Math.max(0, zoneRect.h - rosterH - config.outer.gutterPx) }],
          ]);
          for (const p of expandedFinal) {
            panels[p.panelId] = { rect: slots.get(p.panelId)!, stripRect: null, presentationEffective: 'expanded', suspended: false, zone };
          }
          break;
        }
        const w = expandedWidth(config, o.panelId, zoneRect.w);
        const home = defaultPlacement(config, o.panelId, zone, zoneRect, w);
        const place = intent.placements[o.panelId] ?? home;
        const x = panel.widthMode === 'zone-fill' ? zoneRect.x : clamp(place.x, zoneRect.x, Math.max(zoneRect.x, zoneRect.x + zoneRect.w - w));
        const y = clamp(place.y, zoneRect.y, Math.max(zoneRect.y, zoneRect.y + zoneRect.h - panel.minHeightPx));
        const h = Math.min(panel.naturalHeightPx, zoneRect.y + zoneRect.h - y);
        panels[o.panelId] = { rect: { x, y, w, h }, stripRect: null, presentationEffective: 'expanded', suspended: false, zone };
      } else if (stripRect) {
        panels[o.panelId] = { rect: null, stripRect, presentationEffective: 'strip', suspended: false, zone };
      } else {
        panels[o.panelId] = { rect: null, stripRect: null, presentationEffective: null, suspended: true, zone };
      }
    }
  }

  fillAbsentPanels(config, panels);
  return { zones, nominalZones, envelope, panels, clusterEnvelope: null, signature: layoutSignature(viewport, regime, zones, panels, null) };
}

/** Panels that never entered occupancy (closed or overlay-managed) still get
 *  a defined resolution — callers may index `panels[id]` unconditionally. */
function fillAbsentPanels(config: StageZonesConfig, panels: Record<StagePanelId, PanelResolution>): void {
  for (const id of Object.keys(config.panels) as StagePanelId[]) {
    if (!panels[id]) {
      panels[id] = { rect: null, stripRect: null, presentationEffective: null, suspended: false, zone: config.panels[id].zone };
    }
  }
}

/**
 * The zone a drop intends, from the pointer's x on the NOMINAL zone bounds
 * (collapsed rails stay droppable, §A.3b). A pointer in a gutter snaps to the
 * nearer zone; outside the stage it snaps to the nearer wing.
 */
export function dropTargetZone(config: StageZonesConfig, nominalZones: Record<StageZoneId, StageRect>, pointerX: number): StageZoneId {
  for (const zone of ZONE_IDS) {
    const r = nominalZones[zone];
    if (pointerX >= r.x && pointerX <= r.x + r.w) return zone;
  }
  /* Gutter/outside: nearest zone center. */
  let best: StageZoneId = 'leftWing';
  let bestD = Infinity;
  for (const zone of ZONE_IDS) {
    const r = nominalZones[zone];
    const d = Math.abs(pointerX - (r.x + r.w / 2));
    if (d < bestD) {
      bestD = d;
      best = zone;
    }
  }
  return best;
}

/** Deterministic layout signature — the resolved rect set serialized in a
 *  stable order (BV-02 compares these, diagnostics diff them). */
export function layoutSignature(
  viewport: { w: number; h: number },
  regime: StageRegime,
  zones: Record<StageZoneId, StageRect>,
  panels: Record<StagePanelId, PanelResolution>,
  clusterEnvelope: StageRect | null,
): string {
  const r = (v: number) => Math.round(v * 1000) / 1000;
  const rect = (rect: StageRect | null) => (rect ? `${r(rect.x)},${r(rect.y)},${r(rect.w)},${r(rect.h)}` : '-');
  const zonePart = ZONE_IDS.map((z) => `${z}=${rect(zones[z])}`).join('|');
  const panelPart = (Object.keys(panels) as StagePanelId[])
    .sort()
    .map((id) => `${id}=${rect(panels[id].rect)}~${rect(panels[id].stripRect)}~${panels[id].presentationEffective ?? 's'}:${panels[id].suspended ? 'S' : '-'}`)
    .join('|');
  return `${r(viewport.w)}x${r(viewport.h)}|${regime}|${zonePart}|${panelPart}|cluster=${rect(clusterEnvelope)}`;
}
