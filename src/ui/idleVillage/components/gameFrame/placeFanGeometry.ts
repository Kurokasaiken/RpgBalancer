/**
 * placeFanGeometry — geometria pura dell'ANELLO ellittico di spicchi del
 * Luogo (modello battezzato `refs/approved-fan-v65.png`, ruling Director
 * 2026-11-14; sostituisce la slot-map a carte v8, bocciata).
 *
 * Contratto stabile (testabile in jsdom, niente DOM qui):
 * - L'anello è una corona ellittica parametrica: `slotsTotal` settori
 *   contigui divisi da separatori oro (`gapDeg`), primo separatore a
 *   `startAngleDeg` (0 = est, + = orario in coordinate schermo y-down).
 * - Le coordinate sono frazioni dello spazio di riferimento `refW × refH`;
 *   il componente scala l'intera composizione uniformemente.
 * - Il foro interno (impronta del saucer del diorama) è spostato in basso
 *   di `innerDy` per la prospettiva; il diorama copre i bordi interni.
 * - Assegnazione: attività → slot in ordine di lettura sinistra → destra
 *   (`ringFillOrder`); oltre capienza → overflow al planner.
 * - Grammatica smalto: settore sempre smalto chiaro di famiglia; il
 *   progress scrive smalto scuro radialmente dal bordo interno (la
 *   "punta" dello spicchio, rivolta al diorama) verso il rim; done
 *   non-ripetibile resta scuro (click-to-collect); vuoto → smalto navy.
 * - Niente testo sugli spicchi («niente testo, mai»): solo icone.
 */
import { PLACES_CONFIG } from '@/balancing/config/idleVillage/placesConfig';

/** Spec dell'anello — forma di `placesConfig.fanRing` (config-first). */
export interface FanRingSpec {
  readonly refW: number;
  readonly refH: number;
  readonly cx: number;
  readonly cy: number;
  readonly outerRx: number;
  readonly outerRy: number;
  readonly innerRx: number;
  readonly innerRy: number;
  readonly innerDy: number;
  readonly slotsTotal: number;
  readonly startAngleDeg: number;
  readonly gapDeg: number;
  readonly overlapDeg: number;
  readonly rimFrac: number;
  readonly skirtFrac: number;
  readonly iconFrac: number;
  readonly gold: readonly [string, string, string];
  readonly enamel: Readonly<Record<string, string>>;
  readonly familyDark: Readonly<Record<string, string>>;
  readonly sliceBase: string;
  readonly familySlice: Readonly<Record<string, string>>;
  readonly iconGlyphBase: string;
  readonly iconGlyphMap: Readonly<Record<string, string>>;
  readonly diorama: {
    readonly x: number;
    readonly y: number;
    readonly hFrac: number;
    readonly href: string;
    readonly aspect: number;
  };
}

/** Spec di produzione letta dal config (deep-frozen). */
export const FAN_RING: FanRingSpec = PLACES_CONFIG.fanRing;

const rad = (d: number) => (d * Math.PI) / 180;

/** Punto della corona: angolo `aDeg`, `t` radiale 0 = bordo interno → 1 = rim. */
export function ringPoint(spec: FanRingSpec, aDeg: number, t: number): readonly [number, number] {
  const a = rad(aDeg);
  const cx = spec.cx * spec.refW;
  const cyIn = spec.cy * spec.refH + spec.innerDy * spec.refH;
  const cy = cyIn + (spec.cy * spec.refH - cyIn) * t;
  const rx = spec.innerRx * spec.refW + (spec.outerRx * spec.refW - spec.innerRx * spec.refW) * t;
  const ry = spec.innerRy * spec.refH + (spec.outerRy * spec.refH - spec.innerRy * spec.refH) * t;
  return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
}

/** Estremi angolari dello slot `i` (smalto, al netto del separatore oro). */
export function slotAngles(spec: FanRingSpec, i: number): { a0: number; a1: number; mid: number } {
  const step = 360 / spec.slotsTotal;
  const a0 = spec.startAngleDeg + i * step + spec.gapDeg / 2;
  const a1 = a0 + step - spec.gapDeg;
  return { a0, a1, mid: (a0 + a1) / 2 };
}

/** Angoli dei separatori oro (bordi slot lordi, senza il mezzo-gap). */
export function separatorAngles(spec: FanRingSpec): number[] {
  const step = 360 / spec.slotsTotal;
  return Array.from({ length: spec.slotsTotal }, (_, i) => spec.startAngleDeg + i * step - spec.gapDeg / 2);
}

/**
 * Span dipinto della lastra `i`: esteso di `overlapDeg` verso CCW così la
 * lastra successiva (disegnata dopo, sopra) copre il suo bordo CW — il
 * ventaglio è un accavallamento di lastre, non settori contigui. La
 * giunzione di discontinuità (slot 9 → 0) va in basso via `startAngleDeg`.
 */
export function slotPaintAngles(spec: FanRingSpec, i: number): { a0: number; a1: number } {
  const { a0, a1 } = slotAngles(spec, i);
  return { a0: a0 - spec.overlapDeg, a1 };
}

