#!/usr/bin/env tsx
/**
 * docs:impact — mechanical enforcement of .windsurf/rules/85-documentation-impact.md
 *
 * Two surfaces:
 *
 *   Declaration lint (plan/spec review gate):
 *     npm run docs:impact -- --plan plans/PLAN-0XX.md
 *     npm run docs:impact -- --spec spec.json
 *   Checks that a Documentation Impact field exists, that REQUIRED lists at
 *   least one target doc, and that NONE carries a justification.
 *
 *   Execution check (post-implementation gate):
 *     npm run docs:impact -- --plan plans/PLAN-0XX.md --touched a.ts,b.md
 *     npm run docs:impact -- --plan plans/PLAN-0XX.md --diff-base <sha> [--workspace <dir>]
 *   When level is REQUIRED, every declared target must appear in the touched
 *   set (or in the git diff vs --diff-base). Fails otherwise — a REQUIRED plan
 *   is not complete until its docs are actually updated.
 *
 * Exit codes: 0 ok · 1 violations · 2 usage/parse error.
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

export type DocImpactLevel = 'NONE' | 'OPTIONAL' | 'REQUIRED';

export interface DocImpactVerdict {
  level: DocImpactLevel | null;
  declared: boolean;
  targets: string[];
  justification: string | null;
  violations: string[];
  warnings: string[];
}

const LEVEL_RE = /\b(NONE|OPTIONAL|REQUIRED)\b/;

/** Parse a plan markdown file for the documentation impact declaration. */
export function parsePlanDocImpact(content: string): DocImpactVerdict {
  const verdict: DocImpactVerdict = {
    level: null, declared: false, targets: [], justification: null,
    violations: [], warnings: [],
  };

  // Accepted spellings (observed in plans/):
  //   frontmatter:  documentation_impact: REQUIRED — targets…
  //   body:         Documentation Impact: REQUIRED — targets…
  //   bold body:    **Documentation Impact:** REQUIRED — targets…
  const lineRe = /^\s*(?:\*\*)?(?:documentation[_\s]impact)(?:\*\*)?\s*:\s*(.+)$/im;
  const m = content.match(lineRe);
  if (!m) {
    verdict.violations.push('missing Documentation Impact declaration');
    return verdict;
  }
  verdict.declared = true;
  const tail = m[1].trim();
  const levelMatch = tail.match(LEVEL_RE);
  if (!levelMatch) {
    verdict.violations.push(`unrecognised Documentation Impact level in "${tail.slice(0, 60)}"`);
    return verdict;
  }
  verdict.level = levelMatch[1] as DocImpactLevel;

  // Targets: text after the level on the same line (after a dash/emdash),
  // and/or a `documentation_targets:` field, and/or bullet lines listing paths.
  const afterLevel = tail.slice(tail.indexOf(levelMatch[1]) + levelMatch[1].length);
  const inlineTail = afterLevel.replace(/^\s*[-—:]\s*/, '').trim();
  const pathRe = /(?:[\w./-]+\.(?:md|mdx|json|yaml|yml))/g;
  const seen = new Set<string>();
  const collect = (text: string): void => {
    for (const p of text.match(pathRe) ?? []) {
      if (!seen.has(p)) { seen.add(p); verdict.targets.push(p); }
    }
  };
  collect(inlineTail);
  if (inlineTail && verdict.targets.length === 0) {
    // free-text tail that isn't a path — treat as justification
    verdict.justification = inlineTail;
  } else if (inlineTail) {
    verdict.justification = inlineTail;
  }

  const targetsField = content.match(/^\s*documentation_targets\s*:\s*(.+)$/im);
  if (targetsField) collect(targetsField[1]);

  return verdict;
}

