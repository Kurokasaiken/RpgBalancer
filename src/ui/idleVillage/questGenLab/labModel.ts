/**
 * labModel — derived view-model for the Quest Generation Lab
 * (`/quest-generation-lab`, R-140).
 *
 * Everything here is DERIVED from the real data (catalog scenarios, domain
 * kits, trait registry, scenario node content) so the lab cannot drift
 * from the code it describes. The authored editorial layer (status labels,
 * pipeline steps, consequence matrix, open issues) lives in
 * `src/balancing/config/idleVillage/quests/generation/labRegistry.ts`.
 */

import type { QuestScenario } from '@/balancing/config/idleVillage/quests/questScenario.schema';
import type { QuestNode, QuestOption } from '@/ui/idleVillage/questS1Lab/questScenario';
import {
  GENERATED_CATALOG,
  PASSO_MONTANO_KIT,
  PALUDE_KIT,
  MINIERA_FLOOD_KIT,
  MARE_FLOOD_KIT,
  MINIERA_RACE_KIT,
  type RaceDomainKit,
  type FloodDomainKit,
} from '@/balancing/config/idleVillage/quests/generation/catalog';
import type { LocalizedRaceDomainKit } from '@/balancing/config/idleVillage/quests/generation/raceGimmick';
import type { LocalizedFloodDomainKit } from '@/balancing/config/idleVillage/quests/generation/floodVault';
import { DOMAIN_VOCABS } from '@/balancing/config/idleVillage/quests/generation/domainVocabs';
import { QUEST_TRAITS } from '@/balancing/config/idleVillage/quests/questTraits';
import { QUEST_LAB_GIMMICKS, type LabGimmick } from '@/balancing/config/idleVillage/quests/generation/labRegistry';

/* ------------------------------------------------------------------ */
/* Gimmick + kit resolution                                             */
/* ------------------------------------------------------------------ */

/** Gimmick ids — match the `gen-<gimmick>-<kit>` scenario id segment. */
export type GimmickId = 'race' | 'flood' | 'meld';

const GIMMICK_IDS: readonly GimmickId[] = ['race', 'flood', 'meld'];

/** The gimmick a catalog scenario id encodes (`gen-race-x` / `gen-flood-x`). */
export function gimmickOf(scenarioId: string): GimmickId | undefined {
  for (const g of GIMMICK_IDS) {
    if (scenarioId.startsWith(`gen-${g}-`)) return g;
  }
  return undefined;
}

/** The kit id a catalog scenario id encodes (last `gen-<g>-` segment). */
export function kitIdOf(scenarioId: string): string | undefined {
  const g = gimmickOf(scenarioId);
  return g ? scenarioId.slice(`gen-${g}-`.length) : undefined;
}

/** Where a kit's copy came from — hand-authored here or provider-narrated. */
export type KitOrigin = 'authored' | 'narrated';

/**
 * Normalized kit info for the lab card. `RaceDomainKit` and
 * `FloodDomainKit` share id/prefix/title/flavour/intelId/objective and
 * differ in names (race) vs loot (flood) — the lab flattens both.
 */
export interface LabKitInfo {
  /** Lab key `${gimmick}:${kit.id}` — unique across gimmicks sharing a kit id. */
  key: string;
  /** The kit's own id (`passo-montano`, `miniera`, …). */
  id: string;
  gimmick: GimmickId;
  origin: KitOrigin;
  title: string;
  flavour: string;
  /** Race kits: place/rival/prize names; flood kits: loot item names. */
  names: { label: string; value: string }[];
  intelId: string;
  objective: string;
  /** DomainVocab id when a vocabulary exists for this domain. */
  vocabId?: string;
  /** Scenario ids in the catalog produced by this kit. */
  scenarioIds: string[];
}

function raceKitInfo(
  kit: RaceDomainKit | LocalizedRaceDomainKit,
  gimmick: GimmickId,
  origin: KitOrigin,
): LabKitInfo {
  const k: RaceDomainKit = 'it' in kit ? kit.it : kit;
  return {
    key: `${gimmick}:${k.id}`,
    id: k.id,
    gimmick,
    origin,
    title: k.title,
    flavour: k.flavour,
    names: [
      { label: 'luogo', value: k.names.place },
      { label: 'rivale', value: k.names.rival },
      { label: 'premio', value: k.names.prize },
    ],
    intelId: k.intelId,
    objective: k.objective,
    vocabId: k.id in DOMAIN_VOCABS ? k.id : undefined,
    scenarioIds: [],
  };
}

