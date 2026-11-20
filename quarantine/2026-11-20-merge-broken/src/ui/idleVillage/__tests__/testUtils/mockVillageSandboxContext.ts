import { vi } from 'vitest';
import type { ActivitySlotData } from '@/ui/idleVillage/types/ActivitySlotData';
import type { ResidentState, VillageState } from '@/engine/game/idleVillage/TimeEngine';
import type { UseVillageSandboxReturn } from '@/ui/idleVillage/hooks/useVillageSandbox';
import type { ActivityAreaHandlers, ActivityAreaSlot } from '@/ui/idleVillage/ActivityArea';
import type { AncillarySlotEntry } from '@/ui/idleVillage/components/AncillaryPanels';
import type { ActivityDefinition, IdleVillageConfig } from '@/balancing/config/idleVillage/types';
import type { VillageSummary } from '@/ui/idleVillage/state/VillageRegistry';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '@/balancing/config/idleVillage/defaultConfig';

export const demoResidents: ResidentState[] = [
  {
    id: 'resident-alpha',
    displayName: 'Atria',
    status: 'available',
    fatigue: 10,
    currentHp: 90,
    maxHp: 100,
    isHero: false,
    isInjured: false,
    survivalCount: 0,
    survivalScore: 0,
    portraitUrl: 'alpha.png',
    statSnapshot: { hp: 100 },
    statTags: ['forager'],
  },
  {
    id: 'resident-beta',
    displayName: 'Bram',
    status: 'available',
    fatigue: 5,
    currentHp: 80,
    maxHp: 100,
    isHero: false,
    isInjured: false,
    survivalCount: 0,
    survivalScore: 0,
    portraitUrl: 'beta.png',
    statSnapshot: { hp: 90 },
    statTags: ['scout'],
  },
] as ResidentState[];

export const baseSlot: ActivitySlotData = {
  slotId: 'job-harvest',
  label: 'Harvest',
  iconName: '🌾',
  assignedWorkerId: null,
  activity: {
    id: 'job-harvest',
    label: 'Harvest',
    tags: ['job'],
    slotTags: ['village_job'],
    resolutionEngineId: 'job',
  },
  mapSlotLabel: 'Fields',
  visualVariant: 'jade',
};

type SandboxVerbSummary = UseVillageSandboxReturn['theaterVerbs'][number];

export type MockSandboxContext = Pick<
  UseVillageSandboxReturn,
  | 'residents'
  | 'assignmentFeedback'
  | 'handleResidentSelect'
  | 'isDayPhase'
  | 'cycleProgressFraction'
  | 'cycleElapsedSeconds'
  | 'cycleDayCount'
  | 'cyclePhaseLabel'
  | 'cyclePhaseIcon'
  | 'secondsPerTimeUnit'
  | 'totalCycleSeconds'
  | 'isCyclePlaying'
  | 'toggleCyclePlaying'
  | 'locationSlots'
  | 'openTheaterForSlot'
  | 'isTheaterOpen'
  | 'theaterPrimarySlot'
  | 'theaterVerbs'
  | 'handleCloseTheater'
  | 'handleLocationResidentDrop'
  | 'handleWorkerDrop'
  | 'slotDropStates'
  | 'locationDropState'
  | 'activityAreaSlots'
  | 'activityAreaHandlers'
  | 'managedActivities'
  | 'demoPanelHandlers'
  | 'resetState'
  | 'config'
  | 'activityScheduler'
  | 'villageState'
  | 'activeSlots'
  | 'getVillageSummaries'
  | 'getTradeRoutes'
  | 'getMigrationQueue'
  | 'getLastTradeResult'
  | 'createTradeRoute'
  | 'executeTradeRoute'
  | 'processMigrationTick'
  | 'resourceItems'
  | 'headerResources'
  | 'handleQuickWorkShift'
  | 'handleQuickRest'
  | 'isResting'
  | 'handleResetSandboxState'
>;

