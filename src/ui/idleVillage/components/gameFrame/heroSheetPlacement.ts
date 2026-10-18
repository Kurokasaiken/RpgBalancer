/**
 * heroSheetPlacement — where the hero sheet plaque goes (PLAN-043).
 *
 * Until now the sheet tried «right of the card, then left of the card» at the card's height and only avoided the quest
 * run window: it could land on the expedition planner, the village stash or any other open panel. The placement is
 * now a search over candidate positions, the same model as Microsoft's tooltip `PlacementRect` (an anchor rectangle
 * the popup must not occlude) extended to several obstacles: Floating UI's `flip`/`shift` know one reference element,
 * and plain clamping to the viewport can land the popup right back on the thing it should leave alone.
 *
 * Rules, in order:
 *  1. the sheet never covers the anchor card (the hovered/focused card — WCAG 2.4.11);
 *  2. it stays inside the viewport (with an inset);
 *  3. it covers as little as possible of the other open panels (weighted: the quest and planner count more than the
 *     roster header) — zero when any free spot exists;
 *  4. among equals, it stays as close as possible to the natural spot (right of the card, at the card's height).
 * With no obstacle the result is exactly the old natural placement.
 */

export interface PlacementRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  /** How bad it is to cover this obstacle, relative to others (default 1). The quest and its planner weigh more than the roster. */
  weight?: number;
}

export interface SheetPlacementInput {
  /** The anchor card (the one the sheet describes). */
  card: PlacementRect;
  sheet: { width: number; height: number };
  viewport: { width: number; height: number };
  /** Other open panels, quest windows, etc. — everything the sheet should not cover. */
  obstacles: readonly PlacementRect[];
  /** Gap between the card and the sheet. */
  gap: number;
  /** Minimum distance from the viewport edges. */
  inset: number;
  /** Fixed HUD chrome the sheet may not enter (top bar / menu, bottom navigation). Default 0. */
  chrome?: { top: number; bottom: number };
}

export interface SheetPlacement {
  left: number;
  top: number;
  /** Covered area of the obstacles, px². 0 = clear. */
  overlapArea: number;
}

const overlapArea = (a: PlacementRect, b: PlacementRect): number => {
  const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return w > 0 && h > 0 ? w * h : 0;
};

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(value, Math.max(min, max)));

/** Coarse scan step for positions that are not snapped to an edge. */
const SCAN_STEP_PX = 48;

export function chooseSheetPlacement({ card, sheet, viewport, obstacles, gap, inset, chrome }: SheetPlacementInput): SheetPlacement {
  const { width: w, height: h } = sheet;
  const minTop = Math.max(inset, chrome?.top ?? 0);
  const maxLeft = viewport.width - w - inset;
  const maxTop = viewport.height - Math.max(inset, chrome?.bottom ?? 0) - h;
  const natural = { left: clamp(card.right + gap, inset, maxLeft), top: clamp(card.top, minTop, maxTop) };

  /* Candidate coordinates: the natural ones, the card's other side, the viewport edges, the spots hugging each
   * obstacle (just beyond each of its edges) and a coarse scan so a free pocket in between is not missed. */
  const lefts = new Set<number>([natural.left, clamp(card.left - gap - w, inset, maxLeft), inset, maxLeft]);
  const tops = new Set<number>([natural.top, minTop, maxTop, clamp(card.bottom - h, minTop, maxTop)]);
  for (const o of obstacles) {
    lefts.add(clamp(o.right + gap, inset, maxLeft));
    lefts.add(clamp(o.left - gap - w, inset, maxLeft));
    tops.add(clamp(o.bottom + gap, minTop, maxTop));
    tops.add(clamp(o.top - gap - h, minTop, maxTop));
  }
  for (let x = inset; x <= maxLeft; x += SCAN_STEP_PX) lefts.add(x);
  for (let y = minTop; y <= maxTop; y += SCAN_STEP_PX) tops.add(y);

  /* Never touch the card: a 2 px halo so a hairline overlap cannot pass. */
  const cardGuard: PlacementRect = { left: card.left - 2, top: card.top - 2, right: card.right + 2, bottom: card.bottom + 2 };

  let best: (SheetPlacement & { distance: number; cost: number }) | null = null;
  for (const left of lefts) {
    for (const top of tops) {
      const box: PlacementRect = { left, top, right: left + w, bottom: top + h };
      if (overlapArea(box, cardGuard) > 0) continue;
      let covered = 0;
      let cost = 0;
      for (const o of obstacles) {
        const a = overlapArea(box, o);
        covered += a;
        cost += a * (o.weight ?? 1);
      }
      const distance = Math.abs(left - natural.left) + Math.abs(top - natural.top);
      if (!best || cost < best.cost || (cost === best.cost && distance < best.distance)) {
        best = { left, top, overlapArea: covered, distance, cost };
      }
    }
  }
  /* Nowhere fits without touching the card (a viewport smaller than card + sheet): keep the old natural spot. */
  return best ? { left: Math.round(best.left), top: Math.round(best.top), overlapArea: best.overlapArea } : { ...natural, overlapArea: 0 };
}
