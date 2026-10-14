/**
 * scenario.ts — L2 Scenario layer del goblin lab (r003 S1).
 *
 * Uno scenario = patch dati ORDINATA sopra le config esistenti
 * (LAB_META_CONFIG + CFG del lab). La patch può modificare SOLO valori
 * dati già definiti negli schema — mai campi nuovi, mai semantica
 * (quella vive solo in adapter OBSERVED-ADAPTER). Il risultato viene
 * ri-validato dallo Zod canonico; reject-never-coerce.
 *
 * Regola tuning-vs-meccanica (dissenso grok → criterio di audit):
 * cambiare un VALORE authored (riskBand, harmProfile, weight, timer,
 * tuning) è bilanciamento; cambiare la FORMULA è meccanica e richiede
 * un adapter esplicito + approvazione Director.
 *
 * Ogni target è risolto a compile-of-run time: path inesistente → throw.
 *
 * Target grammar:
 *   offer.<offerId>.<path>      — singolo OfferDef (incl. array: requires.0.min)
 *   family.<familyId>.<path>    — tutte le OfferDef della famiglia
 *   familydef.<famId>.<path>    — FamilyDef (stopCondition.value, ...)
 *   clock.<key>.<path>          — ClockDef (es. clock.clock:king.periodTicks)
 *   tuning.<key>                — MetaLayerTuning (incl. nested: overQualifiedPower.t3)
 *   cfg.<path>                  — config lab (popCap, eatPer, rewards, partySize...)
 *   meta.<path>                 — escape hatch: qualunque path di MetaLayerConfig
 *                                 (offers.0.riskBand, milestones.0.approaches.1.0...)
 *                                 sempre ri-validato dallo schema .strict()
 *
 * Ops: { set: v } | { mul: f } | { add: d } — set accetta qualunque valore
 * JSON (la ri-validazione Zod strict rifiuta campi/tipi non canonici);
 * mul/add solo su numeri.
 */

import { MetaLayerConfigSchema, type MetaLayerConfig } from '../../src/balancing/config/metaLayer/schema';

/** Hash deterministico del config risolto (FNV-1a 64-bit — identità dello
 *  scenario, non crittografia). Portabile in browser (niente node:crypto). */
function stableHash(input: string): string {
  let h = 0xcbf29ce484222325n;
  for (let i = 0; i < input.length; i++) {
    h = ((h ^ BigInt(input.charCodeAt(i))) * 0x100000001b3n) & 0xffffffffffffffffn;
  }
  return h.toString(16).padStart(16, '0');
}

export interface PatchOp {
  /** Percorso tipato del target (vedi grammar sopra). */
  target: string;
  /** Operazione: set (sostituisci — qualunque valore JSON validato dallo
   *  schema a valle), mul (moltiplica numero), add (somma a numero). */
  set?: unknown;
  mul?: number;
  add?: number;
}

export interface Scenario {
  id: string;
  description: string;
  /** Patch applicate IN ORDINE sulle config base. */
  ops: PatchOp[];
}

export interface ResolvedScenario {
  scenarioId: string;
  /** Config metaLayer risolta e ri-validata dallo schema canonico. */
  meta: MetaLayerConfig;
  /** Config lab risolta (record generico — i tipi restano in lab.ts). */
  cfg: Record<string, unknown>;
  /** sha256 del config risolto (canonical JSON) — identità dello scenario. */
  configHash: string;
}

/** Root dei campi OfferDef patchabili (whitelist — solo valori dati).
 *  Path dentro array/liste ammessi: requires.0.min, provides.1.delta, ... */
const OFFER_ROOTS = new Set([
  'riskBand', 'harmProfile', 'weight', 'durationTicks', 'acceptanceTicks',
  'completionTicks', 'repeatCooldownTicks', 'tier', 'repeatable',
  'requires', 'provides', 'providesOnAlmost', 'appearsWhen', 'unlockRoute',
]);