const demoVerb: SandboxVerbSummary = {
  key: 'verb-harvest',
  source: 'system',
  activityId: 'job-harvest',
  slotId: 'job-harvest',
  label: 'Harvest',
  kindLabel: 'Job',
  isQuest: false,
  isJob: true,
  icon: '🌾',
  visualVariant: 'jade',
  progressStyle: 'border',
  progressFraction: 0,
  elapsedSeconds: 0,
  totalDurationSeconds: 60,
  remainingSeconds: 60,
  injuryPercentage: 5,
  deathPercentage: 0,
  assignedCount: 0,
  totalSlots: 1,
  rewardLabel: 'Grain',
  tone: 'job',
  deadlineLabel: null,
  assigneeNames: [],
  autoState: null,
};

const demoVillageResources = {
  gold: 120,
  food: 75,
  population: 38,
};

const demoVillageState = {
  residents: demoResidents.reduce<Record<string, ResidentState>>((acc, resident) => {
    acc[resident.id] = resident;
    return acc;
  }, {}),
  resources: demoVillageResources,
} as unknown as VillageState;

const demoActivityAreaSlots: (ActivityAreaSlot & { assignedWorkerId: string | null; activity: ActivityDefinition })[] = [
  {
    slotId: 'day-night-cycle',
    label: 'Cycle Control',
    iconName: '🌓',
    visualVariant: 'solar',
    progressFraction: 0.5,
    elapsedSeconds: 120,
    totalDurationSeconds: 240,
    canAcceptDrop: false,
    isCycleControl: true,
    assignedWorkerId: null,
    activity: { id: 'cycle', label: 'Cycle', tags: [], slotTags: [], resolutionEngineId: 'none' } as { id: string; label: string; tags: string[]; slotTags: string[]; resolutionEngineId: string },
  },
  {
    slotId: baseSlot.slotId,
    label: baseSlot.label,
    iconName: baseSlot.iconName,
    visualVariant: baseSlot.visualVariant,
    mapSlotLabel: baseSlot.mapSlotLabel,
    progressFraction: 0.25,
    elapsedSeconds: 30,
    totalDurationSeconds: 120,
    assignedWorkerId: null,
    activity: baseSlot.activity,
    canAcceptDrop: true,
  },
];

const demoActiveSlots: AncillarySlotEntry[] = [
  {
    slot: baseSlot,
    state: {
      progress: 0.4,
      elapsed: 24,
      duration: 120,
    } as unknown as AncillarySlotEntry['state'],
  },
];

const demoVillageSummaries: VillageSummary[] = [
  {
    id: 'village-alpha',
    name: 'Alpha',
    currentResources: demoVillageResources,
    population: 30,
    activeActivities: 2,
    status: 'active',
  },
];

const demoConfig: IdleVillageConfig = {
  ...DEFAULT_IDLE_VILLAGE_CONFIG,
  resources: {
    ...DEFAULT_IDLE_VILLAGE_CONFIG.resources,
    gold: { ...DEFAULT_IDLE_VILLAGE_CONFIG.resources.gold, label: 'Gold' },
    food: { ...DEFAULT_IDLE_VILLAGE_CONFIG.resources.food, label: 'Food' },
    population: {
      ...(DEFAULT_IDLE_VILLAGE_CONFIG.resources.population ?? { id: 'population', label: 'Population' }),
      label: 'Population',
    },
  },
  globalRules: {
    ...DEFAULT_IDLE_VILLAGE_CONFIG.globalRules,
    secondsPerTimeUnit: DEFAULT_IDLE_VILLAGE_CONFIG.globalRules.secondsPerTimeUnit ?? 60,
    dayLengthInTimeUnits: DEFAULT_IDLE_VILLAGE_CONFIG.globalRules.dayLengthInTimeUnits ?? 10,
    dayNightCycle: {
      dayTimeUnits: DEFAULT_IDLE_VILLAGE_CONFIG.globalRules.dayNightCycle?.dayTimeUnits ?? 10,
      nightTimeUnits: DEFAULT_IDLE_VILLAGE_CONFIG.globalRules.dayNightCycle?.nightTimeUnits ?? 5,
    },
  },
};

