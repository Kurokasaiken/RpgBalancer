/**
 * Meta-Layer content v0 (PLAN-030 / R-164).
 *
 * Authored v0 content: 3 families × 3 tiers + cross-gate utility offers,
 * 2 authored milestone nodes, world clocks, capability tag catalog.
 * Rewards are fixed and configured (no stat-inflation, no conversion
 * rewards — deferred to playtest).
 *
 * Design notes (the graph this content encodes):
 * - `delve-flooded-vault` provides `access:sewers` = the unlock route for
 *   `infil-fortress-sewers` (cross-family convergence, ≥2 entries rule).
 * - `clock:goblin-pressure` ticking ≥3 makes `race-warning-bell` appear:
 *   the world advances and generates opportunities on its own.
 * - `intel:siege-plans` is produced by TWO independent offers
 *   (delve-deep-cache, race-warning-bell) — convergent intel.
 */

import type {
  ClockDef,
  FamilyDef,
  MetaLayerConfig,
  MetaLayerTuning,
  MilestoneNode,
  OfferDef,
  QualityDelta,
} from './schema';

export const META_LAYER_TUNING: MetaLayerTuning = {
  boardSize: 5,
  scoutNarrowingMax: 0.7,
  underpreparedFailPenalty: 0.15,
  overQualifiedFailBonus: 0.1,
  powerPerCapability: 2,
  overQualifiedPower: { t1: 14, t2: 24, t3: 34 },
  epicFailHarmScale: 1.5,
  outcomeTable: { epicFailBelow: 0.15, bigWinAbove: 0.9, almostBelow: 0.35 },
};

export const META_LAYER_CAPABILITY_TAGS: string[] = [
  'stealth',
  'disguise',
  'arcana',
  'survival',
  'tracking',
  'diplomacy',
  'sabotage',
  'lockpick',
];

export const META_LAYER_FAMILIES: FamilyDef[] = [
  {
    id: 'infiltration',
    signaturePressure: 'clock:alarm',
    stopCondition: { kind: 'pressureAtOrAbove', value: 10 },
    compatibleChannels: ['stealth', 'disguise', 'arcana'],
  },
  {
    id: 'delve',
    signaturePressure: 'clock:attrition',
    stopCondition: { kind: 'pressureAtOrAbove', value: 10 },
    compatibleChannels: ['survival', 'tracking', 'lockpick'],
  },
  {
    id: 'race',
    signaturePressure: 'clock:target-progress',
    stopCondition: { kind: 'pressureAtOrAbove', value: 10 },
    compatibleChannels: ['diplomacy', 'sabotage', 'tracking'],
  },
];

export const META_LAYER_CLOCKS: ClockDef[] = [
  { key: 'clock:goblin-pressure', startAt: 0, periodTicks: 5, max: 10 },
  { key: 'clock:winter', startAt: 0, periodTicks: 20, max: 4 },
];

