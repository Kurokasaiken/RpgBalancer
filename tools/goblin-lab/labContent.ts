/**
 * Goblin Lab — contenuto metaLayer (Inc B, R-174).
 *
 * MetaLayerConfig authored per lo scenario Invasione Goblin, validata dallo
 * schema Zod canonico (config-first). Gli OfferDef sostituiscono la board
 * quest ad-hoc di v0.2: offerte con gate a 4 stati, doppio timer e
 * harmProfile reali dell'engine — non un resolver riscritto.
 *
 * Marcatura: i contenuti (nomi, pesi, bande) sono PROPOSTA-lab — esperimenti,
 * non regole canoniche. Le QUALITÀ (`intel:king-lair`, `access:recruitment`,
 * `clock:king`, `access:siege-broken`) usano il vocabolario del layer
 * opportunità: `access:recruitment` = quality scritta dall'adapter, ≥1
 * quando c'è spazio per nuovi residenti (slack pop < cap).
 *
 * Il Re = offerta `king-assault` + milestone `ms-end-siege`: appare quando
 * `clock:king ≥ 1` (tick 60, come kingAt di v0.2), accettabile entro 300
 * tick (scadenza v0.2 exp+300), ripetibile con cooldown 38 tick dopo un
 * tentativo fallito (v0.2: kingAt = day+t+30).
 */

import {
  MetaLayerConfigSchema,
  type MetaLayerConfig,
  type OfferDef,
} from '../../src/balancing/config/metaLayer/schema';

/* ---- Reward adapter (PROPOSTA-lab): le `provides` dell'engine scrivono
 * qualities; la conversione in risorse di villaggio vive QUI, separata,
 * perché "conversion rewards" è posticipata nel progetto reale
 * (PLAN-030 non-scope). Tabella: defId → esito → effetti. -------------- */

export interface LabRewardEntry {
  /** Risorse accreditate al villaggio. */
  res?: Partial<Record<'legna' | 'ferro' | 'cibo' | 'oro', number>>;
  /** Item: +1 palizzata / +1 oil / +N addestrati / +1 stat eroe. */
  item?: 'pal' | 'oil' | 'trn' | 'FOR' | 'AST' | 'CAR';
  /** Nuovi residenti che arrivano a risoluzione (famiglia people). */
  migrants?: number;
  /** Tag di capability assegnato ai migranti di questa offerta. */
  migrantTrait?: string;
  /** Vittoria della run (offerta king-assault). */
  victory?: boolean;
}

export const LAB_REWARDS: Record<
  string,
  { win: LabRewardEntry; bigWin?: LabRewardEntry; almost?: LabRewardEntry }
> = {
  'forage-hunt': { win: { res: { cibo: 14 } }, bigWin: { res: { cibo: 21 } } },
  'forage-wood': { win: { res: { legna: 16 } }, bigWin: { res: { legna: 24 } } },
  'delve-ruins': {
    win: { res: { ferro: 12, oro: 6 } },
    bigWin: { res: { ferro: 18, oro: 9 }, item: 'oil' },
  },
  'caravan-escort': {
    win: { res: { oro: 18 } },
    bigWin: { res: { oro: 27 }, item: 'CAR' },
  },
  'scout-tracks': { win: { res: { cibo: 4 } } },
  'migrants-arrival': {
    win: { migrants: 3 },
    bigWin: { migrants: 5 },
    almost: { migrants: 1 }, // successo marginale: arriva solo un nucleo
  },
  'mercenary-hero': {
    win: { migrants: 1, migrantTrait: 'stealth' },
  },
  'king-assault': { win: { victory: true }, bigWin: { victory: true } },
};

/** Dimensione party per offerta (PROPOSTA-lab): villager oltre l'eroe. */
export const LAB_PARTY_SIZE: Record<string, number> = {
  'forage-hunt': 1,
  'forage-wood': 1,
  'delve-ruins': 2,
  'caravan-escort': 2,
  'scout-tracks': 1,
  'migrants-arrival': 0,
  'mercenary-hero': 0,
  'king-assault': 3,
};

/* ---- OfferDef authored ----------------------------------------------- */

