/**
 * catalog:critique — PLAN-086 r013 critique stage (web-ai-prompt-protocol).
 *
 * Per manifest entry, per provider:
 *   probe (throwaway conversation, canary only)
 *   → turn 1: commission + shots (NO rubric/schema/counts/canary/facts)
 *   → turn 2: rubric_slice filters the model's OWN proposals + P0-P3
 *   → harness audit: 2-3 concrete critique claims vs ground_truth
 * Writes critiques/<provider>.md + digest.md (mapper, not judge — P5).
 *
 * Usage:
 *   npm run catalog:critique -- --component hud-top-tabs \
 *     --providers chatgpt,claude,deepseek [--shots-dir .mw/ui-catalog/components/hud-top-tabs/shots/V1]
 *
 * Requires: Chrome Canary shared profile on CDP :9222, mind-weaver checked out.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import path from 'node:path';

const ROOT = process.cwd();
const MW = '/Users/faustoboni/progetti_personali/mind-weaver';
const MWP = `${MW}/browser-runtime/.venv/bin/python`;
const MWT = `${MW}/scripts/mw-web-turn.py`;
const PROMPTS = path.join(ROOT, 'scripts/catalog/prompts');
const CATALOG = path.join(ROOT, '.mw/ui-catalog');

const arg = (k: string, d = '') => {
  const i = process.argv.indexOf(`--${k}`);
  return i >= 0 ? process.argv[i + 1] : d;
};
const COMPONENT = arg('component', 'hud-top-tabs');
const PROVIDERS = arg('providers', 'chatgpt,claude,deepseek').split(',');
const SHOTS_DIR = arg('shots-dir', path.join(CATALOG, 'components', COMPONENT, 'shots', 'V1'));
const STATE = arg('state', 'default');
const RUN_ID = `catalog-critique-${COMPONENT}-${Date.now() % 1e6}`;

function tpl(name: string, vars: Record<string, string>): string {
  let t = readFileSync(path.join(PROMPTS, name), 'utf8');
  for (const [k, v] of Object.entries(vars)) t = t.split(`{${k}}`).join(v);
  return t;
}

function webturn(...args: string[]): any {
  const out = execFileSync(MWP, [MWT, ...args], { encoding: 'utf8', timeout: 420_000 });
  for (const line of out.trim().split('\n').reverse()) {
    if (line.trim().startsWith('{')) return JSON.parse(line);
  }
  return { status: 'NO_JSON' };
}

const sha = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 12);

/** P2 lint — blocking rules only. Warnings logged, never blocking. */
function lintCommission(text: string): string[] {
  const fails: string[] = [];
  const banned = [/--skin-[a-z-]+/i, /===\s*[A-Z]/, /\bverdict\b/i, /observed_facts/i, /canary/i, /per ogni punto/i, /≥\s*\d/, /\bJSON\b/];
  for (const re of banned) if (re.test(text)) fails.push(`banned:${re.source}`);
  if (!/sei un /i.test(text)) fails.push('missing:persona');
  if (!/allegat/i.test(text)) fails.push('missing:attachments-declaration');
  if (/enumerat/i.test(text)) fails.push('warn:enumeration-smell');
  return fails;
}

function rubricSlice(): string {
  const f = path.join(CATALOG, 'ART-DIRECTION.md');
  return existsSync(f) ? readFileSync(f, 'utf8') : '(rubric file missing)';
}

function groundTruth(): string[] {
  const f = path.join(CATALOG, 'components', COMPONENT, 'ground_truth.json');
  if (!existsSync(f)) return [];
  const g = JSON.parse(readFileSync(f, 'utf8'));
  return (g.facts ?? []).map((x: any) => String(x.expectedValue ?? x.fact ?? x));
}

/** Audit: count critique claims checkable against ground_truth (naive token overlap). */
function auditClaims(critique: string, facts: string[]): { checked: number; passed: number } {
  if (!facts.length) return { checked: 0, passed: 0 };
  let checked = 0, passed = 0;
  const low = critique.toLowerCase();
  for (const fact of facts) {
    const key = fact.toLowerCase().split(/\s+/).filter(w => w.length > 5).slice(0, 2);
    if (key.every(w => low.includes(w))) { checked++; passed++; }
  }
  return { checked, passed };
}

