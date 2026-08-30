/**
 * PLAN-010 CP-A — harness di copertura.
 *
 * Misura la copertura sul modello geometrico REALE (`coverage.ts`), non su una
 * reimplementazione: e' l'unico modo perche' l'harness non diverga dal codice che
 * dovrebbe sorvegliare.
 *
 * Cosa questo file ASSERISCE, oggi: solo il **determinismo**. Il contratto
 * `copertura = 50 + delta` NON e' ancora asserito, perche' il pilota della forma e'
 * ancora quello di V16 (`punta/muro`) e il contratto entra in vigore con CP-D.
 * Asserirlo adesso vorrebbe dire tenere la suite rossa per design.
 *
 * La tabella stampata E' il deliverable di CP-A e l'input di CP-B: dice, caso per
 * caso, quanto la geometria attuale dista dal contratto.
 */
import { describe, expect, it } from 'vitest';
import { buildSnapshot } from '@/ui/skillCheckWebV1/zones';
import { measureCoverage } from '@/ui/skillCheckWebV1/coverage';

/** I casi che il Director ha nominato, piu' gli estremi del dominio. */
const GOLDEN: Array<[stat: number, diff: number]> = [
  [10, 90], [20, 80], [30, 70], [40, 60], [45, 55],
  [50, 50],
  [55, 50], [60, 50], [70, 50], [80, 50], [85, 50], [90, 50], [95, 50],
  [50, 35], [50, 20], [95, 30],
];

/** Il bersaglio del Director: la copertura E' la percentuale di successo. */
const target = (stat: number, diff: number) => Math.max(1, Math.min(99, 50 + stat - diff));

const coverageOf = (stat: number, diff: number, narrow: boolean) =>
  measureCoverage(buildSnapshot({ stats: [stat], diffs: [diff] }), 7200, narrow);

describe('PLAN-010 CP-A — harness di copertura', () => {
  it('e\' deterministico: stesso input, stesso report', () => {
    for (const [stat, diff] of GOLDEN) {
      for (const narrow of [false, true]) {
        const a = coverageOf(stat, diff, narrow);
        const b = coverageOf(stat, diff, narrow);
        expect(b.pct).toBe(a.pct);
        expect(b.coveredArea).toBe(a.coveredArea);
        expect(b.tramaArea).toBe(a.tramaArea);
        expect(b.exposedByAxis).toEqual(a.exposedByAxis);
      }
    }
  });

  /**
   * Con una sola skill i cinque assi NON sono equivalenti, ed e' voluto: il muro
   * porta una deformazione organica `sin(3t) + sin(5t) + sin(7t)`, e i termini a 3
   * e a 7 non sono simmetrici a cinque. L'invariante non e' «spread zero» — sarebbe
   * falsa — ma «l'unica asimmetria viene dal muro, e resta limitata».
   *
   * Caso peggiore misurato: 3.72 punti (50/50, profilo fiore). Il limite a 5 tiene
   * il margine senza lasciar passare una seconda sorgente di asimmetria: se un
   * giorno sfonda, e' entrato qualcosa che non e' il blob.
   */
  const SPREAD_MAX = 5;

  it('con una sola skill l\'asimmetria fra assi viene solo dal muro, e resta limitata', () => {
    for (const [stat, diff] of GOLDEN) {
      for (const narrow of [false, true]) {
        const { exposedByAxis } = coverageOf(stat, diff, narrow);
        const spread = Math.max(...exposedByAxis) - Math.min(...exposedByAxis);
        expect(spread).toBeLessThan(SPREAD_MAX);
      }
    }
  });

  it('ogni stat muove solo la propria punta', () => {
    const base = { stats: [50, 50, 50, 50, 50], diffs: [50, 50, 50, 50, 50] };
    const ref = measureCoverage(buildSnapshot(base), 7200, true).exposedByAxis;
    const bumped = measureCoverage(
      buildSnapshot({ ...base, stats: [90, 50, 50, 50, 50] }),
      7200,
      true,
    ).exposedByAxis;
    // l'asse 0 cambia...
    expect(Math.abs(bumped[0] - ref[0])).toBeGreaterThan(1e-3);
    // ...e i due assi non adiacenti restano fermi (2 e 3 non condividono valli con 0)
    for (const i of [2, 3]) expect(Math.abs(bumped[i] - ref[i])).toBeLessThan(1e-6);
  });

  it('riporta la distanza dal contratto (tabella, nessuna asserzione)', () => {
    const rows = GOLDEN.map(([stat, diff]) => {
      const tg = target(stat, diff);
      const flower = coverageOf(stat, diff, false).pct;
      const morph = coverageOf(stat, diff, true).pct;
      return {
        caso: `${stat}/${diff}`,
        bersaglio: tg,
        fiore: +flower.toFixed(1),
        morph: +morph.toFixed(1),
        scarto: +(morph - tg).toFixed(1),
      };
    });
    // eslint-disable-next-line no-console
    console.table(rows);
    expect(rows).toHaveLength(GOLDEN.length);
  });
});
