/**
 * QuestScenarioSchema — canonical Zod schema for authored quest scenarios
 * (PLAN-019-S2.1, decision D-A: the node graph is the canonical execution
 * format; `QuestBlueprint` is reduced to offer metadata).
 *
 * The schema *mirrors* the existing engine types
 * (`QuestNode`/`QuestOption`/`CombatSpec` in `questS1Lab/questScenario.ts`) —
 * same fields, same semantics. Every node/option/combat sub-schema is
 * `.strict()` and no `.default()`/`.transform()`/`.coerce()` is allowed:
 * Zod would silently drop unknown keys otherwise, and the parity test compares
 * the original TS object against the parse output.
 *
 * What the schema deliberately does NOT carry:
 * - post-verdict routing of `check`/`combat` nodes: it lives in the engine
 *   (`applyNodeOutcome`, per-node switch — invariant I-3, engine unchanged).
 *   Static integrity therefore validates every *declared* target; reachability
 *   through engine routing is asserted dynamically by the Monte Carlo
 *   coverage test (every node and every option must be traversed).
 * - engine-produced flags (`campoSveglio`, `prigionieroLibero`, loadout
 *   aliases): `requiresFlag`/`consumesFlag` producers are checked against the
 *   declared `sets` ∪ `ENGINE_PRODUCED_FLAGS` contract below.
 */

import { z } from 'zod';

/* ------------------------------------------------------------------------ */
/* Leaf schemas (mirror of questScenario.ts / slots/types.ts contracts).     */
/* ------------------------------------------------------------------------ */

/** Lab/quest stat channel — mirrors `LabStat`. */
export const LabStatSchema = z.enum(['perc', 'int', 'str', 'con', 'agi', 'cha']);
export type LabStatSchemaType = z.infer<typeof LabStatSchema>;

/** Five-verdict scale — mirrors `Verdict`. */
export const VerdictSchema = z.enum(['epicfail', 'fail', 'almost', 'win', 'bigwin']);
export type VerdictSchemaType = z.infer<typeof VerdictSchema>;

/** Numeric stat threshold — mirrors `NumericStatRequirement`. */
export const NumericStatRequirementSchema = z
  .object({
    stat: z.string(),
    operator: z.enum(['>', '>=', '<', '<=', '==']),
    value: z.number(),
  })
  .strict();
export type NumericStatRequirementSchemaType = z.infer<typeof NumericStatRequirementSchema>;

/**
 * Resident stat-tag requirement — mirrors `StatRequirement`
 * (`statMatching.evaluateStatRequirement`). Slot requirements reuse this
 * contract; no parallel requirement shape is invented.
 */
export const StatRequirementSchema = z
  .object({
    allOf: z.array(z.union([z.string(), NumericStatRequirementSchema])).optional(),
    anyOf: z.array(z.string()).optional(),
    noneOf: z.array(z.string()).optional(),
    label: z.string().optional(),
  })
  .strict();
export type StatRequirementSchemaType = z.infer<typeof StatRequirementSchema>;

/** Per-slot multipliers — mirrors `ActivitySlotModifier`. */
export const ActivitySlotModifierSchema = z
  .object({
    fatigueMult: z.number().optional(),
    riskMult: z.number().optional(),
    yieldMult: z.number().optional(),
  })
  .strict();

/** Party-level penalty while a declaring slot is empty — mirrors `QuestSlotEmptyPenalty`. */
export const QuestSlotEmptyPenaltySchema = z
  .object({
    partyPowerMult: z.number().optional(),
    extraDeathChance: z.number().optional(),
    extraInjuryChance: z.number().optional(),
  })
  .strict();

/** Risk modifiers on the occupying resident — mirrors `QuestSlotResidentRiskModifiers`. */
export const QuestSlotResidentRiskModifiersSchema = z
  .object({
    injuryChanceDelta: z.number().optional(),
    deathChanceDelta: z.number().optional(),
  })
  .strict();

/**
 * Quest slot blueprint — mirrors `ResidentSlotBlueprint`. Roles are
 * engine-facing (`'leader' | 'member' | 'bodyguard'`): the slot declares which
 * quest role the assigned resident plays in the run.
 */
