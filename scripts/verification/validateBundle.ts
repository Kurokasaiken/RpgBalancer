/**
 * validateBundle — ri-valida un bundle.json da disco (C2 lato gate).
 * Ricomputa hash di manifest e artefatti; exit != 0 se il bundle non regge.
 *
 * Uso: tsx scripts/verification/validateBundle.ts --bundle=<path>/bundle.json
 */
import path from 'node:path';
import { validateBundleFile } from './gateCore';

function main(): void {
  const arg = process.argv.slice(2).find((a) => a.startsWith('--bundle='));
  if (!arg) {
    console.error('Uso: tsx scripts/verification/validateBundle.ts --bundle=<path>');
    process.exit(2);
  }
  const bundlePath = path.resolve(arg.split('=').slice(1).join('='));
  const result = validateBundleFile(bundlePath);
  if (result.ok) {
    console.log(`Bundle valido: ${bundlePath}`);
    process.exit(0);
  }
  console.error('Bundle NON valido:');
  result.reasons.forEach((r) => console.error(`  • ${r}`));
  process.exit(1);
}

main();
