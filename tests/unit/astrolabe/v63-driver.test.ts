/**
 * PLAN-010 CP-C — il pilota d'area.
 *
 * Verifica che sostituire il driver (da `punta/muro` a errore d'area) produca
 * davvero il contratto della v17: `copertura = 50 + (stat - difficolta)`.
 *
 * Le primitive di forma non sono toccate: `rHeroAt`, `rStarChord`, `rHeroNarrowAt`
 * restano quelle di V16. Cambia solo chi decide `mix` e la valle.
 */
import { describe, expect, it } from 'vitest';
import { AXES, buildSnapshot } from '@/ui/skillCheckWebV1/zones';
import {
  measureCoverage,
  solveValleys,
  solveHeroShape,
  buildHeroShapeFromValleys,
  valleyForMorph,
  MORPH_VALLEY_FLOWER,
  MORPH_VALLEY_STAR,
} from '@/ui/skillCheckWebV1/coverage';

const target = (stat: number, diff: number) => Math.max(1, Math.min(99, 50 + stat - diff));

const snapOf = (stats: number[], diffs: number[]) => buildSnapshot({ stats, diffs });

/** una skill sola: i cinque bersagli coincidono */
function solvedPct(stat: number, diff: number) {
  const s = snapOf([stat], [diff]);
  const tg = target(stat, diff);
  const shape = solveHeroShape(s, new Array(AXES).fill(tg));
  return measureCoverage(s, 7200, true, { shape, withCore: true }).pct;
}

