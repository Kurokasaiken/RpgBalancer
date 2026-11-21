/**
 * `npm run pieces:check` — check globale piece-kit (PLAN-130 OB-2).
 * Stesso gate invocato scoped in closure:lint via checkPiecesGate.
 */
import { checkPiecesGate } from './verification/piecesGate';

const report = checkPiecesGate(process.cwd());
for (const w of report.warnings) console.error(` ⚠ ${w}`);
if (report.errors.length > 0) {
  console.error('pieces:check fallito:');
  for (const e of report.errors) console.error(` • ${e}`);
  process.exitCode = 1;
} else {
  console.log(`pieces:check OK (${report.checked.length} pezzi).`);
}
