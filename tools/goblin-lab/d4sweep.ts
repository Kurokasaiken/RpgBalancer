/**
 * D4 sweep (S0 — WITNESS-05): quantifica la "dead zone" del gate canonico
 * sull'offerta `king-assault`. Misura, non asserzione.
 *
 * Per ogni valore di partyPower calcola gate state e failChance canonici
 * (evaluateGateState + gateAdjustedFailChance), tenendo fissi i requisiti
 * non-stat (intel:king-lair presente, for>=8) così che solo il potere vari.
 *
 * Uso: npx tsx tools/goblin-lab/d4sweep.ts
 */

import {
  evaluateGateState,
  gateAdjustedFailChance,
  initialWorldState,
  partyPower,
  type PartyCapability,
} from '../../src/engine/metaLayer/engine';
import { LAB_META_CONFIG } from './labContent';

const king = LAB_META_CONFIG.offers.find((o) => o.id === 'king-assault')!;
const tuning = LAB_META_CONFIG.tuning;

/** Mondo con intel:king-lair già acquisito (requisito capability soddisfatto). */
const worldWithIntel = initialWorldState(LAB_META_CONFIG);
worldWithIntel.qualities['intel:king-lair'] = 1;

/** Party "minimo qualificato": for=8 (req cost), caps scelte per il power. */
function partyAtPower(power: number): PartyCapability {
  // power = somma stat + 2*caps. for=8 + ast/car = resto in stat, 0 caps.
  const rest = Math.max(0, power - 8);
  return {
    leaders: 1,
    stats: { for: 8, ast: Math.ceil(rest / 2), car: Math.floor(rest / 2) },
    capabilities: [],
    explorerQuality: 0.5,
  };
}

console.log('power | gate           | failChance | P(≥1 win in 5 tentativi)');
console.log('------|----------------|------------|-------------------------');
let prev = '';
for (let p = 0; p <= 50; p++) {
  const party = partyAtPower(p);
  const gate = evaluateGateState(king, party, worldWithIntel, tuning);
  const fail = gateAdjustedFailChance(king, gate, tuning);
  const pw = partyPower(party, tuning);
  const p5 = 1 - Math.pow(fail, 5);
  const row = `${String(pw).padStart(5)} | ${gate.state.padEnd(14)} | ${fail.toFixed(2)}       | ${(p5 * 100).toFixed(1)}%`;
  // stampa solo i cambi di stato (la dead zone e' una riga sola)
  const key = `${gate.state}|${fail}`;
  if (key !== prev || p === 0 || p === 50) { console.log(row); prev = key; }
}

// Anche il ramo underprepared (for<8): power alto ma requisito mancante.
const weak: PartyCapability = {
  leaders: 1, stats: { for: 5, ast: 20, car: 15 }, capabilities: [],
  explorerQuality: 0.5,
};
const gWeak = evaluateGateState(king, weak, worldWithIntel, tuning);
console.log(`\nfor=5 ast=20 car=15 (power ${partyPower(weak, tuning)}, manca req for>=8):`);
console.log(`  gate=${gWeak.state}  fail=${gateAdjustedFailChance(king, gWeak, tuning).toFixed(2)}`);
console.log(`\nSoglia over-qualified t3 = ${tuning.overQualifiedPower.t3}.`);