function floodKitInfo(
  kit: FloodDomainKit | LocalizedFloodDomainKit,
  gimmick: GimmickId,
  origin: KitOrigin,
): LabKitInfo {
  const k: FloodDomainKit = 'it' in kit ? kit.it : kit;
  return {
    key: `${gimmick}:${k.id}`,
    id: k.id,
    gimmick,
    origin,
    title: k.title,
    flavour: k.flavour,
    names: [
      { label: 'bottino comune', value: k.loot.pezzo },
      { label: 'cassa nascosta', value: k.loot.cassa },
      { label: 'cassa madre', value: k.loot.madre },
      { label: 'ultimo carico', value: k.loot.lingotto },
    ],
    intelId: k.intelId,
    objective: k.objective,
    vocabId: k.id in DOMAIN_VOCABS ? k.id : undefined,
    scenarioIds: [],
  };
}

/** Every registered domain kit, normalized — hand kits and narrated imprints. */
export function labKits(): LabKitInfo[] {
  const kits: LabKitInfo[] = [
    raceKitInfo(PASSO_MONTANO_KIT, 'race', 'authored'),
    raceKitInfo(PALUDE_KIT, 'race', 'authored'),
    floodKitInfo(MINIERA_FLOOD_KIT, 'flood', 'authored'),
    floodKitInfo(MARE_FLOOD_KIT, 'flood', 'narrated'),
    raceKitInfo(MINIERA_RACE_KIT, 'race', 'narrated'),
  ];
  for (const kit of kits) {
    kit.scenarioIds = Object.values(GENERATED_CATALOG)
      .filter((s) => gimmickOf(s.id) === kit.gimmick && kitIdOf(s.id) === kit.id)
      .map((s) => s.id);
  }
  return kits;
}

/* ------------------------------------------------------------------ */
/* Catalog entries                                                      */
/* ------------------------------------------------------------------ */

/** Counts of node kinds and interactive surfaces of a scenario. */
export interface ScenarioStats {
  nodes: number;
  checks: number;
  choices: number;
  combats: number;
  options: number;
  gatedOptions: number;
  verdictTables: number;
}

/** One twist flag the scenario can arm — runstart or in-run. */
export interface ScenarioTwist {
  flag: string;
  kind: 'runstart' | 'in-run';
  chance: number;
  requiresTrait?: string;
  /** Node ids that can roll it (in-run) or 'armRoll' for runstart. */
  source: string;
}

/** A catalog scenario plus its derived lab metadata. */
export interface LabCatalogEntry {
  scenario: QuestScenario;
  gimmickId: GimmickId;
  gimmick?: LabGimmick;
  kitId: string;
  kit?: LabKitInfo;
  stats: ScenarioStats;
  twists: ScenarioTwist[];
  /** Trait ids the scenario actually references (gates + armRolls). */
  traitsUsed: string[];
  /** Mechanic ids (QUEST_LAB_MECHANICS) the scenario exercises. */
  mechanicsUsed: string[];
}

function optionGates(o: QuestOption): string[] {
  const gates: string[] = [];
  if (o.requiresInfo) gates.push(`info:${o.requiresInfo}`);
  if (o.requiresFlag) gates.push(`flag:${o.requiresFlag}`);
  if (o.hiddenIfFlag) gates.push(`not:${o.hiddenIfFlag}`);
  if (o.requiresTrait) gates.push(`trait:${o.requiresTrait}`);
  if (o.hiddenIfTrait) gates.push(`not-trait:${o.hiddenIfTrait}`);
  if (o.costGold) gates.push(`gold:${o.costGold}`);
  return gates;
}

function scenarioStats(scenario: QuestScenario): ScenarioStats {
  const nodes = Object.values(scenario.nodes);
  const options = nodes.flatMap((n) => n.options ?? []);
  return {
    nodes: nodes.length,
    checks: nodes.filter((n) => n.kind === 'check').length,
    choices: nodes.filter((n) => n.kind === 'choice').length,
    combats: nodes.filter((n) => n.kind === 'combat').length,
    options: options.length,
    gatedOptions: options.filter((o) => optionGates(o).length > 0).length,
    verdictTables: nodes.filter((n) => n.verdictTable).length,
  };
}

/** Collect every twist flag the scenario can arm — runstart and in-run. */
export function scenarioTwists(scenario: QuestScenario): ScenarioTwist[] {
  const out: ScenarioTwist[] = [];
  for (const roll of scenario.armRolls ?? []) {
    out.push({
      flag: roll.flag,
      kind: 'runstart',
      chance: roll.chance,
      requiresTrait: roll.requiresTrait,
      source: 'armRoll',
    });
  }
  for (const node of Object.values(scenario.nodes)) {
    for (const [verdict, outcome] of Object.entries(node.verdictTable ?? {})) {
      if (outcome?.rollFlag) {
        out.push({
          flag: outcome.rollFlag.flag,
          kind: 'in-run',
          chance: outcome.rollFlag.chance,
          source: `${node.id} · ${verdict}`,
        });
      }
    }
  }
  return out;
}

