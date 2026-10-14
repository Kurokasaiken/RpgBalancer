/**
 * resolvers.ts — S3: varianti di risoluzione per l'esperimento Re A/B/C.
 *
 * REGOLA (r003): il `resolve` canonico del metaLayer e' sigillato. Queste
 * varianti sono OBSERVED-ADAPTER di ricerca — istanze separate scelte a
 * runtime, mai promosse a engine senza RFC del Director. Il confronto e'
 * matched-seed sulle stesse condizioni iniziali; i draw RNG delle varianti
 * arrivano da uno stream dedicato ('resolve'), quindi non perturbano gli
 * altri sottosistemi. I draw canonici della sessione restano consumati
 * (i resolver si applicano sull'evento quest-resolved, dopo la risoluzione
 * interna — la divergenza canonico/variante viene registrata come metrica).
 *
 * I tre modelli confrontati (desiderata D4):
 *   A — canonico: failChance = mid(riskBand) + gate discreto (−0.1/0/+0.15).
 *   B — continuo: power interpola la banda authored linearmente
 *       (power 0 → hi, power ≥ ref → lo), poi penalita'/bonus gate sopra.
 *       Le statistiche spostano la probabilita' in modo continuo.
 *   C — ibrido: failChance canonica invariata (preparazione/info = accesso
 *       e rischio iniziale discreti); il power modula la QUALITA'
 *       dell'esito: shrink della zona epic-fail e almost, zona big-win
 *       allargata. Le capacita' del gruppo influenzano l'efficacia del
 *       tentativo, non la probabilita' di riuscita.
 */
import {
  resolveOutcome,
  gateAdjustedFailChance,
  type GateEvaluation,
  type HarmOutcome,
  type QuestOutcome,
} from '../../src/engine/metaLayer/engine';
import type {
  MetaLayerTuning,
  OfferDef,
} from '../../src/balancing/config/metaLayer/schema';

export type ResolverModel = 'A' | 'B' | 'C';

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** Soglia over-qualified del tier (la stessa tabella del gate canonico). */
function tierRef(offer: OfferDef, tuning: MetaLayerTuning): number {
  return offer.tier === 1 ? tuning.overQualifiedPower.t1
    : offer.tier === 2 ? tuning.overQualifiedPower.t2
    : tuning.overQualifiedPower.t3;
}

/**
 * failChance sotto il modello scelto — lo stesso numero che la card
 * mostrerebbe se il mondo funzionasse cosi' (scoutedFail lo usa).
 * A e C coincidono col canonico; B interpola la raw band via power.
 */
export function variantFailChance(
  offer: OfferDef,
  gate: GateEvaluation,
  tuning: MetaLayerTuning,
  power: number,
  model: ResolverModel,
): number {
  if (model !== 'B') return gateAdjustedFailChance(offer, gate, tuning);
  const [lo, hi] = offer.riskBand;
  const ref = tierRef(offer, tuning);
  const norm = Math.min(1, Math.max(0, power / ref));
  let f = hi - (hi - lo) * norm;
  if (gate.state === 'underprepared') f += tuning.underpreparedFailPenalty;
  if (power >= ref) f -= tuning.overQualifiedFailBonus;
  return clamp01(f);
}

/**
 * Risolve una quest sotto il modello scelto. La struttura del tiro e'
 * identica al canonico (roll unico + zone outcomeTable + harm condizionato
 * al fail con epicFailHarmScale); cambia solo cosa entra in failChance (B)
 * o nella outcome table (C). A delega al canonico.
 */
export function resolveVariant(
  offer: OfferDef,
  gate: GateEvaluation,
  tuning: MetaLayerTuning,
  power: number,
  model: ResolverModel,
  rng: () => number,
): { outcome: QuestOutcome; harm: HarmOutcome } {
  if (model === 'A') return resolveOutcome(offer, gate, tuning, rng);

  const failChance = variantFailChance(offer, gate, tuning, power, model);
  const t = { ...tuning.outcomeTable };
  if (model === 'C') {
    const norm = Math.min(1, Math.max(0, power / tierRef(offer, tuning)));
    t.epicFailBelow *= 1 - norm;                    // coda catastrofica → 0
    t.almostBelow *= 1 - norm / 2;                  // meno "quasi", piu' win piene
    t.bigWinAbove = 1 - (1 - t.bigWinAbove) * (1 - norm / 2); // zona big-win +50%
  }

  const roll = rng();
  let outcome: QuestOutcome;
  if (roll < failChance) {
    outcome = roll < failChance * t.epicFailBelow ? 'epic-fail' : 'fail';
  } else if (roll >= t.bigWinAbove) {
    outcome = 'big-win';
  } else {
    const intoSuccess = roll - failChance;
    outcome =
      intoSuccess < (1 - failChance) * t.almostBelow ? 'almost' : 'win';
  }

  if (outcome !== 'fail' && outcome !== 'epic-fail') {
    return { outcome, harm: 'none' };
  }
  const scale = outcome === 'epic-fail' ? tuning.epicFailHarmScale : 1;
  const deathP = Math.min(1, offer.harmProfile.death * scale);
  const woundP = Math.min(1, offer.harmProfile.wound * scale);
  const h = rng();
  if (h < deathP) return { outcome, harm: 'death' };
  if (h < deathP + woundP) return { outcome, harm: 'wound' };
  return { outcome, harm: outcome === 'epic-fail' ? 'wound' : 'none' };
}