function getPath(obj: unknown, path: string[]): unknown {
  let cur: unknown = obj;
  for (const k of path) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[k];
  }
  return cur;
}

function setPath(obj: Record<string, unknown>, path: string[], v: unknown): void {
  let cur = obj;
  for (const k of path.slice(0, -1)) {
    const nxt = cur[k];
    if (nxt == null || typeof nxt !== 'object') throw new Error(`path non oggetto: ${path.join('.')}`);
    cur = nxt as Record<string, unknown>;
  }
  cur[path[path.length - 1]] = v;
}

function applyOp(cur: unknown, op: PatchOp): unknown {
  const nOps = Number(op.set !== undefined) + Number(op.mul !== undefined) + Number(op.add !== undefined);
  if (nOps !== 1) throw new Error(`patch op ambigua (una sola di set/mul/add): ${op.target}`);
  if (op.set !== undefined) {
    // Guard: set non puo' cambiare il tipo di un campo esistente — il cfg
    // non ha schema Zod, questo e' l'unico controllo (per meta.* e offer.*
    // lo schema strict a valle re-valida comunque).
    if (cur !== undefined && typeof op.set !== typeof cur) {
      throw new Error(`set cambia tipo ${typeof cur}→${typeof op.set}: ${op.target}`);
    }
    return op.set;
  }
  if (typeof cur !== 'number') throw new Error(`mul/add su non-numero: ${op.target} = ${JSON.stringify(cur)}`);
  if (op.mul !== undefined) return cur * op.mul;
  return cur + op.add!;
}

/** Trova per id/key in un array di def, o throw. */
function findByKey<T extends Record<string, unknown>>(
  arr: T[], keyField: string, sel: string, what: string, target: string,
): T {
  const hit = arr.find((x) => x[keyField] === sel);
  if (!hit) throw new Error(`${what} inesistente: ${target}`);
  return hit;
}

/**
 * Applica una patch ordinata a {meta, cfg} e ri-valida il risultato.
 * Throw su: target inesistente, campo non in whitelist, op ambigua,
 * config risolta che non passa lo schema Zod canonico.
 */
