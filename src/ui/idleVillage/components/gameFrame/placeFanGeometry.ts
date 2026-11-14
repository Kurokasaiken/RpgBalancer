/**
 * placeFanGeometry — geometria pura del ventaglio di carte del Luogo
 * (PLAN-117 sub-plan F2-T1, mockup `mockup-hub-fan-village.jpg` + ruling Director).
 *
 * Contratto stabile (testabile in jsdom, niente DOM qui):
 * - Il layout NON è un ventaglio parametrico: è una SLOT MAP misurata sul
 *   mockup approvato — 14 posizioni con centro, rotazione, dimensione e
 *   z-order propri (ruling: «non un disco perfetto», 2026-11-14).
 * - Le coordinate sono frazioni di uno spazio di riferimento `refW × refH`
 *   (i pixel del mockup); il componente scala l'intera composizione in modo
 *   uniforme preservando `refW/refH`.
 * - `slots` è in DRAW ORDER (back → front): lo zIndex è l'indice.
 * - `fillOrder` indica quali slot possono ospitare attività e in quale ordine
 *   vengono riempiti (ordine di lettura sinistra → destra del mockup);
 *   gli slot non in `fillOrder` sono socket permanenti (piastra ▲).
 *   Slot attività senza attività assegnata → piastra vuota renderizzata
 *   comunque (ruling «slot vuoto comunque renderizzato»).
 * - Capienza attività = `fillOrder.length`; oltre → overflow al planner.
 */
import { PLACES_CONFIG } from '@/balancing/config/idleVillage/placesConfig';

/** Una posizione-carta misurata sul mockup (frazioni dello spazio di riferimento). */
export interface FanSlotSpec {
  readonly x: number;
  readonly y: number;
  readonly rotateDeg: number;
  readonly wFrac: number;
  readonly hFrac: number;
}

/** Geometria del ventaglio — spec config-first (placesConfig.fanCards). */
export interface FanCardsSpec {
  readonly refW: number;
  readonly refH: number;
  readonly slots: readonly FanSlotSpec[];
  readonly fillOrder: readonly number[];
  readonly diorama: { readonly x: number; readonly y: number; readonly hFrac: number };
}

/** Spec di produzione letta dal config (deep-frozen). */
export const FAN_CARDS: FanCardsSpec = PLACES_CONFIG.fanCards;

/** Pose di una posizione-carta risolta per il render. */
export interface FanCardPose extends FanSlotSpec {
  /** Indice nello slot map (indice = draw order, back → front). */
  readonly index: number;
  /** True se lo slot può ospitare un'attività (presente in fillOrder). */
  readonly activityCapable: boolean;
  /** Posizione dello slot dentro fillOrder (−1 per i socket permanenti). */
  readonly fillRank: number;
  readonly zIndex: number;
}

/** Pose di tutti gli slot in draw order. */
export function fanCardPoses(spec: FanCardsSpec = FAN_CARDS): FanCardPose[] {
  return spec.slots.map((s, i) => ({
    ...s,
    index: i,
    activityCapable: spec.fillOrder.includes(i),
    fillRank: spec.fillOrder.indexOf(i),
    zIndex: i,
  }));
}

/** Numero di slot che possono ospitare attività. */
export function fanActivityCapacity(spec: FanCardsSpec = FAN_CARDS): number {
  return spec.fillOrder.length;
}

/**
 * Assegnazione STABILE: attività[i] → slot `fillOrder[i]`.
 * Torna una mappa allineata a `slots` (null = posizione senza attività,
 * renderizzata come piastra ▲) e l'overflow oltre capienza.
 */
export function assignFanCards<T>(
  activities: readonly T[],
  spec: FanCardsSpec = FAN_CARDS,
): { slots: (T | null)[]; overflow: T[] } {
  const slots: (T | null)[] = spec.slots.map(() => null);
  const capacity = spec.fillOrder.length;
  activities.slice(0, capacity).forEach((a, i) => {
    slots[spec.fillOrder[i]] = a;
  });
  return { slots, overflow: activities.slice(capacity) };
}

/** Wrap tastiera lungo il fillOrder (solo slot activity-capable). */
export function nextFanSlot(fillRank: number, dir: 1 | -1, spec: FanCardsSpec = FAN_CARDS): number {
  const n = spec.fillOrder.length;
  return ((fillRank + dir) % n + n) % n;
}

/** Aspect ratio dello spazio di riferimento (per il contenitore letterbox). */
export function fanRefAspect(spec: FanCardsSpec = FAN_CARDS): number {
  return spec.refW / spec.refH;
}

/** Pose del diorama centrale (sopra tutte le carte). */
export function fanDioramaPose(spec: FanCardsSpec = FAN_CARDS): {
  x: number; y: number; hFrac: number; zIndex: number;
} {
  return { ...spec.diorama, zIndex: spec.slots.length };
}