const arc = (spec: FanRingSpec, t: number, a0: number, a1: number, sweep: 0 | 1) => {
  const [x1, y1] = ringPoint(spec, a1, t);
  const rx = spec.innerRx * spec.refW + (spec.outerRx * spec.refW - spec.innerRx * spec.refW) * t;
  const ry = spec.innerRy * spec.refH + (spec.outerRy * spec.refH - spec.innerRy * spec.refH) * t;
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  return `A ${rx.toFixed(1)} ${ry.toFixed(1)} 0 ${large} ${sweep} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
};

/** Settore anulare fra gli angoli a0→a1 e i raggi t0→t1 (path SVG). */
export function ringSectorPath(spec: FanRingSpec, a0: number, a1: number, t0 = 0, t1 = 1): string {
  const [x0, y0] = ringPoint(spec, a0, t1);
  const [ix1, iy1] = ringPoint(spec, a1, t0);
  return [
    `M ${x0.toFixed(1)} ${y0.toFixed(1)}`,
    arc(spec, t1, a0, a1, 1),
    `L ${ix1.toFixed(1)} ${iy1.toFixed(1)}`,
    arc(spec, t0, a1, a0, 0),
    'Z',
  ].join(' ');
}

/** Path dello spicchio smalto dello slot `i`. */
export function slicePath(spec: FanRingSpec, i: number): string {
  const { a0, a1 } = slotAngles(spec, i);
  return ringSectorPath(spec, a0, a1);
}

/** Progress: scrittura scura dal bordo interno verso il rim (radiale). */
export function sliceProgressPath(spec: FanRingSpec, i: number, frac: number): string | null {
  const f = Math.min(Math.max(frac, 0), 1);
  if (f <= 0) return null;
  const { a0, a1 } = slotAngles(spec, i);
  return ringSectorPath(spec, a0, a1, 0, Math.min(f, 0.995));
}

/** Centroide smalto dello slot `i` (posizione icona): verso il bordo
 *  esterno — il centro visivo resta libero (critica GPT-5.6). */
export function sliceCentroid(spec: FanRingSpec, i: number): readonly [number, number] {
  const { mid } = slotAngles(spec, i);
  return ringPoint(spec, mid, 0.68);
}

/** Ordine di riempimento: indice slot — da NE (`startAngleDeg`) in senso
 *  orario (ruling Director: le attività riempiono dal primo slot a NE e
 *  procedono CW; gli slot non assegnati non renderizzano alcun petalo). */
export function ringFillOrder(spec: FanRingSpec = FAN_RING): number[] {
  return Array.from({ length: spec.slotsTotal }, (_, i) => i);
}

/** Capienza attività = numero di settori. */
export function fanActivityCapacity(spec: FanRingSpec = FAN_RING): number {
  return spec.slotsTotal;
}

/**
 * Assegnazione STABILE: attività[j] → slot `ringFillOrder[j]`.
 * Torna una mappa allineata agli slot (null = settore vuoto navy) e
 * l'overflow oltre capienza.
 */
export function assignFanCards<T>(
  activities: readonly T[],
  spec: FanRingSpec = FAN_RING,
): { slots: (T | null)[]; overflow: T[] } {
  const slots: (T | null)[] = Array.from({ length: spec.slotsTotal }, () => null);
  const order = ringFillOrder(spec);
  activities.slice(0, spec.slotsTotal).forEach((a, j) => {
    slots[order[j]] = a;
  });
  return { slots, overflow: activities.slice(spec.slotsTotal) };
}

/** Gonna: banda sotto il bordo frontale dell'anello (a in [from,to] gradi).
 *  `topT` < 1 alza il bordo superiore DENTRO la facciata dell'anello — il
 *  fill va sotto gli spicchi e la cucitura AA non può diventare una
 *  fessura trasparente (defetto segnalato dal Director). */
export function skirtPath(spec: FanRingSpec, from = 6, to = 174, topT = 1): string {
  const drop = spec.skirtFrac * spec.refH;
  const steps = 28;
  const top: string[] = [];
  const bot: string[] = [];
  for (let j = 0; j <= steps; j++) {
    const a = from + ((to - from) * j) / steps;
    const [x, y] = ringPoint(spec, a, topT);
    const [, ey] = ringPoint(spec, a, 1);
    top.push(`${j === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
    bot.unshift(`L ${x.toFixed(1)} ${(ey + drop).toFixed(1)}`);
  }
  return `${top.join(' ')} ${bot.join(' ')} Z`;
}

/** Posizione gemma sul rim al separatore `i` (punto diamante). */
export function gemPoint(spec: FanRingSpec, sepAngleDeg: number): readonly [number, number] {
  return ringPoint(spec, sepAngleDeg, 1.012);
}

/** Bounding box (px ref-space) della lastra dipinta dello slot `i`
 * (span esteso con l'overlap — il painter warppa la piastra su quello). */
export function slicePaintBBox(spec: FanRingSpec, i: number, pad = 10): { x: number; y: number; w: number; h: number } {
  const { a0, a1 } = slotPaintAngles(spec, i);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let a = a0; a <= a1 + 0.001; a += (a1 - a0) / 12) {
    for (const t of [0, 1]) {
      const [x, y] = ringPoint(spec, a, t);
      x0 = Math.min(x0, x); y0 = Math.min(y0, y);
      x1 = Math.max(x1, x); y1 = Math.max(y1, y);
    }
  }
  return { x: x0 - pad, y: y0 - pad, w: x1 - x0 + 2 * pad, h: y1 - y0 + 2 * pad };
}