export const QuestSlotSchema = z
  .object({
    id: z.string(),
    label: z.string().optional(),
    statHint: z.string().optional(),
    /**
     * Machine-readable run-stat(s) this slot is expected to contribute
     * (LabStat vocabulary — the stats the quest engine rolls). Drives the
     * offer↔nodes coherence check below and S2.4's party guidance.
     * `statHint` stays the free-form display hint; `statFocus` is the data.
     */
    statFocus: z.array(LabStatSchema).optional(),
    requirement: StatRequirementSchema.optional(),
    requirementLabel: z.string().optional(),
    modifiers: ActivitySlotModifierSchema.optional(),
    role: z.string().optional(),
    emptyPenalty: QuestSlotEmptyPenaltySchema.optional(),
    residentRiskModifiers: QuestSlotResidentRiskModifiersSchema.optional(),
    /**
     * `revealAtPlanning` (PLAN-019-S3 D-S3-3): a member meeting the stat
     * threshold assigned to this slot unlocks deeper authored intel
     * (`revealHint`s) already at planning — the explorer pays now, not in-run.
     * `reveals` restricts which nodes unlock (default: every authored one).
     */
    revealAtPlanning: z
      .object({
        stat: LabStatSchema,
        threshold: z.number().min(0).max(100),
        reveals: z.array(z.string()).optional(),
      })
      .strict()
      .optional(),
  })
  .strict();
export type QuestSlotSchemaType = z.infer<typeof QuestSlotSchema>;

/* ------------------------------------------------------------------------ */
/* Node schemas (mirror of QuestNode / QuestOption / CombatSpec).            */
/* ------------------------------------------------------------------------ */

/** Check option — mirrors `QuestOption`. */
export const QuestOptionSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    detail: z.string(),
    /** Node id, or 'CHECK:<id>' to run check <id> then branch on verdict. */
    next: z.string(),
    costGold: z.number().optional(),
    requiresInfo: z.string().optional(),
    requiresFlag: z.string().optional(),
    hiddenIfFlag: z.string().optional(),
    /** Trait-gated options (PLAN-026): shown only with a living carrier. */
    requiresTrait: z.string().optional(),
    hiddenIfTrait: z.string().optional(),
    sets: z.string().optional(),
    consumesFlag: z.string().optional(),
    grantsGold: z.number().optional(),
    grantsInfo: z.string().optional(),
    costDays: z.number().optional(),
    abandonsObjective: z.boolean().optional(),
  })
  .strict();
export type QuestOptionSchemaType = z.infer<typeof QuestOptionSchema>;

/** Turn-based combat configuration — mirrors `CombatSpec`. */
export const CombatSpecSchema = z
  .object({
    turns: z.number(),
    enemies: z.number(),
    attackStats: z.array(LabStatSchema),
    killPerWin: z.number(),
    killPerBigwin: z.number(),
    hitDamage: z.number(),
    escalateProfile: z.boolean(),
    nextCleared: z.string().optional(),
    nextSurvivors: z.string().optional(),
  })
  .strict();
export type CombatSpecSchemaType = z.infer<typeof CombatSpecSchema>;

/** Deterministic pre-verdict toll — mirrors `QuestNode.upfrontDamage`. */
export const UpfrontDamageSchema = z
  .object({
    amount: z.number(),
    epicfailAmount: z.number().optional(),
  })
  .strict();

/** Per-slot base risk for check nodes — mirrors `QuestNode.risk`. */
export const QuestRiskSchema = z
  .object({
    wound: z.number(),
    death: z.number(),
  })
  .strict();

/* ------------------------------------------------------------------ */
/* Declarative outcome model (PLAN-026 engine v2) — mirrors the        */
/* OutcomeSpec/GotoSpec/VarOp contracts in questScenario.ts. Generated  */
/* nodes carry `verdictTable`; authored nodes stay on the engine        */
/* switch. All sub-schemas strict, same rule as the rest of the file.   */
/* ------------------------------------------------------------------ */

/** Run-state condition — mirrors `OutcomeCond` (AND semantics). */
export const OutcomeCondSchema = z
  .object({
    flag: z.string().optional(),
    notFlag: z.string().optional(),
    varGE: z.object({ var: z.string(), value: z.number() }).strict().optional(),
    varLT: z.object({ var: z.string(), value: z.number() }).strict().optional(),
  })
  .strict();
