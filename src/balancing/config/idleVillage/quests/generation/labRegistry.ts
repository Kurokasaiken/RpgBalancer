/**
 * labRegistry — authored registry for the Quest Generation Lab
 * (`/quest-generation-lab`, R-140).
 *
 * This module is the EDITORIAL layer of the lab: it describes what exists
 * in the quest-generation pipeline, where it lives, and what state it is
 * in. Everything the lab can DERIVE from real data (catalog scenarios,
 * kits, traits, twists used) is derived in
 * `src/ui/idleVillage/questGenLab/labModel.ts` — this file holds only the
 * parts that have no machine-readable source of truth today:
 *
 * - gimmick descriptors (vars semantics, dilemma, hooks);
 * - the generation pipeline tree (PLAN-026 / QUEST_GENERATION_CONTRACTS §1);
 * - the mechanics glossary;
 * - the post-quest consequence matrix;
 * - the implementation map (subsystems → files → status);
 * - the open-issue list (what the Director is forgetting).
 *
 * Status vocabulary is shared and closed — a lab card is honest about
 * whether a thing runs in production, only in the lab/offline, is a ratified
 * plan with no code, or does not exist yet.
 *
 * Copy convention: authored content stays Italian (same rule as
 * `questTraits.ts` and scenario copy); UI chrome lives in i18n keys.
 */

import { z } from 'zod';

/* ------------------------------------------------------------------ */
/* Status vocabulary                                                    */
/* ------------------------------------------------------------------ */

/**
 * Honest lifecycle state of a registry entry:
 * - `implemented` — code exists and runs (runtime or lab/test);
 * - `partial` — code exists but covers only part of the contract;
 * - `offline` — implemented outside the live game loop (generators,
 *   narration pipeline, benchmarks);
 * - `gated` — implemented behind an unopened plan gate (e.g. PLAN-026 T6);
 * - `proposal` — written in contracts/specs, no code;
 * - `missing` — required by the rules, nothing exists.
 */
export const LAB_STATUS = [
  'implemented',
  'partial',
  'offline',
  'gated',
  'proposal',
  'missing',
] as const;

export type LabStatus = (typeof LAB_STATUS)[number];

export const LabStatusSchema = z.enum(LAB_STATUS);

/** What kind of artifact a subsystem entry points at. */
export const LAB_SUBSYSTEM_KIND = [
  'engine',
  'config',
  'ui',
  'offline',
  'doc',
  'test',
] as const;

export type LabSubsystemKind = (typeof LAB_SUBSYSTEM_KIND)[number];

/* ------------------------------------------------------------------ */
/* Gimmick descriptors                                                  */
/* ------------------------------------------------------------------ */

/** One numeric core variable of a gimmick (engine v2 `vars` layer). */
export const LabVarSchema = z
  .object({
    /** Var key as it appears in `initialVars` / `OutcomeSpec.vars`. */
    key: z.string(),
    /** What the cursor means in fiction. */
    label: z.string(),
    /** Who moves it up and how. */
    movesWith: z.string(),
  })
  .strict();

export type LabVar = z.infer<typeof LabVarSchema>;

/** Descriptor of a core gimmick skeleton (the strategic problem). */
export const LabGimmickSchema = z
  .object({
    /** Machine id — matches the `gen-<gimmick>-*` scenario id segment. */
    id: z.string(),
    /** Display name (authored). */
    label: z.string(),
    /** The core dilemma the gimmick forces, one line. */
    dilemma: z.string(),
    /** The numeric cursors the skeleton owns. */
    vars: z.array(LabVarSchema),
    /** How the run resolves: what ends the gimmick and how. */
    resolution: z.string(),
    /** Twist flags the skeleton can arm/consume. */
    twists: z.array(
      z
        .object({
          flag: z.string(),
          label: z.string(),
          arming: z.string(),
        })
        .strict(),
    ),
    /** Node keys of the skeleton (scene archetypes it composes). */
    sceneKeys: z.array(z.string()),
    /** Generator module path + entry point. */
    generator: z.object({
      file: z.string(),
      fn: z.string(),
      tuning: z.string(),
    }),
    status: LabStatusSchema,
  })
  .strict();

export type LabGimmick = z.infer<typeof LabGimmickSchema>;

/* ------------------------------------------------------------------ */
/* Pipeline tree (point 2 of R-140)                                     */
/* ------------------------------------------------------------------ */

/** One step of the generation pipeline — the tree the lab renders. */
export const LabPipelineStepSchema = z
  .object({
    id: z.string(),
    /** Step title. */
    title: z.string(),
    /** What happens in the step. */
    desc: z.string(),
    /** What the step reads (inputs). */
    reads: z.string(),
    /** What the step writes (outputs). */
    writes: z.string(),
    /** Source files implementing it. */
    files: z.array(z.string()),
    status: LabStatusSchema,
  })
  .strict();

export type LabPipelineStep = z.infer<typeof LabPipelineStepSchema>;

/* ------------------------------------------------------------------ */
/* Mechanics glossary                                                   */
/* ------------------------------------------------------------------ */

/** One mechanic of the quest engine/generator — name + what it does. */
export const LabMechanicSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    desc: z.string(),
    /** The scenario-data fields or engine APIs that carry it. */
    surface: z.string(),
    files: z.array(z.string()),
    status: LabStatusSchema,
  })
  .strict();

export type LabMechanic = z.infer<typeof LabMechanicSchema>;

/* ------------------------------------------------------------------ */
/* Consequence matrix (point 3 of R-140)                                */
/* ------------------------------------------------------------------ */

/** One domain the quest aftermath touches — what changes, where, how. */
export const LabConsequenceSchema = z
  .object({
    id: z.string(),
    /** Domain label (party, villaggio, fazioni, mondo, future quest…). */
    domain: z.string(),
    /** What concretely changes after a run. */
    desc: z.string(),
    /** The mechanism that applies it (or 'nessuno — non esiste'). */
    mechanism: z.string(),
    files: z.array(z.string()),
    status: LabStatusSchema,
  })
  .strict();

