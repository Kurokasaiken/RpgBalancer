#!/usr/bin/env tsx
/**
 * contracts:check — report + gate file→superficie (PLAN-044 T-002).
 *
 * Stampa i file toccati mappati, gli expected_checks richiesti e i file
 * non mappati; exit 1 se esistono violazioni (unmapped senza disposition,
 * diff mappa non approvata, anti-glob non confermato).
 *
 * CLI:
 *   tsx scripts/contractsCheck.ts [--root DIR] [--diff f1,f2,...]
 */
import path from 'node:path';
import { checkContractsGate } from './verification/contractsCheck';

const rootIdx = process.argv.indexOf('--root');
const root = rootIdx >= 0 ? path.resolve(process.argv[rootIdx + 1]) : process.cwd();
const diffIdx = process.argv.indexOf('--diff');
const diff = diffIdx >= 0 ? process.argv[diffIdx + 1].split(',').filter(Boolean) : undefined;

const report = checkContractsGate(root, { changedFiles: diff });

console.log(
  `contracts:check — ${report.changed_files.length} file toccati (baseline HEAD` +
    `${report.evaluated_by === 'head-gate' ? ', gate valutato dalla versione committata' : ''})`,
);
for (const g of report.gate_files ?? []) {
  console.log(`  gate-file ${g.file} → ${g.via}`);
}
if (report.exempt_files.length) {
  console.log(`  exempt (artefatti del gate): ${report.exempt_files.length}`);
}
for (const m of report.mapped) {
  console.log(`  mapped   ${m.file} → ${m.surfaces.join(', ')}`);
}
for (const d of report.dispositioned) {
  console.log(`  disposed ${d.file} → ${d.via}`);
}
for (const f of report.unmapped) {
  console.log(`  UNMAPPED ${f}`);
}
if (report.required_checks.length) {
  console.log(`\nCheck/evidence richieste (expected_checks delle superfici toccate):`);
  for (const c of report.required_checks) console.log(`  • ${c}`);
}
if (report.errors.length === 0) {
  console.log('\ncontracts:check OK');
} else {
  console.error('\ncontracts:check FAILED:');
  for (const e of report.errors) console.error(`  • ${e}`);
  process.exit(1);
}
