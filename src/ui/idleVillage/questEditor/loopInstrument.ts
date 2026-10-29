/**
 * questEditor/loopInstrument — dev-only edit→probe→observe loop counter
 * (PLAN-102 D7): timestamps op-apply and re-seed; exposes `__qgeLoop`
 * (roundtrips/min) on window. Falsifies the "<2min" claim and feeds the
 * live-probe falsifier (re-seed+renavigate ≤2 interactions → probe v2).
 */
interface LoopEvent { kind: 'op' | 'reseed' | 'observe'; t: number }
const buf: LoopEvent[] = [];

export function loopEvent(kind: LoopEvent['kind']): void {
  buf.push({ kind, t: Date.now() });
  if (buf.length > 400) buf.shift();
}

/** A roundtrip = op → reseed → observe within the window. */
export function roundtripsPerMin(windowMin = 5): number {
  const now = Date.now();
  const evs = buf.filter((e) => now - e.t < windowMin * 60_000);
  let trips = 0;
  for (let i = 0; i + 2 < evs.length; i++) {
    if (evs[i].kind === 'op' && evs[i + 1].kind === 'reseed' && evs[i + 2].kind === 'observe') trips++;
  }
  return trips / windowMin;
}

/** Interactions between op and observe (the probe falsifier metric). */
export function interactionsPerProbe(): number {
  const ops = buf.filter((e) => e.kind === 'reseed').length;
  return ops; // each re-seed = 1 interaction by construction
}

if (typeof window !== 'undefined') {
  (window as unknown as { __qgeLoop: object }).__qgeLoop = { buf, roundtripsPerMin, interactionsPerProbe };
}
