/**
 * PLAN-010 CP-B — mappa di fattibilita' del contratto.
 *
 * La domanda non e' «si puo' fare?» ma **«in quale regione esatta?»**, e va risposta
 * sul modello parametrico gia' esistente, senza implementare il morph che si vuole
 * validare. Se il contratto non e' raggiungibile in una regione, si scopre QUI e non
 * dopo averci costruito sopra dinamica, contatto e materialita'.
 *
 * Il contratto (desiderata v17): `copertura = 50 + (stat - difficolta)`, e la forma
 * e' quella che serve a produrlo.
 *
 * La manopola dell'area e' la **valle**. Il modello ammette:
 *   - il ramo stella, valle in [0.15, 0.30] (`STAR_VALLEY_SLIM..WIDE`);
 *   - il ramo fiore, oggi inchiodato a `VALLEY_F = 0.3675`.
 * La «stella cicciona» (punta acuta con valle alta) non e' costruibile: il ramo a
 * punta acuta tiene la valle <= 0.30. Il divieto del Director e' rispettato per
 * costruzione, non per disciplina.
 *
 * Questo file determina il TETTO della valle del fiore che serve a rendere EXACT
 * tutto il dominio giocabile. E' l'input diretto di CP-C.
 */
import { describe, expect, it } from 'vitest';
import { buildSnapshot } from '@/ui/skillCheckWebV1/zones';
import { measureCoverage } from '@/ui/skillCheckWebV1/coverage';
import { STAR_VALLEY_SLIM } from '@/ui/skillCheckWebV1/coverage';

/** estremi dell'insieme ammesso esplorato qui */
const VALLEY_MIN = STAR_VALLEY_SLIM; // 0.15 — la forma piu' magra del modello
const VALLEY_SWEEP_MAX = 0.95; // limite dello sweep, non una forma ammessa a priori

/** angoli: bastano per una funzione liscia, e tengono la bisezione veloce */
const ANGLES_SWEEP = 720;
const ANGLES_CHECK = 7200;

const target = (stat: number, diff: number) => Math.max(1, Math.min(99, 50 + stat - diff));

const coverageAt = (stat: number, diff: number, valleyF: number, angles = ANGLES_SWEEP) =>
  measureCoverage(buildSnapshot({ stats: [stat], diffs: [diff] }), angles, false, valleyF).pct;

/**
 * La copertura cresce con la valle (valle piu' alta = petalo piu' pieno), quindi la
 * bisezione e' lecita. Ritorna null se il bersaglio sta fuori dallo sweep.
 */