/** Parse a harness spec.json for `documentation_impact`. */
export function parseSpecDocImpact(spec: Record<string, unknown>): DocImpactVerdict {
  const verdict: DocImpactVerdict = {
    level: null, declared: false, targets: [], justification: null,
    violations: [], warnings: [],
  };
  const raw = spec.documentation_impact;
  if (raw === undefined) {
    verdict.violations.push('missing documentation_impact field');
    return verdict;
  }
  verdict.declared = true;
  if (typeof raw === 'string') {
    const lm = raw.match(LEVEL_RE);
    if (!lm) { verdict.violations.push(`bad documentation_impact "${raw}"`); return verdict; }
    verdict.level = lm[1] as DocImpactLevel;
    verdict.justification = raw.slice(raw.indexOf(lm[1]) + lm[1].length).replace(/^\s*[-—:]\s*/, '') || null;
  } else if (raw && typeof raw === 'object') {
    const r = raw as { level?: string; targets?: string[]; justification?: string };
    const lm = String(r.level ?? '').match(LEVEL_RE);
    if (!lm) { verdict.violations.push('documentation_impact.level missing/invalid'); return verdict; }
    verdict.level = lm[1] as DocImpactLevel;
    verdict.targets = Array.isArray(r.targets) ? r.targets : [];
    verdict.justification = r.justification ?? null;
  } else {
    verdict.violations.push('documentation_impact must be a string or object');
    return verdict;
  }
  return verdict;
}

/** Apply rule-85 requirements to a parsed verdict. `strict` = new-plan gate. */
export function validateVerdict(v: DocImpactVerdict, opts: { strict?: boolean; touched?: string[] }): DocImpactVerdict {
  if (!v.declared || !v.level) return v;
  if (v.level === 'REQUIRED') {
    if (v.targets.length === 0) {
      if (opts.strict) v.violations.push('REQUIRED but no target documents declared');
      else v.warnings.push('REQUIRED but no target documents declared');
    }
    if (opts.touched) {
      const touched = new Set(opts.touched.map((t) => t.replace(/^\.\//, '')));
      for (const target of v.targets) {
        const hit = [...touched].some((t) => t === target || t.endsWith(`/${target}`) || target.endsWith(`/${t}`) || t.endsWith(target) || target.endsWith(t));
        if (!hit) v.violations.push(`declared target not updated: ${target}`);
      }
    }
  }
  if (v.level === 'NONE' && !v.justification) {
    v.violations.push('NONE without justification');
  }
  return v;
}

function touchedFromDiff(base: string, workspace: string): string[] {
  const out = execSync(`git diff --name-only ${base}..HEAD && git status --porcelain | awk '{print $2}'`, {
    cwd: workspace, encoding: 'utf8',
  });
  return out.split('\n').map((s) => s.trim()).filter(Boolean);
}

function main(): number {
  const args = process.argv.slice(2);
  const get = (k: string): string | undefined => {
    const i = args.indexOf(k);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const has = (k: string): boolean => args.includes(k);

  const planPath = get('--plan');
  const specPath = get('--spec');
  if (!planPath && !specPath) {
    console.error('usage: docs:impact -- --plan <file.md> | --spec <spec.json> [--touched a,b] [--diff-base <sha> --workspace <dir>] [--strict] [--json]');
    return 2;
  }

  let verdict: DocImpactVerdict;
  try {
    if (planPath) {
      const p = path.resolve(planPath);
      if (!existsSync(p)) { console.error(`plan not found: ${planPath}`); return 2; }
      verdict = parsePlanDocImpact(readFileSync(p, 'utf8'));
    } else {
      const p = path.resolve(specPath!);
      if (!existsSync(p)) { console.error(`spec not found: ${specPath}`); return 2; }
      verdict = parseSpecDocImpact(JSON.parse(readFileSync(p, 'utf8')));
    }
  } catch (e) {
    console.error(`parse error: ${e instanceof Error ? e.message : e}`);
    return 2;
  }

  let touched: string[] | undefined;
  const touchedArg = get('--touched');
  const diffBase = get('--diff-base');
  if (touchedArg !== undefined) {
    touched = touchedArg.split(',').map((s) => s.trim()).filter(Boolean);
  } else if (diffBase) {
    touched = touchedFromDiff(diffBase, path.resolve(get('--workspace') ?? '.'));
  }

  verdict = validateVerdict(verdict, { strict: has('--strict'), touched });

  if (has('--json')) {
    console.log(JSON.stringify(verdict, null, 2));
  } else {
    console.log(`doc-impact: ${verdict.declared ? verdict.level : 'MISSING'}`);
    if (verdict.targets.length) console.log(`  targets: ${verdict.targets.join(', ')}`);
    for (const w of verdict.warnings) console.warn(`  WARN ${w}`);
    for (const v of verdict.violations) console.error(`  VIOLATION ${v}`);
  }
  return verdict.violations.length > 0 ? 1 : 0;
}

if (process.argv[1]?.endsWith('docsImpactCheck.ts')) {
  process.exit(main());
}