export const META_LAYER_OFFERS: OfferDef[] = [
  // ---- infiltration -------------------------------------------------------
  {
    id: 'infil-scout-camp',
    family: 'infiltration',
    tier: 1,
    requires: [{ kind: 'capability', key: 'stealth', severity: 'capability' }],
    provides: [{ key: 'intel:guard-rotation', delta: 1 }],
    providesOnAlmost: [{ key: 'intel:guard-rotation', delta: 1 }],
    durationTicks: 3,
    acceptanceTicks: 10,
    completionTicks: 6,
    riskBand: [0.2, 0.45],
    harmProfile: { wound: 0.3, death: 0.05 },
    weight: 10,
    repeatable: true,
    repeatCooldownTicks: 6,
  },
  {
    id: 'infil-bribe-smuggler',
    family: 'infiltration',
    tier: 1,
    requires: [{ kind: 'stat', key: 'cha', min: 2, severity: 'cost' }],
    provides: [{ key: 'contact:smuggler', delta: 1 }],
    durationTicks: 2,
    acceptanceTicks: 12,
    completionTicks: 4,
    riskBand: [0.1, 0.3],
    harmProfile: { wound: 0.1, death: 0 },
    weight: 8,
    repeatable: true,
    repeatCooldownTicks: 15,
  },
  {
    id: 'infil-forge-papers',
    family: 'infiltration',
    tier: 2,
    appearsWhen: [{ kind: 'quality', key: 'contact:smuggler' }],
    requires: [{ kind: 'capability', key: 'disguise', severity: 'capability' }],
    provides: [{ key: 'intel:disguise-cover', delta: 1 }],
    durationTicks: 4,
    acceptanceTicks: 15,
    completionTicks: 8,
    riskBand: [0.25, 0.5],
    harmProfile: { wound: 0.1, death: 0 },
    weight: 6,
  },
  {
    id: 'infil-fortress-sewers',
    family: 'infiltration',
    tier: 2,
    appearsWhen: [{ kind: 'quality', key: 'intel:guard-rotation' }],
    requires: [
      { kind: 'quality', key: 'access:sewers', severity: 'absolute' },
      { kind: 'capability', key: 'stealth', severity: 'capability' },
    ],
    unlockRoute: { kind: 'quality', key: 'access:sewers' },
    provides: [{ key: 'access:fortress-inner', delta: 1 }],
    durationTicks: 5,
    acceptanceTicks: 14,
    completionTicks: 10,
    riskBand: [0.35, 0.6],
    harmProfile: { wound: 0.4, death: 0.15 },
    weight: 6,
  },
  {
    id: 'infil-assassinate-captain',
    family: 'infiltration',
    tier: 3,
    appearsWhen: [{ kind: 'quality', key: 'access:fortress-inner' }],
    requires: [
      { kind: 'capability', key: 'stealth', severity: 'capability' },
      { kind: 'quality', key: 'intel:guard-rotation', min: 2, severity: 'cost' },
    ],
    provides: [
      { key: 'clock:goblin-pressure', delta: -3 },
      { key: 'contact:resistance', delta: 1 },
    ],
    durationTicks: 6,
    acceptanceTicks: 12,
    completionTicks: 10,
    riskBand: [0.45, 0.7],
    harmProfile: { wound: 0.5, death: 0.25 },
    weight: 4,
  },
  // ---- delve --------------------------------------------------------------
  {
    id: 'delve-outer-ruins',
    family: 'delve',
    tier: 1,
    requires: [
      { kind: 'capability', key: 'survival', severity: 'capability' },
    ],
    provides: [{ key: 'intel:sewer-map', delta: 1 }],
    durationTicks: 3,
    acceptanceTicks: 12,
    completionTicks: 6,
    riskBand: [0.15, 0.35],
    harmProfile: { wound: 0.35, death: 0.05 },
    weight: 10,
  },
  {
    id: 'delve-flooded-vault',
    family: 'delve',
    tier: 2,
    requires: [
      { kind: 'quality', key: 'intel:sewer-map', severity: 'capability' },
      { kind: 'capability', key: 'survival', severity: 'capability' },
    ],
    provides: [{ key: 'access:sewers', delta: 1 }],
    durationTicks: 4,
    acceptanceTicks: 16,
    completionTicks: 8,
    riskBand: [0.3, 0.55],
    harmProfile: { wound: 0.35, death: 0.15 },
    weight: 7,
  },
  {
    id: 'delve-deep-cache',
    family: 'delve',
    tier: 3,
    appearsWhen: [{ kind: 'quality', key: 'access:sewers' }],
    requires: [
      { kind: 'capability', key: 'survival', severity: 'capability' },
      { kind: 'stat', key: 'end', min: 3, severity: 'cost' },
    ],
    provides: [{ key: 'intel:siege-plans', delta: 1 }],
    durationTicks: 6,
    acceptanceTicks: 14,
    completionTicks: 10,
    riskBand: [0.4, 0.65],
    harmProfile: { wound: 0.45, death: 0.2 },
    weight: 4,
  },
  // ---- race ---------------------------------------------------------------
  {
    id: 'race-caravan-escort',
    family: 'race',
    tier: 1,
    requires: [{ kind: 'stat', key: 'str', min: 2, severity: 'capability' }],
    provides: [{ key: 'contact:caravan-master', delta: 1 }],
    durationTicks: 4,
    acceptanceTicks: 8,
    completionTicks: 8,
    riskBand: [0.2, 0.4],
    harmProfile: { wound: 0.3, death: 0.05 },
    weight: 8,
  },
  {
    id: 'race-escort-pilgrims',
    family: 'race',
    tier: 1,
    requires: [{ kind: 'stat', key: 'str', min: 2, severity: 'capability' }],
    provides: [{ key: 'contact:temple-prior', delta: 1 }],
    durationTicks: 5,
    acceptanceTicks: 10,
    completionTicks: 9,
    window: { openAt: 15, closeAt: 40 },
    riskBand: [0.15, 0.4],
    harmProfile: { wound: 0.3, death: 0.05 },
    weight: 7,
  },
  {
    id: 'race-warning-bell',
    family: 'race',
    tier: 2,
    appearsWhen: [
      { kind: 'quality', key: 'clock:goblin-pressure', min: 3 },
    ],
    requires: [{ kind: 'stat', key: 'agi', min: 3, severity: 'capability' }],
    provides: [
      { key: 'intel:siege-plans', delta: 1 },
      { key: 'contact:militia', delta: 1 },
    ],
    durationTicks: 3,
    acceptanceTicks: 6,
    completionTicks: 6,
    riskBand: [0.3, 0.55],
    harmProfile: { wound: 0.35, death: 0.1 },
    weight: 8,
  },
  {
    id: 'race-recruit-mercs',
    family: 'race',
    tier: 2,
    appearsWhen: [{ kind: 'quality', key: 'contact:caravan-master' }],
    requires: [{ kind: 'stat', key: 'cha', min: 3, severity: 'cost' }],
    provides: [{ key: 'contact:mercenary-captain', delta: 1 }],
    durationTicks: 4,
    acceptanceTicks: 12,
    completionTicks: 8,
    riskBand: [0.25, 0.5],
    harmProfile: { wound: 0.15, death: 0.02 },
    weight: 6,
  },
  {
    id: 'race-break-siege',
    family: 'race',
    tier: 3,
    appearsWhen: [{ kind: 'quality', key: 'intel:siege-plans' }],
    requires: [
      { kind: 'capability', key: 'sabotage', severity: 'capability' },
    ],
    provides: [{ key: 'access:siege-broken', delta: 1 }],
    durationTicks: 6,
    acceptanceTicks: 8,
    completionTicks: 9,
    riskBand: [0.5, 0.75],
    harmProfile: { wound: 0.55, death: 0.3 },
    weight: 5,
  },
];

