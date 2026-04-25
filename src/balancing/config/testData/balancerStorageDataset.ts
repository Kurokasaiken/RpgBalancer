import { DEFAULT_CONFIG } from '../defaultConfig';
import type { BalancerConfig, CardDefinition, StatDefinition } from '../types';

const SENTINEL_PROTOCOL_CARD_ID = 'sentinel_protocol';
const SOLAR_PARABOLA_CARD_ID = 'solar_parabola';
const BATTLE_FOCUS_STAT_ID = 'battle_focus';
const SOLAR_RESERVE_STAT_ID = 'solar_reserve';

/**
 * Creates a deep clone of the default balancer configuration to ensure test
 * datasets never mutate shared references.
 */
function cloneDefaultConfig(): BalancerConfig {
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG)) as BalancerConfig;
}

/**
 * Produces the Battle Focus stat definition used by the storage tests.
 */
function createBattleFocusStat(): StatDefinition {
  return {
    id: BATTLE_FOCUS_STAT_ID,
    label: 'Battle Focus',
    description: 'Tempo di reazione e lucidità dei comandanti durante i test di storage.',
    type: 'number',
    min: 0,
    max: 200,
    step: 1,
    defaultValue: 60,
    weight: 2.5,
    isCore: false,
    isDerived: false,
    baseStat: true,
    isDetrimental: false,
  };
}

/**
 * Produces the Solar Reserve stat definition used by the storage tests.
 */
function createSolarReserveStat(): StatDefinition {
  return {
    id: SOLAR_RESERVE_STAT_ID,
    label: 'Solar Reserve',
    description: 'Energia residua per artefatti di difesa quando si ripristinano i preset.',
    type: 'number',
    min: 0,
    max: 150,
    step: 5,
    defaultValue: 45,
    weight: 1.25,
    isCore: false,
    isDerived: false,
    baseStat: false,
    isDetrimental: false,
  };
}

/**
 * Builds the Sentinel Protocol card definition that groups battle stats.
 */
function createSentinelProtocolCard(): CardDefinition {
  return {
    id: SENTINEL_PROTOCOL_CARD_ID,
    title: 'Sentinel Protocol',
    color: '#0f8c9c',
    icon: 'shield',
    statIds: ['hp', BATTLE_FOCUS_STAT_ID, 'htk'],
    isCore: false,
    order: 900,
  };
}

/**
 * Builds the Solar Parabola card definition that focuses on offensive stats.
 */
function createSolarParabolaCard(): CardDefinition {
  return {
    id: SOLAR_PARABOLA_CARD_ID,
    title: 'Solar Parabola',
    color: '#c78f1e',
    icon: 'sun',
    statIds: ['damage', SOLAR_RESERVE_STAT_ID],
    isCore: false,
    order: 950,
  };
}

/**
 * Builds a balancer configuration used as baseline for storage regression tests.
 * Adds two custom cards and stats on top of the default config to exercise the
 * serializer/deserializer path with realistic data.
 */
export function buildPrimaryBalancerStorageDataset(): BalancerConfig {
  const config = cloneDefaultConfig();

  config.version = DEFAULT_CONFIG.version;

  const stats = {
    ...config.stats,
    [BATTLE_FOCUS_STAT_ID]: createBattleFocusStat(),
    [SOLAR_RESERVE_STAT_ID]: createSolarReserveStat(),
  };

  const cards = {
    ...config.cards,
    [SENTINEL_PROTOCOL_CARD_ID]: createSentinelProtocolCard(),
    [SOLAR_PARABOLA_CARD_ID]: createSolarParabolaCard(),
  };

  const storagePresetId = 'storage_suite';
  const storagePreset = {
    id: storagePresetId,
    name: 'Storage Suite',
    description: 'Preset dedicato al test della persistence API.',
    weights: {
      ...config.presets[config.activePresetId].weights,
      [BATTLE_FOCUS_STAT_ID]: 2.5,
      [SOLAR_RESERVE_STAT_ID]: 1.25,
    },
    isBuiltIn: false,
    createdAt: '2025-02-01T00:00:00Z',
    modifiedAt: '2025-02-01T00:00:00Z',
  };

  const presets = {
    ...config.presets,
    [storagePresetId]: storagePreset,
  };

  return {
    ...config,
    stats,
    cards,
    presets,
    activePresetId: storagePresetId,
  };
}

/**
 * Builds an alternate dataset to stress overwrite behaviour inside the storage
 * framework. Tweaks stat defaults, card ordering, and preset weights so the
 * multiple-save tests have meaningful differences to track.
 */
export function buildAlternateBalancerStorageDataset(): BalancerConfig {
  const config = buildPrimaryBalancerStorageDataset();

  config.version = DEFAULT_CONFIG.version;

  config.stats[BATTLE_FOCUS_STAT_ID] = {
    ...config.stats[BATTLE_FOCUS_STAT_ID],
    defaultValue: 90,
    weight: 3.25,
  };

  config.stats[SOLAR_RESERVE_STAT_ID] = {
    ...config.stats[SOLAR_RESERVE_STAT_ID],
    defaultValue: 60,
    weight: 1.5,
  };

  config.cards[SENTINEL_PROTOCOL_CARD_ID] = {
    ...config.cards[SENTINEL_PROTOCOL_CARD_ID],
    order: 975,
    statIds: ['hp', 'damage', BATTLE_FOCUS_STAT_ID],
  };

  config.cards[SOLAR_PARABOLA_CARD_ID] = {
    ...config.cards[SOLAR_PARABOLA_CARD_ID],
    statIds: ['htk', SOLAR_RESERVE_STAT_ID],
  };

  const preset = config.presets[config.activePresetId];
  preset.weights = {
    ...preset.weights,
    [BATTLE_FOCUS_STAT_ID]: 3.25,
    [SOLAR_RESERVE_STAT_ID]: 1.5,
  };
  preset.modifiedAt = '2025-02-02T00:00:00Z';

  return config;
}