export type OutcomeCondSchemaType = z.infer<typeof OutcomeCondSchema>;

/** Conditional goto branch — mirrors `GotoBranch`. */
export const GotoBranchSchema = z
  .object({
    when: OutcomeCondSchema,
    then: z.string(),
  })
  .strict();

/** Routing target — mirrors `GotoSpec` (plain id or ordered branches + else). */
export const GotoSpecSchema = z.union([
  z.string(),
  z
    .object({
      branches: z.array(GotoBranchSchema).min(1),
      else: z.string(),
    })
    .strict(),
]);
export type GotoSpecSchemaType = z.infer<typeof GotoSpecSchema>;

/** Numeric var operation — mirrors `VarOp`. */
export const VarOpSchema = z
  .object({
    var: z.string(),
    op: z.enum(['set', 'inc', 'dec']),
    value: z.number(),
  })
  .strict();

/** In-run twist arming roll — mirrors `OutcomeSpec.rollFlag`. */
export const RollFlagSchema = z
  .object({
    flag: z.string(),
    chance: z.number().min(0).max(100),
  })
  .strict();

/** Post-verdict outcome — mirrors `OutcomeSpec`. */
export const OutcomeSpecSchema = z
  .object({
    goto: GotoSpecSchema,
    setFlags: z.array(z.string()).optional(),
    clearFlags: z.array(z.string()).optional(),
    setInfo: z.array(z.string()).optional(),
    takeLoot: z.array(z.string()).optional(),
    dropLoot: z.array(z.string()).optional(),
    goldDelta: z.number().optional(),
    damage: z.number().optional(),
    setAlarm: z.boolean().optional(),
    setObjective: z.enum(['done', 'lost']).optional(),
    vars: z.array(VarOpSchema).optional(),
    rollFlag: RollFlagSchema.optional(),
    log: z.string().optional(),
  })
  .strict();
export type OutcomeSpecSchemaType = z.infer<typeof OutcomeSpecSchema>;

/** Verdict → outcome map — mirrors `VerdictTable` (`else` = fallback verdict). */
export const VerdictTableSchema = z
  .object({
    epicfail: OutcomeSpecSchema.optional(),
    fail: OutcomeSpecSchema.optional(),
    almost: OutcomeSpecSchema.optional(),
    win: OutcomeSpecSchema.optional(),
    bigwin: OutcomeSpecSchema.optional(),
    else: OutcomeSpecSchema.optional(),
  })
  .strict();
export type VerdictTableSchemaType = z.infer<typeof VerdictTableSchema>;

/** Run-start twist arming roll — mirrors `ArmRoll`. */
export const ArmRollSchema = z
  .object({
    flag: z.string(),
    chance: z.number().min(0).max(100),
    requiresTrait: z.string().optional(),
  })
  .strict();
export type ArmRollSchemaType = z.infer<typeof ArmRollSchema>;

/** Authored quest node — mirrors `QuestNode`. */
export const QuestNodeSchema = z
  .object({
    id: z.string(),
    kind: z.enum(['choice', 'check', 'info', 'harm', 'combat', 'end']),
    title: z.string(),
    body: z.string(),
    stats: z.array(LabStatSchema).optional(),
    risk: QuestRiskSchema.optional(),
    risky: z.boolean().optional(),
    /**
     * Planning-visible authored danger hint (PLAN-019-S3 T-1): shown at
     * planning always — the declared "what could go wrong" the party sees
     * before launching.
     */
    previewHint: z.string().optional(),
    /** Deeper authored hint unlocked only via `revealAtPlanning` slots. */
    revealHint: z.string().optional(),
    combat: CombatSpecSchema.optional(),
    failHint: z.string().optional(),
    upfrontDamage: UpfrontDamageSchema.optional(),
    options: z.array(QuestOptionSchema).optional(),
    next: z.string().optional(),
    beat: z.number().optional(),
    transit: z.string().optional(),
    verdictFlavor: z.partialRecord(VerdictSchema, z.string()).optional(),
    /**
     * Declarative post-verdict outcomes (PLAN-026 engine v2): when present,
     * the engine applies these data-driven effects/routing and skips the
     * legacy `applyNodeOutcome` switch for this node.
     */
    verdictTable: VerdictTableSchema.optional(),
  })
  .strict();