export const META_LAYER_MILESTONES: MilestoneNode[] = [
  {
    id: 'ms-fortress',
    label: 'Infiltrare la Fortezza',
    approaches: [
      [
        { kind: 'quality', key: 'access:fortress-inner' },
        { kind: 'capability', key: 'stealth' },
      ],
      [
        { kind: 'quality', key: 'contact:smuggler' },
        { kind: 'quality', key: 'intel:disguise-cover' },
        { kind: 'capability', key: 'disguise' },
      ],
      [
        { kind: 'quality', key: 'access:sewers' },
        { kind: 'quality', key: 'intel:guard-rotation', min: 2 },
      ],
    ],
  },
  {
    id: 'ms-siege',
    label: "Spezzare l'Assedio",
    approaches: [
      [
        { kind: 'quality', key: 'intel:siege-plans' },
        { kind: 'capability', key: 'sabotage' },
      ],
      [{ kind: 'quality', key: 'contact:mercenary-captain' }],
      [
        { kind: 'quality', key: 'clock:goblin-pressure', min: 8 },
        { kind: 'quality', key: 'contact:militia' },
      ],
    ],
  },
];

export const META_LAYER_INITIAL_QUALITIES: QualityDelta[] = [
  { key: 'clock:goblin-pressure', delta: 0 },
  { key: 'clock:winter', delta: 0 },
];

/** Assembled v0 config, validated by `loadMetaLayerConfig`. */
export const META_LAYER_CONFIG_V0: MetaLayerConfig = {
  version: 1,
  tuning: META_LAYER_TUNING,
  families: META_LAYER_FAMILIES,
  clocks: META_LAYER_CLOCKS,
  capabilityTags: META_LAYER_CAPABILITY_TAGS,
  offers: META_LAYER_OFFERS,
  milestones: META_LAYER_MILESTONES,
  initialQualities: META_LAYER_INITIAL_QUALITIES,
};
