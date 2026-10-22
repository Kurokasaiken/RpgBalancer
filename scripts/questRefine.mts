/**
 * questRefine — PLAN-027 pipeline applied to AUTHORED scenarios
 * (R-219, 2026-10-18). questNarrate narrates generated kit skeletons;
 * this driver refines copy that already exists: it extracts the current
 * authored text of a scenario (goblin/rovine), runs gate + critic +
 * revise on it, then produces the facts-locked IT re-render.
 *
 * The output is a REVIEW artefact — it never writes back into
 * `scenarios/*.ts`. The Director reads the report, approves, and the
 * merge into config/spec is a separate decision.
 *
 * Pipeline per node:
 *   extract  — node fields → NarratedNodeCopy (option label/detail come
 *              from the inbound `CHECK:<id>` option on the parent choice)
 *   gate     — validateNodeCopy on the current text (locale = authored)
 *   critic   — promptForCritic → structured findings (skippable)
 *   revise   — promptForRevise only when findings exist (bounded tries)
 *   render   — promptForRerender → IT re-voice, revalidated
 *
 * Text the pipeline does NOT cover (option labels of non-CHECK options,
 * previewHint/revealHint, combat attackLines, engine damage/epilogue
 * lines) is listed in the report as "out of pipeline" — refine by hand.
 *
 * Usage:
 *   npx tsx --tsconfig tsconfig.app.json scripts/questRefine.mts \
 *     --scenario goblin --domain bosco-goblin --contract <contract.json> --dry-run
 *   npx tsx --tsconfig tsconfig.app.json scripts/questRefine.mts \
 *     --scenario goblin --domain bosco-goblin --contract <contract.json> --live \
 *     --provider groq --model openai/gpt-oss-120b \
 *     [--fallback-provider gemini --fallback-model gemini-3.8-flash] \
 *     [--chain codex/gpt-5.6-terra,openrouter/openrouter/free] \
 *     [--only tracce-per,cerca] [--tries 3] [--no-critic] [--no-render]
 */

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { DOMAIN_VOCABS, type DomainVocab } from '../src/balancing/config/idleVillage/quests/generation/domainVocabs';
import {
  attachEpistemic,
  briefsForScenario,
  type SceneBrief,
} from '../src/balancing/config/idleVillage/quests/generation/narrative/sceneBrief';
import {
  promptForCritic,
  promptForFieldRevise,
  promptForNode,
  promptForNodeR8,
  promptForRerender,
  promptForRevise,
  VOICE_ANCHORS,
} from '../src/balancing/config/idleVillage/quests/generation/narrative/narrationPrompt';
import {
  contractIssues,
  contractLintIssues,
  promptForArcContract,
  QuestArcContractSchema,
  type QuestArcContract,
} from '../src/balancing/config/idleVillage/quests/generation/narrative/arcContract';
import {
  CriticReportSchema,
  extractJson,
  NarratedNodeCopySchema,
  validateKitCopy,
  validateNodeCopy,
  validateNodeCopyR8,
  type CriticReport,
  type NarratedNodeCopy,
  type ValidationIssue,
} from '../src/balancing/config/idleVillage/quests/generation/narrative/validateCopy';
import type { QuestScenario, QuestNodeSchemaType as QuestNode } from '../src/balancing/config/idleVillage/quests/questScenario.schema';
import { GOBLIN_SCENARIO } from '../src/balancing/config/idleVillage/quests/scenarios/goblin';
import { ROVINE_SCENARIO } from '../src/balancing/config/idleVillage/quests/scenarios/rovine';

const REPO = new URL('..', import.meta.url).pathname;
const MW_PY = join(REPO, '.mw/venv/bin/python');
const MW_ASK = join(REPO, 'scripts/mw-ask.py');

/** Authored scenarios the pipeline can refine — id prefix = the string
 *  stripped from node ids to get copy keys. */
const SCENARIOS: Record<string, { scenario: QuestScenario; prefix: string }> = {
  goblin: { scenario: GOBLIN_SCENARIO, prefix: 'gob' },
  rovine: { scenario: ROVINE_SCENARIO, prefix: 'rv' },
};

/** Quest-level text the node pipeline cannot carry — surfaced in the
 *  report so the human refinement pass does not lose it. */
interface OutOfPipeline {
  nodeKey: string;
  field: 'previewHint' | 'revealHint' | 'upfrontDamage' | 'nonCheckOption';
  text: string;
}

