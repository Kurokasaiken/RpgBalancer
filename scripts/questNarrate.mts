/**
 * questNarrate — PLAN-026 T4 / P3: offline narrative generation.
 *
 * Drives a provider (via `scripts/mw-ask.py`, the Mind Weaver proxy) to
 * write the COPY of a domain kit around an already-emitted mechanical
 * scenario. The skeleton (vars, graph, verdictTable, gating) is built by
 * the structural generator and treated as IMMUTABLE input — the model
 * sees mechanical facts, never alters them.
 *
 * Artifact: `generation/narrated/<gimmick>-<domain>.kit.ts` — a typed
 * FloodDomainKit/RaceDomainKit literal with provenance header
 * (provider, model, scenarioVersion, date, per-node attempts). The file
 * is a generated artifact: committed, versioned, replayable.
 *
 * Usage:
 *   npx tsx --tsconfig tsconfig.app.json scripts/questNarrate.mts \
 *     --gimmick flood --domain mare --dry-run
 *   npx tsx --tsconfig tsconfig.app.json scripts/questNarrate.mts \
 *     --gimmick flood --domain mare --live --provider groq \
 *     --model openai/gpt-oss-120b [--fallback-provider F --fallback-model FM]
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
import { promptForKitMeta, promptForNode } from '../src/balancing/config/idleVillage/quests/generation/narrative/narrationPrompt';
import {
  extractJson,
  validateNodeCopy,
  NarratedKitMetaSchema,
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
  ok: boolean;
  note?: string;
}

/** Ask with fallback chain; each attempt logged for provenance. */
function askChain(args: Args, prompt: string, attempts: Attempt[]): ProviderReply {
  const chain: [string, string][] = [[args.provider!, args.model!]];
  if (args.fallbackProvider && args.fallbackModel) chain.push([args.fallbackProvider, args.fallbackModel]);
  let last: ProviderReply = { success: false, error: 'no provider configured' };
  for (const [p, m] of chain) {
    last = ask(p, m, prompt);
    attempts.push({ provider: p, model: m, ok: last.success, note: last.success ? undefined : last.error });
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
    gimmick: 'Corsa a tappe contro un rivale: i vars you/rival corrono verso un goal — scorciatoie rischiose vs via maestra, un twist armato da tratto devia il percorso.',
    extraFields: ['"names": {"place": "nome del luogo ≤30 car", "rival": "nome del rivale ≤30 car", "prize": "nome del premio ≤30 car"}'],
    stub: () => generateRaceScenario(PASSO_MONTANO_KIT) as never,
  },
};

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const vocab: DomainVocab = DOMAIN_VOCABS[args.domain];
  const meta = { gimmick: GIMMICK_META[args.gimmick].gimmick, mood: args.mood };

  /* Structure comes from ANY existing kit — the skeleton is kit-free. */
  const scenario = GIMMICK_META[args.gimmick].stub() as ReturnType<typeof generateFloodVault>;
  const prefix = args.gimmick === 'flood' ? 'fv' : 'rp';
  const briefs: SceneBrief[] = briefsForScenario(scenario, vocab, prefix);

  console.log(`== questNarrate — ${args.gimmick} × ${args.domain} ==`);
  console.log(`scenario: ${scenario.id} (${Object.keys(scenario.nodes).length} nodi), brief: ${briefs.length}`);
  for (const b of briefs) console.log(`  ${String(b.beat).padStart(2, '0')} ${b.nodeId} [${b.kind}]`);

  const metaPrompt = promptForKitMeta(vocab, { ...meta, extraFields: GIMMICK_META[args.gimmick].extraFields });

  /* --emit-from <partial.json>: re-emit the artifact from a partial
   * dump with NO provider calls — every node copy is revalidated
   * against its brief, so a stale partial can't slip bad text in. */
  if (args.emitFrom) {
    const prev = JSON.parse(readFileSync(args.emitFrom, 'utf-8')) as {
      meta?: ReturnType<typeof NarratedKitMetaSchema.parse>;
      copy?: Record<string, unknown>;
    };
    if (!prev.meta) throw new Error('partial senza meta');
    const reIssues: ValidationIssue[] = [];
    const copy: Record<string, unknown> = {};
    for (const b of briefs) {
      const v = validateNodeCopy(prev.copy?.[b.nodeKey], b, vocab);
      if (v.ok) copy[b.nodeKey] = v.copy;
      else reIssues.push(...v.issues);
    }
    const missing = briefs.filter((b) => !copy[b.nodeKey]).map((b) => b.nodeKey);
    if (reIssues.length || missing.length) {
      console.error(JSON.stringify({ reIssues, missing }, null, 2));
      throw new Error(`partial non valido: ${reIssues.length} issue, ${missing.length} nodi mancanti`);
    }
    emitArtifact(args, scenario.id, scenario.scenarioVersion, prefix, prev.meta, copy, []);
    return;
  }

  if (args.dryRun) {
    const requests = briefs.map((b) => promptForNode(b, vocab, meta));
    console.log(`\n--- KIT META PROMPT (${metaPrompt.length} car) ---\n${metaPrompt}`);
    for (const r of requests) {
      console.log(`\n--- ${r.brief.nodeId} (${r.prompt.length} car) ---\n${r.prompt}`);
    }
    return;
  }

  /* ---- live: meta first, then nodes ---- */
  const provenance = { generatedAt: new Date().toISOString(), scenarioId: scenario.id, scenarioVersion: scenario.scenarioVersion, domain: vocab.id, gimmick: args.gimmick };
  const attempts: Attempt[] = [];
  const issues: ValidationIssue[] = [];
  const copy: Record<string, unknown> = {};
  let failures = 0;

  /* Resume: a previous partial dump seeds meta+copy — regeneration is
   * per-node (never a text patch), so merging is still generation. */
  let kitMeta: ReturnType<typeof NarratedKitMetaSchema.parse> | undefined;
  if (args.reuse) {
    const prev = JSON.parse(readFileSync(args.reuse, 'utf-8')) as {
      meta?: typeof kitMeta;
      copy?: Record<string, unknown>;
    };
    kitMeta = prev.meta;
    Object.assign(copy, prev.copy ?? {});
    /* Nodes being regenerated must not silently keep the old copy —
     * a failed regen leaves them missing, never stale. */
    for (const k of args.only ?? []) delete copy[k];
    console.log(`reuse ${args.reuse}: meta ${kitMeta ? 'ok' : 'assente'}, ${Object.keys(copy).length} nodi già narrati`);
  }

  /* Kit meta — same retry contract as the nodes. */
  for (let t = 0; t < args.tries && !kitMeta; t++) {
    const metaReply = askChain(args, metaPrompt, attempts);
    if (!metaReply.success || !metaReply.content) continue;
    try {
      kitMeta = NarratedKitMetaSchema.parse(extractJson(metaReply.content));
    } catch (e) {
      console.error(`meta JSON non valido (try ${t + 1}): ${e instanceof Error ? e.message : e}`);
    }
  }
  if (!kitMeta) {
    console.error('KIT META FALLITO — abort');
    process.exit(1);
  }
  /* The kit's mechanical references must exist — a missing loot key or
   * rival name would emit a broken kit. */
  const requiredMeta = args.gimmick === 'flood' ? ['pezzo', 'cassa', 'madre', 'lingotto'] : ['place', 'rival', 'prize'];
  const metaBucket = (args.gimmick === 'flood' ? kitMeta.loot : kitMeta.names) ?? {};
  const missingMeta = requiredMeta.filter((k) => !metaBucket[k]);
  if (missingMeta.length) {
    console.error(`KIT META incompleto — chiavi mancanti: ${missingMeta.join(', ')} — abort`);
    process.exit(1);
  }

  /* Canonical names: the stub kit's nouns leak into the mechanical
   * facts (takeLoot names are data). Map them to the names the meta
   * chose for THIS domain, so node prompts read domain-correct. */
  const stubKit = (args.gimmick === 'flood' ? MINIERA_FLOOD_KIT : PASSO_MONTANO_KIT) as {
    title: string;
    loot?: Record<string, string>;
    names?: Record<string, string>;
  };
  const canonicalNames: Record<string, string> = {};
  const canonLoot = kitMeta.loot ?? {};
  const canonNames = kitMeta.names ?? {};
  for (const [k, v] of Object.entries(stubKit.loot ?? {})) if (canonLoot[k]) canonicalNames[v] = canonLoot[k];
  for (const [k, v] of Object.entries(stubKit.names ?? {})) if (canonNames[k]) canonicalNames[v] = canonNames[k];
  canonicalNames[stubKit.title] = kitMeta.title;

  const requests = briefs
    .filter((b) => !args.only || args.only.has(b.nodeKey))
    .map((b) => {
      const r = promptForNode(b, vocab, meta, canonicalNames);
      /* Rewrite leaked stub nouns inside the mechanical facts. */
      let prompt = r.prompt;
      for (const [stub, canon] of Object.entries(canonicalNames)) {
        prompt = prompt.split(stub).join(canon);
      }
      return { ...r, prompt };
    });

  /* Per-node copy with tries: a validation failure regenerates the node. */
  for (const r of requests) {
    let accepted: unknown | undefined;
    for (let t = 0; t < args.tries && !accepted; t++) {
      const reply = askChain(args, r.prompt, attempts);
      if (!reply.success || !reply.content) {
        issues.push({ nodeKey: r.brief.nodeKey, rule: 'schema', detail: `provider: ${reply.error ?? 'no content'}` });
        continue;
      }
      let parsed: unknown;
      try {
        parsed = extractJson(reply.content);
      } catch (e) {
        issues.push({ nodeKey: r.brief.nodeKey, rule: 'schema', detail: `parse: ${e instanceof Error ? e.message : e}` });
        continue;
      }
      const v = validateNodeCopy(parsed, r.brief, vocab);
      if (v.ok) accepted = v.copy;
      else issues.push(...v.issues);
    }
    if (accepted) copy[r.brief.nodeKey] = accepted;
    else failures++;
  }

  const missing = briefs.map((b) => b.nodeKey).filter((k) => !copy[k]);
  const report = { provenance, attempts, issues, failures, missing, nodesOk: Object.keys(copy).length, nodesTotal: briefs.length };
  console.log(JSON.stringify(report, null, 2));

  /* Always dump the partial state — a rerun with `--only` + `--reuse`
   * regenerates only the missing nodes. */
  const outDir = join(REPO, 'src/balancing/config/idleVillage/quests/generation/narrated');
  mkdirSync(outDir, { recursive: true });
  const kitId = `${args.gimmick}-${args.domain}`;
  const partialFile = join(outDir, `.partial-${kitId}.json`);
  writeFileSync(partialFile, JSON.stringify({ meta: kitMeta, copy, report }, null, 2));
  console.log(`partial dump: ${partialFile}`);

  if (failures > 0 || missing.length > 0) {
    console.error(
      `\nNARRAZIONE INCOMPLETA: ${missing.length ? `mancano ${missing.join(', ')}` : ''} — nessun artefatto emesso. ` +
        `Riprendi con --only ${missing.join(',')} --reuse ${partialFile}`,
    );
    process.exit(1);
  }

  /* ---- emit the artifact ---- */
  emitArtifact(args, scenario.id, scenario.scenarioVersion, prefix, kitMeta, copy, attempts);
}