export type LabConsequence = z.infer<typeof LabConsequenceSchema>;

/* ------------------------------------------------------------------ */
/* Implementation map (point 4 of R-140)                                */
/* ------------------------------------------------------------------ */

/** One implemented subsystem: where it lives and how it moves mechanics. */
export const LabSubsystemSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    kind: z.enum(LAB_SUBSYSTEM_KIND),
    /** Primary file(s) — repo-relative paths. */
    files: z.array(z.string()),
    /** What it changes mechanically / what it produces. */
    impact: z.string(),
    /** Tests or benchmarks covering it (names, not paths). */
    tests: z.array(z.string()),
    status: LabStatusSchema,
    /** Known limitation, if any. */
    limitation: z.string().optional(),
  })
  .strict();

export type LabSubsystem = z.infer<typeof LabSubsystemSchema>;

/* ------------------------------------------------------------------ */
/* Open issues (point 5 of R-140)                                       */
/* ------------------------------------------------------------------ */

/** One unresolved issue the Director should not forget. */
export const LabOpenIssueSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    desc: z.string(),
    /** Where the discussion lives (doc / OPEN-xx). */
    source: z.string(),
  })
  .strict();

export type LabOpenIssue = z.infer<typeof LabOpenIssueSchema>;

/* ================================================================== */
/* Authored registry data                                               */
/* ================================================================== */

/**
 * Core gimmicks implemented as skeleton generators. The `id` matches the
 * `gen-<id>-<kit>` scenario naming so the lab can derive the gimmick of a
 * catalog entry from its id.
 */
export const QUEST_LAB_GIMMICKS: Readonly<Record<string, LabGimmick>> = {
  race: LabGimmickSchema.parse({
    id: 'race',
    label: 'Gara di avanzamento',
    dilemma:
      'Correre veloci o correre informati: ogni check sposta te o il rivale verso il traguardo — chi arriva prima prende il premio, chi esita lo guarda andarsene.',
    vars: [
      { key: 'you', label: 'Avanzamento del party', movesWith: 'i verdetti win/bigwin sui check di avanzamento' },
      { key: 'rival', label: 'Avanzamento del rivale', movesWith: 'i fail/epicfail e le scelte lente' },
      { key: 'goal', label: 'Traguardo', movesWith: 'fisso (tuning `goal`) — il primo che lo raggiunge vince' },
    ],
    resolution:
      'Il primo cursore a `goal` vince: `you` → la vetta e il premio (TAKEN≠SECURED fino al varco); `rival` → la sconfitta — sopravvivi ma senza obiettivo.',
    twists: [
      {
        flag: 'inseguimento',
        label: 'Inseguimento',
        arming: 'armRoll a inizio run (chance tuning), gate su trait `scavezzacollo` — devia la rotta verso l’imboscata',
      },
    ],
    sceneKeys: [
      'partenza', 'viaA', 'viaB', 'tappa', 'sprint', 'passo', 'taglio',
      'balzo', 'imboscata', 'vetta', 'sicuro', 'varco', 'sconfitta', 'fine',
    ],
    generator: {
      file: 'src/balancing/config/idleVillage/quests/generation/raceGimmick.ts',
      fn: 'generateRaceScenario(kit, tuning?)',
      tuning: 'goal, twistChance',
    },
    status: 'offline',
  }),
  flood: LabGimmickSchema.parse({
    id: 'flood',
    label: 'La volta che allaga',
    dilemma:
      'Avidità vs fuga: ogni azione alza l’acqua, solo spingere verso il pozzo alza l’uscita — un altro carico o scappare mentre si può.',
    vars: [
      { key: 'acqua', label: 'Livello dell’acqua', movesWith: 'sale a OGNI azione; a `limite` la galleria va in piena' },
      { key: 'uscita', label: 'Progresso verso l’uscita', movesWith: 'solo i check che spingono verso il pozzo' },
    ],
    resolution:
      'A `uscita ≥ uscitaGoal` raggiungi lo sbarramento e l’estrazione — il bottino TAKEN non è SECURED finché non esci. Se `acqua ≥ limite` prima: piena — molli il carico o lo rischi in un nuoto quasi suicida.',
    twists: [
      {
        flag: 'cassa-madre',
        label: 'Cassa madre',
        arming: 'armRoll a inizio run (gate trait `avido`) — sblocca l’opzione di bottino massimo alla camera madre',
      },
      {
        flag: 'parete-cede',
        label: 'La parete cede',
        arming: 'armRoll/evento (chance tuning) — evento che accelera la piena',
      },
    ],
    sceneKeys: [
      'ingresso', 'gabbia', 'cunicolo', 'crocevia', 'vena', 'punta', 'camera',
      'puntella', 'madre', 'piena', 'nuoto', 'sacca', 'sbarramento',
      'diaframma', 'ultimo', 'fine',
    ],
    generator: {
      file: 'src/balancing/config/idleVillage/quests/generation/floodVault.ts',
      fn: 'generateFloodVault(kit, tuning?)',
      tuning: 'limite, uscitaGoal, madreChance, pareteChance',
    },
    status: 'offline',
  }),
  meld: LabGimmickSchema.parse({
    id: 'meld',
    label: 'Meld — il bonus che scade',
    dilemma:
      'Prendere il bonus in scadenza o restare sulla rotta sicura: il contenitore si perde fra pochi turni non dichiarati — le opzioni veloci costano sangue (rischio ferita/morte), quelle prudenti lo lasciano scadere.',
    vars: [
      { key: 'rotta', label: 'Avanzamento verso il contenitore', movesWith: 'i verdetti sui check del tracciato meld; le opzioni rapide danno +2 ma portano rischio wound/death' },
      { key: 'soglia', label: 'Distanza da coprire', movesWith: 'fisso (tuning `soglia`) — a `rotta ≥ soglia` il meld è TAKEN' },
      { key: 'scadenza', label: 'Turni residui prima della perdita', movesWith: 'decresce a ogni azione della run — valore NON dichiarato al giocatore: la UI mostra solo stati nominati (disponibile / ultima chiamata / scaduto)' },
    ],
    resolution:
      'Tracciato bonus parallelo all’obiettivo: `rotta ≥ soglia` prima che `scadenza` arrivi a 0 → contenitore preso (bottino extra, TAKEN≠SECURED fino all’uscita); `scadenza = 0` → il meld si perde e la quest continua. L’indicatore mostra solo lo stato nominato, mai i turni esatti.',
    twists: [
      {
        flag: 'doppio-meld',
        label: 'Secondo contenitore',
        arming: 'armRoll a inizio run (chance tuning) — un secondo contenitore appare sulla rotta opposta: non si possono prendere entrambi',
      },
      {
        flag: 'meld-presidiato',
        label: 'Contenitore presidiato',
        arming: 'armRoll/evento (chance tuning) — il contenitore è sorvegliato: la raccolta richiede uno scontro o un check di ingaggio',
      },
    ],
    sceneKeys: [
      'avvistamento', 'rotta', 'scorciatoia', 'bivio', 'tratto',
      'contenitore', 'ultima', 'scaduto', 'estrazione', 'fine',
    ],
    generator: {
      file: 'src/balancing/config/idleVillage/quests/generation/meldGimmick.ts',
      fn: 'generateMeldScenario(kit, tuning?)',
      tuning: 'soglia, finestraTurni, doppioChance, presidioChance',
    },
    status: 'proposal',
  }),
};