function solveValley(stat: number, diff: number, tg: number): number | null {
  if (coverageAt(stat, diff, VALLEY_SWEEP_MAX) < tg) return null; // serve piu' del massimo
  if (coverageAt(stat, diff, VALLEY_MIN) > tg) return -1; // gia' troppo col minimo
  let lo = VALLEY_MIN;
  let hi = VALLEY_SWEEP_MAX;
  for (let i = 0; i < 40; i += 1) {
    const m = (lo + hi) / 2;
    if (coverageAt(stat, diff, m) < tg) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
}

type Row = {
  caso: string;
  bersaglio: number;
  valleRichiesta: number | null;
  classe: 'EXACT' | 'SAT-alto' | 'SAT-basso';
  alTappo: boolean;
};

function mapDomain(step = 10): Row[] {
  const rows: Row[] = [];
  for (let stat = 10; stat <= 90; stat += step) {
    for (let diff = 10; diff <= 90; diff += step) {
      const tg = target(stat, diff);
      const v = solveValley(stat, diff, tg);
      rows.push({
        caso: `${stat}/${diff}`,
        bersaglio: tg,
        valleRichiesta: v === null || v === -1 ? null : +v.toFixed(3),
        classe: v === null ? 'SAT-alto' : v === -1 ? 'SAT-basso' : 'EXACT',
        // al tappo il check non si tira (desiderata v15 §8: se e' automatico, non si tira)
        alTappo: tg === 1 || tg === 99,
      });
    }
  }
  return rows;
}

describe('PLAN-010 CP-B — mappa di fattibilita', () => {
  const rows = mapDomain(10);
  const giocabili = rows.filter((r) => !r.alTappo);

  it('e\' riproducibile: stessa griglia, stessa classificazione', () => {
    const again = mapDomain(10);
    expect(again).toEqual(rows);
  });

  /**
   * Non STRETTAMENTE crescente: dove la stella ha gia' inghiottito tutta la trama la
   * copertura satura al 100% e alzare ancora la valle non aggiunge niente — misurato
   * su 50/20. Non-decrescente basta perche' la bisezione sia lecita.
   */
  it('la copertura non decresce mai al crescere della valle (la bisezione e lecita)', () => {
    for (const [stat, diff] of [[50, 50], [85, 50], [30, 70], [50, 20]] as const) {
      let prev = -Infinity;
      for (let v = VALLEY_MIN; v <= 0.9; v += 0.05) {
        const c = coverageAt(stat, diff, v);
        expect(c).toBeGreaterThanOrEqual(prev);
        prev = c;
      }
    }
  });

  it('riporta il tetto della valle che serve a coprire il dominio giocabile', () => {
    const risolti = giocabili.filter((r) => r.valleRichiesta !== null);
    const tetto = Math.max(...risolti.map((r) => r.valleRichiesta as number));
    const peggiore = risolti.find((r) => r.valleRichiesta === tetto);
    /* Per la policy di saturazione (CP-D) la classe non basta: serve il DIVARIO,
       cioe' quanto il bersaglio dista dal miglior valore ottenibile al bordo
       dell'insieme ammesso. Un caso che sfonda di 0.3 punti e uno che sfonda di 30
       non sono lo stesso problema e non chiedono la stessa risposta. */
    const fuori = giocabili
      .filter((r) => r.classe !== 'EXACT')
      .map((r) => {
        const [stat, diff] = r.caso.split('/').map(Number);
        const best = r.classe === 'SAT-alto'
          ? coverageAt(stat, diff, VALLEY_SWEEP_MAX, ANGLES_CHECK)
          : coverageAt(stat, diff, VALLEY_MIN, ANGLES_CHECK);
        return { ...r, ottenibile: +best.toFixed(1), divario: +Math.abs(best - r.bersaglio).toFixed(1) };
      })
      .sort((a, b) => b.divario - a.divario);
    // eslint-disable-next-line no-console
    if (fuori.length) console.table(fuori.map(({ caso, bersaglio, classe, ottenibile, divario }) => ({ caso, bersaglio, classe, ottenibile, divario })));

    // eslint-disable-next-line no-console
    console.log(
      [
        '',
        `casi giocabili (bersaglio non al tappo): ${giocabili.length}`,
        `  EXACT ......... ${giocabili.filter((r) => r.classe === 'EXACT').length}`,
        `  SAT-alto ...... ${giocabili.filter((r) => r.classe === 'SAT-alto').length}`,
        `  SAT-basso ..... ${giocabili.filter((r) => r.classe === 'SAT-basso').length}`,
        `TETTO DELLA VALLE richiesto: ${tetto.toFixed(3)}  (caso ${peggiore?.caso}, bersaglio ${peggiore?.bersaglio}%)`,
        fuori.length ? `FUORI BANDA: ${fuori.map((r) => `${r.caso}[${r.classe}]`).join(' ')}` : 'nessun caso fuori banda',
        '',
      ].join('\n'),
    );

    // il tetto deve esistere e restare lontano dal disco (valle -> 1 = cerchio)
    expect(Number.isFinite(tetto)).toBe(true);
    expect(tetto).toBeLessThan(0.9);
  });

  it('la soluzione trovata centra davvero il bersaglio, ad alta risoluzione', () => {
    for (const [stat, diff] of [[50, 50], [85, 50], [40, 60], [50, 20]] as const) {
      const tg = target(stat, diff);
      const v = solveValley(stat, diff, tg);
      if (v === null || v === -1) continue;
      expect(Math.abs(coverageAt(stat, diff, v, ANGLES_CHECK) - tg)).toBeLessThan(1);
    }
  });
});
