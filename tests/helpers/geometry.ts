/**
 * Asserzioni geometriche Playwright (PLAN-044 T-004, classe T-01).
 *
 * Classe T-01 (recurring-traps): l'isola/il contenuto scivola sotto il
 * chrome HUD quando fit del contenuto e copertura del floor collidono.
 * Il livello DOM-assertabile del contratto è: canvas del mondo che copre
 * il viewport (nessuna banda scoperta dove il contenuto possa nascondersi),
 * chrome HUD interamente dentro il viewport, chrome che non si sovrappone.
 * L'overlap isola↔HUD dentro il canvas è pixel-level e resta rischio
 * residuo v1 documentato.
 */
import { expect, type Locator, type Page } from '@playwright/test';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Bounding box di un locator; null se non visibile o zero-size. */
export async function rectOf(locator: Locator): Promise<Rect | null> {
  if (!(await locator.isVisible().catch(() => false))) return null;
  const box = await locator.boundingBox();
  if (!box || box.width <= 0 || box.height <= 0) return null;
  return box;
}

export function area(r: Rect): number {
  return r.width * r.height;
}

export function overlapArea(a: Rect, b: Rect): number {
  const w = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
}

/** Il rect copre l'intero viewport (tolleranza pixel). */
export function expectCoversViewport(rect: Rect, page: Page, label: string, tol = 2): void {
  const vp = page.viewportSize();
  expect(vp, `${label}: viewportSize non disponibile`).not.toBeNull();
  const vw = vp!.width;
  const vh = vp!.height;
  expect(rect.x, `${label}: bordo sinistro oltre il viewport`).toBeLessThanOrEqual(tol);
  expect(rect.y, `${label}: bordo superiore oltre il viewport`).toBeLessThanOrEqual(tol);
  expect(rect.x + rect.width, `${label}: bordo destro non copre il viewport`).toBeGreaterThanOrEqual(vw - tol);
  expect(rect.y + rect.height, `${label}: bordo inferiore non copre il viewport`).toBeGreaterThanOrEqual(vh - tol);
}

/** Il rect è interamente dentro il viewport (tolleranza pixel). */
export function expectInsideViewport(rect: Rect, page: Page, label: string, tol = 2): void {
  const vp = page.viewportSize();
  expect(vp, `${label}: viewportSize non disponibile`).not.toBeNull();
  expect(rect.x, `${label}: bordo sinistro fuori viewport`).toBeGreaterThanOrEqual(-tol);
  expect(rect.y, `${label}: bordo superiore fuori viewport`).toBeGreaterThanOrEqual(-tol);
  expect(rect.x + rect.width, `${label}: bordo destro fuori viewport`).toBeLessThanOrEqual(
    vp!.width + tol,
  );
  expect(rect.y + rect.height, `${label}: bordo inferiore fuori viewport`).toBeLessThanOrEqual(
    vp!.height + tol,
  );
}

/** Due rect non si sovrappongono oltre la tolleranza (chrome HUD disgiunto). */
export function expectDisjoint(a: Rect, b: Rect, labelA: string, labelB: string, tolPx = 2): void {
  const ov = overlapArea(a, b);
  expect(
    ov,
    `${labelA} si sovrappone a ${labelB} di ${ov}px²`,
  ).toBeLessThanOrEqual(tolPx * Math.min(a.width, a.height, b.width, b.height));
}

/** Bounding box di tutti i locator visibili che matchano il selettore. */
export async function visibleRects(page: Page, selector: string): Promise<{ label: string; rect: Rect }[]> {
  const locs = page.locator(selector);
  const n = await locs.count();
  const out: { label: string; rect: Rect }[] = [];
  for (let i = 0; i < n; i++) {
    const rect = await rectOf(locs.nth(i));
    if (rect) out.push({ label: `${selector}[${i}]`, rect });
  }
  return out;
}