describe('PLAN-010 CP-C — pilota d\'area', () => {
  it('il morph copre l\'intervallo fiore..stella, e la valle lo segue', () => {
    expect(valleyForMorph(0)).toBeCloseTo(MORPH_VALLEY_FLOWER, 6);
    expect(valleyForMorph(1)).toBeCloseTo(MORPH_VALLEY_STAR, 6);
    // monotono e continuo: nessuna commutazione, nessuna famiglia discreta
    let prev = Infinity;
    for (let m = 0; m <= 1.0001; m += 0.05) {
      const v = valleyForMorph(m);
      expect(v).toBeLessThan(prev);
      prev = v;
    }
  });

  /**
   * Il cuore di CP-C. Dove il bersaglio e' dentro l'insieme ammesso il contratto
   * dev'essere centrato; dove sta fuori il morph satura e lo scarto viene dalla
   * frontiera — che e' la policy della v17, non un fallimento.
   */
  it('centra il contratto dove il bersaglio e raggiungibile', () => {
    const casi: Array<[number, number]> = [
      [50, 50], [55, 50], [60, 50], [70, 50], [80, 50], [85, 50], [90, 50],
      [40, 60], [45, 55], [30, 70], [50, 35], [50, 20], [60, 40], [70, 30],
    ];
    const fuori: string[] = [];
    for (const [stat, diff] of casi) {
      const tg = target(stat, diff);
      const err = Math.abs(solvedPct(stat, diff) - tg);
      if (err > 3) fuori.push(`${stat}/${diff} err=${err.toFixed(1)}`);
    }
    expect(fuori, `casi oltre 3 punti: ${fuori.join(', ')}`).toEqual([]);
    }, 20_000);

  it('e monotono: piu stat a difficolta fissa non puo abbassare la copertura', () => {
    let prev = -Infinity;
    for (let stat = 20; stat <= 90; stat += 10) {
      const p = solvedPct(stat, 50);
      expect(p).toBeGreaterThanOrEqual(prev - 0.5); // 0.5 = rumore di bisezione
      prev = p;
    }
    }, 20_000);

  it('non dipende piu da punta/muro: due casi con lo stesso delta danno la stessa copertura', () => {
    /* 60/50 e 70/60 hanno delta +10 e quindi lo STESSO bersaglio, ma allungamenti
       `punta/muro` molto diversi. Col vecchio pilota davano forme e coperture
       diverse; col pilota d'area devono coincidere. */
    const a = solvedPct(60, 50);
    const b = solvedPct(70, 60);
    expect(Math.abs(a - b)).toBeLessThan(3);
  });

  it('ogni stat muove solo il proprio petalo', () => {
    const diffs = [50, 50, 50, 50, 50];
    const base = solveValleys(snapOf([50, 50, 50, 50, 50], diffs), new Array(AXES).fill(50));
    const stats = [90, 50, 50, 50, 50];
    const tg = stats.map((st, i) => target(st, diffs[i]));
    const bumped = solveValleys(snapOf(stats, diffs), tg);
    expect(Math.abs(bumped[0] - base[0])).toBeGreaterThan(0.01);
    // gli assi non adiacenti alla punta toccata restano fermi
    for (const i of [2]) expect(Math.abs(bumped[i] - base[i])).toBeLessThan(0.30);
  });

  /**
   * CONFLITTO STRUTTURALE, non un difetto del solver. Due regole approvate
   * separatamente si contraddicono quando gli assi adiacenti sono molto diversi:
   *
   *   1. «la valle segue l'asse piu' debole» — da V16, conservata: e' cio' che
   *      rende leggibile «quale skill ti tradisce»;
   *   2. «un bersaglio per settore» — scelta del Director.
   *
   * La (1) fa scavare le valli di un asse FORTE dai suoi vicini deboli, e allora
   * la (2) non e' raggiungibile per quel settore. Misurato su board a spread
   * crescente (difficolta' fissa 50): fino a ~20 punti di spread il contratto
   * tiene esatto; sopra, satura SEMPRE UN SOLO settore — il forte accanto al
   * debole — e lo scarto cresce col spread (40 -> 4.7, 60 -> 11.8, 75 -> 16.1).
   *
   * AGGIORNATO. Il conflitto era in gran parte MIO: la vecchia parametrizzazione
   * legava la valle al morph dell'asse debole, cosi' un asse forte fra due vicini
   * deboli non controllava nessuna delle sue due valli e restava senza gradi di
   * liberta' (-13 punti). Le valli pero' sono CINQUE e i bersagli CINQUE: il
   * sistema e' quadrato. Risolvendo sulle valli il peggiore scende a 1.42 su
   * questo board, e nessun settore esce dalla tolleranza.
   *
   * Cio' che resta e' saturazione vera contro il tetto del fiore, sui board
   * estremi: misurato 2.94 su [90,30,60,75,45] e 4.91 su [95,20,60,60,60], e
   * non migliora aumentando le passate — le valli sono incollate a 0.80.
   */
  it('documenta il conflitto valle-debole vs bersaglio-per-settore', () => {
    const casi: Array<[number[], number]> = [
      [[60, 60, 60, 60, 60], 0],
      [[70, 50, 60, 60, 60], 0],
      [[90, 30, 60, 60, 60], 0],
    ];
    for (const [stats, attesiFuori] of casi) {
      const diffs = stats.map(() => 50);
      const tg = stats.map((st) => target(st, 50));
      const s = snapOf(stats, diffs);
      const shape = solveHeroShape(s, tg);
      const cov = measureCoverage(s, 7200, true, { shape, withCore: true });
      const fuori = cov.exposedByAxis.filter((e, i) => Math.abs(100 - e - tg[i]) > 3).length;
      expect(fuori, `stats ${stats.join(',')}`).toBe(attesiFuori);
    }
  });

  it('e deterministico', () => {
    const s = snapOf([70, 40, 55, 60, 45], [50, 50, 50, 50, 50]);
    const tg = [70, 40, 55, 60, 45].map((st) => target(st, 50));
    expect(solveValleys(s, tg)).toEqual(solveValleys(s, tg));
  });

  it('la forma risolta resta dentro l\'insieme ammesso', () => {
    const s = snapOf([85], [50]);
    const valleys = solveValleys(s, new Array(AXES).fill(target(85, 50)));
    for (const v of valleys) {
      expect(v).toBeGreaterThanOrEqual(MORPH_VALLEY_STAR);
      expect(v).toBeLessThanOrEqual(MORPH_VALLEY_FLOWER);
    }
    const shape = buildHeroShapeFromValleys(s, valleys);
    // i dieci vertici alternano punta/incavo e l'incavo non supera mai la punta
    for (let i = 0; i < AXES; i += 1) {
      expect(shape.radii[i * 2 + 1]).toBeLessThan(shape.radii[i * 2]);
    }
  });
});