export type QuestNodeSchemaType = z.infer<typeof QuestNodeSchema>;

/* ------------------------------------------------------------------------ */
/* Offer header (new content — field ownership: schema here, values S2.3).   */
/* ------------------------------------------------------------------------ */

/**
 * Offer header — the POI/detail-facing envelope of a scenario (replaces the
 * data role of `QuestBlueprint`). Ownership rules (S2.1):
 * 1. `slots` reuse the `StatRequirement` contract — no parallel shape.
 * 2. `dangerBandRef` names a danger band whose *values* are owned by S2.3
 *    (`questPois`/`dangerBands`); here it is a declared reference, verified
 *    in tests once the band table exists.
 * 3. `rewardBase` is a declared placeholder until S2.3 defines `rewardTiers`.
 */
/**
 * Reference party member — the calibration party `dangerBandRef` is declared
 * against (critica r2: the band is only meaningful *for a party*). Mirrors
 * `LabMember` minus the presentation fields; stats are complete (all six
 * LabStats) because a partial calibration party is meaningless.
 */
export const ReferenceMemberSchema = z
  .object({
    id: z.string(),
    name: z.string().optional(),
    role: z.enum(['leader', 'member', 'bodyguard']),
    /** HP pool — absent = engine default (`TUNE.hp`). */
    hp: z.number().optional(),
    stats: z.record(LabStatSchema, z.number()),
  })
  .strict();
export type ReferenceMemberSchemaType = z.infer<typeof ReferenceMemberSchema>;

export const QuestOfferSchema = z
  .object({
    /** One-line objective shown in the POI detail header. */
    objective: z.string(),
    /** Free-form tags for the offer card (quest type, tone, …). */
    tags: z.array(z.string()).optional(),
    /** Slots the player must fill to embark (gate «Invia spedizione»). */
    slots: z
      .object({
        required: z.array(QuestSlotSchema),
        optional: z.array(QuestSlotSchema),
      })
      .strict(),
    /**
     * Reference to the danger band id — resolved by S2.3 config. Declared
     * FOR `referenceParty`: the parity test re-simulates the reference party
     * (fixed seed, declared N) and fails only if the derived band differs by
     * more than one grade; a metric within ε of a boundary is «borderline».
     * Requires `referenceParty` — a band without its calibration party is
     * unverifiable.
     */
    dangerBandRef: z.string().optional(),
    /**
     * Calibration party for `dangerBandRef` (see above). Must fit the slot
     * structure: `required.length ≤ referenceParty.length ≤ required +
     * optional`, exactly one `role:'leader'`.
     */
    referenceParty: z.array(ReferenceMemberSchema).optional(),
    /** Nominal quest reward (gold) before world-scaling — placeholder for S2.3. */
    rewardBase: z.number().nonnegative().optional(),
  })
  .strict();
export type QuestOfferSchemaType = z.infer<typeof QuestOfferSchema>;

/* ------------------------------------------------------------------------ */
/* Scenario schema + graph integrity.                                       */
/* ------------------------------------------------------------------------ */

const CHECK_PREFIX = 'CHECK:';

/**
 * Run flags produced by the engine or by config systems outside the node
 * graph (documented contract — schema mirrors code, I-3): camp escalation,
 * prisoner release, loadout aliases, outcome flags. An option may legally
 * require/consume these even though no `sets` declares them.
 */
export const ENGINE_PRODUCED_FLAGS: ReadonlySet<string> = new Set([
  'campoAllertato',
  'campoSveglio',
  'prigionieroLibero',
  'sterminio',
  'trofeoLasciato',
  'trofeoPerso',
  'tesoroPerso',
  'cassaPersa',
  // loadout aliases resolved by questStash (consumables carried in the bag)
  'hasPozione',
  'hasFumogeno',
  'hasCorda',
  'hasCoagulo',
  'hasHealing',
  'hasBonusForza',
  'hasBonusPerc',
  'bonusStealth',
  'bonusStealthPiccolo',
  'vantaggioGrande',
  'vantaggioPiccolo',
  'agguatoPeggiore',
  // Engine v2 (PLAN-026): setObjective:'lost' produces this marker flag.
  'objectiveLost',
]);