/**
 * The generation tree — CONTRACTS §1 order, annotated with what exists
 * today. This is the «albero specifico» the Director asked for.
 */
export const QUEST_LAB_PIPELINE: readonly LabPipelineStep[] = [
  {
    id: 'input',
    title: '1. Input',
    desc: 'POI + banda di pericolo desiderata + party candidato + seed. Il punto d’ingresso di ogni generazione.',
    reads: 'poiConfig, worldScaling (daysPlayed), roster/party, seed',
    writes: 'parametri di generazione',
    files: [
      'src/ui/idleVillage/questS1Lab/questOffer.ts',
      'src/balancing/config/idleVillage/quests/worldScaling.ts',
    ],
    status: 'partial',
  },
  {
    id: 'pick',
    title: '2. Pick gimmick + kit',
    desc: 'Scelta del CoreGimmick compatibile e del DomainKit (il mondo). Struttura e flavour sono due livelli separati: stesso scheletro, vestito diverso.',
    reads: 'QUEST_LAB_GIMMICKS, kit registry, DomainVocab',
    writes: 'coppia gimmick × kit',
    files: [
      'src/balancing/config/idleVillage/quests/generation/kits.ts',
      'src/balancing/config/idleVillage/quests/generation/domainVocabs.ts',
    ],
    status: 'offline',
  },
  {
    id: 'skeleton',
    title: '3. Skeleton (SceneArchetype)',
    desc: 'Il generatore emette il grafo dei nodi: scene archetype con le loro option, i check, i gate (info/trait/flag), le verdictTable.',
    reads: 'kit.copy per scena, tuning',
    writes: 'grafo QuestNode completo',
    files: [
      'src/balancing/config/idleVillage/quests/generation/raceGimmick.ts',
      'src/balancing/config/idleVillage/quests/generation/floodVault.ts',
    ],
    status: 'offline',
  },
  {
    id: 'bind',
    title: '4. Bind traits + twist deck',
    desc: 'ArmRoll runstart (gate su trait del party) e rollFlag in-run: il party è un vettore di twist — la composizione cambia lo spazio delle possibilità, non le odds.',
    reads: 'QUEST_TRAITS, armRolls del kit/gimmick',
    writes: 'armRolls + rollFlag nello scenario',
    files: [
      'src/balancing/config/idleVillage/quests/questTraits.ts',
      'src/balancing/config/idleVillage/quests/questScenario.schema.ts',
    ],
    status: 'offline',
  },
  {
    id: 'emit',
    title: '5. Emit QuestScenario',
    desc: 'Lo scenario esce parse-validato da Zod a import: id, initialVars, primaryStats, offer header, nodi con verdictTable.',
    reads: 'grafo + dressing',
    writes: 'QuestScenario (schema-checked)',
    files: [
      'src/balancing/config/idleVillage/quests/questScenario.schema.ts',
      'src/balancing/config/idleVillage/quests/generation/catalog.ts',
    ],
    status: 'offline',
  },
  {
    id: 'narrate',
    title: '6. NarrativeBrief → copy',
    desc: 'Pipeline offline: brief per nodo → draft provider → validazione lessicale (vietati/coerenza del vocab) → kit narrato. Gli artefatti IT entrano nel catalogo come imprints.',
    reads: 'DomainVocab (mayInvent/vietati), skeleton facts',
    writes: 'kit narrati (flood-mare, race-miniera) → scenari narrated',
    files: [
      'src/balancing/config/idleVillage/quests/generation/narrative/',
      'src/balancing/config/idleVillage/quests/generation/narrated/',
    ],
    status: 'offline',
  },
  {
    id: 'validate',
    title: '7. Validazione strutturale',
    desc: 'Zod strict + integrità del grafo (target, coverage verdictTable, flag con produttore, trait registrati, stat coverage offerta).',
    reads: 'QuestScenario',
    writes: 'errori di integrità (fail-loud a import/test)',
    files: ['src/balancing/config/idleVillage/quests/questScenario.schema.ts'],
    status: 'implemented',
  },
  {
    id: 'montecarlo',
    title: '8. Monte Carlo benchmark',
    desc: 'Simulazione N run per scenario: distribuzione esiti, copertura nodi/opzioni, bande di pericolo, regressioni dello skeleton.',
    reads: 'ScenarioInstance + strategy + seed',
    writes: 'metriche bench (generatedCatalog.bench.test)',
    files: ['src/ui/idleVillage/questS1Lab/questSimulation.ts'],
    status: 'offline',
  },
  {
    id: 'freeze',
    title: '9. Freeze ScenarioInstance',
    desc: 'Istanza content-addressed (`qsi-<hash>`): nodi, startNode, armRolls, initialVars, primaryStats congelati — il run non legge mai la config viva.',
    reads: 'QuestScenario + scales',
    writes: 'ScenarioInstance registrata',
    files: [
      'src/ui/idleVillage/questS1Lab/questOffer.ts',
      'src/ui/idleVillage/questS1Lab/questRun.ts',
    ],
    status: 'implemented',
  },
  {
    id: 'offer',
    title: '10. Offer al POI',
    desc: 'L’offerta appare al POI con banda di pericolo derivata (ipotesi sul reference party) e reward risolta. Oggi cablata solo per gli scenari authored (goblin/rovine).',
    reads: 'questPois, worldScaling, rewardTiers, MC band',
    writes: 'ResolvedQuestOffer + ResolvedOfferRecord',
    files: [
      'src/ui/idleVillage/questS1Lab/questOffer.ts',
      'src/balancing/config/idleVillage/quests/questPois.ts',
    ],
    status: 'gated',
  },
  {
    id: 'run',
    title: '11. Run (profilo gen)',
    desc: 'Il motore esegue lo scenario generato: check a 5 verdetti, harms posizionali, vars, twist, TAKEN≠SECURED, fuga.',
    reads: 'ScenarioInstance + party + seed',
    writes: 'QuestRunState terminale',
    files: ['src/ui/idleVillage/questS1Lab/questRun.ts'],
    status: 'implemented',
  },
  {
    id: 'settle',
    title: '12. Settlement',
    desc: 'Piano di settlement idempotente: morti/feriti sui residenti, gold+loot+XP al villaggio, release del loadout, righe di eventLog.',
    reads: 'run terminale + resolvedOffer.rewardResolved',
    writes: 'effetti sullo store (gold, xp, isDead, isInjured)',
    files: ['src/ui/idleVillage/quests/questSettlement.ts'],
    status: 'partial',
  },
  {
    id: 'epilogue',
    title: '13. Epilogo / report',
    desc: 'Report di ritorno: caduti, feriti, consumabili, ricompensa, bottino, XP, intel, grant authored (titoli/malattie/lore — seam senza sistemi sotto).',
    reads: 'run + settlement plan + scenario.epilogue',
    writes: 'sezioni epilogo per la UI',
    files: ['src/ui/idleVillage/quests/questEpilogue.ts'],
    status: 'implemented',
  },
];