interface Args {
  scenarioId: string;
  domain: string;
  dryRun: boolean;
  live: boolean;
  provider?: string;
  model?: string;
  fallbackProvider?: string;
  fallbackModel?: string;
  tries: number;
  only?: Set<string>;
  /** Extra provider/model pairs tried after the primary+fallback — R-219:
   *  rate limits made a two-provider chain too fragile mid-run. */
  chain: [string, string][];
  contract?: string;
  generateContract: boolean;
  noCritic: boolean;
  noRender: boolean;
  outDir?: string;
  /** r008 — authoring locale: 'it' drafts directly in Italian and skips
   *  the EN→IT re-render (the manuscript is native-IT). */
  authoringLocale: 'en' | 'it';
  /** r008 — revise only the fields named by findings, never the scene. */
  fieldScoped: boolean;
  /** r008 — JSON map {nodeKey: copy} to refine instead of the scenario's
   *  own text (native-IT manuscripts live outside the EN config). */
  copyFile?: string;
}

function parseArgs(argv: string[]): Args {
  const get = (k: string) => {
    const i = argv.indexOf(`--${k}`);
    return i === -1 ? undefined : argv[i + 1];
  };
  const scenarioId = get('scenario') ?? '';
  const domain = get('domain') ?? '';
  if (!SCENARIOS[scenarioId])
    throw new Error(`--scenario sconosciuto (noti: ${Object.keys(SCENARIOS).join(', ')})`);
  if (!DOMAIN_VOCABS[domain])
    throw new Error(`--domain sconosciuto (noti: ${Object.keys(DOMAIN_VOCABS).join(', ')})`);
  const args: Args = {
    scenarioId,
    domain,
    dryRun: argv.includes('--dry-run'),
    live: argv.includes('--live'),
    provider: get('provider'),
    model: get('model'),
    fallbackProvider: get('fallback-provider'),
    fallbackModel: get('fallback-model'),
    tries: Number(get('tries') ?? '3'),
    only: get('only') ? new Set(get('only')!.split(',').map((s) => s.trim())) : undefined,
    chain: (get('chain') ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((pair) => {
        const i = pair.indexOf('/');
        const p = i === -1 ? '' : pair.slice(0, i);
        const m = i === -1 ? '' : pair.slice(i + 1);
        if (!p || !m) throw new Error(`--chain: coppia provider/model non valida '${pair}'`);
        return [p, m] as [string, string];
      }),
    contract: get('contract'),
    generateContract: argv.includes('--generate-contract'),
    noCritic: argv.includes('--no-critic'),
    noRender: argv.includes('--no-render') || argv.includes('--native-it'),
    outDir: get('out-dir'),
    authoringLocale: argv.includes('--native-it') ? 'it' : 'en',
    fieldScoped: argv.includes('--field-scoped') || argv.includes('--native-it'),
    copyFile: get('copy-file'),
  };
  if (args.dryRun) return args;
  if (!args.live) throw new Error('serve --dry-run o --live');
  if (!args.provider || !args.model) throw new Error('--live richiede --provider e --model');
  if (!args.contract && !args.generateContract)
    throw new Error('--live richiede --contract <file> oppure --generate-contract');
  return args;
}

interface ProviderReply {
  success: boolean;
  content?: string;
  error?: string;
}

function ask(provider: string, model: string, prompt: string): ProviderReply {
  try {
    const out = execFileSync(
      MW_PY,
      [MW_ASK, '--provider', provider, '--model', model, '--json', '--prompt', prompt],
      { cwd: REPO, encoding: 'utf-8', maxBuffer: 8 * 1024 * 1024 },
    );
    const parsed = JSON.parse(out.trim());
    return { success: !!parsed.success, content: parsed.content, error: parsed.error };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message.slice(0, 400) : String(err) };
  }
}

interface Attempt {
  provider: string;
  model: string;
  pass: string;
  ok: boolean;
  note?: string;
}

function askChain(args: Args, prompt: string, pass: string, attempts: Attempt[]): ProviderReply {
  const chain: [string, string][] = [[args.provider!, args.model!]];
  if (args.fallbackProvider && args.fallbackModel) chain.push([args.fallbackProvider, args.fallbackModel]);
  chain.push(...args.chain);
  let last: ProviderReply = { success: false, error: 'no provider configured' };
  for (const [p, m] of chain) {
    last = ask(p, m, prompt);
    attempts.push({ provider: p, model: m, pass, ok: last.success, note: last.success ? undefined : last.error });
    if (last.success) return last;
  }
  return last;
}