const OFFERS: OfferDef[] = [
  // ---- forage (economia di base) ---------------------------------------
  {
    id: 'forage-hunt', family: 'forage', tier: 1,
    requires: [],
    provides: [],
    durationTicks: 3, acceptanceTicks: 7, completionTicks: 10,
    riskBand: [0.15, 0.35], harmProfile: { wound: 0.3, death: 0.05 },
    weight: 10, repeatable: true, repeatCooldownTicks: 2,
  },
  {
    id: 'forage-wood', family: 'forage', tier: 1,
    requires: [],
    provides: [],
    durationTicks: 3, acceptanceTicks: 7, completionTicks: 10,
    riskBand: [0.2, 0.4], harmProfile: { wound: 0.3, death: 0.05 },
    weight: 9, repeatable: true, repeatCooldownTicks: 2,
  },
  {
    id: 'delve-ruins', family: 'delve', tier: 2,
    requires: [{ kind: 'stat', key: 'ast', min: 3, severity: 'capability' }],
    provides: [],
    durationTicks: 5, acceptanceTicks: 12, completionTicks: 14,
    riskBand: [0.3, 0.5], harmProfile: { wound: 0.35, death: 0.1 },
    weight: 7, repeatable: true, repeatCooldownTicks: 4,
  },
  {
    id: 'caravan-escort', family: 'caravan', tier: 2,
    requires: [{ kind: 'stat', key: 'car', min: 2, severity: 'capability' }],
    provides: [{ key: 'contact:carovane', delta: 1 }],
    providesOnAlmost: [{ key: 'contact:carovane', delta: 1 }],
    durationTicks: 6, acceptanceTicks: 15, completionTicks: 16,
    riskBand: [0.2, 0.4], harmProfile: { wound: 0.25, death: 0.08 },
    weight: 7, repeatable: true, repeatCooldownTicks: 8,
  },
  // ---- recon (preparazione assalto Re) ---------------------------------
  {
    id: 'scout-tracks', family: 'recon', tier: 1,
    requires: [],
    provides: [{ key: 'intel:king-lair', delta: 1 }],
    providesOnAlmost: [{ key: 'intel:king-lair', delta: 1 }],
    durationTicks: 4, acceptanceTicks: 20, completionTicks: 12,
    riskBand: [0.25, 0.45], harmProfile: { wound: 0.35, death: 0.1 },
    weight: 8, repeatable: true, repeatCooldownTicks: 10,
  },
  // ---- people (D3: reclutamento come opportunità) -----------------------
  {
    id: 'migrants-arrival', family: 'people', tier: 1,
    appearsWhen: [{ kind: 'quality', key: 'access:recruitment' }],
    requires: [],
    provides: [],
    durationTicks: 1, acceptanceTicks: 6, completionTicks: 4,
    riskBand: [0, 0], harmProfile: { wound: 0, death: 0 },
    weight: 6, repeatable: true, repeatCooldownTicks: 12,
  },
  {
    id: 'mercenary-hero', family: 'people', tier: 2,
    appearsWhen: [
      { kind: 'quality', key: 'access:recruitment' },
      { kind: 'quality', key: 'contact:carovane' },
    ],
    requires: [],
    provides: [],
    durationTicks: 1, acceptanceTicks: 10, completionTicks: 4,
    riskBand: [0, 0], harmProfile: { wound: 0, death: 0 },
    weight: 3, repeatable: true, repeatCooldownTicks: 40,
  },
  // ---- assault (il Re) --------------------------------------------------
  {
    id: 'king-assault', family: 'assault', tier: 3,
    appearsWhen: [{ kind: 'quality', key: 'clock:king' }],
    requires: [
      { kind: 'stat', key: 'for', min: 8, severity: 'cost' },
      { kind: 'quality', key: 'intel:king-lair', severity: 'capability' },
    ],
    unlockRoute: { kind: 'quality', key: 'intel:king-lair' },
    provides: [{ key: 'access:siege-broken', delta: 1 }],
    durationTicks: 8, acceptanceTicks: 300, completionTicks: 60,
    riskBand: [0.35, 0.65], harmProfile: { wound: 0.5, death: 0.5 },
    weight: 10, repeatable: true, repeatCooldownTicks: 38,
  },
];

export const LAB_META_CONFIG: MetaLayerConfig = MetaLayerConfigSchema.parse({
  version: 1,
  tuning: {
    boardSize: 5,
    scoutNarrowingMax: 0.7,
    underpreparedFailPenalty: 0.15,
    overQualifiedFailBonus: 0.1,
    powerPerCapability: 2,
    overQualifiedPower: { t1: 14, t2: 24, t3: 34 },
    epicFailHarmScale: 1.5,
    outcomeTable: { epicFailBelow: 0.15, bigWinAbove: 0.9, almostBelow: 0.35 },
  },
  families: [
    {
      id: 'forage',
      signaturePressure: 'clock:famine',
      stopCondition: { kind: 'pressureAtOrAbove', value: 10 },
      compatibleChannels: ['survival', 'tracking'],
    },
    {
      id: 'delve',
      signaturePressure: 'clock:attrition',
      stopCondition: { kind: 'pressureAtOrAbove', value: 10 },
      compatibleChannels: ['survival', 'tracking', 'lockpick'],
    },
    {
      id: 'caravan',
      signaturePressure: 'clock:road-danger',
      stopCondition: { kind: 'pressureAtOrAbove', value: 10 },
      compatibleChannels: ['diplomacy'],
    },
    {
      id: 'recon',
      signaturePressure: 'clock:threat',
      stopCondition: { kind: 'pressureAtOrAbove', value: 10 },
      compatibleChannels: ['tracking', 'stealth'],
    },
    {
      id: 'people',
      signaturePressure: 'clock:attrition',
      stopCondition: { kind: 'pressureAtOrAbove', value: 10 },
      compatibleChannels: [],
    },
    {
      id: 'assault',
      signaturePressure: 'clock:king',
      stopCondition: { kind: 'pressureAtOrAbove', value: 2 },
      compatibleChannels: [],
    },
  ],
  clocks: [{ key: 'clock:king', startAt: 0, periodTicks: 60, max: 1 }],
  capabilityTags: [
    'stealth', 'disguise', 'arcana', 'survival',
    'tracking', 'diplomacy', 'sabotage', 'lockpick',
  ],
  offers: OFFERS,
  milestones: [
    {
      id: 'ms-end-siege',
      label: 'Spezzare l’assedio goblin',
      // Regola multi-entry (≥2 approcci): la via diplomatica è dichiarata ma
      // nessun offer ancora la fornisce → resta chiusa (content gap onesto).
      approaches: [
        [{ kind: 'quality', key: 'access:siege-broken' }],
        [{ kind: 'quality', key: 'access:siege-bought' }],
      ],
    },
  ],
  initialQualities: [],
});