/**
 * Mechanics glossary — what exists and what surface carries it.
 */
export const QUEST_LAB_MECHANICS: readonly LabMechanic[] = [
  {
    id: 'verdicts',
    label: 'Check a 5 verdetti',
    desc: 'epicfail/fail/almost/win/bigwin su roll D100 vs group score — ogni banda ha effetto e flavour propri.',
    surface: 'node.stats, node.risk, ResolvedCheck.verdict',
    files: ['src/ui/idleVillage/questS1Lab/questRun.ts'],
    status: 'implemented',
  },
  {
    id: 'verdict-table',
    label: 'verdictTable (engine v2)',
    desc: 'Esiti post-verdetto dichiarativi: effetti + routing in DATI, non nello switch per-id. I nodi generati la portano sempre.',
    surface: 'node.verdictTable → OutcomeSpec (goto, setFlags, vars, loot…)',
    files: [
      'src/ui/idleVillage/questS1Lab/questScenario.ts',
      'src/balancing/config/idleVillage/quests/questScenario.schema.ts',
    ],
    status: 'implemented',
  },
  {
    id: 'vars',
    label: 'Vars numeriche del run',
    desc: 'Cursori del gimmick (you/rival/goal, acqua/uscita) come Record<string, number> — decisione Director: numeri, non flag.',
    surface: 'scenario.initialVars, OutcomeSpec.vars (set/inc/dec), varGE/varLT',
    files: ['src/ui/idleVillage/questS1Lab/questRun.ts'],
    status: 'implemented',
  },
  {
    id: 'goto-conds',
    label: 'Routing condizionale',
    desc: 'GotoSpec a branches: primo branch che matcha (flag/notFlag/varGE/varLT) vince, `else` obbligatorio.',
    surface: 'OutcomeSpec.goto = {branches, else}',
    files: ['src/ui/idleVillage/questS1Lab/questScenario.ts'],
    status: 'implemented',
  },
  {
    id: 'gates',
    label: 'Gate sulle opzioni',
    desc: 'requiresInfo/requiresFlag/requiresTrait + hiddenIf*: le strade disponibili cambiano con ciò che il party sa, ha fatto, è.',
    surface: 'QuestOption.requires*/hiddenIf*',
    files: ['src/ui/idleVillage/questS1Lab/questRun.ts'],
    status: 'implemented',
  },
  {
    id: 'traits',
    label: 'Trait narrativi',
    desc: 'Registry chiuso (avido/prudente/scavezzacollo): nessun modificatore numerico — aprono rotte e armano twist.',
    surface: 'LabMember.traits, ArmRoll.requiresTrait',
    files: ['src/balancing/config/idleVillage/quests/questTraits.ts'],
    status: 'implemented',
  },
  {
    id: 'armrolls',
    label: 'Twist arming',
    desc: 'armRoll runstart (trait-gated) + rollFlag in-run: arming misto, il flag vive poi nei gate delle opzioni e nei branch.',
    surface: 'scenario.armRolls, OutcomeSpec.rollFlag',
    files: ['src/ui/idleVillage/questS1Lab/questRun.ts'],
    status: 'implemented',
  },
  {
    id: 'taken-secured',
    label: 'TAKEN ≠ SECURED',
    desc: 'Il bottino preso resta vulnerabile fino all’estrazione: takeLoot/dropLoot nei verdetti, la piena lo strappa di mano.',
    surface: 'OutcomeSpec.takeLoot/dropLoot, run.loot',
    files: ['src/ui/idleVillage/questS1Lab/questRun.ts'],
    status: 'implemented',
  },
  {
    id: 'harms',
    label: 'Harms posizionali',
    desc: 'Ferite/morti per slot con pesi posizionali, bodyguard che intercetta, wounded che peggiora i rischi.',
    surface: 'SLOT_RISK, memberRisk, HarmEvent',
    files: ['src/ui/idleVillage/questS1Lab/questRun.ts'],
    status: 'implemented',
  },
  {
    id: 'combat',
    label: 'Combattimento a turni',
    desc: 'Nodi combat: attackStats per turno, nemici con hit posizionali, kill anticipati chiudono lo scontro. Copy dichiarativa opzionale (enemyName/attackLines/clearedText/survivorsText/holdingText) — fallback goblin, fight non-goblin senza toccare il motore.',
    surface: 'node.combat (CombatSpec)',
    files: ['src/ui/idleVillage/questS1Lab/questRun.ts'],
    status: 'implemented',
  },
  {
    id: 'imprint-compilation',
    label: 'Compilazione imprint→grafo',
    desc: 'Le function spec dei beat (QUEST_IMPRINTS) compilate in QuestScenario sul profilo `gen`: vars/verdictTable/goto bastano, zero switch authored. Primo artefatto: gen-impr002-palude (IMPR-002 × palude). Id gen-<imprint>-<dominio> = provenance distinta dai skeleton×kit.',
    surface: 'impr002Palude.ts, imprintCatalogEntries (labModel)',
    files: [
      'src/balancing/config/idleVillage/quests/generation/impr002Palude.ts',
      'src/ui/idleVillage/questGenLab/labModel.ts',
      'context/QUEST_IMPRINTS.md',
    ],
    status: 'implemented',
  },
  {
    id: 'alarm',
    label: 'Allerta a stati',
    desc: 'Escalation a stati nominati (quieto→allertato→sveglio) non a metro numerico — authored, engine switch legacy.',
    surface: 'flags campoAllertato/campoSveglio, OutcomeSpec.setAlarm',
    files: ['src/ui/idleVillage/questS1Lab/questRun.ts'],
    status: 'partial',
  },
  {
    id: 'preview',
    label: 'Preview esatta pre-check',
    desc: 'successPct, wound/death per slot, consumabile e intel applicabili — numeri reali prima di commettere (regola frozen R-108).',
    surface: 'previewOption(state, optionId)',
    files: ['src/ui/idleVillage/questS1Lab/questRun.ts'],
    status: 'implemented',
  },
  {
    id: 'simulation',
    label: 'Simulazione Monte Carlo',
    desc: 'N run deterministiche per seed: distribuzione esiti, per-member sopravvivenza, bande di pericolo derivate.',
    surface: 'simulateQuest/simulateQuestAsync, QuestSimResult',
    files: ['src/ui/idleVillage/questS1Lab/questSimulation.ts'],
    status: 'implemented',
  },
  {
    id: 'world-scaling',
    label: 'World scaling',
    desc: 'daysPlayed → dangerScale/rewardScale → whitelist transform su rischi/combat/reward dello ScenarioInstance.',
    surface: 'computeWorldScales, transformScenarioNodes',
    files: [
      'src/balancing/config/idleVillage/quests/worldScaling.ts',
      'src/ui/idleVillage/questS1Lab/questOffer.ts',
    ],
    status: 'implemented',
  },
  {
    id: 'epilogue-grants',
    label: 'Grant di epilogo',
    desc: 'Titoli/malattie/lore da flag+outcome — seam authored: la riga appare nel report, i sistemi sotto non esistono ancora.',
    surface: 'scenario.epilogue → buildQuestEpilogue',
    files: ['src/ui/idleVillage/quests/questEpilogue.ts'],
    status: 'partial',
  },
  {
    id: 'channels',
    label: 'Canali di approccio (gimmick channels)',
    desc: 'Approach lock a run-level, capability-gated dal party, max 3 canali per check — adottato (R-134), runtime v0 non integrato.',
    surface: 'QUEST_RULES §7, PLAN-028',
    files: ['plans/PLAN-028-gimmick-channels-v0.md'],
    status: 'proposal',
  },
  {
    id: 'hidden-check',
    label: 'Nodi hazard / hiddenCheck',
    desc: 'Eventi a innesco automatico con check nascosto — nascosto prima, rivelato sempre dopo (QUEST_RULES §3). Primo esemplare: mimic (finta cassa → perc check → combat lungo/breve, nessun bottino). Famiglia ricompensa-ingannevole.',
    surface: 'HazardNode.hiddenCheck + verdictTable (CONTRACTS §15)',
    files: ['context/QUEST_GENERATION_CONTRACTS.md'],
    status: 'proposal',
  },
];

