/**
 * questNarrate — PLAN-026 T4 / P3 → PLAN-027 r001 quality pipeline.
 *
 * Offline narration of a domain kit around an already-emitted mechanical
 * scenario. The skeleton (vars, graph, verdictTable, gating) is built by
 * the structural generator and treated as IMMUTABLE input — the model
 * sees mechanical facts, never alters them.
 *
 * r001 pipeline (PLAN-027, converged via multi-AI web debate):
 *   Pass 0  ARC CONTRACT — one frontier call fixes arc/competition/prop
 *           glossary/ending facts. Human-approvable via --contract.
 *   Pass 1  EN node drafts — brief + contract + voice anchors +
 *           story-so-far + sibling labels.
 *   Pass 2  deterministic gate — schema, per-locale banned terms, trait/
 *           stat/id leaks, creature whitelist, required fields.
 *   Pass 3  LLM critic — rubric of the rejected corpus' defect classes.
 *   Pass 4  revise — rewrite with cited findings (bounded tries).
 *   Pass 5  IT re-render — facts-locked peer render, not a translation.
 *   Emit    single .ts, nested { en, it }, provenance-embedded contract.
 *
 * Usage:
 *   npx tsx --tsconfig tsconfig.app.json scripts/questNarrate.mts \
 *     --gimmick race --domain miniera --dry-run
 *   npx tsx --tsconfig tsconfig.app.json scripts/questNarrate.mts \
 *     --gimmick race --domain miniera --prefix rn --live \
 *     --provider codex --model gpt-5.6-terra \
 *     [--fallback-provider gemini --fallback-model gemini-3.8-flash] \
 *     [--contract path/to/contract.json] [--no-critic]
 */

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { DOMAIN_VOCABS, type DomainVocab } from '../src/balancing/config/idleVillage/quests/generation/domainVocabs';
import { MINIERA_FLOOD_KIT } from '../src/balancing/config/idleVillage/quests/generation/floodMiniera';
import { generateFloodVault } from '../src/balancing/config/idleVillage/quests/generation/floodVault';
import { generateRaceScenario } from '../src/balancing/config/idleVillage/quests/generation/raceGimmick';
import { PASSO_MONTANO_KIT } from '../src/balancing/config/idleVillage/quests/generation/kits';
import { briefsForScenario, type SceneBrief } from '../src/balancing/config/idleVillage/quests/generation/narrative/sceneBrief';
import {
  promptForCritic,
  promptForKitMeta,
  promptForMetaRerender,
  promptForNode,
  promptForRerender,
  promptForRevise,
} from '../src/balancing/config/idleVillage/quests/generation/narrative/narrationPrompt';
import {
  contractIssues,
  promptForArcContract,
  QuestArcContractSchema,
  type QuestArcContract,
} from '../src/balancing/config/idleVillage/quests/generation/narrative/arcContract';
import {
  CriticReportSchema,
  extractJson,
  localeParityIssues,
  NarratedKitMetaSchema,
  validateKitCopy,
  validateNodeCopy,
  type CopyLocale,
  type NarratedKitMeta,
  type NarratedNodeCopy,
  type ValidationIssue,
} from '../src/balancing/config/idleVillage/quests/generation/narrative/validateCopy';

const REPO = new URL('..', import.meta.url).pathname;
const MW_PY = join(REPO, '.mw/venv/bin/python');
const MW_ASK = join(REPO, 'scripts/mw-ask.py');

interface Args {
  gimmick: 'flood' | 'race';
  domain: string;
  dryRun: boolean;
  live: boolean;
  provider?: string;
  model?: string;
  fallbackProvider?: string;
  fallbackModel?: string;
  tries: number;
  mood: string;
  only?: Set<string>;
  reuse?: string;
  emitFrom?: string;
  prefix?: string;
  contract?: string;
  noCritic: boolean;
}

