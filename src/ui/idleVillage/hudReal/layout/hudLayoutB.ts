/**
 * HUD blueprint B (PLAN-112 F1): the layout contract. Pure data + a resolver, no React, no assets.
 * SCALE MODEL (amend G1 #2, A5-a, 2026-11-05): the game's own. Layout is in CSS px 1:1 and the only scale is the game's HUD zoom
 * (`hudScale.ts`: 1 .. 2, modes auto/1/1.25/1.5/2, never below 1). The canvas is the window divided by the zoom, so right/bottom
 * anchors sit on the screen edge and running text is always >= 16 real px at zoom 1. Everything that places HUD components reads this file; a test
 * (tests/unit/idleVillage/hudLayoutContract.test.ts) fails when an alignment or an overlap rule breaks.
 */
import { isMobileFitViewport } from '@/balancing/config/idleVillage/mobileFitConfig';
import { HUD_SCALE_MIN, HUD_SCALE_MAX, resolveHudScale, type HudScaleMode } from '@/ui/idleVillage/components/gameFrame/hudScale';

/** One margin for every edge-anchored block; grid unit 8. */
export const M = 24;
export const GRID = 8;
/** The top row is one module: same height, same centre line. */
export const TOP_ROW_H = 56;
/** Crest box above the roster column (amend G1 #4, PLAN-112 §29): the ribbon starts 22 px inside its lower edge, as in the mockup. */
export const CREST_BOX = 156;
/** Roster column width with plaques (Director ruling 2026-11-05, "Con placche"): zanara kit 214 px x 1.25 = 267.5, rounded up. */
export const ROSTER_W = 268;
export const CREST_OVERLAP = 22;
/** Open roster panel (amend G1 #4): width from the mockup (620), height capped by the resolve step below. */
export const ROSTER_OPEN_W = 620;
export const ROSTER_OPEN_H = 520;

export type SlotMode = 'persistent' | 'contextual' | 'temporary';
export type HudView = 'overview' | 'context' | 'narrative';
/** vertical (t|b) + horizontal (l|c|r) */
export type Anchor = 'tl' | 'tc' | 'tr' | 'cl' | 'bl' | 'bc' | 'br';

export interface Slot {
  id: string;
  label: string;
  mode: SlotMode;
  /** 1 = ornate focal piece, 2 = sober, 3 = flat */
  tier: 1 | 2 | 3;
  anchor: Anchor;
  /** distance from the anchored edges (horizontal edge for l/r, centre offset for c); dy from the top or bottom edge */
  dx: number;
  dy: number;
  w: number;
  h: number;
  views: HudView[];
  note?: string;
}

export const SLOTS_B: Slot[] = [
  { id: 'crest', label: 'Cimiero', mode: 'persistent', tier: 1, anchor: 'tl', dx: M, dy: M, w: CREST_BOX, h: CREST_BOX, views: ['overview', 'context', 'narrative'], note: 'fenice + Sol Invictus in componente circolare (amend G1 #4)' },
  { id: 'roster', label: 'Eroi', mode: 'persistent', tier: 1, anchor: 'tl', dx: M, dy: M + CREST_BOX - CREST_OVERLAP, w: ROSTER_W, h: 432, views: ['overview', 'context', 'narrative'], note: 'medaglioni 72 px, passo 80; placca 200x64 al passaggio (fuori ingombro)' },
  { id: 'time', label: 'Tempo', mode: 'persistent', tier: 2, anchor: 'tc', dx: 0, dy: M, w: 420, h: TOP_ROW_H, views: ['overview', 'context', 'narrative'], note: 'giorno, pausa, x1/x2/x4' },
  { id: 'resources', label: 'Risorse', mode: 'persistent', tier: 2, anchor: 'tr', dx: M, dy: M, w: 360, h: TOP_ROW_H, views: ['overview', 'context', 'narrative'], note: 'oro, cibo, legno; consumo nel chip' },
  { id: 'panel', label: 'Pannello', mode: 'contextual', tier: 1, anchor: 'tr', dx: M, dy: M + TOP_ROW_H + 16, w: 340, h: 520, views: ['context'], note: 'ala destra del gioco (stageZones rightWing = 340); contiene la riga probabilita/sigillo' },
  { id: 'rosterOpen', label: 'Compagnia aperta', mode: 'contextual', tier: 1, anchor: 'tl', dx: M + ROSTER_W + 16, dy: M + CREST_BOX + 8, w: ROSTER_OPEN_W, h: ROSTER_OPEN_H, views: ['context'], note: 'pannello del roster derivato da /game (filtri, ordinamento, densità) (amend G1 #4)' },
  { id: 'nav', label: 'Nav', mode: 'persistent', tier: 2, anchor: 'bc', dx: 0, dy: M, w: 460, h: 88, views: ['overview', 'context', 'narrative'], note: '4 voci + ricentra, etichette sotto' },
  { id: 'commands', label: 'Comandi', mode: 'persistent', tier: 3, anchor: 'br', dx: M, dy: M, w: 132, h: 40, views: ['overview', 'context', 'narrative'], note: 'menu, pannelli, nascondi' },
  { id: 'toast', label: 'Esiti', mode: 'temporary', tier: 2, anchor: 'bl', dx: M, dy: M + 96 + 8, w: 320, h: 72, views: ['narrative'], note: 'notifiche di esito, impilate sopra la Voce (amend G1 A1, 2026-11-05)' },
  { id: 'voce', label: 'Voce', mode: 'temporary', tier: 1, anchor: 'bl', dx: M, dy: M, w: 360, h: 96, views: ['narrative'], note: 'notifica espandibile, ingresso da sinistra' },
];

