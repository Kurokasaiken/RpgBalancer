/**
 * skin:no-adhoc-css — glob guard for the Skin/Theme invariant
 * (PLAN-122 T-3, `.windsurf/rules/00-project-invariants.md` §Skin/Theme).
 *
 * The invariant bans NEW standalone `.css` files for skins/themes: new visuals
 * go through `skinConfigRegistry` presets, never a standalone stylesheet.
 *
 * Mechanism (baseline, blocks NEW violations only): every tracked `.css` file
 * must appear in the versioned allowlist
 * `scripts/governance/registries/cssAllowlist.json` — seeded 2026-11-15 with
 * the 63 pre-existing stylesheets (global.css/tailwind entries, legacy skins,
 * module css). A `.css` file not in the list FAILS; adding a legitimate
 * non-skin stylesheet requires an allowlist entry + justification.
 *
 * Scope: tracked `*.css` (`git ls-files`) in full mode, or the paths passed
 * via `--files` in staged/selftest mode. `tests/fixtures/governance/` is
 * exempt (it contains the seeded violation fixture for --selftest).
 *
 * CLI:
 *   tsx scripts/governance/checks/skinNoAdhocCss.ts            # full scan (git ls-files)
 *   tsx scripts/governance/checks/skinNoAdhocCss.ts --files a.css b.ts
 *   tsx scripts/governance/checks/skinNoAdhocCss.ts --root DIR
 *
 * Exit 1 on any unlisted .css; 0 otherwise.
 */
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = (() => {
  const i = process.argv.indexOf('--root');
  return i >= 0 ? process.argv[i + 1] : process.cwd();
})();

const ALLOWLIST_PATH = join(ROOT, 'scripts/governance/registries/cssAllowlist.json');
const CSS_EXT = '.css';

interface Allowlist {
  allowed: string[];
  exemptDirs: string[];
}

function loadAllowlist(): Allowlist {
  if (!existsSync(ALLOWLIST_PATH)) {
    console.error(`skin:no-adhoc-css — allowlist not found at ${ALLOWLIST_PATH}`);
    process.exit(2);
  }
  const parsed = JSON.parse(readFileSync(ALLOWLIST_PATH, 'utf8')) as Partial<Allowlist>;
  return { allowed: parsed.allowed ?? [], exemptDirs: parsed.exemptDirs ?? [] };
}

function main(): void {
  const filesIdx = process.argv.indexOf('--files');
  let targets: string[];
  if (filesIdx >= 0) {
    targets = process.argv.slice(filesIdx + 1).filter((a) => !a.startsWith('--'));
  } else {
    targets = execSync('git ls-files "*.css"', { cwd: ROOT, encoding: 'utf8' })
      .split('\n')
      .filter(Boolean);
  }

  const { allowed, exemptDirs } = loadAllowlist();
  const allowedSet = new Set(allowed);
  // exemptDirs applies only to the full tracked-tree scan — in --files mode the
  // caller asked explicitly (selftest violation fixtures live under the exempt dir).
  const isExempt = (rel: string) => filesIdx < 0 && exemptDirs.some((d) => rel.startsWith(d));

  const violations: string[] = [];
  const warnings: string[] = [];
  let scanned = 0;

  for (const rel of targets) {
    const norm = rel.split('\\').join('/');
    if (!norm.endsWith(CSS_EXT)) continue; // non-css files are not this check's surface
    if (isExempt(norm)) continue;
    scanned += 1;
    if (!allowedSet.has(norm)) {
      violations.push(norm);
    }
  }

  // Allowlist hygiene (warnings only): entries that no longer exist on disk.
  if (filesIdx < 0) {
    const onDisk = new Set(targets);
    for (const a of allowed) {
      if (!onDisk.has(a)) warnings.push(`allowlisted css no longer tracked (remove it): ${a}`);
    }
  }

  console.log(`skin:no-adhoc-css — ${scanned} .css file(s) checked against ${allowedSet.size}-entry allowlist`);
  for (const w of warnings) console.warn(`  warning: ${w}`);
  if (violations.length === 0) {
    console.log('OK — no new standalone .css outside the allowlist.');
    return;
  }
  console.error(`FAILED — ${violations.length} unlisted .css file(s):`);
  for (const v of violations) console.error(`  ${v}`);
  console.error(
    '\nNew skins/themes MUST be skinConfigRegistry presets, never standalone .css ' +
      '(.windsurf/rules/00-project-invariants.md §Skin/Theme). If this stylesheet is ' +
      'legitimately not a skin/theme surface, add it to ' +
      'scripts/governance/registries/cssAllowlist.json with a justification.',
  );
  process.exit(1);
}

main();