function parseArgs(argv: string[]): Args {
  const get = (k: string) => {
    const i = argv.indexOf(`--${k}`);
    return i === -1 ? undefined : argv[i + 1];
  };
  const gimmick = get('gimmick');
  const domain = get('domain');
  if (gimmick !== 'flood' && gimmick !== 'race') throw new Error('--gimmick flood|race obbligatorio');
  if (!domain || !DOMAIN_VOCABS[domain]) throw new Error(`--domain sconosciuto (noti: ${Object.keys(DOMAIN_VOCABS).join(', ')})`);
  const args: Args = {
    gimmick,
    domain,
    dryRun: argv.includes('--dry-run'),
    live: argv.includes('--live'),
    provider: get('provider'),
    model: get('model'),
    fallbackProvider: get('fallback-provider'),
    fallbackModel: get('fallback-model'),
    tries: Number(get('tries') ?? '3'),
    mood: get('mood') ?? 'tensione sobria, pericolo concreto, niente retorica',
    only: get('only') ? new Set(get('only')!.split(',').map((s) => s.trim())) : undefined,
    reuse: get('reuse'),
    emitFrom: get('emit-from'),
    prefix: get('prefix'),
    contract: get('contract'),
    noCritic: argv.includes('--no-critic'),
  };
  if (args.emitFrom) return args;
  if (args.live && (!args.provider || !args.model)) throw new Error('--live richiede --provider e --model');
  if (!args.dryRun && !args.live) throw new Error('serve --dry-run o --live');
  return args;
}

interface ProviderReply {
  success: boolean;
  content?: string;
  error?: string;
}