export interface Rect { x: number; y: number; w: number; h: number }
export interface Frame { scale: number; W: number; H: number }

/** The canvas for a window and a HUD zoom (the game's `hudScale`: 1..2). `zoom` is a factor, not a mode: use {@link zoomFor} for `auto`. */
export function frameFor(winW: number, winH: number, zoom = 1): Frame {
  const scale = Math.min(HUD_SCALE_MAX, Math.max(HUD_SCALE_MIN, zoom));
  return { scale, W: winW / scale, H: winH / scale };
}

/** The zoom the game applies for a mode in a window: exactly `resolveHudScale` (auto = 1 up to Full HD, then proportional). */
export function zoomFor(mode: HudScaleMode, winW: number, winH: number): number {
  return resolveHudScale(mode, winW, winH);
}

export function resolve(slot: Slot, f: { W: number; H: number }): Rect {
  const v = slot.anchor[0];
  const h = slot.anchor[1];
  const y = v === 't' ? slot.dy : v === 'c' ? (f.H - slot.h) / 2 + slot.dy : f.H - slot.dy - slot.h;
  const x = h === 'l' ? slot.dx : h === 'r' ? f.W - slot.dx - slot.w : (f.W - slot.w) / 2 + slot.dx;
  return { x, y, w: slot.w, h: slot.h };
}

export const overlaps = (a: Rect, b: Rect, tol = 0): boolean =>
  Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) > tol && Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) > tol;

const slot = (id: string) => SLOTS_B.find((s) => s.id === id)!;
const GAP = 16;
/** Narrowest canvas on which roster, time and resources share one row. */
export const MIN_W_TOP_ROW = Math.max(
  2 * (slot('resources').dx + slot('resources').w + slot('time').w / 2 + GAP),
  2 * (slot('roster').dx + slot('roster').w + GAP + slot('time').w / 2),
);
/** Narrowest canvas on which the nav stays clear of the narrator (bottom row). */
export const MIN_W_BOTTOM_ROW = 2 * (slot('voce').dx + slot('voce').w + GAP) + slot('nav').w;
/** A blueprint needs at least this much roster/panel height to be usable. */
export const MIN_ROSTER_H = 176;
/** The panel may scroll its content (D6c, approved 2026-11-05) down to this height: title, a few lines of text and the action stay visible. */
export const MIN_PANEL_H = 240;
export const PANEL_H = 520;

/** Variants of blueprint B (visual-fork card, PLAN-112 F1.5).
 *  B1 one aligned top row: roster | time | resources (the mockup's reading order).
 *  B2 fused top module: time + resources hang together at the top right, the top centre stays free for the map.
 *  B3 floating roster: the hero column is centred on the left edge, the top-left corner is free. */
export type Variant = 'B1' | 'B2' | 'B3';
export function applyVariant(variant: Variant): Slot[] {
  const out = SLOTS_B.map((s) => ({ ...s }));
  const get = (id: string) => out.find((s) => s.id === id)!;
  if (variant === 'B2') {
    const time = get('time');
    time.anchor = 'tr'; time.dx = M + get('resources').w + 8; time.w = 340;
  }
  if (variant === 'B3') {
    const roster = get('roster');
    roster.anchor = 'cl'; roster.dy = 0;
  }
  return out;
}