/**
 * Post-quest consequence matrix — what actually changes after a run,
 * honest about what exists and what does not.
 */
export const QUEST_LAB_CONSEQUENCES: readonly LabConsequence[] = [
  {
    id: 'party-hp',
    domain: 'Party — HP',
    desc: 'Il danno resta: HP consumati da harms posizionali, upfrontDamage e combat durante il run.',
    mechanism: 'run.party[].hp/maxHp nel QuestRunState',
    files: ['src/ui/idleVillage/questS1Lab/questRun.ts'],
    status: 'implemented',
  },
  {
    id: 'party-wounded',
    domain: 'Party — feriti',
    desc: 'Chi torna ferito diventa isInjured sul residente: non lavora, recovery a injuredUntilTick = settleTick + woundRecoveryTicks.',
    mechanism: 'settlement effect resident-wounded → store',
    files: [
      'src/ui/idleVillage/quests/questSettlement.ts',
      'src/balancing/config/idleVillage/quests/questSettlement.ts',
    ],
    status: 'implemented',
  },
  {
    id: 'party-dead',
    domain: 'Party — morti',
    desc: 'La morte è reale e permanente (DD/XCOM): il residente diventa isDead — non si rialza, non si recupera.',
    mechanism: 'settlement effect resident-dead → store',
    files: ['src/ui/idleVillage/quests/questSettlement.ts'],
    status: 'implemented',
  },
  {
    id: 'village-gold',
    domain: 'Villaggio — oro',
    desc: 'Reward risolto (solo se leader vivo + outcome reward) + gold di bottino raccolto in run entrano nella cassa del villaggio.',
    mechanism: 'village-gold effects: reward: vs loot:',
    files: ['src/ui/idleVillage/quests/questSettlement.ts'],
    status: 'implemented',
  },
  {
    id: 'village-xp',
    domain: 'Villaggio — XP',
    desc: 'L’esperienza della run confluisce nell’XP del villaggio.',
    mechanism: 'village-xp effect',
    files: ['src/ui/idleVillage/quests/questSettlement.ts'],
    status: 'implemented',
  },
  {
    id: 'loadout',
    domain: 'Consumabili',
    desc: 'La borsa spedizione si svuota: i consumabili usati appaiono nel report, la riserva del loadout si rilascia a settlement.',
    mechanism: 'consumablesUsed nel report + loadout-release effect',
    files: ['src/ui/idleVillage/quests/questSettlement.ts'],
    status: 'implemented',
  },
  {
    id: 'eventlog',
    domain: 'Villaggio — memoria',
    desc: 'Il villaggio ricorda: una riga di esito + una per effetto applicato nell’eventLog (dedup ledger — mai due volte).',
    mechanism: 'applyPlanToState → eventLog entries',
    files: ['src/ui/idleVillage/quests/questSettlement.ts'],
    status: 'implemented',
  },
  {
    id: 'epilogue-grants',
    domain: 'PG — titoli/malattie/lore',
    desc: 'Seam authored: «Ammazzagoblin», malattie, echi — le righe esistono nel report quando lo scenario le dichiara; i sistemi sottostanti (titoli, malattie) non esistono.',
    mechanism: 'scenario.epilogue → buildQuestEpilogue',
    files: ['src/ui/idleVillage/quests/questEpilogue.ts'],
    status: 'partial',
  },
  {
    id: 'factions',
    domain: 'Fazioni',
    desc: 'Nessun sistema di fazioni esiste: una quest che colpisce i predoni della Val Nera non cambia nulla fuori dal testo.',
    mechanism: 'nessuno — non implementato',
    files: [],
    status: 'missing',
  },
  {
    id: 'world',
    domain: 'Mondo / POI',
    desc: 'Il mondo legge (daysPlayed → scaling) ma non viene scritto: risolvere la quest non chiude il POI, non sposta marker, non cambia la mappa.',
    mechanism: 'worldScaling in lettura; nessuna scrittura',
    files: ['src/balancing/config/idleVillage/quests/worldScaling.ts'],
    status: 'missing',
  },
  {
    id: 'future-quests',
    domain: 'Quest future / archi narrativi',
    desc: 'Archi principali gated (PLAN-026 T7): nessuna quest generata ne sblocca un’altra, nessun arco registra progressi.',
    mechanism: 'nessuno — gate di plan aperto',
    files: ['plans/PLAN-026-quest-generation.md'],
    status: 'gated',
  },
  {
    id: 'ignored-offers',
    domain: 'Offerte ignorate/scadute',
    desc: 'Le regole lo chiedono («ogni opportunità ignorata ha conseguenze») ma nessun sistema traccia expiry né applica un costo al rifiuto.',
    mechanism: 'nessuno — non implementato',
    files: [],
    status: 'missing',
  },
];