async function main() {
  const shots = readdirSync(SHOTS_DIR)
    .filter(f => f.startsWith(`${STATE}-`) && f.endsWith('.png'))
    .map(f => path.join(SHOTS_DIR, f));
  const canary = `${MW}/.mw/tmp/canary-${PROVIDERS[0]}-probe.png`;
  const page = readFileSync(path.join(CATALOG, 'components', COMPONENT, 'page.md'), 'utf8');
  const firstPara = page.split('\n').filter(l => l.trim() && !l.startsWith('#') && !l.startsWith('>'))[0] ?? COMPONENT;
  const componentLine = `il componente ${COMPONENT} su /game — ${firstPara.trim()}`;
  const facts = groundTruth();

  webturn('run-create', '--run', RUN_ID, '--providers', PROVIDERS.join(','));
  const runDir = `${MW}/.mw/runs/${RUN_ID}`;
  mkdirSync(runDir, { recursive: true });
  const outDir = path.join(CATALOG, 'components', COMPONENT, 'critiques');
  mkdirSync(outDir, { recursive: true });

  const commission = tpl('turn1-commission.md', {
    component_line: componentLine,
    search_clause: 'Fa una ricerca online, poi ',
  });
  const commissionText = tpl('turn1-text-only.md', {
    component_line: `Il componente è ${COMPONENT} su /game. ${firstPara.trim()}`,
    search_clause: 'Fa una ricerca online, poi ',
  });
  const lintOut = lintCommission(commission);
  if (lintOut.some(x => !x.startsWith('warn:'))) throw new Error(`commission lint FAIL: ${lintOut}`);
  const commHash = sha(commission);
  writeFileSync(path.join(runDir, 'turn1-commission.md'), commission);

  const digest: any = {
    component: COMPONENT, run: RUN_ID, commission_sha: commHash,
    consensus: [], dissenting: [], quick_wins: [], structural: [],
    per_provider: {}, grounded: [], non_grounded: [],
  };

  for (const provider of PROVIDERS) {
    const entry: any = { capability_class: 'attachments', grounding_path: 'none' };
    // probe — throwaway conversation
    const probe = webturn('send', '--run', RUN_ID, '--provider', provider,
      '--prompt', tpl('canary-probe.md', {}), '--image', canary,
      '--meta', JSON.stringify({ turn_id: `T-probe-${provider}`, kind: 'probe' }));
    entry.probe = probe.status;
    const canSee = probe.status === 'SUCCESS' && probe.response && !/non vedo|cannot see|no image/i.test(probe.response);
    if (!canSee) { entry.capability_class = 'text_only'; entry.probe_response = probe.response ?? probe.error; }

    const isTextOnly = entry.capability_class === 'text_only';
    const t1 = isTextOnly ? commissionText : commission;
    const sendArgs = ['send', '--run', RUN_ID, '--provider', provider,
      '--prompt', t1, '--meta', JSON.stringify({ turn_id: `T-crit-${provider}`, kind: 'critique' })];
    if (!isTextOnly) for (const s of shots) sendArgs.push('--image', s);
    const c1 = webturn(...sendArgs);
    if (c1.status !== 'SUCCESS' || !c1.response) {
      entry.turn1 = `FAILED:${c1.status} ${c1.error ?? ''}`; digest.non_grounded.push(provider);
      digest.per_provider[provider] = entry; continue;
    }
    entry.turn1 = 'ok';
    writeFileSync(path.join(outDir, `${provider}.t1.md`), c1.response);

    // turn 2 — rubric filters proposals only
    const c2 = webturn('send', '--run', RUN_ID, '--provider', provider,
      '--prompt', tpl('turn2-rubric.md', { rubric_slice: rubricSlice() }),
      '--meta', JSON.stringify({ turn_id: `T-rub-${provider}`, kind: 'selection' }));
    if (c2.status === 'SUCCESS' && c2.response)
      writeFileSync(path.join(outDir, `${provider}.t2.md`), c2.response);
    entry.turn2 = c2.status;

    // harness audit vs ground_truth
    const a = auditClaims(c1.response, facts);
    entry.audit = a;
    if (a.passed >= 2) { entry.grounding_path = 'claim-audit'; digest.grounded.push(provider); }
    else digest.non_grounded.push(provider);
    digest.per_provider[provider] = entry;
  }

  writeFileSync(path.join(outDir, 'digest.raw.json'), JSON.stringify(digest, null, 2));
  // P5: digest is mapper — verbatim critiques are the artifact; digest.md = index
  const md = [
    `# Digest critiche — ${COMPONENT} (run ${RUN_ID}, protocol r013)`,
    ``,
    `Commission sha: ${commHash} — byte-identical per classe capability.`,
    `Image-grounded quorum: ${digest.grounded.join(', ') || '(none)'} (${digest.grounded.length}/3 richiesti)`,
    `Non-grounded (evidenza text-only, non scartata): ${digest.non_grounded.join(', ') || '—'}`,
    ``,
    `## Per provider`,
    ...PROVIDERS.map(p => `- **${p}** — capability=${digest.per_provider[p]?.capability_class}, probe=${digest.per_provider[p]?.probe}, grounding=${digest.per_provider[p]?.grounding_path}, audit=${JSON.stringify(digest.per_provider[p]?.audit ?? {})}`),
    ``,
    `## Consensus / Dissenting / Quick-wins vs Structural`,
    `Da compilare dall'orchestratore citando SOLO lingua presente nei verbatim`,
    `(quote-or-mapping rule, P5): ogni punto non mappabile su asse rubrica`,
    `va flaggato orthogonal e mostrato PRIMO al Director.`,
  ].join('\n');
  writeFileSync(path.join(outDir, 'digest.md'), md);
  console.log(`[critique] ${COMPONENT}: grounded=${digest.grounded.length} text_only=${digest.non_grounded.length} → ${outDir}/digest.md`);
}

main().catch(e => { console.error('[critique] FAIL', e.message ?? e); process.exit(1); });