export interface Resolved { slots: Slot[]; topReflow: boolean; bottomReflow: boolean; /** true when the panel is shorter than its natural height and must scroll */ panelScrolls: boolean }

/**
 * The blueprint for a given canvas, with the reflow rules (D6b, approved 2026-11-05):
 *  - top reflow (canvas narrower than MIN_W_TOP_ROW): the time bar drops under the resources, same right edge; the panel moves down with it;
 *  - bottom reflow (narrower than MIN_W_BOTTOM_ROW): the narrator sits above the nav instead of beside it;
 *  - heights adapt: the roster and the panel shrink to the space left (the roster shows fewer rows, the panel scrolls).
 */
export function resolveSlots(f: { W: number; H: number }, variant: Variant = 'B1'): Resolved {
  const topReflow = f.W < MIN_W_TOP_ROW;
  const bottomReflow = f.W < MIN_W_BOTTOM_ROW;
  const out = applyVariant(variant);
  const get = (id: string) => out.find((s) => s.id === id)!;
  const time = get('time');
  const panel = get('panel');
  const voce = get('voce');
  const roster = get('roster');
  const cmd = get('commands');
  if (topReflow) {
    time.anchor = 'tr'; time.dx = M; time.dy = M + TOP_ROW_H + 8; time.w = get('resources').w;
    panel.dy += TOP_ROW_H + 8;
  }
  if (bottomReflow) voce.dy = M + get('nav').h + 8;
  const toast = get('toast');
  toast.dy = voce.dy + voce.h + 8;
  // the panel ends above whatever sits under it: the nav when their widths touch, the command cluster otherwise
  const nav = get('nav');
  const navTouchesPanel = (f.W + nav.w) / 2 + GAP > f.W - M - panel.w;
  panel.h = Math.max(0, Math.min(panel.h, f.H - panel.dy - M - (navTouchesPanel ? nav.h : cmd.h) - GAP));
  const voceTop = f.H - toast.dy - toast.h; // top of the bottom-left stack (narrator + outcome toast)
  roster.h = Math.max(0, Math.min(roster.h, roster.anchor === 'cl' ? 2 * (voceTop - GAP) - f.H : voceTop - GAP - roster.dy));
  // the open roster sits under the top row, left of the panel column, and stops above the nav and the bottom-left stack
  const open = get('rosterOpen');
  // its width is what is left between the roster column and the right panel (amend G1 #4, rule added 2026-11-05)
  open.w = Math.max(0, Math.min(open.w, (f.W - M - panel.w) - GAP - (open.dx)));
  open.h = Math.max(0, Math.min(open.h, f.H - open.dy - M - nav.h - GAP, voceTop - GAP - open.dy));
  return { slots: out, topReflow, bottomReflow, panelScrolls: panel.h < PANEL_H };
}

export function resolveAll(slots: Slot[], f: { W: number; H: number }): Record<string, Rect> {
  const out: Record<string, Rect> = {};
  for (const s of slots) out[s.id] = resolve(s, f);
  return out;
}

/** Persistent-surface budget (box figure, %): 24 at every zoom (Director ruling B, 2026-11-05: placche a riposo, budget più alto; supersedes the 18% of G1). */
export const budgetFor = (_zoom: number): number => 24;

/** True when the resolved blueprint is usable on this canvas: nothing overlaps, nothing leaves the window, roster and panel keep a minimum height. */
/** Declared overlap (amend G1 #4): the ribbon starts CREST_OVERLAP px inside the crest, as in the mockup. Any other overlap is a failure. */
export const isDeclaredOverlap = (a: string, b: string): boolean => (a === 'crest' && b === 'roster') || (a === 'roster' && b === 'crest');

export function fits(f: Frame, variant: Variant = 'B1'): boolean {
  const { slots } = resolveSlots(f, variant);
  const r = resolveAll(slots, f);
  const ids = Object.keys(r);
  for (let i = 0; i < ids.length; i++) {
    const a = r[ids[i]];
    if (a.x < -1e-6 || a.y < -1e-6 || a.x + a.w > f.W + 1e-6 || a.y + a.h > f.H + 1e-6) return false;
    for (let j = i + 1; j < ids.length; j++) if (!isDeclaredOverlap(ids[i], ids[j]) && overlaps(a, r[ids[j]])) return false;
  }
  if (!(r.roster.h >= MIN_ROSTER_H && r.panel.h >= MIN_PANEL_H)) return false;
  // the budget (Director ruling B, 2026-11-05): persistent boxes <= 24% of the window at every zoom
  return coveragePct(SLOTS_B, f, (x) => x.mode === 'persistent', variant) <= budgetFor(f.scale);
}