/** Write the typed kit artifact — the versioned, committed output of a
 *  narration run. Provenance (scenario, version, provider attempts) is
 *  embedded in the file header. */
function emitArtifact(
  args: Args,
  scenarioId: string,
  scenarioVersion: string,
  prefix: string,
  kitMeta: ReturnType<typeof NarratedKitMetaSchema.parse>,
  copy: Record<string, unknown>,
  attempts: Attempt[],
) {
  const provenance = { generatedAt: new Date().toISOString(), scenarioId, scenarioVersion, domain: args.domain, gimmick: args.gimmick };
  const kitConst = `${args.domain.toUpperCase().replace(/-/g, '_')}_${args.gimmick.toUpperCase()}_KIT`;
  const tsType = args.gimmick === 'flood' ? 'FloodDomainKit' : 'RaceDomainKit';
  const tsImport = args.gimmick === 'flood' ? '../floodVault' : '../raceGimmick';

  const kitLiteral =
    args.gimmick === 'flood'
      ? {
          id: args.domain,
          prefix,
          title: kitMeta.title,
          flavour: kitMeta.flavour,
          objective: kitMeta.objective,
          intelId: kitMeta.intelId,
          loot: kitMeta.loot,
          copy,
        }
      : {
          id: args.domain,
          prefix,
          title: kitMeta.title,
          flavour: kitMeta.flavour,
          names: kitMeta.names,
          intelId: kitMeta.intelId,
          objective: kitMeta.objective,
          copy,
        };

  const outDir = join(REPO, 'src/balancing/config/idleVillage/quests/generation/narrated');
  mkdirSync(outDir, { recursive: true });
  const outFile = join(outDir, `${args.gimmick}-${args.domain}.kit.ts`);
  const prov = JSON.stringify({ ...provenance, attempts }, null, 2).split('\n').map((l) => ` * ${l}`).join('\n');
  const src = `/**\n * GENERATED ARTIFACT — questNarrate (PLAN-026 T4 / P3). Do not hand-edit:\n * regenerate via \`scripts/questNarrate.mts\`. Provenance:\n${prov}\n */\n\nimport type { ${tsType} } from '${tsImport}';\n\nexport const ${kitConst}: ${tsType} = ${JSON.stringify(kitLiteral, null, 2)};\n`;
  writeFileSync(outFile, src);
  console.log(`\nartefatto scritto: ${outFile}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