function nodeTargets(node: QuestNodeSchemaType): string[] {
  const targets: string[] = [];
  if (node.next) targets.push(node.next);
  if (node.combat?.nextCleared) targets.push(node.combat.nextCleared);
  if (node.combat?.nextSurvivors) targets.push(node.combat.nextSurvivors);
  return targets;
}

/** Every node id a `GotoSpec` can route to (plain id or branches + else). */
function gotoSpecTargets(gotoSpec: GotoSpecSchemaType): string[] {
  if (typeof gotoSpec === 'string') return [gotoSpec];
  return [...gotoSpec.branches.map((b) => b.then), gotoSpec.else];
}

/** Every node id a `verdictTable` can route to. */
function verdictTableTargets(table: VerdictTableSchemaType): string[] {
  return Object.values(table).flatMap((outcome) =>
    outcome ? gotoSpecTargets(outcome.goto) : [],
  );
}

const VERDICT_TABLE_KEYS = ['epicfail', 'fail', 'almost', 'win', 'bigwin'] as const;

/**
 * Static graph integrity (data-verifiable part — see file header for what is
 * deliberately left to the dynamic coverage test):
 * - every `option.next` resolves: `CHECK:<id>` must point at a `check` node;
 *   plain ids must exist;
 * - every `node.next` / `combat.nextCleared` / `combat.nextSurvivors` exists;
 * - node map key === `node.id`;
 * - `startNode` exists and is a `choice` node;
 * - at least one `end` node;
 * - `requiresFlag`/`consumesFlag` have a producer: an option `sets` with the
 *   same name or an engine-produced flag (`ENGINE_PRODUCED_FLAGS`).
 */