/** Share of the window covered by the rects of the given slots, in percent: the DOM-bounding-box figure of T-101b. */
export function coveragePct(slots: Slot[], f: { W: number; H: number }, only?: (s: Slot) => boolean, variant: Variant = 'B1'): number {
  const used = resolveSlots(f, variant).slots.filter((s) => slots.some((q) => q.id === s.id) && (only ? only(s) : true));
  const area = used.reduce((a, s) => { const r = resolve(s, f); return a + r.w * r.h; }, 0);
  return (area / (f.W * f.H)) * 100;
}

/** HUD zooms (the game's `hudScale` steps) whose canvas still fits the (reflowed) blueprint. */
export function allowedSteps(winW: number, winH: number, steps: number[] = [1, 1.25, 1.5, 2], variant: Variant = 'B1'): number[] {
  return steps.filter((s) => fits(frameFor(winW, winH, s), variant));
}

/** Sizes of the game's existing floating panels (gameFrameConfig.ts `panels` and `questWindow`), design px. Used by the fit check. */
export const PANEL_FAMILIES: Array<{ id: string; family: string; zone: 'leftWing' | 'centerStage' | 'rightWing'; minW: number; minH: number; natW: number; natH: number }> = [
  { id: 'events', family: 'editorial', zone: 'rightWing', minW: 280, minH: 160, natW: 300, natH: 320 },
  { id: 'heroSheet', family: 'editorial', zone: 'rightWing', minW: 280, minH: 200, natW: 380, natH: 400 },
  { id: 'merchant', family: 'table', zone: 'rightWing', minW: 320, minH: 240, natW: 360, natH: 420 },
  { id: 'villageStash', family: 'table', zone: 'leftWing', minW: 236, minH: 200, natW: 320, natH: 360 },
  { id: 'questDetail', family: 'quest', zone: 'centerStage', minW: 460, minH: 300, natW: 680, natH: 520 },
  { id: 'quest', family: 'quest', zone: 'centerStage', minW: 640, minH: 400, natW: 820, natH: 600 },
];

export type FitVerdict = 'natural' | 'compressed' | 'scroll' | 'no';

/**
 * Where a game panel lands in the blueprint on a given canvas.
 * Wing panels live in the right panel slot (width = slot, height = resolved slot height, content scrolls below its natural height);
 * centre-stage panels live between the roster and the right slot and replace the side panel when they do not fit beside it.
 */
export function fitPanel(p: (typeof PANEL_FAMILIES)[number], f: { W: number; H: number }): FitVerdict {
  const { slots } = resolveSlots(f);
  const r = resolveAll(slots, f);
  if (p.zone === 'centerStage') {
    const avail = r.panel.x - GAP - (r.roster.x + r.roster.w + GAP);
    const availH = f.H - 72 - M;
    if (avail >= p.natW && availH >= p.natH) return 'natural';
    if (avail >= p.minW && availH >= p.minH) return 'compressed';
    // the stage overlay replaces the side panel: it then has the whole width between the margins
    const whole = f.W - 2 * M - GAP * 2 - r.roster.w;
    return whole >= p.minW && availH >= p.minH ? 'scroll' : 'no';
  }
  const w = r.panel.w;
  const h = r.panel.h;
  if (w < p.minW || h < p.minH) return 'no';
  if (w >= p.natW && h >= p.natH) return 'natural';
  return w >= p.natW ? 'scroll' : 'compressed';
}

/**
 * Where the blueprint applies (D10, PLAN-112): below the game's mobile-fit breakpoint (768 px wide, `mobileFitConfig`) the blueprint is
 * NOT used and the game keeps the `base` HUD with its own mobile-fit layout. At and above it the blueprint applies, in the game's scale model.
 */
export type BlueprintMode = 'base-fallback' | 'blueprint';
export function blueprintMode(winW: number): BlueprintMode {
  return isMobileFitViewport(winW) ? 'base-fallback' : 'blueprint';
}