/* ------------------------------------------------------------------ */
/* Extraction — authored node fields → NarratedNodeCopy.               */
/* ------------------------------------------------------------------ */

/** Find the option that routes into `CHECK:<nodeId>` — in the authored
 *  scenarios the option label/detail live on the parent choice node,
 *  while in the kit copy shape they live on the check's own `option`. */
function inboundCheckOption(nodes: Record<string, QuestNode>, nodeId: string) {
  for (const other of Object.values(nodes)) {
    for (const opt of other.options ?? []) {
      if (opt.next === `CHECK:${nodeId}`) return { label: opt.label, detail: opt.detail };
    }
  }
  return undefined;
}

/** Extract the authored copy of one node into the pipeline copy shape. */
function extractCopy(node: QuestNode, nodes: Record<string, QuestNode>, prefix: string): {
  copy: NarratedNodeCopy;
  outOfPipeline: OutOfPipeline[];
} {
  const outOfPipeline: OutOfPipeline[] = [];
  const nodeKey = node.id.replace(`${prefix}-`, '');
  const copy: NarratedNodeCopy = { title: node.title ?? '', body: node.body ?? '' };
  if (node.transit) copy.transit = node.transit;
  if (node.failHint) copy.failHint = node.failHint;
  if (node.verdictFlavor) {
    copy.verdictFlavor = Object.fromEntries(
      Object.entries(node.verdictFlavor).filter(([, v]) => typeof v === 'string'),
    ) as NarratedNodeCopy['verdictFlavor'];
  }
  if (node.kind === 'check') {
    const opt = inboundCheckOption(nodes, node.id);
    if (opt) copy.option = opt;
  }
  if (node.previewHint) outOfPipeline.push({ nodeKey, field: 'previewHint', text: node.previewHint });
  if (node.revealHint) outOfPipeline.push({ nodeKey, field: 'revealHint', text: node.revealHint });
  if (node.upfrontDamage) {
    outOfPipeline.push({
      nodeKey,
      field: 'upfrontDamage',
      text: `upfront damage ${node.upfrontDamage.amount} (epicfail ${node.upfrontDamage.epicfailAmount ?? '—'}) — narrated inside verdict lines`,
    });
  }
  for (const opt of node.options ?? []) {
    if (!opt.next.startsWith('CHECK:')) {
      outOfPipeline.push({
        nodeKey,
        field: 'nonCheckOption',
        text: `«${opt.label}» — ${opt.detail}`,
      });
    }
  }
  if (node.combat?.attackLines) {
    for (const [band, line] of Object.entries(node.combat.attackLines)) {
      if (line) outOfPipeline.push({ nodeKey, field: 'previewHint', text: `attackLine ${band}: «${line}»` });
    }
  }
  return { copy, outOfPipeline };
}

/** Authored-mode revise — the generated-kit revise prompt says «rewrite
 *  it fixing EVERY finding», which on authored text licensed the model
 *  to redesign the scene (a tree climb became a spear thrust, a STR
 *  chase a PER spot-check). Here the fiction is locked: fix findings,
 *  improve prose — never change who does what, with which stat, on
 *  which object. */
function promptForAuthoredRevise(
  basePrompt: string,
  draft: NarratedNodeCopy,
  findings: { class: string; field: string; detail: string }[],
  orig: NarratedNodeCopy,
  stats?: string[],
): string {
  return [
    `THIS IS A REFINEMENT OF AUTHORED TEXT — not a fresh generation.`,
    `LOCKED (never change, even to satisfy a finding):`,
    `- the physical action: whoever climbs a tree still climbs a tree; whoever charges the wall still charges it; whoever chases still chases`,
    stats?.length ? `- the stat behind the option: this check tests ${stats.join('+')} — option.detail may name it (authored convention), never a different one` : `- the stat behind the option stays the one it already names`,
    orig.option ? `- the option's act and cost: «${orig.option.label}» — «${orig.option.detail}» (rephrase ok, replace never)` : undefined,
    `- who does what to whom, and every mechanical outcome listed in MECHANICAL FACTS`,
    `You may ONLY: fix the listed findings, improve prose quality and rhythm, and add missing required fields. Never redesign the scene.`,
    ``,
    basePrompt,
    ``,
    `YOUR PREVIOUS DRAFT WAS REJECTED BY REVIEW. Rewrite it fixing EVERY finding — same JSON shape, same constraints, same scene.`,
    `PREVIOUS DRAFT:`,
    JSON.stringify(draft, null, 2),
    `FINDINGS:`,
    ...findings.map((f) => `- [${f.class}] ${f.field}: ${f.detail}`),
  ]
    .filter((l): l is string => l !== undefined)
    .join('\n');
}