export const QuestScenarioSchema = z
  .object({
    /** Scenario id — must match the engine `QuestId` (checked in tests). */
    id: z.string(),
    /** Display title (authored content, Italian). */
    title: z.string(),
    /** Short flavour line for the running-quest window. */
    flavour: z.string().optional(),
    /**
     * Content version/hash written into the run at creation and verified on
     * reload — a mismatch invalidates the run, no silent catch-up on a
     * different scenario (S2.2 writes it, S2.5 enforces it).
     */
    scenarioVersion: z.string().min(1),
    /** Entry node id. */
    startNode: z.string(),
    /** Declared primary stats (drives previews/party guidance). */
    primaryStats: z.array(LabStatSchema).min(1),
    /** Beat labels for the progress indicator. */
    beats: z.array(z.string()).min(1),
    /** Optional intel id → label map (journal/intel UI). */
    intelLabels: z.record(z.string(), z.string()).optional(),
    /** Offer header — POI/detail envelope (see `QuestOfferSchema`). */
    offer: QuestOfferSchema,
    /**
     * Run-start twist arming (PLAN-026, mixed arming): each entry rolls once
     * in `createRun`; `requiresTrait` gates the roll to parties carrying the
     * trait on a living member. In-run arming stays on `OutcomeSpec.rollFlag`.
     */
    armRolls: z.array(ArmRollSchema).optional(),
    /** Initial numeric vars written into the run state (generated scenarios). */
    initialVars: z.record(z.string(), z.number()).optional(),
    /** Authored nodes keyed by node id. */
    nodes: z.record(z.string(), QuestNodeSchema),
  })
  .strict()
  .superRefine((scenario, ctx) => {
    const { nodes } = scenario;
    const issue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, message, path });

    if (!nodes[scenario.startNode]) {
      issue(['startNode'], `startNode '${scenario.startNode}' non esiste in nodes`);
    }
    if (!Object.values(nodes).some((n) => n.kind === 'end')) {
      issue(['nodes'], 'nessun nodo di tipo end');
    }

    const producedFlags = new Set<string>(ENGINE_PRODUCED_FLAGS);
    for (const node of Object.values(nodes)) {
      for (const opt of node.options ?? []) if (opt.sets) producedFlags.add(opt.sets);
      // Engine-v2 producers: declarative outcomes can set/arm flags too.
      for (const outcome of Object.values(node.verdictTable ?? {})) {
        for (const f of outcome?.setFlags ?? []) producedFlags.add(f);
        if (outcome?.rollFlag) producedFlags.add(outcome.rollFlag.flag);
      }
    }
    for (const roll of scenario.armRolls ?? []) producedFlags.add(roll.flag);

    for (const [key, node] of Object.entries(nodes)) {
      if (key !== node.id) {
        issue(['nodes', key], `chiave '${key}' != node.id '${node.id}'`);
      }
      for (const t of nodeTargets(node)) {
        if (!nodes[t]) {
          issue(['nodes', key], `target '${t}' dichiarato ma non esiste`);
        }
      }
      if (node.verdictTable) {
        const vt = node.verdictTable;
        // Coverage: either `else` exists or every verdict has an entry —
        // a missing row at runtime would silently drop the outcome.
        if (!vt.else && !VERDICT_TABLE_KEYS.every((v) => vt[v])) {
          issue(
            ['nodes', key, 'verdictTable'],
            'verdictTable incompleta: servono tutti e 5 i verdict oppure un else',
          );
        }
        for (const t of verdictTableTargets(vt)) {
          if (!nodes[t]) {
            issue(['nodes', key, 'verdictTable'], `goto target '${t}' non esiste`);
          }
        }
        for (const [vKey, outcome] of Object.entries(vt)) {
          if (!outcome || typeof outcome.goto === 'string') continue;
          for (const [i, branch] of outcome.goto.branches.entries()) {
            for (const f of [branch.when.flag, branch.when.notFlag]) {
              if (f && !producedFlags.has(f)) {
                issue(
                  ['nodes', key, 'verdictTable', vKey, 'goto', 'branches', i],
                  `flag '${f}' in condizione goto senza produttore`,
                );
              }
            }
          }
        }
      }
      for (const [i, opt] of (node.options ?? []).entries()) {
        const oPath = ['nodes', key, 'options', i];
        if (opt.next.startsWith(CHECK_PREFIX)) {
          const checkId = opt.next.slice(CHECK_PREFIX.length);
          const checkNode = nodes[checkId];
          if (!checkNode) {
            issue([...oPath, 'next'], `CHECK target '${checkId}' non esiste`);
          } else if (checkNode.kind !== 'check') {
            issue([...oPath, 'next'], `CHECK target '${checkId}' è kind '${checkNode.kind}', atteso 'check'`);
          }
        } else if (!nodes[opt.next]) {
          issue([...oPath, 'next'], `target '${opt.next}' non esiste`);
        }
        for (const flag of [opt.requiresFlag, opt.consumesFlag]) {
          if (flag && !producedFlags.has(flag)) {
            issue(oPath, `flag '${flag}' richiesto/consumato senza produttore (sets o motore)`);
          }
        }
      }
    }

    /* ---- offer ↔ nodes coherence (critica r2: the offer is new content,
     * not covered by the migration parity, so its contract is enforced here) */

    const req = scenario.offer.slots.required;
    const opt = scenario.offer.slots.optional;
    const allSlots = [...req, ...opt];

    // (a) Party shape: at least one required slot carries the engine's
    //     'leader' role (leader alive = reward — a run with no leader slot
    //     can never produce the canonical reward path).
    if (!req.some((s) => s.role === 'leader')) {
      issue(['offer', 'slots', 'required'], 'serve almeno uno slot required con role \'leader\'');
    }

    // (b) referenceParty ↔ slot structure: the calibration party must be
    //     assignable to the slots — no smaller than the required set, no
    //     larger than the total — and carry exactly one leader.
    const ref = scenario.offer.referenceParty;
    if (ref) {
      if (ref.length < req.length || ref.length > allSlots.length) {
        issue(
          ['offer', 'referenceParty'],
          `referenceParty di ${ref.length} membri non assegnabile agli slot (required ${req.length}, totali ${allSlots.length})`,
        );
      }
      if (ref.filter((m) => m.role === 'leader').length !== 1) {
        issue(['offer', 'referenceParty'], 'referenceParty deve avere esattamente un role \'leader\'');
      }
    }
    if (scenario.offer.dangerBandRef && !ref) {
      issue(['offer', 'dangerBandRef'], 'dangerBandRef richiede offer.referenceParty (la banda è dichiarata PER il party di calibrazione)');
    }

    // (c) Stat coverage: every stat a check/combat node rolls must be
    //     coverable by at least one slot's statFocus — otherwise the party
    //     cannot field the competence the scenario demands. All authored
    //     nodes are checked (reachability itself is a separate contract —
    //     the coverage test owns it).
    const neededStats = new Set<string>();
    for (const node of Object.values(nodes)) {
      for (const s of node.stats ?? []) neededStats.add(s);
      for (const s of node.combat?.attackStats ?? []) neededStats.add(s);
    }
    const coveredStats = new Set(allSlots.flatMap((s) => s.statFocus ?? []));
    for (const s of neededStats) {
      if (!coveredStats.has(s)) {
        issue(['offer', 'slots'], `stat '${s}' richiesta dai check non coperta da alcuno statFocus di slot`);
      }
    }
  });

