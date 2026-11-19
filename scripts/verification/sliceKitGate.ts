/**
 * Slice-kit receipts gate (PLAN-127 OB-12, scoped wiring r002).
 *
 * Quando la diff tocca superfici slice-kit — riconosciute per path pattern
 * meccanico, non dal registro di classificazione umano (anti-evasione) —
 * esegue `npm run slice:audit` su ogni superficie coinvolta. Record
 * mancanti, ricevute stale/forgiate, tripwire patch e matrix_coverage sotto
 * il minimo [P9] bloccano la chiusura.
 *
 * Scope (pattern meccanico):
 *   scripts/hud-real/specs/<surface>.json
 *   public/assets/ui/hud-real/slicekit/<surface>/…
 *   src/generated/slicekit/<surface>Frame.ts
 *   → audit sulla superficie: FAIL = errore.
 *   primitivo PanelFrameOrnaments / sliceKitManifest → warning: il consumo
 *   non è mappabile per-superficie meccanicamente; le superfici consumatrici
 *   pagano le ricevute alla loro prossima modifica diretta.
 *
 * Nota: `test-results/` è gitignored — i record non appaiono mai nel diff;
 * lo scope è dedotto solo da spec/manifest/primitivo (per design r003).
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';

export type SliceKitGateReport = {
  checked: string[];
  errors: string[];
  warnings: string[];
};

const AUDIT = path.join('scripts', 'hud-real', 'slice-audit.mjs');

const patterns: Array<{ re: RegExp; surface: (m: RegExpMatchArray) => string }> = [
  {
    re: /^scripts\/hud-real\/specs\/([^/]+)\.json$/,
    surface: (m) => m[1],
  },
  {
    re: /^public\/assets\/ui\/hud-real\/slicekit\/([^/]+)\//,
    surface: (m) => m[1],
  },
  {
    re: /^src\/generated\/slicekit\/([^/]+)Frame\.ts$/,
    surface: (m) => m[1],
  },
];

export function checkSliceKitGate(
  repoRoot: string,
  opts: { changedFiles?: string[] } = {},
): SliceKitGateReport {
  const report: SliceKitGateReport = { checked: [], errors: [], warnings: [] };
  const changed = opts.changedFiles ?? [];
  const surfaces = new Set<string>();
  let primitiveTouched = false;

  for (const file of changed) {
    const rel = file.split(path.sep).join('/');
    for (const p of patterns) {
      const m = rel.match(p.re);
      if (m) surfaces.add(p.surface(m));
    }
    if (/PanelFrameOrnaments|sliceKitManifest/.test(rel)) {
      primitiveTouched = true;
    }
  }
  if (primitiveTouched) {
    report.warnings.push(
      'slice-kit: primitivo cornice/consumer toccato — verifica che le ' +
        'superfici consumatrici restino integre (npm run slice:audit -- <surface>); ' +
        'le loro ricevute saranno richieste alla prossima modifica diretta',
    );
  }
  if (surfaces.size === 0) return report;

  for (const surface of surfaces) {
    report.checked.push(surface);
    const run = spawnSync(
      process.execPath,
      [path.join(repoRoot, AUDIT), surface],
      { cwd: repoRoot, encoding: 'utf8', timeout: 60_000 },
    );
    if (run.error) {
      report.errors.push(
        `slice-kit ${surface}: slice:audit non eseguito (${run.error.message})`,
      );
      continue;
    }
    if (run.status !== 0) {
      const detail = (run.stdout || '')
        .split('\n')
        .filter((l) => l.includes('✗'))
        .map((l) => l.trim())
        .join(' | ');
      report.errors.push(
        `slice-kit ${surface}: ricevute incomplete — ${detail || 'slice:audit exit ' + run.status}. ` +
          `Corri con: npm run slice:audit -- ${surface}`,
      );
    }
  }
  return report;
}