export const createMockContext = (overrides: Partial<MockSandboxContext> = {}): MockSandboxContext => {
  const defaultActivityAreaHandlers: ActivityAreaHandlers = {
    onWorkerDrop: vi.fn(),
    onInspect: vi.fn(),
    onToggleCycle: vi.fn(),
    onLocationInspect: vi.fn(),
    onLocationDragEnter: vi.fn(),
    onLocationDragLeave: vi.fn(),
    onLocationDrop: vi.fn(),
    onSlotResidentDragEnter: vi.fn(),
    onSlotResidentDragLeave: vi.fn(),
  };

  const defaultContext: MockSandboxContext = {
    residents: demoResidents,
    assignmentFeedback: 'Demo alert',
    handleResidentSelect: vi.fn(),
    isDayPhase: true,
    cycleProgressFraction: 0.5,
    cycleElapsedSeconds: 120,
    cycleDayCount: 1,
    cyclePhaseLabel: 'Fase giorno',
    cyclePhaseIcon: '☀️',
    secondsPerTimeUnit: 60,
    totalCycleSeconds: 600,
    isCyclePlaying: true,
    toggleCyclePlaying: vi.fn(),
    locationSlots: [baseSlot],
    openTheaterForSlot: vi.fn(),
    isTheaterOpen: false,
    theaterPrimarySlot: baseSlot,
    theaterVerbs: [demoVerb],
    handleCloseTheater: vi.fn(),
    handleLocationResidentDrop: vi.fn(),
    handleWorkerDrop: vi.fn(),
    slotDropStates: { [baseSlot.slotId]: 'idle' },
    locationDropState: 'idle',
    activityAreaSlots: demoActivityAreaSlots,
    activityAreaHandlers: defaultActivityAreaHandlers,
    managedActivities: [
      {
        id: baseSlot.slotId,
        label: baseSlot.label,
        tags: ['job'],
        slotTags: [],
        resolutionEngineId: 'job',
      },
    ] as unknown as UseVillageSandboxReturn['managedActivities'],
    demoPanelHandlers: {
      setRequirement: vi.fn(),
      onSlotDrop: vi.fn(),
      onSlotClear: vi.fn(),
      onRemoveAll: vi.fn(),
      onStart: vi.fn(),
    },
    resetState: vi.fn().mockResolvedValue(undefined),
    config: demoConfig,
    activityScheduler: {
      advanceTimeUnitsDebug: vi.fn(),
      pauseTimer: vi.fn(),
      resumeTimer: vi.fn(),
      resetScheduler: vi.fn(),
      villageState: demoVillageState,
    } as unknown as UseVillageSandboxReturn['activityScheduler'],
    villageState: demoVillageState,
    activeSlots: demoActiveSlots,
    getVillageSummaries: vi.fn(() => demoVillageSummaries),
    getTradeRoutes: vi.fn(() => []),
    getMigrationQueue: vi.fn(() => []),
    getLastTradeResult: vi.fn(() => null),
    createTradeRoute: vi.fn(),
    executeTradeRoute: vi.fn(),
    processMigrationTick: vi.fn(() => []),
    resourceItems: [
      {
        id: 'gold',
        label: 'Gold',
        icon: '🪙',
        value: demoVillageResources.gold,
        accentClass: 'text-amber-200',
      },
      {
        id: 'food',
        label: 'Food',
        icon: '🥖',
        value: demoVillageResources.food,
        accentClass: 'text-emerald-200',
      },
      {
        id: 'population',
        label: 'Population',
        icon: '👥',
        value: demoVillageResources.population,
        accentClass: 'text-slate-200',
      },
    ],
    headerResources: {
      gold: demoVillageResources.gold,
      food: demoVillageResources.food,
      population: demoVillageResources.population,
    },
    handleQuickWorkShift: vi.fn(),
    handleQuickRest: vi.fn(),
    isResting: false,
    handleResetSandboxState: vi.fn(),
  };

  return {
    ...defaultContext,
    ...overrides,
    activityAreaHandlers: overrides.activityAreaHandlers ?? defaultActivityAreaHandlers,
  };
};