export function applyScenario(
  scenario: Scenario,
  baseMeta: MetaLayerConfig,
  baseCfg: Record<string, unknown>,
): ResolvedScenario {
  const meta = JSON.parse(JSON.stringify(baseMeta)) as MetaLayerConfig;
  // Deep clone che preserva le funzioni (CFG contiene trnCost/trainCost —
  // JSON.clone le distruggerebbe). Le funzioni sono condivise immutabili.
  const deepClone = <T>(v: T): T => {
    if (v === null || typeof v !== 'object') return v;
    if (Array.isArray(v)) return v.map(deepClone) as T;
    const o: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v)) o[k] = deepClone(x);
    return o as T;
  };
  const cfg = deepClone(baseCfg);

  for (const op of scenario.ops) {
    const [ns, ...rest] = op.target.split('.');
    if (ns === 'tuning') {
      const cur = getPath(meta.tuning, rest);
      if (cur === undefined) throw new Error(`tuning target inesistente: ${op.target}`);
      setPath(meta.tuning as unknown as Record<string, unknown>, rest, applyOp(cur, op));
    } else if (ns === 'cfg') {
      const cur = getPath(cfg, rest);
      if (cur === undefined) throw new Error(`cfg target inesistente: ${op.target}`);
      // Funzioni = meccanica (trnCost/trainCost): non patchabili come dati.
      if (typeof cur === 'function') {
        throw new Error(`cfg target funzione (meccanica, non dato): ${op.target}`);
      }
      setPath(cfg, rest, applyOp(cur, op));
    } else if (ns === 'familydef') {
      const [sel, ...fp] = rest;
      const fam = findByKey(
        meta.families as unknown as Record<string, unknown>[], 'id', sel, 'familydef', op.target);
      const cur = getPath(fam, fp);
      if (cur === undefined) throw new Error(`campo inesistente su familydef ${sel}: ${fp.join('.')}`);
      setPath(fam, fp, applyOp(cur, op));
    } else if (ns === 'clock') {
      const [sel, ...fp] = rest;
      const clk = findByKey(
        meta.clocks as unknown as Record<string, unknown>[], 'key', sel, 'clock', op.target);
      const cur = getPath(clk, fp);
      if (cur === undefined) throw new Error(`campo inesistente su clock ${sel}: ${fp.join('.')}`);
      setPath(clk, fp, applyOp(cur, op));
    } else if (ns === 'meta') {
      // Escape hatch generico: qualunque path di MetaLayerConfig — la
      // ri-validazione Zod strict rifiuta risultati non canonici.
      const cur = getPath(meta, rest);
      if (cur === undefined) throw new Error(`meta target inesistente: ${op.target}`);
      setPath(meta as unknown as Record<string, unknown>, rest, applyOp(cur, op));
    } else if (ns === 'offer' || ns === 'family') {
      const [selector, ...fieldPath] = rest;
      const root = fieldPath[0];
      if (!OFFER_ROOTS.has(root)) {
        throw new Error(`campo offerta non patchabile: ${root} (whitelist: ${[...OFFER_ROOTS].join(', ')})`);
      }
      const targets = meta.offers.filter((o) =>
        ns === 'offer' ? o.id === selector : o.family === selector);
      if (!targets.length) throw new Error(`target senza offerte: ${op.target}`);
      for (const o of targets) {
        const cur = getPath(o, fieldPath);
        if (cur === undefined) throw new Error(`campo inesistente su ${o.id}: ${fieldPath.join('.')}`);
        setPath(o as unknown as Record<string, unknown>, fieldPath, applyOp(cur, op));
      }
    } else {
      throw new Error(`namespace patch sconosciuto: ${ns} (offer|family|familydef|clock|tuning|cfg|meta)`);
    }
  }

  // Ri-validazione canonica — reject, never coerce.
  const validated = MetaLayerConfigSchema.parse(meta);
  const hash = stableHash(JSON.stringify({ scenario: scenario.id, meta: validated, cfg }));
  return { scenarioId: scenario.id, meta: validated, cfg, configHash: hash };
}

/* ------------------------------------------------------------------ */
/* Scenari dimostrativi (dati, non meccaniche)                          */
/* ------------------------------------------------------------------ */

export const SCENARIOS: Record<string, Scenario> = {
  base: {
    id: 'base', description: 'Config canonica del lab, nessuna patch',
    ops: [],
  },
  /** Mondo più letale: harmProfile ×1.5 su delve, Re più rischioso,
   *  ferite più lunghe (tier moderate/severe raddoppiati). */
  deadly: {
    id: 'deadly',
    description: 'harmProfile ×1.5 su delve, riskBand Re ↑, ferite più lunghe',
    ops: [
      { target: 'family.delve.harmProfile.wound', mul: 1.5 },
      { target: 'family.delve.harmProfile.death', mul: 1.5 },
      // king-assault ha harmProfile saturo (w+ d = 1.0): lo schema canonico
      // vieta di alzarlo — la leva letalità sul Re è il riskBand.
      { target: 'offer.king-assault.riskBand', set: [0.5, 0.8] },
      { target: 'cfg.injuryTiers.moderate', set: 6 },
      { target: 'cfg.injuryTiers.severe', set: 14 },
      { target: 'cfg.injuryTiers.light', set: 2 },
    ],
  },
  /** Meno migranti: access:recruitment più raro + popCap più basso. */
  scarce: {
    id: 'scarce',
    description: 'migranti dimezzati (weight), popCap 25, cibo più caro',
    ops: [
      { target: 'family.people.weight', mul: 0.5 },
      { target: 'cfg.popCap', set: 25 },
      { target: 'cfg.eatPer', mul: 1.4 },
    ],
  },
};