/** Single provider call through the Mind Weaver proxy. */
function ask(provider: string, model: string, prompt: string): ProviderReply {
  try {
    const out = execFileSync(MW_PY, [MW_ASK, '--provider', provider, '--model', model, '--json', '--prompt', prompt], {
      cwd: REPO,
      encoding: 'utf-8',
      maxBuffer: 8 * 1024 * 1024,
    });
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

/** Ask with fallback chain; each attempt logged for provenance. */
function askChain(args: Args, prompt: string, pass: string, attempts: Attempt[]): ProviderReply {
  const chain: [string, string][] = [[args.provider!, args.model!]];
  if (args.fallbackProvider && args.fallbackModel) chain.push([args.fallbackProvider, args.fallbackModel]);
  let last: ProviderReply = { success: false, error: 'no provider configured' };
  for (const [p, m] of chain) {
    last = ask(p, m, prompt);
    attempts.push({ provider: p, model: m, pass, ok: last.success, note: last.success ? undefined : last.error });
    if (last.success) return last;
  }
  return last;
}

const GIMMICK_META: Record<
  Args['gimmick'],
  { gimmick: string; extraFields: string[]; stub: () => { id: string; nodes: object } }
> = {
  flood: {
    gimmick: 'Volta che allaga: accumuli bottino mentre l’acqua sale — ogni azione all’hub fa salire l’acqua, il loot preso va portato fuori vivo. Saccheggia di più o fuggi: l’avidità è la meccanica.',
    extraFields: ['"loot": {"pezzo": "≤30 car", "cassa": "≤30 car", "madre": "≤30 car", "lingotto": "≤30 car"}'],
    stub: () => generateFloodVault(MINIERA_FLOOD_KIT) as never,
  },
  race: {
    gimmick: 'Corsa a tappe CONTRO UN RIVALE: i vars you/rival corrono verso un goal — il giocatore compete direttamente, scorciatoie rischiose vs via maestra, un twist armato da tratto devia il percorso.',
    extraFields: ['"names": {"place": "nome del luogo ≤30 car", "rival": "nome del rivale ≤30 car", "prize": "nome del premio ≤30 car"}'],
    stub: () => generateRaceScenario(PASSO_MONTANO_KIT) as never,
  },
};

/** One locale's copy set + meta — the unit the pipeline fills. */
interface LocaleDraft {
  meta?: NarratedKitMeta;
  copy: Record<string, NarratedNodeCopy>;
  usedLabels: string[];
}

/** First sentence of a body — the story-so-far line for later prompts. */
function firstLine(text: string): string {
  const m = text.match(/^(.{10,140}?[.!?…])(\s|$)/);
  return (m ? m[1] : text.slice(0, 140)).trim();
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const vocab: DomainVocab = DOMAIN_VOCABS[args.domain];
  const meta = { gimmick: GIMMICK_META[args.gimmick].gimmick, mood: args.mood };

  const scenario = GIMMICK_META[args.gimmick].stub() as ReturnType<typeof generateFloodVault>;
  const stubPrefix = args.gimmick === 'flood' ? MINIERA_FLOOD_KIT.prefix : PASSO_MONTANO_KIT.prefix;
  const prefix = args.prefix ?? stubPrefix;
  const briefs: SceneBrief[] = briefsForScenario(scenario, vocab, stubPrefix);

  console.log(`== questNarrate r001 — ${args.gimmick} × ${args.domain} ==`);
  console.log(`scenario: ${scenario.id} (${Object.keys(scenario.nodes).length} nodi), brief: ${briefs.length}`);
  for (const b of briefs) console.log(`  ${String(b.beat).padStart(2, '0')} ${b.nodeId} [${b.kind}]`);

  const outDir = join(REPO, 'src/balancing/config/idleVillage/quests/generation/narrated');
  const kitId = `${args.gimmick}-${args.domain}`;
  const partialFile = join(outDir, `.partial-${kitId}.json`);

  /* --emit-from <partial.json>: re-emit with NO provider calls — every
   * node copy revalidated per-locale + kit-level + parity. */
  if (args.emitFrom) {
    const prev = JSON.parse(readFileSync(args.emitFrom, 'utf-8')) as {
      contract?: QuestArcContract;
      meta?: Record<CopyLocale, NarratedKitMeta>;
      copy?: Record<CopyLocale, Record<string, unknown>>;
    };
    const reIssues: ValidationIssue[] = [];
    const copyOut: Record<CopyLocale, Record<string, NarratedNodeCopy>> = { en: {}, it: {} };
    for (const locale of ['en', 'it'] as const) {
      for (const b of briefs) {
        const v = validateNodeCopy(prev.copy?.[locale]?.[b.nodeKey], b, vocab, locale);
        if (v.ok) copyOut[locale][b.nodeKey] = v.copy;
        else reIssues.push(...v.issues);
      }
      const kitCheck = validateKitCopy(prev.meta![locale], copyOut[locale], vocab, { gimmick: args.gimmick });
      reIssues.push(...kitCheck.issues);
    }
    if (reIssues.length) {
      console.error(JSON.stringify({ reIssues }, null, 2));
      throw new Error(`partial non valido: ${reIssues.length} issue`);
    }
    emitArtifact(args, scenario.id, scenario.scenarioVersion, prefix, prev.meta!, copyOut, [], prev.contract);
    return;
  }

  /* ---- Pass 0 — arc contract ---- */
  let contract: QuestArcContract | undefined;
  if (args.contract) {
    contract = QuestArcContractSchema.parse(JSON.parse(readFileSync(args.contract, 'utf-8')));
    console.log(`arc contract caricato da ${args.contract}`);
  }
  if (args.dryRun) {
    const cPrompt = promptForArcContract(vocab, briefs, { ...meta, oppositionHint: args.gimmick === 'race' ? 'il rivale della corsa' : undefined });
    const metaPrompt = promptForKitMeta(vocab, { ...meta, extraFields: GIMMICK_META[args.gimmick].extraFields, locale: 'en', contract });
    console.log(`\n--- ARC CONTRACT PROMPT (${cPrompt.length} car) ---\n${cPrompt}`);
    console.log(`\n--- KIT META PROMPT EN (${metaPrompt.length} car) ---\n${metaPrompt}`);
    for (const b of briefs) {
      const r = promptForNode(b, vocab, { ...meta, locale: 'en' }, { contract });
      console.log(`\n--- ${r.brief.nodeId} (${r.prompt.length} car) ---\n${r.prompt}`);
    }
    return;
  }

  const provenance = { generatedAt: new Date().toISOString(), scenarioId: scenario.id, scenarioVersion: scenario.scenarioVersion, domain: vocab.id, gimmick: args.gimmick, pipeline: 'r001' };
  const attempts: Attempt[] = [];
  const issues: ValidationIssue[] = [];
  const drafts: Record<CopyLocale, LocaleDraft> = {
    en: { copy: {}, usedLabels: [] },
    it: { copy: {}, usedLabels: [] },
  };
  let failures = 0;

  /* Resume: previous partial seeds contract+meta+copy; --only nodes are
   * dropped from reuse so a failed regen never leaves stale text. */
  if (args.reuse) {
    const prev = JSON.parse(readFileSync(args.reuse, 'utf-8')) as {
      contract?: QuestArcContract;
      meta?: Record<CopyLocale, NarratedKitMeta>;
      copy?: Record<CopyLocale, Record<string, NarratedNodeCopy>>;
    };
    contract = contract ?? prev.contract;
    for (const locale of ['en', 'it'] as const) {
      drafts[locale].meta = prev.meta?.[locale];
      for (const [k, v] of Object.entries(prev.copy?.[locale] ?? {})) {
        if (!args.only || !args.only.has(k)) drafts[locale].copy[k] = v;
      }
      drafts[locale].usedLabels = Object.values(drafts[locale].copy).flatMap((c) => (c.option?.label ? [c.option.label] : []));
    }
    console.log(`reuse ${args.reuse}: contract ${contract ? 'ok' : 'assente'}`);
  }

  /* Pass 0 — generate the contract if none was handed in. */
  if (!contract) {
    const cPrompt = promptForArcContract(vocab, briefs, {
      ...meta,
      oppositionHint: args.gimmick === 'race' ? 'il rivale della corsa' : undefined,
    });
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
  console.log(`arc contract: "${contract.arcSummary.slice(0, 90)}…"`);

  /* Canonical names: stub-kit nouns → names the contract/meta chose. */
  const stubKit = (args.gimmick === 'flood' ? MINIERA_FLOOD_KIT : PASSO_MONTANO_KIT) as {
    title: string;
    loot?: Record<string, string>;
    names?: Record<string, string>;
  };

  /* ---- Meta: EN draft → gate → IT re-render → gate ---- */
  const metaExtra = { extraFields: GIMMICK_META[args.gimmick].extraFields };
  const genMeta = async (locale: CopyLocale, base?: NarratedKitMeta): Promise<NarratedKitMeta | undefined> => {
    const prompt =
      locale === 'en'
        ? promptForKitMeta(vocab, { ...meta, ...metaExtra, locale, contract })
        : promptForMetaRerender(base!, vocab, { contract });
    for (let t = 0; t < args.tries; t++) {
      const reply = askChain(args, prompt, `meta-${locale}`, attempts);
      if (!reply.success || !reply.content) continue;
      try {
        return NarratedKitMetaSchema.parse(extractJson(reply.content));
      } catch (e) {
        console.error(`meta ${locale} JSON non valido (try ${t + 1}): ${e instanceof Error ? e.message : e}`);
      }
    }
    return undefined;
  };

  if (!drafts.en.meta) drafts.en.meta = await genMeta('en');
  if (!drafts.en.meta) {
    console.error('META EN FALLITO — abort');
    process.exit(1);
  }
  if (!drafts.it.meta) drafts.it.meta = await genMeta('it', drafts.en.meta);
  if (!drafts.it.meta) {
    console.error('META IT FALLITO — abort');
    process.exit(1);
  }

  const requiredMeta = args.gimmick === 'flood' ? ['pezzo', 'cassa', 'madre', 'lingotto'] : ['place', 'rival', 'prize'];
  for (const locale of ['en', 'it'] as const) {
    const bucket = (args.gimmick === 'flood' ? drafts[locale].meta!.loot : drafts[locale].meta!.names) ?? {};
    const missingMeta = requiredMeta.filter((k) => !bucket[k]);
    if (missingMeta.length) {
      console.error(`META ${locale} incompleto — chiavi mancanti: ${missingMeta.join(', ')} — abort`);
      process.exit(1);
    }
  }
  /* Names are locale-invariant (proper nouns): IT meta must keep EN names. */
  const enNames = { ...(drafts.en.meta.loot ?? {}), ...(drafts.en.meta.names ?? {}) };
  const itNames = { ...(drafts.it.meta.loot ?? {}), ...(drafts.it.meta.names ?? {}) };
  for (const [k, v] of Object.entries(enNames)) {
    if (itNames[k] !== v) {
      console.error(`META names divergono (${k}: EN «${v}» ≠ IT «${itNames[k]}») — abort`);
      process.exit(1);
    }
  }
  drafts.it.meta.intelId = drafts.en.meta.intelId;

  const canonicalNames: Record<string, string> = {};
  for (const [k, v] of Object.entries(stubKit.loot ?? {})) if (drafts.en.meta.loot?.[k]) canonicalNames[v] = drafts.en.meta.loot[k];
  for (const [k, v] of Object.entries(stubKit.names ?? {})) if (drafts.en.meta.names?.[k]) canonicalNames[v] = drafts.en.meta.names[k];
  canonicalNames[stubKit.title] = drafts.en.meta.title;
  /* The rival is a proper noun — same in both locales. */
  if (args.gimmick === 'race' && drafts.en.meta.names?.rival) canonicalNames['il rivale'] = drafts.en.meta.names.rival;

  /* ---- Nodes: EN draft → gate → critic → revise → IT re-render → gate ---- */
  const prevScenes: { key: string; title: string; line: string }[] = [];
  for (const b of briefs) {
    if (args.only && !args.only.has(b.nodeKey)) continue;
    if (drafts.en.copy[b.nodeKey] && drafts.it.copy[b.nodeKey]) {
      prevScenes.push({ key: b.nodeKey, title: drafts.en.copy[b.nodeKey].title, line: firstLine(drafts.en.copy[b.nodeKey].body) });
      continue;
    }

    /* -- Pass 1–4: EN draft + critic/revise loop -- */
    let enCopy: NarratedNodeCopy | undefined = drafts.en.copy[b.nodeKey];
    if (!enCopy) {
      let prompt = promptForNode(b, vocab, { ...meta, locale: 'en' }, {
        canonicalNames, contract, usedLabels: drafts.en.usedLabels, prevScenes,
      }).prompt;
      for (const [stub, canon] of Object.entries(canonicalNames)) prompt = prompt.split(stub).join(canon);

      for (let t = 0; t < args.tries && !enCopy; t++) {
        const reply = askChain(args, prompt, `draft-en:${b.nodeKey}`, attempts);
        if (!reply.success || !reply.content) {
          issues.push({ nodeKey: b.nodeKey, rule: 'schema', detail: `provider: ${reply.error ?? 'no content'}` });
          continue;
        }
        let parsed: unknown;
        try {
          parsed = extractJson(reply.content);
        } catch (e) {
          issues.push({ nodeKey: b.nodeKey, rule: 'schema', detail: `parse: ${e instanceof Error ? e.message : e}` });
          continue;
        }
        const v = validateNodeCopy(parsed, b, vocab, 'en');
        if (!v.ok) {
          issues.push(...v.issues);
          prompt = promptForRevise(prompt, parsed as NarratedNodeCopy, v.issues.map((i) => ({ class: i.rule, field: '-', detail: i.detail })));
          continue;
        }
        enCopy = v.copy;

        /* Pass 3 — critic (conditional: skipped with --no-critic). */
        if (!args.noCritic) {
          const cReply = askChain(args, promptForCritic(b, enCopy, vocab, { locale: 'en', contract, usedLabels: drafts.en.usedLabels }), `critic:${b.nodeKey}`, attempts);
          if (cReply.success && cReply.content) {
            try {
              const report = CriticReportSchema.parse(extractJson(cReply.content));
              if (!report.accept && report.findings.length) {
                const rReply = askChain(args, promptForRevise(prompt, enCopy, report.findings), `revise:${b.nodeKey}`, attempts);
                if (rReply.success && rReply.content) {
                  const rv = validateNodeCopy(extractJson(rReply.content), b, vocab, 'en');
                  if (rv.ok) enCopy = rv.copy;
                  else issues.push(...rv.issues.map((i) => ({ ...i, detail: `post-revise: ${i.detail}` })));
                }
              }
            } catch {
              /* critic output malformed — keep the gate-approved draft. */
            }
          }
        }
      }
    }
    if (!enCopy) {
      failures++;
      continue;
    }
    drafts.en.copy[b.nodeKey] = enCopy;
    if (enCopy.option?.label) drafts.en.usedLabels.push(enCopy.option.label);

    /* -- Pass 5: IT re-render + gate -- */
    if (!drafts.it.copy[b.nodeKey]) {
      let itCopy: NarratedNodeCopy | undefined;
      let itPrompt = promptForRerender(b, enCopy, vocab, { contract, usedLabels: drafts.it.usedLabels });
      for (let t = 0; t < args.tries && !itCopy; t++) {
        const reply = askChain(args, itPrompt, `render-it:${b.nodeKey}`, attempts);
        if (!reply.success || !reply.content) continue;
        try {
          const v = validateNodeCopy(extractJson(reply.content), b, vocab, 'it');
          if (v.ok) itCopy = v.copy;
          else {
            issues.push(...v.issues);
            itPrompt = promptForRevise(itPrompt, extractJson(reply.content) as NarratedNodeCopy, v.issues.map((i) => ({ class: i.rule, field: '-', detail: i.detail })));
          }
        } catch (e) {
          issues.push({ nodeKey: b.nodeKey, rule: 'schema', detail: `render-it parse: ${e instanceof Error ? e.message : e}` });
        }
      }
      if (!itCopy) {
        failures++;
        continue;
      }
      drafts.it.copy[b.nodeKey] = itCopy;
      if (itCopy.option?.label) drafts.it.usedLabels.push(itCopy.option.label);
    }

    prevScenes.push({ key: b.nodeKey, title: enCopy.title, line: firstLine(enCopy.body) });
  }

  /* ---- Kit-level gates per locale ---- */
  const kitFlags: { locale: CopyLocale; term: string; count: number; detail: string }[] = [];
  for (const locale of ['en', 'it'] as const) {
    const kitCheck = validateKitCopy(drafts[locale].meta!, drafts[locale].copy, vocab, { gimmick: args.gimmick });
    issues.push(...kitCheck.issues.map((i) => ({ ...i, detail: `[${locale}] ${i.detail}` })));
    kitFlags.push(...kitCheck.flags.map((f) => ({ locale, ...f })));
  }

  const missing = briefs.map((b) => b.nodeKey).filter((k) => !drafts.en.copy[k] || !drafts.it.copy[k]);
  const report = {
    provenance,
    contract: contract ?? null,
    attempts: attempts.length,
    attemptsFailed: attempts.filter((a) => !a.ok).length,
    issues,
    kitFlags,
    failures,
    missing,
    nodesOk: Object.keys(drafts.en.copy).length,
    nodesTotal: briefs.length,
  };
  console.log(JSON.stringify(report, null, 2));

  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    partialFile,
    JSON.stringify({ contract, meta: { en: drafts.en.meta, it: drafts.it.meta }, copy: { en: drafts.en.copy, it: drafts.it.copy }, report }, null, 2),
  );
  console.log(`partial dump: ${partialFile}`);

  if (failures > 0 || missing.length > 0 || issues.some((i) => i.rule === 'duplicate' || i.rule === 'meta')) {
    console.error(`\nNARRAZIONE INCOMPLETA — nessun artefatto emesso. Riprendi con --only <nodi> --reuse ${partialFile}`);
    process.exit(1);
  }

  emitArtifact(args, scenario.id, scenario.scenarioVersion, prefix, { en: drafts.en.meta!, it: drafts.it.meta! }, { en: drafts.en.copy, it: drafts.it.copy }, attempts, contract);
}

/** Write the typed kit artifact — nested { en, it }, provenance header
 *  including the arc contract (PLAN-027 D5). */
function emitArtifact(
  args: Args,
  scenarioId: string,
  scenarioVersion: string,
  prefix: string,
  metas: Record<CopyLocale, NarratedKitMeta>,
  copies: Record<CopyLocale, Record<string, NarratedNodeCopy>>,
  attempts: Attempt[],
  contract?: QuestArcContract,
) {
  const kitLiteral = (locale: CopyLocale) =>
    args.gimmick === 'flood'
      ? {
          id: args.domain,
          prefix,
          title: metas[locale].title,
          flavour: metas[locale].flavour,
          objective: metas[locale].objective,
          intelId: metas[locale].intelId,
          loot: metas[locale].loot,
          copy: copies[locale],
        }
      : {
          id: args.domain,
          prefix,
          title: metas[locale].title,
          flavour: metas[locale].flavour,
          names: metas[locale].names,
          intelId: metas[locale].intelId,
          objective: metas[locale].objective,
          copy: copies[locale],
        };

  const localized = { en: kitLiteral('en'), it: kitLiteral('it') };
  const parity = localeParityIssues(localized.en, localized.it);
  if (parity.length) {
    console.error(`LOCALE PARITY FALLITA:\n${parity.join('\n')}`);
    process.exit(1);
  }

  const kitConst = `${args.domain.toUpperCase().replace(/-/g, '_')}_${args.gimmick.toUpperCase()}_KIT`;
  const tsType = args.gimmick === 'flood' ? 'LocalizedFloodDomainKit' : 'LocalizedRaceDomainKit';
  const tsImport = args.gimmick === 'flood' ? '../floodVault' : '../raceGimmick';

  const provenance = {
    generatedAt: new Date().toISOString(),
    scenarioId,
    scenarioVersion,
    domain: args.domain,
    gimmick: args.gimmick,
    pipeline: 'r001',
    arcContract: contract ?? null,
    attempts,
  };

  const outDir = join(REPO, 'src/balancing/config/idleVillage/quests/generation/narrated');
  mkdirSync(outDir, { recursive: true });
  const outFile = join(outDir, `${args.gimmick}-${args.domain}.kit.ts`);
  const prov = JSON.stringify(provenance, null, 2).split('\n').map((l) => ` * ${l}`).join('\n');
  const src = `/**\n * GENERATED ARTIFACT — questNarrate (PLAN-027 r001, bilingual EN draft →\n * facts-locked IT re-render). Do not hand-edit: regenerate via\n * \`scripts/questNarrate.mts\`. Provenance + arc contract:\n${prov}\n */\n\nimport type { ${tsType} } from '${tsImport}';\n\nexport const ${kitConst}: ${tsType} = ${JSON.stringify(localized, null, 2)};\n`;
  writeFileSync(outFile, src);
  console.log(`\nartefatto scritto: ${outFile}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