/** Trait ids referenced anywhere in the scenario data. */
export function scenarioTraitsUsed(scenario: QuestScenario): string[] {
  const used = new Set<string>();
  for (const roll of scenario.armRolls ?? []) {
    if (roll.requiresTrait) used.add(roll.requiresTrait);
  }
  for (const node of Object.values(scenario.nodes)) {
    for (const o of node.options ?? []) {
      if (o.requiresTrait) used.add(o.requiresTrait);
      if (o.hiddenIfTrait) used.add(o.hiddenIfTrait);
    }
  }
  return [...used].filter((id) => id in QUEST_TRAITS);
}

/** Mechanic ids (matching QUEST_LAB_MECHANICS) the scenario exercises. */
export function scenarioMechanicsUsed(scenario: QuestScenario): string[] {
  const used = new Set<string>();
  let gated = false;
  let loot = false;
  let vars = Object.keys(scenario.initialVars ?? {}).length > 0;
  let gotoConds = false;
  for (const node of Object.values(scenario.nodes) as QuestNode[]) {
    if (node.verdictTable) {
      used.add('verdict-table');
      used.add('verdicts');
    }
    if (node.combat) used.add('combat');
    if (node.risky || node.risk) used.add('harms');
    for (const outcome of Object.values(node.verdictTable ?? {})) {
      if (!outcome) continue;
      if (outcome.takeLoot?.length || outcome.dropLoot?.length) loot = true;
      if (outcome.setAlarm) used.add('alarm');
      if (outcome.vars?.length) vars = true;
      if (typeof outcome.goto !== 'string') gotoConds = true;
    }
    for (const o of node.options ?? []) {
      if (optionGates(o).length > 0) gated = true;
    }
  }
  if (gated) used.add('gates');
  if (loot) used.add('taken-secured');
  if (vars) used.add('vars');
  if (gotoConds) used.add('goto-conds');
  if (scenarioTwists(scenario).length > 0) used.add('armrolls');
  if (scenarioTraitsUsed(scenario).length > 0) used.add('traits');
  return [...used];
}

/** The lab's catalog entries — one per generated scenario, fully derived. */
export function labCatalogEntries(): LabCatalogEntry[] {
  const kits = labKits();
  return Object.values(GENERATED_CATALOG).flatMap((scenario) => {
    const gimmickId = gimmickOf(scenario.id);
    const kitId = kitIdOf(scenario.id);
    if (!gimmickId || !kitId) return [];
    const kit = kits.find((k) => k.gimmick === gimmickId && k.id === kitId);
    return [
      {
        scenario,
        gimmickId,
        gimmick: QUEST_LAB_GIMMICKS[gimmickId],
        kitId,
        kit,
        stats: scenarioStats(scenario),
        twists: scenarioTwists(scenario),
        traitsUsed: scenarioTraitsUsed(scenario),
        mechanicsUsed: scenarioMechanicsUsed(scenario),
      },
    ];
  });
}

/**
 * A catalog entry for an imprint-compiled scenario (R-152): the `id` rides
 * the 'gen' profile (`gen-<imprint>-<domain>`) but encodes no gimmick, so
 * `labCatalogEntries` skips it by design. These entries keep the lab's
 * coverage honest — every catalog row is either a gimmick generation or an
 * imprint spine, never a silent third thing.
 */
export interface LabImprintEntry {
  scenario: QuestScenario;
  /** Imprint segment of `gen-<imprint>-<domain>` (e.g. `impr002`). */
  imprintId: string;
  /** Domain segment of `gen-<imprint>-<domain>` (e.g. `palude`). */
  domainId: string;
  stats: ScenarioStats;
  twists: ScenarioTwist[];
  traitsUsed: string[];
  mechanicsUsed: string[];
}

/** Catalog scenarios that are imprint spines, not skeleton×kit generations. */
export function imprintCatalogEntries(): LabImprintEntry[] {
  return Object.values(GENERATED_CATALOG).flatMap((scenario) => {
    if (gimmickOf(scenario.id)) return [];
    const m = /^gen-([a-z0-9]+)-(.+)$/.exec(scenario.id);
    if (!m) return [];
    return [
      {
        scenario,
        imprintId: m[1]!,
        domainId: m[2]!,
        stats: scenarioStats(scenario),
        twists: scenarioTwists(scenario),
        traitsUsed: scenarioTraitsUsed(scenario),
        mechanicsUsed: scenarioMechanicsUsed(scenario),
      },
    ];
  });
}

/* ------------------------------------------------------------------ */
/* Small shared helpers                                                 */
/* ------------------------------------------------------------------ */

/** Human-readable gate chips for an option (`info:x`, `trait:avido`, …). */
export function gatesOfOption(option: QuestOption): string[] {
  return optionGates(option);
}