export type QuestScenario = z.infer<typeof QuestScenarioSchema>;

/**
 * Parse and validate an authored scenario module. Throws `ZodError` listing
 * every integrity violation (strict keys + graph checks).
 */
export function parseQuestScenario(input: unknown): QuestScenario {
  return QuestScenarioSchema.parse(input);
}

/* ------------------------------------------------------------------------ */
/* scenarioVersion — content hash (critica r2).                              */
/* ------------------------------------------------------------------------ */

/**
 * Presentation-only keys excluded from the content hash: copy edits (titles,
 * bodies, transit, verdictFlavor, labels, display hints, the beats/intel
 * label lists, slot/offer display strings) must NOT invalidate a persisted
 * run. Everything else — ids, graph topology, stats, risks, costs, combat
 * specs, slot gates, flags — is hashed. `scenarioVersion` itself is excluded
 * (the field stores this hash; hashing it would be circular).
 */
const PRESENTATION_KEYS = new Set([
  'scenarioVersion',
  'title',
  'flavour',
  'body',
  'transit',
  'verdictFlavor',
  'failHint',
  // Engine v2: OutcomeSpec.log is copy (a log line), not mechanics — same
  // rule as verdictFlavor.
  'log',
  'label',
  'detail',
  'objective',
  'tags',
  'beats',
  'intelLabels',
  'statHint',
  'requirementLabel',
  'name',
  'portrait',
  'description',
]);

/** Canonical JSON: object keys sorted, presentation keys dropped, recursively. */
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(value as Record<string, unknown>).sort()) {
      if (PRESENTATION_KEYS.has(k)) continue;
      const v = canonicalize((value as Record<string, unknown>)[k]);
      if (v !== undefined) out[k] = v;
    }
    return out;
  }
  return value;
}

/** FNV-1a 32-bit over the canonical serialization — pure JS, no crypto dep
 *  (runs in browser and in tests). */
function fnv1a(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

/**
 * Content hash of a parsed scenario — the `scenarioVersion` written into the
 * run at creation (S2.2) and verified on reload (S2.5). Both call this
 * function; they never reimplement it. Key-order stable, insensitive to
 * presentation-only edits, sensitive to any semantic change.
 */
export function computeScenarioVersion(scenario: QuestScenario): string {
  return `qsv1-${fnv1a(JSON.stringify(canonicalize(scenario)))}`;
}

/* ------------------------------------------------------------------------ */
/* Type parity guardrail (critica r2).                                       */
/* ------------------------------------------------------------------------ */

type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type AssertTrue<T extends true> = T;

/**
 * Compile-time parity between the Zod-inferred types and the engine types
 * (`QuestNode`/`QuestOption`/`CombatSpec` in `questS1Lab/questScenario.ts`).
 * A drift — a field renamed in the engine, an optionality change — breaks
 * typechecking here, forcing the schema to be updated with it.
 * NOTE: the project has no `tsc` gate in `build:check` (vite build is
 * transpile-only); this assertion is enforced by IDE/tsc and mirrored by the
 * runtime `toStrictEqual` parity test.
 */
export type _NodeParity = AssertTrue<
  Equals<QuestNodeSchemaType, import('@/ui/idleVillage/questS1Lab/questScenario').QuestNode>
>;
export type _OptionParity = AssertTrue<
  Equals<QuestOptionSchemaType, import('@/ui/idleVillage/questS1Lab/questScenario').QuestOption>
>;
export type _CombatParity = AssertTrue<
  Equals<CombatSpecSchemaType, import('@/ui/idleVillage/questS1Lab/questScenario').CombatSpec>
>;
