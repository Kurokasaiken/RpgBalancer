/**
 * PLAN-010 CP-D — contratto di copertura e policy di saturazione.
 *
 * Dove il bersaglio e' raggiungibile il contratto dev'essere centrato; dove non lo
 * e', la forma va al massimo ammesso e lo scarto resta — ma **dichiarato**. La v17
 * chiede che lo scarto sia spiegato dalla frontiera e non da una taratura
 * opportunistica, e per esserlo dev'essere ispezionabile.
 *
 * Nota su una clausola del piano: «il correttore globale e' un parametro
 * documentato del modello, non un fix». Un correttore globale **non esiste** in
 * questa implementazione — il Director ha scelto un bersaglio per settore, quindi
 * ogni petalo si risolve contro il proprio e non c'e' niente da correggere dopo.
 * La clausola e' soddisfatta per assenza.
 */
import { describe, expect, it } from 'vitest';
import { buildSnapshot } from '@/ui/skillCheckWebV1/zones';
import { solveShapeReported, CONTRACT_TOLERANCE } from '@/ui/skillCheckWebV1/coverage';

const target = (stat: number, diff: number) => Math.max(1, Math.min(99, 50 + stat - diff));

/**
 * Una skill sola: i cinque settori hanno lo stesso bersaglio.
 *
 * MEMOIZZATA, e non per eleganza. Un solve costa ~86k iterazioni (4 passate x 5
 * assi x 18 bisezioni x 240 angoli), e le griglie qui sotto ne chiedono la stessa
 * cella piu' volte. Senza cache i due test piu' pesanti stavano a ~4s e sotto
 * carico sfondavano il timeout di 5s di vitest: erano flaky per costruzione, non
 * per logica — il modello e' puro e non ha nessuna sorgente di caso.
 */
const cache = new Map<string, ReturnType<typeof solveShapeReported>>();
function solveSingle(stat: number, diff: number) {
  const key = `${stat}/${diff}`;
  let v = cache.get(key);
  if (!v) {
    const s = buildSnapshot({ stats: [stat], diffs: [diff] });
    v = solveShapeReported(s, new Array(5).fill(target(stat, diff)));
    cache.set(key, v);
  }
  return v;
}

/** media dei settori: con una skill sola e' la copertura del board */
const meanAchieved = (stat: number, diff: number) => {
  const { report } = solveSingle(stat, diff);
  return report.reduce((a, r) => a + r.achieved, 0) / report.length;
};