/* ------------------------------------------------------------------ */
/* Report.                                                             */
/* ------------------------------------------------------------------ */

function fmtCopy(c: NarratedNodeCopy): string {
  const lines = [`title: «${c.title}»`, `body: «${c.body}»`];
  if (c.transit) lines.push(`transit: «${c.transit}»`);
  if (c.failHint) lines.push(`failHint: «${c.failHint}»`);
  if (c.option) lines.push(`option: «${c.option.label}» — «${c.option.detail}»`);
  for (const [band, v] of Object.entries(c.verdictFlavor ?? {})) {
    if (v) lines.push(`verdict.${band}: «${v}»`);
  }
  for (const [band, v] of Object.entries(c.outcomeLog ?? {})) {
    if (v) lines.push(`outcomeLog.${band}: «${v}»`);
  }
  return lines.map((l) => `  ${l}`).join('\n');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { scenario, prefix } = SCENARIOS[args.scenarioId];
  const vocab: DomainVocab = DOMAIN_VOCABS[args.domain];
  let briefs: SceneBrief[] = briefsForScenario(scenario, vocab, prefix);

  const gimmick =
    'Storia authored: spedizione punitiva contro una banda di predoni — info, pedaggi e rischio posizionale; ciò che il party risparmia torna sulla strada.';
  const mood = 'tensione sobria, pericolo concreto, niente retorica';

  console.log(`== questRefine — ${args.scenarioId} × ${args.domain} ==`);
  console.log(`scenario: ${scenario.id} (${Object.keys(scenario.nodes).length} nodi), brief: ${briefs.length}`);

  /* Extraction + current-state gate — the baseline the report diffs.
   *  --copy-file overrides the scenario text (r008 native-IT path: the
   *  manuscript is authored IT, not the EN config). */
  const fileCopy: Record<string, NarratedNodeCopy> = args.copyFile
    ? JSON.parse(readFileSync(args.copyFile, 'utf-8'))
    : {};
  const current: Record<string, NarratedNodeCopy> = {};
  const outOfPipeline: OutOfPipeline[] = [];
  const baselineIssues: ValidationIssue[] = [];
  for (const b of briefs) {
    const node = scenario.nodes[b.nodeId];
    const { copy, outOfPipeline: oop } = extractCopy(node, scenario.nodes, prefix);
    current[b.nodeKey] = fileCopy[b.nodeKey] ?? copy;
    outOfPipeline.push(...oop);
    const v = validateNodeCopy(current[b.nodeKey], b, vocab, args.authoringLocale);
    if (!v.ok) baselineIssues.push(...v.issues);
    console.log(
      `  ${String(b.beat).padStart(2, '0')} ${b.nodeKey} [${b.kind}] — baseline issues: ${v.ok ? 0 : v.issues.length}`,
    );
  }

  if (args.dryRun) {
    console.log('\n--- baseline gate issues (testo corrente) ---');
    for (const i of baselineIssues) console.log(`  [${i.nodeKey}] ${i.rule}: ${i.detail}`);
    console.log('\n--- out-of-pipeline fields (da raffinare a mano) ---');
    for (const o of outOfPipeline) console.log(`  [${o.nodeKey}] ${o.field}: ${o.text.slice(0, 90)}`);
    const cPrompt = promptForArcContract(vocab, briefs, { gimmick, mood });
    console.log(`\n--- ARC CONTRACT PROMPT (${cPrompt.length} car) ---\n${cPrompt}`);
    for (const b of briefs) {
      const r = promptForNode(b, vocab, { gimmick, mood, locale: 'en' }, {});
      console.log(`\n--- NODE ${b.nodeKey} (${r.prompt.length} car) ---\n${r.prompt}`);
    }
    return;
  }

  /* ---- Contract ---- */
  let contract: QuestArcContract | undefined;
  if (args.contract) {
    contract = QuestArcContractSchema.parse(JSON.parse(readFileSync(args.contract, 'utf-8')));
    console.log(`arc contract caricato da ${args.contract}`);
  } else {
    const cPrompt = promptForArcContract(vocab, briefs, { gimmick, mood });
    const attempts: Attempt[] = [];
    for (let t = 0; t < args.tries && !contract; t++) {
      const reply = askChain(args, cPrompt, 'pass0-contract', attempts);
      if (!reply.success || !reply.content) continue;
      try {
        contract = QuestArcContractSchema.parse(extractJson(reply.content));
      } catch (e) {
        console.error(`contract JSON non valido (try ${t + 1}): ${e instanceof Error ? e.message : e}`);
      }
    }
    if (!contract) {
      console.error('ARC CONTRACT FALLITO — abort');
      process.exit(1);
    }
  }
  const cIssues = contractIssues(contract, briefs);
  if (cIssues.length) {
    console.error(`CONTRACT non copre il grafo:\n${cIssues.join('\n')}`);
    process.exit(1);
  }
  /* r008 — the contract's own vocabularies must be disjoint before any
   * copy is generated (allowedEntities ∩ bans = ∅). */
  const lintIssues = contractLintIssues(contract);
  if (lintIssues.length) {
    console.error(`CONTRACT LINT fallito:\n${lintIssues.join('\n')}`);
    process.exit(1);
  }
  /* r008 — when the contract carries a `world` block, briefs get the
   * epistemic partition: framingFacts vs per-band verdictFacts. */
  if (contract.world) {
    briefs = attachEpistemic(briefs, contract, scenario);
    console.log(`epistemic partition attiva (world contract, ${briefs.filter((b) => b.epistemic).length} brief)`);
  }

  /** Combined gate — legacy checks + r008 epistemic hard checks when
   *  the brief carries the partition. */
  const gateNode = (raw: unknown, b: SceneBrief, loc: 'it' | 'en'): { ok: boolean; copy?: NarratedNodeCopy; issues: ValidationIssue[] } => {
    const legacy = validateNodeCopy(raw, b, vocab, loc);
    const r8 = validateNodeCopyR8(raw, b, vocab, loc);
    const issues = [...(legacy.ok ? [] : legacy.issues), ...(r8.ok ? [] : r8.issues)];
    return issues.length ? { ok: false, issues } : { ok: true, copy: (legacy.ok ? legacy.copy : (r8.ok ? (r8.copy as NarratedNodeCopy) : undefined)) };
  };

  const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const runDir = args.outDir ?? join(REPO, `.mw/runs/${ts}-${args.scenarioId}-refine`);
  mkdirSync(runDir, { recursive: true });

  const attempts: Attempt[] = [];
  const allLabels = Object.values(current)
    .flatMap((c) => (c.option?.label ? [c.option.label] : []));
  const prevScenes: { key: string; title: string; line: string }[] = [];

  const revised: Record<string, NarratedNodeCopy> = {};
  const rendered: Record<string, NarratedNodeCopy> = {};
  const reportFindings: Record<
    string,
    { gate: ValidationIssue[]; critic?: CriticReport; revised: boolean; renderedOk: boolean }
  > = {};

  for (const b of briefs) {
    if (args.only && !args.only.has(b.nodeKey)) continue;
    const enCopy = current[b.nodeKey];
    const nodeReport = { gate: [] as ValidationIssue[], revised: false, renderedOk: false };
    reportFindings[b.nodeKey] = nodeReport;

    /* Gate on current copy. */
    const gv = gateNode(enCopy, b, args.authoringLocale);
    nodeReport.gate = gv.ok ? [] : gv.issues;

    /* Sibling labels WITHOUT this node's own — a label is allowed to be
     * itself; the critic must compare against the others only. */
    const usedLabels = allLabels.filter((l) => l !== enCopy.option?.label);

    /* Critic on current copy. */
    let findings: CriticReport['findings'] = [];
    if (!args.noCritic) {
      const cReply = askChain(
        args,
        promptForCritic(b, enCopy, vocab, { locale: args.authoringLocale, contract, usedLabels }),
        `critic:${b.nodeKey}`,
        attempts,
      );
      if (cReply.success && cReply.content) {
        try {
          const report = CriticReportSchema.parse(extractJson(cReply.content));
          nodeReport.critic = report;
          if (!report.accept) findings = report.findings;
        } catch {
          /* malformed critic output — treat as no findings. */
        }
      }
    }

    /* Revise only when the current copy has defects. */
    let finalEn = enCopy;
    const allFindings = [
      ...nodeReport.gate.map((i) => ({ class: `gate:${i.rule}`, field: '-', detail: i.detail })),
      ...findings,
    ];
    if (allFindings.length) {
      const basePrompt = b.epistemic
        ? promptForNodeR8(b, vocab, { gimmick, mood, locale: args.authoringLocale }, {
            contract,
            usedLabels,
            prevScenes,
          }).prompt
        : promptForNode(b, vocab, { gimmick, mood, locale: args.authoringLocale }, {
            contract,
            usedLabels,
            prevScenes,
          }).prompt;
      const nodeDef = scenario.nodes[b.nodeId];
      /* r008 field-scoped: a finding on 'verdictFlavor.fail' rewrites
       * only that field — findings on '-'/unknown fields fall back to
       * the authored whole-scene revise. */
      const scopedFields = args.fieldScoped
        ? [...new Set(allFindings.map((f) => f.field).filter((f) => f && f !== '-'))]
        : [];
      for (let t = 0; t < args.tries; t++) {
        const rReply = askChain(
          args,
          scopedFields.length
            ? promptForFieldRevise(basePrompt, finalEn as unknown as Record<string, unknown>, scopedFields, allFindings)
            : promptForAuthoredRevise(basePrompt, finalEn, allFindings, enCopy, nodeDef.stats),
          `revise:${b.nodeKey}`,
          attempts,
        );
        if (!rReply.success || !rReply.content) continue;
        try {
          const rv = gateNode(extractJson(rReply.content), b, args.authoringLocale);
          if (rv.ok && rv.copy) {
            finalEn = rv.copy;
            nodeReport.revised = true;
            break;
          }
          allFindings.push(
            ...rv.issues.map((i) => ({ class: `gate:${i.rule}` as const, field: '-', detail: i.detail })),
          );
        } catch (e) {
          console.error(`revise ${b.nodeKey} parse fallito: ${e instanceof Error ? e.message : e}`);
        }
      }
    }
    revised[b.nodeKey] = finalEn;
    prevScenes.push({ key: b.nodeKey, title: finalEn.title, line: finalEn.body.slice(0, 140) });

    /* IT re-render — a failed draft is fed back with its gate issues so
     * the next try knows what it did wrong (same loop as revise). */
    if (!args.noRender) {
      let itPrompt = promptForRerender(b, finalEn, vocab, { contract, usedLabels });
      for (let t = 0; t < args.tries && !rendered[b.nodeKey]; t++) {
        const reply = askChain(args, itPrompt, `render-it:${b.nodeKey}`, attempts);
        if (!reply.success || !reply.content) continue;
        let itRaw: unknown;
        try {
          itRaw = extractJson(reply.content);
        } catch (e) {
          console.error(`render-it ${b.nodeKey} parse fallito: ${e instanceof Error ? e.message : e}`);
          continue;
        }
        const rv = validateNodeCopy(itRaw, b, vocab, 'it');
        /* Voice anchors are register reference — a verbatim copy inside
         * the render is a defect even when the gate passes (R-219 run 1:
         * the scene anchor landed in 10/15 bodies). */
        const anchorHit = rv.ok
          ? Object.values(VOICE_ANCHORS).find((a) => {
              const sentence = a.replace(/[«»]/g, '').trim();
              return [
                rv.copy.title,
                rv.copy.body,
                rv.copy.transit,
                rv.copy.failHint,
                rv.copy.option?.label,
                rv.copy.option?.detail,
                ...Object.values(rv.copy.verdictFlavor ?? {}),
                ...Object.values(rv.copy.outcomeLog ?? {}),
              ]
                .filter((t): t is string => Boolean(t))
                .some((t) => t.toLowerCase().includes(sentence.toLowerCase()));
            })
          : undefined;
        if (rv.ok && !anchorHit) {
          rendered[b.nodeKey] = rv.copy;
          nodeReport.renderedOk = true;
        } else if (rv.ok && anchorHit) {
          console.error(`render-it ${b.nodeKey} anchor-echo: frase anchor copiata verbatim`);
          itPrompt = promptForRevise(itPrompt, rv.copy, [
            {
              class: 'anchor-echo',
              field: '-',
              detail: `hai copiato verbatim la frase anchor «${anchorHit}» — gli anchor sono SOLO riferimento di registro: riscrivi senza quella frase`,
            },
          ]);
        } else {
          console.error(`render-it ${b.nodeKey} gate: ${rv.issues.map((i) => `${i.rule}(${i.detail.slice(0, 60)})`).join(', ')}`);
          const parsedDraft = NarratedNodeCopySchema.safeParse(itRaw);
          if (parsedDraft.success) {
            itPrompt = promptForRevise(
              itPrompt,
              parsedDraft.data,
              rv.issues.map((i) => ({ class: `gate:${i.rule}`, field: '-', detail: i.detail })),
            );
          }
        }
      }
    }
    console.log(`${b.nodeKey}: gate ${nodeReport.gate.length} · critic ${nodeReport.critic?.findings.length ?? '-'} · revised ${nodeReport.revised} · it ${nodeReport.renderedOk}`);
  }

  /* Kit-level checks on the revised set. */
  const kitCheck = validateKitCopy(
    { title: scenario.title, flavour: '', objective: '', intelId: 'refine' },
    revised,
    vocab,
    { gimmick: 'flood' },
  );

  /* ---- Emit ---- */
  writeFileSync(join(runDir, 'contract.json'), JSON.stringify(contract, null, 2));
  writeFileSync(join(runDir, 'copy-before.en.json'), JSON.stringify(current, null, 2));
  writeFileSync(join(runDir, 'copy-after.en.json'), JSON.stringify(revised, null, 2));
  writeFileSync(join(runDir, 'copy-after.it.json'), JSON.stringify(rendered, null, 2));
  writeFileSync(
    join(runDir, 'findings.json'),
    JSON.stringify({ baselineIssues, reportFindings, kitIssues: kitCheck.issues, kitFlags: kitCheck.flags, attempts }, null, 2),
  );

  const md: string[] = [
    `# questRefine — ${args.scenarioId} (${new Date().toISOString()})`,
    ``,
    `Domain: ${vocab.label} · contract: ${args.contract ?? 'generato'} · provider: ${args.provider}/${args.model}`,
    ``,
    `## Baseline gate sul testo corrente: ${baselineIssues.length} issue`,
    ...baselineIssues.map((i) => `- [${i.nodeKey}] ${i.rule}: ${i.detail}`),
    ``,
    `## Kit-level sul set revisionato: ${kitCheck.issues.length} issue · ${kitCheck.flags.length} flag`,
    ...kitCheck.issues.map((i) => `- [${i.nodeKey}] ${i.rule}: ${i.detail}`),
    ...kitCheck.flags.map((f) => `- FLAG '${f.term}' ×${f.count}: ${f.detail}`),
    ``,
    `## Fuori pipeline (raffinare a mano)`,
    ...outOfPipeline.map((o) => `- [${o.nodeKey}] ${o.field}: ${o.text}`),
    ``,
    `## Per nodo`,
  ];
  for (const b of briefs) {
    const r = reportFindings[b.nodeKey];
    if (!r) {
      md.push(`\n### ${b.nodeKey} — saltato (--only)`);
      continue;
    }
    md.push(`\n### ${b.nodeKey} [${b.kind}]`);
    if (r.critic?.findings.length) {
      md.push(`Critic findings:`);
      for (const f of r.critic.findings) md.push(`- [${f.class}] ${f.field}: ${f.detail}`);
    }
    md.push(`\n**EN — dopo:**\n${fmtCopy(revised[b.nodeKey])}`);
    if (rendered[b.nodeKey]) md.push(`\n**IT — re-render:**\n${fmtCopy(rendered[b.nodeKey])}`);
  }
  writeFileSync(join(runDir, 'report.md'), md.join('\n'));

  const fails = Object.values(reportFindings).filter((r) => !r.renderedOk && !args.noRender).length;
  console.log(`\nArtefatti in ${runDir}`);
  console.log(`baseline issues: ${baselineIssues.length} · kit issues: ${kitCheck.issues.length} · kit flags: ${kitCheck.flags.length} · render mancanti: ${fails}`);
  console.log(`attempts: ${attempts.filter((a) => a.ok).length}/${attempts.length} ok`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