/**
 * Implementation map — every subsystem the generation stack relies on,
 * where it lives and what it does to the mechanics.
 */
export const QUEST_LAB_SUBSYSTEMS: readonly LabSubsystem[] = [
  {
    id: 'engine',
    label: 'Quest run engine (questRun)',
    kind: 'engine',
    files: ['src/ui/idleVillage/questS1Lab/questRun.ts'],
    impact:
      'Lo stato della run: check a 5 verdetti, harms posizionali, opzioni gated, verdictTable interpreter, vars, armRolls, combat, fuga. Profilo `gen` vuoto di proposito — il contenuto arriva via ScenarioInstance.',
    tests: ['raceToPass.test', 'floodVault.test', 'questTraits.test', 'questSettlement.test'],
    status: 'implemented',
  },
  {
    id: 'schema',
    label: 'QuestScenario Zod schema',
    kind: 'config',
    files: ['src/balancing/config/idleVillage/quests/questScenario.schema.ts'],
    impact:
      'Integrità statica: target esistenti, coverage verdictTable, flag con produttore, trait registrati (registry chiuso), stat coverage offerta, parity compile-time con i tipi del motore.',
    tests: ['raceToPass.test (schema parse)', 'goblin/rovine parity'],
    status: 'implemented',
  },
  {
    id: 'generators',
    label: 'Generatori skeleton (race + flood)',
    kind: 'offline',
    files: [
      'src/balancing/config/idleVillage/quests/generation/raceGimmick.ts',
      'src/balancing/config/idleVillage/quests/generation/floodVault.ts',
    ],
    impact:
      'Emettono il grafo completo dallo skeleton × kit: nodi, opzioni gated, verdictTable, vars, armRolls. Tuning: goal/twistChance (race), limite/uscitaGoal/madreChance/pareteChance (flood).',
    tests: ['raceToPass.test', 'floodVault.test'],
    status: 'offline',
  },
  {
    id: 'kits',
    label: 'Domain kit (dressing)',
    kind: 'config',
    files: [
      'src/balancing/config/idleVillage/quests/generation/kits.ts',
      'src/balancing/config/idleVillage/quests/generation/floodMiniera.ts',
      'src/balancing/config/idleVillage/quests/generation/narrated/',
    ],
    impact:
      'Passo-montano, palude, miniera (authored) + mare, miniera-race (narrated): cambiano mondo, nomi, threat, loot e copy di scena — la meccanica resta dello skeleton.',
    tests: ['raceToPass.test (kit-swap)', 'narrationQuality.test'],
    status: 'offline',
  },
  {
    id: 'catalog',
    label: 'GENERATED_CATALOG v0',
    kind: 'config',
    files: ['src/balancing/config/idleVillage/quests/generation/catalog.ts'],
    impact:
      'I 5 imprints pre-generati (2 gimmick × kit): la v0 spedisce scenari generati OFFLINE come dati, non genera a runtime.',
    tests: ['generatedCatalog.bench.test'],
    status: 'offline',
  },
  {
    id: 'traits',
    label: 'Trait registry',
    kind: 'config',
    files: ['src/balancing/config/idleVillage/quests/questTraits.ts'],
    impact:
      'avido/prudente/scavezzacollo: gate su opzioni, arming twist, rotte alternative. Registry chiuso — un id sbagliato è errore di dati a import.',
    tests: ['questTraits.test'],
    status: 'implemented',
  },
  {
    id: 'vocabs',
    label: 'DomainVocab',
    kind: 'config',
    files: ['src/balancing/config/idleVillage/quests/generation/domainVocabs.ts'],
    impact:
      'Vocabolario per dominio: mayInvent/vietati/coerenza — input semantico del NarrativeBrief e criterio del validatore di copy.',
    tests: ['narration.test', 'narrationQuality.test'],
    status: 'offline',
  },
  {
    id: 'narrative',
    label: 'Pipeline narrativa',
    kind: 'offline',
    files: ['src/balancing/config/idleVillage/quests/generation/narrative/'],
    impact:
      'SceneBrief → prompt → draft provider → validazione deterministica → kit narrato. Due artefatti in catalogo (flood-mare, race-miniera).',
    tests: ['narration.test', 'narrationQuality.test'],
    status: 'offline',
  },
  {
    id: 'instances',
    label: 'ScenarioInstance registry',
    kind: 'engine',
    files: [
      'src/ui/idleVillage/questS1Lab/questOffer.ts',
      'src/ui/idleVillage/questS1Lab/questRun.ts',
    ],
    impact:
      'Istanza content-addressed (`qsi-<hash>`): il run esegue nodi congelati, mai la config viva. Il save trasporta l’istanza — reload safe.',
    tests: ['raceToPass.test (gen profile)', 'questSettlement.test'],
    status: 'implemented',
  },
  {
    id: 'offer-resolution',
    label: 'Offer resolution (resolveQuestOffer)',
    kind: 'engine',
    files: [
      'src/ui/idleVillage/questS1Lab/questOffer.ts',
      'src/balancing/config/idleVillage/quests/questPois.ts',
    ],
    impact:
      'Signals → scales → istanza + reward risolto + banda di pericolo (MC sul reference party). Oggi cablata solo su goblin/rovine authored.',
    tests: ['questSettlement.test', 'questOffer tests'],
    status: 'partial',
    limitation: 'Il catalogo generato non ha ancora POI né resolvedOffer (T6 gated).',
  },
  {
    id: 'simulation',
    label: 'Monte Carlo (questSimulation)',
    kind: 'engine',
    files: ['src/ui/idleVillage/questS1Lab/questSimulation.ts'],
    impact:
      'Forecast deterministico: outcome distribution, per-member survival, banda derivata, why-analysis. Usato da lab, bande e bench.',
    tests: ['generatedCatalog.bench.test'],
    status: 'implemented',
  },
  {
    id: 's1lab',
    label: 'Quest S1 Lab (/quest-s1-lab)',
    kind: 'ui',
    files: ['src/ui/idleVillage/pages/QuestS1LabPage.tsx'],
    impact:
      'Cockpit authored: run reale con astrolabe, preview esatta, forecast MC, combat, consumabili. Solo scenari authored — il gen profile non è esposto qui.',
    tests: ['questS1Lab page tests'],
    status: 'implemented',
  },
  {
    id: 'settlement',
    label: 'Settlement (deriveSettlementPlan/settleRun)',
    kind: 'engine',
    files: ['src/ui/idleVillage/quests/questSettlement.ts'],
    impact:
      'Run terminale → effetti idempotenti: morti/feriti residenti, gold/XP villaggio, release loadout, eventLog. Ledger dedup nel salvataggio.',
    tests: ['questSettlement.test'],
    status: 'implemented',
    limitation: 'Copre party+risorse; fazioni/mondo/archi non toccati.',
  },
  {
    id: 'epilogue',
    label: 'Epilogo (buildQuestEpilogue)',
    kind: 'engine',
    files: [
      'src/ui/idleVillage/quests/questEpilogue.ts',
      'src/balancing/config/idleVillage/quests/questEpilogue.ts',
    ],
    impact:
      'Report di ritorno dallo STESSO piano di settlement — mai una seconda derivazione: caduti, feriti, consumabili, ricompensa, bottino, XP, intel, grant authored.',
    tests: ['questEpilogue.test'],
    status: 'implemented',
  },
  {
    id: 'channels',
    label: 'Gimmick channels v0',
    kind: 'doc',
    files: [
      'plans/PLAN-028-gimmick-channels-v0.md',
      'context/QUEST_GIMMICK_CHANNELS_RESEARCH.md',
    ],
    impact:
      'Approach lock run-level, capability-gated, max 3 canali/check — deciso (R-134) ma senza runtime.',
    tests: [],
    status: 'proposal',
  },
];