describe('PLAN-010 CP-D — contratto e saturazione', () => {
  /**
   * L'invariante che rende la policy onesta: uno scarto non dichiarato non deve
   * esistere. Se un settore manca il bersaglio di piu' della tolleranza, il
   * verbale deve dire contro quale frontiera si e' fermato.
   */
  it('non esiste scarto muto: oltre la tolleranza, la frontiera e sempre dichiarata', () => {
    const muti: string[] = [];
    for (let stat = 10; stat <= 90; stat += 10) {
      for (let diff = 10; diff <= 90; diff += 10) {
        for (const r of solveSingle(stat, diff).report) {
          if (Math.abs(r.residual) > CONTRACT_TOLERANCE && r.saturated === 'none') {
            muti.push(`${stat}/${diff} asse${r.axis} res=${r.residual}`);
          }
        }
      }
    }
    expect(muti, `scarti non spiegati: ${muti.slice(0, 8).join(', ')}`).toEqual([]);
  }, 20_000);

  it('nella regione raggiungibile il contratto e centrato', () => {
    const fuori: string[] = [];
    for (let stat = 20; stat <= 90; stat += 10) {
      for (let diff = 20; diff <= 80; diff += 10) {
        const { report } = solveSingle(stat, diff);
        for (const r of report) {
          if (r.saturated === 'none' && Math.abs(r.residual) > CONTRACT_TOLERANCE) {
            fuori.push(`${stat}/${diff} asse${r.axis} res=${r.residual}`);
          }
        }
      }
    }
    expect(fuori, `non saturi ma fuori tolleranza: ${fuori.slice(0, 8).join(', ')}`).toEqual([]);
  }, 20_000);

  /* Le due monotonie vanno verificate SEPARATAMENTE: differenze locali piccole non
     dimostrano monotonia, e monotonia su un asse non dice niente sull'altro. */

  it('monotona lungo stat a difficolta fissa', () => {
    for (const diff of [30, 50, 70]) {
      let prev = -Infinity;
      for (let stat = 10; stat <= 90; stat += 10) {
        const p = meanAchieved(stat, diff);
        expect(p, `diff=${diff} stat=${stat}`).toBeGreaterThanOrEqual(prev - 0.5);
        prev = p;
      }
    }
  });

  it('monotona lungo difficolta a stat fissa (piu difficile, meno copertura)', () => {
    for (const stat of [30, 50, 70]) {
      let prev = Infinity;
      for (let diff = 10; diff <= 90; diff += 10) {
        const p = meanAchieved(stat, diff);
        expect(p, `stat=${stat} diff=${diff}`).toBeLessThanOrEqual(prev + 0.5);
        prev = p;
      }
    }
  });

  it('senza discontinuita: due celle adiacenti non saltano', () => {
    const salti: string[] = [];
    for (let stat = 20; stat <= 80; stat += 10) {
      for (let diff = 20; diff <= 80; diff += 10) {
        const qui = meanAchieved(stat, diff);
        const dopo = meanAchieved(stat + 10, diff);
        /* il bersaglio stesso si muove di 10 punti fra due celle: il salto della
           copertura non deve superarlo di piu' della tolleranza */
        if (Math.abs(dopo - qui) > 10 + CONTRACT_TOLERANCE) {
          salti.push(`${stat}->${stat + 10}/${diff}: ${qui.toFixed(1)}->${dopo.toFixed(1)}`);
        }
      }
    }
    expect(salti, `salti: ${salti.slice(0, 6).join(', ')}`).toEqual([]);
  }, 20_000);

  /**
   * L'invariante «nessuno scarto muto» va verificato anche sui board MULTI-SKILL:
   * li' i settori sono accoppiati dalle valli condivise e il rilassamento puo'
   * lasciare una coda. Misurato: con il guadagno fisso la coda stava a ~3.2 punti,
   * sotto tolleranza a skill singola ma SOPRA su un board sbilanciato — cioe'
   * esattamente uno scarto muto, che questo test prende e il precedente no.
   */
  it('nessuno scarto muto nemmeno sui board multi-skill', () => {
    const boards = [
      [90, 30, 60, 75, 45],
      [95, 20, 60, 60, 60],
      [80, 80, 20, 20, 50],
      [60, 60, 60, 60, 60],
    ];
    const muti: string[] = [];
    for (const stats of boards) {
      const diffs = stats.map(() => 50);
      const s = buildSnapshot({ stats, diffs });
      const { report } = solveShapeReported(s, stats.map((st) => target(st, 50)));
      for (const r of report) {
        if (Math.abs(r.residual) > CONTRACT_TOLERANCE && r.saturated === 'none') {
          muti.push(`[${stats.join(',')}] a${r.axis} res=${r.residual}`);
        }
      }
    }
    expect(muti, `scarti muti: ${muti.join(', ')}`).toEqual([]);
  }, 20_000);

  it('la saturazione dichiara la frontiera giusta', () => {
    /* bersaglio 1% con la punta molto piu' corta del muro: copre comunque troppo,
       quindi si ferma contro la frontiera STELLA (la forma piu' magra ammessa) */
    const basso = solveSingle(20, 80).report.find((r) => r.saturated !== 'none');
    if (basso) {
      expect(basso.saturated).toBe('star');
      expect(basso.residual).toBeGreaterThan(0); // copre PIU' del bersaglio
    }
  });
});
