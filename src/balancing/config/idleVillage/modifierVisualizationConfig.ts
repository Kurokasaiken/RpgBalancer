import type {
  GameplayModifier,
  GameplayStatId,
  LifetimeType,
  ModifierOperation,
  ModifierScope,
  OwnerType,
} from '@/balancing/types/gameplayModifierTypes';

export type ModifierVisualizationStatus = 'active' | 'expired' | 'upcoming';

export interface ModifierVisualizationLifetimeConfig {
  type: LifetimeType;
  label?: string;
  remainingTicks?: number;
}

export interface ModifierVisualizationOwnerConfig {
  id: string;
  label: string;
  type: OwnerType;
}

export interface ModifierVisualizationEntryConfig {
  id: string;
  statId: GameplayStatId;
  label: string;
  scope: ModifierScope;
  operation: ModifierOperation;
  valueLabel: string;
  description?: string;
  owner?: ModifierVisualizationOwnerConfig;
  lifetime?: ModifierVisualizationLifetimeConfig;
  status?: ModifierVisualizationStatus;
  stackCount?: number;
  maxStacks?: number;
  sourceConfigId?: string;
  applicableEntityIds?: string[];
}

export type ModifierVisualizationContext = 'activitySlot' | 'workerPanel' | 'questDetail';

export const MODIFIER_VISUALIZATION_CONFIG: Record<ModifierVisualizationContext, ModifierVisualizationEntryConfig[]> = {
  activitySlot: [
    {
      id: 'mod_location_mill_guard_bonus',
      statId: 'stat_core_guard',
      label: 'Guardia in pattuglia',
      scope: 'LOCATION',
      operation: 'ADD',
      valueLabel: '+12%',
      description: 'Mill Watch rota i buff di guardia finché il turno resta assegnato.',
      owner: {
        id: 'building_watch_mill',
        label: 'Avamposto Mill Watch',
        type: 'building',
      },
      lifetime: { type: 'TIMED', label: '8m' },
      status: 'active',
      stackCount: 1,
      maxStacks: 3,
      sourceConfigId: 'watch_mill_guard_rotations',
      applicableEntityIds: ['slot_mill_watch'],
    },
    {
      id: 'mod_session_focus_teachings',
      statId: 'stat_core_focus',
      label: 'Lezioni di Focus',
      scope: 'SESSION',
      operation: 'ADD',
      valueLabel: '+6',
      description: 'Bonus sessione proveniente dal capanna studio.',
      owner: {
        id: 'building_study_hut',
        label: 'Capanna studio',
        type: 'building',
      },
      lifetime: { type: 'SESSION', label: 'Sessione corrente' },
      status: 'upcoming',
      sourceConfigId: 'study_hut_focus',
    },
    {
      id: 'mod_global_storm_penalty',
      statId: 'stat_core_damage',
      label: 'Tempesta arcana',
      scope: 'GLOBAL',
      operation: 'ADD',
      valueLabel: '-15%',
      description: 'Evento meteo riduce l output offensivo.',
      owner: {
        id: 'system_weather_arcane',
        label: 'Sistema Meteo',
        type: 'system',
      },
      lifetime: { type: 'TIMED', label: '3m' },
      status: 'active',
      sourceConfigId: 'weather_arcane_tempest',
    },
  ],
  workerPanel: [
    {
      id: 'mod_resident_trait_nightowl',
      statId: 'stat_core_focus',
      label: 'Tratto Gufo Notturno',
      scope: 'RESIDENT',
      operation: 'ADD',
      valueLabel: '+4',
      description: 'Si attiva nelle missioni serali.',
      owner: {
        id: 'trait_nightowl',
        label: 'Night Owl',
        type: 'trait',
      },
      lifetime: { type: 'TIMED', label: 'Notte' },
      status: 'active',
      sourceConfigId: 'trait_nightowl_focus',
    },
    {
      id: 'mod_resident_fatigue_recovery',
      statId: 'stat_fatigue_recovery',
      label: 'Tisana Recupero',
      scope: 'RESIDENT',
      operation: 'ADD',
      valueLabel: '+18%',
      description: 'Consumabile craftato al mercato.',
      owner: {
        id: 'item_restoration_tea',
        label: 'Tisana al Trifoglio',
        type: 'item',
      },
      lifetime: { type: 'TIMED', label: '2h' },
      status: 'active',
      stackCount: 1,
      maxStacks: 2,
      sourceConfigId: 'consumable_restoration_tea',
    },
    {
      id: 'mod_resident_injury_penalty',
      statId: 'stat_risk_injury',
      label: 'Ferita recente',
      scope: 'RESIDENT',
      operation: 'ADD',
      valueLabel: '+25%',
      description: 'Applicato fino alla guarigione completa.',
      owner: {
        id: 'system_injury_tracker',
        label: 'Injury Tracker',
        type: 'system',
      },
      lifetime: { type: 'TIMED', label: '12h', remainingTicks: 7200 },
      status: 'active',
      sourceConfigId: 'injury_wound_minor',
    },
  ],
  questDetail: [
    {
      id: 'mod_quest_reward_gold',
      statId: 'stat_reward_gold',
      label: 'Bando Mercenari',
      scope: 'QUEST',
      operation: 'ADD',
      valueLabel: '+35%',
      description: 'Bonus ricompensa oro dal consiglio.',
      owner: {
        id: 'questline_mercenary_contract',
        label: 'Consiglio Mercenario',
        type: 'quest',
      },
      lifetime: { type: 'TIMED', label: 'Quest corrente' },
      status: 'active',
      sourceConfigId: 'quest_reward_boost_gold',
    },
    {
      id: 'mod_location_fog_resistance',
      statId: 'stat_core_guard',
      label: 'Resistenza Nebbia',
      scope: 'LOCATION',
      operation: 'ADD',
      valueLabel: '+8',
      description: 'Filtro respiratore montato sui lavoratori.',
      owner: {
        id: 'terrain_fogwall',
        label: 'Fogwall',
        type: 'terrain',
      },
      lifetime: { type: 'SESSION', label: 'Finché la quest è in zona' },
      status: 'upcoming',
      sourceConfigId: 'fogwall_guard_boost',
    },
    {
      id: 'mod_global_clergy_blessing',
      statId: 'stat_core_damage',
      label: 'Benedizione Clero',
      scope: 'GLOBAL',
      operation: 'MULT',
      valueLabel: '+10%',
      description: 'Moltiplica l output offensivo degli incarichi di fede.',
      owner: {
        id: 'system_clergy_blessing',
        label: 'Clero itinerante',
        type: 'system',
      },
      lifetime: { type: 'SESSION', label: 'Messa del mattino' },
      status: 'active',
      sourceConfigId: 'clergy_blessing_session',
    },
  ],
};