/**
 * Open issues — the «tutto quello che m sto scordando» list.
 */
export const QUEST_LAB_OPEN: readonly LabOpenIssue[] = [
  {
    id: 'tag-taxonomy',
    label: 'Tassonomia dei tag non canonica',
    desc: 'Esistono 3 assi diversi (dominio/kit, struttura/meccanica, trait/twist) — non è ancora un solo sistema di tag deciso.',
    source: 'QUEST_GENERATION_ARCHITECTURE + CONTRACTS',
  },
  {
    id: 'twist-metrics',
    label: 'Metrica di impatto dei twist',
    desc: 'Quanto deve cambiare un run per «contare» come twist? E il cap di twist negativi per run non è fissato.',
    source: 'QUEST_GENERATION_CONTRACTS (OPEN)',
  },
  {
    id: 'text-keys',
    label: 'Formato text-key',
    desc: 'La convenzione per le chiavi di testo generate/narrate non è fissata — oggi copy baked nello scenario.',
    source: 'QUEST_GENERATION_CONTRACTS (OPEN)',
  },
  {
    id: 'trait-provenance',
    label: 'Provenienza dei trait sui residenti',
    desc: 'Come un PG acquisisce avido/prudente/scavezzacollo (authoring, generazione, eredità post-quest) non è deciso — LabMember.traits esiste, il pipeline che li assegna no.',
    source: 'PLAN-026 T5 + ResidentState.traits',
  },
  {
    id: 'narrative-quality',
    label: 'Criteri di qualità della narrazione',
    desc: 'Validazione lessicale esiste (vietati/coerenza) — il giudizio di qualità del testo resta human playtest.',
    source: 'QUEST_GENERATION_ARCHITECTURE',
  },
  {
    id: 'sim-thresholds',
    label: 'Soglie di accettazione MC',
    desc: 'Il benchmark produce distribuzioni — cosa è «buono» (mortalità, successi, spread) non ha soglie ratificate.',
    source: 'generatedCatalog.bench.test + PLAN-026 P4',
  },
  {
    id: 'arcs',
    label: 'Archi narrativi principali',
    desc: 'Progressione/sospensione/conclusione degli archi, generazione incrementale vs pre-generata, quanto il giocatore vede — T7 gated.',
    source: 'PLAN-026 T7',
  },
  {
    id: 'channels-runtime',
    label: 'Canali di approccio nel runtime',
    desc: 'Modello adottato a R-134, PLAN-028 è draft — nessun codice nel motore.',
    source: 'plans/PLAN-028-gimmick-channels-v0.md',
  },
  {
    id: 'ignored-offers-runtime',
    label: 'Conseguenze offerte ignorate/scadute',
    desc: 'La regola esiste (QUEST_RULES) ma non c’è expiry né costo al rifiuto — serve un sistema di opportunità.',
    source: 'QUEST_RULES §1 + CURRENT_STATE',
  },
  {
    id: 'gen-poi-wiring',
    label: 'Catalogo generato → POI',
    desc: 'Gli imprints girano su `gen` solo in lab/test: serve assegnarli a questPoi e passare da resolveQuestOffer (T6 gated).',
    source: 'PLAN-026 T6',
  },
  {
    id: 'hook-rule',
    label: 'Regola «≥75% scene con hook»',
    desc: 'Posticipata/sperimentale — non è un acceptance fisso, la validazione strutturale non la verifica.',
    source: 'QUEST_GENERATION_CONTRACTS',
  },
  {
    id: 'human-playtest',
    label: 'Playtest umano',
    desc: 'Il framework alza la probabilità di scelte significative, non garantisce il divertimento — serve giocare, non solo misurare.',
    source: 'QUEST_GENERATION_ARCHITECTURE',
  },
  {
    id: 'hazard-node-runtime',
    label: 'Categoria nodi hazard nel motore',
    desc: 'hiddenCheck auto-innescato + revealOnResolve non esistono nel runtime — oggi ogni check è dichiarato al giocatore. Primo esemplare: mimic (ricompensa-ingannevole), contratto v0 in CONTRACTS §15.',
    source: 'QUEST_GENERATION_CONTRACTS §15 + ARCHITECTURE §18 (R-151)',
  },
  {
    id: 'variety-not-reskin',
    label: 'Varietà strutturale ≠ reskin',
    desc: 'Director 2026-10-11: gimmick con la stessa algebra di cursori di race/flood (preda, salmento, doppio fronte) possono esistere ma non contano come vera varietà — la metrica si misura sulle strutture decisionali, da definire.',
    source: 'ARCHITECTURE §18.4 (R-151)',
  },
];

/* ------------------------------------------------------------------ */
/* Schema-level self check (fail-loud at import, like the catalog)      */
/* ------------------------------------------------------------------ */

/** Parse every registry block — throws on shape violations at import. */
export const QuestLabRegistrySchema = z
  .object({
    gimmicks: z.record(z.string(), LabGimmickSchema),
    pipeline: z.array(LabPipelineStepSchema).min(1),
    mechanics: z.array(LabMechanicSchema).min(1),
    consequences: z.array(LabConsequenceSchema).min(1),
    subsystems: z.array(LabSubsystemSchema).min(1),
    open: z.array(LabOpenIssueSchema).min(1),
  })
  .strict();

export const QUEST_LAB_REGISTRY = QuestLabRegistrySchema.parse({
  gimmicks: QUEST_LAB_GIMMICKS,
  pipeline: QUEST_LAB_PIPELINE,
  mechanics: QUEST_LAB_MECHANICS,
  consequences: QUEST_LAB_CONSEQUENCES,
  subsystems: QUEST_LAB_SUBSYSTEMS,
  open: QUEST_LAB_OPEN,
});
