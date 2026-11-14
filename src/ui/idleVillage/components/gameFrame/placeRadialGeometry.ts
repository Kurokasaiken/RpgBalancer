/**
 * placeRadialGeometry — geometria pura del menu radiale inclinato del Luogo
 * (PLAN-117, sotto-piano F2, artifact dibattito r003 + ruling Director).
 *
 * Contratto stabile (testabile in jsdom, niente DOM/CSS3D qui):
 * - 8 slot da 45°, centri esatti sui punti cardinali: NE=index 0, poi
 *   riempimento ORARIO (E, SE, S, SW, W, NW, N).
 * - Seam rule: index 0 = NE; la cucitura sta tra index 7 (N) e index 0 (NE);
 *   hit-test polare e roving tabindex usano lo stesso wrap modulo 8.
 * - Le posizioni sono STABILI: l'attività i-esima occupa lo slot i finché
 *   esiste; l'urgenza non sposta mai la posizione (ruling Director — supera
 *   l'ordinamento per urgenza di placeOrdering.ts per questo componente).
 * - Capienza 8: oltre è design-error (l'hub porta l'affordance → planner).
 */

/** Numero di slot del radiale — ruling Director 2026-11-12 («slice 8»). */
export const RADIAL_SLOTS = 8;
/** Ampiezza angolare di uno slot. */
export const SLOT_DEG = 360 / RADIAL_SLOTS;
/** Gutter angolare tra slice adiacenti (gradi). */
export const SLOT_GUTTER_DEG = 2;
/** Bearing (gradi screen, y giù, 0=E CW) del centro dello slot i. NE=-45. */
export function slotCenterDeg(index: number): number {
  return -45 + index * SLOT_DEG;
}
/** Estremi angolari dello slot i (escluso gutter). */
export function slotSpanDeg(index: number): { a0: number; a1: number } {
  const c = slotCenterDeg(index);
  return { a0: c - SLOT_DEG / 2 + SLOT_GUTTER_DEG / 2, a1: c + SLOT_DEG / 2 - SLOT_GUTTER_DEG / 2 };
}

/** Bande radiali del disco in unità di R (disco locale, pre-inclinazione).
 *  Valori misurati sull'arte battezzata (`/assets/ui/poi-radial/disc-base.webp`,
 *  bordo disco ≈ 0.95 del mezzo-canvas → mappato a R). */
export const BANDS = {
  hubOuter: 0.24,      // pozzo centrale sotto il medaglione
  collarOuter: 0.39,   // bordo esterno del collare = inizio settori
  sectorOuter: 0.7,    // fine del campo smalto della slice
  channelInner: 0.72,  // canale incassato — pista temporale
  channelOuter: 0.84,
  channelMid: 0.78,
  discOuter: 1.0,
} as const;

/**
 * Assegnazione slot STABILE: attività[i] → slot i. Ritorna la coppia
 * (slotted, overflow): slotted ha al massimo RADIAL_SLOTS attività.
 */
export function assignRadialSlots<T>(activities: readonly T[]): { slotted: T[]; overflow: T[] } {
  return { slotted: activities.slice(0, RADIAL_SLOTS), overflow: activities.slice(RADIAL_SLOTS) };
}

/**
 * Hit-test polare nel piano locale del disco (pre-inclinazione CSS3D):
 * dato il vettore (dx, dy) dal centro hub in px locali e il raggio R,
 * ritorna l'index dello slot, -1 nella dead-zone interna (hub+collare) o
 * -2 fuori dal bordo del disco. Il bordo esterno è "infinito" (Fitts): oltre
 * R conta comunque lo slot angolare (la regione >R del disco non esiste ma
 * il settore angolare resta selezionabile).
 */
export function slotIndexFromVector(dx: number, dy: number, radiusPx: number): number {
  const r = Math.hypot(dx, dy);
  if (r < radiusPx * BANDS.collarOuter) return -1; // dead zone hub/collare
  let deg = (Math.atan2(dy, dx) * 180) / Math.PI; // -180..180, y giù
  if (deg < 0) deg += 360;
  // NE=index0 → bearing 315°. Normalizza: index = round((deg-315)/45) mod 8
  const idx = Math.round((deg - 315) / SLOT_DEG) % RADIAL_SLOTS;
  return (idx + RADIAL_SLOTS) % RADIAL_SLOTS;
}

/** Path SVG di un settore anulare (piano locale, centro 0,0). */
export function annularSectorPath(
  rOuter: number,
  rInner: number,
  a0Deg: number,
  a1Deg: number,
): string {
  const p = (r: number, deg: number) => {
    const a = (deg * Math.PI) / 180;
    return `${(r * Math.cos(a)).toFixed(2)} ${(r * Math.sin(a)).toFixed(2)}`;
  };
  const large = a1Deg - a0Deg > 180 ? 1 : 0;
  return [
    `M ${p(rInner, a0Deg)}`,
    `L ${p(rOuter, a0Deg)}`,
    `A ${rOuter} ${rOuter} 0 ${large} 1 ${p(rOuter, a1Deg)}`,
    `L ${p(rInner, a1Deg)}`,
    `A ${rInner} ${rInner} 0 ${large} 0 ${p(rInner, a0Deg)}`,
    'Z',
  ].join(' ');
}

/** Arco di cerchio aperto (per le piste temporali sul rim). */
export function arcPath(r: number, a0Deg: number, a1Deg: number): string {
  const p = (deg: number) => {
    const a = (deg * Math.PI) / 180;
    return `${(r * Math.cos(a)).toFixed(2)} ${(r * Math.sin(a)).toFixed(2)}`;
  };
  const large = a1Deg - a0Deg > 180 ? 1 : 0;
  return `M ${p(a0Deg)} A ${r} ${r} 0 ${large} 1 ${p(a1Deg)}`;
}

/** Punto polare nel piano locale (per icone billboarded). */
export function polarPoint(r: number, deg: number): { x: number; y: number } {
  const a = (deg * Math.PI) / 180;
  return { x: r * Math.cos(a), y: r * Math.sin(a) };
}

/** Wrap tastiera: prossimo/precendente lungo l'ordine di riempimento (seam incluso). */
export function nextSlot(index: number, dir: 1 | -1): number {
  return (index + dir + RADIAL_SLOTS) % RADIAL_SLOTS;
}
