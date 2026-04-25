import type { StatRequirement } from '../../idleVillage/types';
import type { ResidentStatus } from '@/engine/game/idleVillage/TimeEngine';

export interface VerbSandboxSlotPreset {
  id: string;
  label: string;
  required: boolean;
  hint?: string;
  requirement?: StatRequirement;
}

export interface VerbSandboxResidentPreset {
  id: string;
  status: ResidentStatus;
  fatigue: number;
  statTags: string[];
}

export interface VerbSandboxPreset {
  activityId: string;
  slotLabel?: string;
  slots: VerbSandboxSlotPreset[];
  residents: VerbSandboxResidentPreset[];
}

export const VERB_SANDBOX_PRESET: VerbSandboxPreset = {
  activityId: 'quest_city_rats',
  slotLabel: 'Village Square',
  slots: [
    {
      id: 'slot_leader',
      label: 'Leader',
      required: true,
      hint: 'Reason focus',
      requirement: {
        label: 'Reason + (Lantern | Discipline)',
        allOf: ['reason'],
        anyOf: ['lantern', 'discipline'],
      },
    },
    {
      id: 'slot_support',
      label: 'Support',
      required: false,
      hint: 'Edge or Moth',
      requirement: {
        label: 'Edge / Moth',
        anyOf: ['edge', 'moth'],
        noneOf: ['frailty'],
      },
    },
  ],
  residents: [
    {
      id: 'Founder',
      status: 'available',
      fatigue: 10,
      statTags: ['reason', 'lantern', 'discipline'],
    },
    {
      id: 'Scout-A',
      status: 'available',
      fatigue: 25,
      statTags: ['moth', 'edge', 'passion'],
    },
    {
      id: 'Worker-B',
      status: 'injured',
      fatigue: 70,
      statTags: ['forge', 'strength'],
    },
  ],
};

interface PunchClubLightActivityConfig {
  id: string;
  label: string;
  description: string;
  statRequirement: StatRequirement;
  durationUnits: number;
}

interface PunchClubLightConfig {
  id: string;
  label: string;
  activities: {
    job_punch_training: PunchClubLightActivityConfig;
  };
}

interface PunchClubLightResident {
  id: string;
  displayName: string;
  status: ResidentStatus;
  fatigue: number;
  maxHp: number;
  currentHp: number;
  statTags: string[];
}

export const PUNCH_CLUB_LIGHT_CONFIG: PunchClubLightConfig = {
  id: 'punch_club_light',
  label: 'Punch Club – Light Preset',
  activities: {
    job_punch_training: {
      id: 'job_punch_training',
      label: 'Gym Shift – Light',
      description: 'Allenamento base per il turno al Punch Club Gym.',
      statRequirement: {
        label: 'Lantern + (Edge | Discipline)',
        allOf: ['lantern'],
        anyOf: ['edge', 'discipline'],
      },
      durationUnits: 3,
    },
  },
};

export const PUNCH_CLUB_LIGHT_RESIDENTS: PunchClubLightResident[] = [
  {
    id: 'punch-aurora',
    displayName: 'Aurora Calder',
    status: 'available',
    fatigue: 5,
    maxHp: 120,
    currentHp: 120,
    statTags: ['lantern', 'discipline', 'edge'],
  },
  {
    id: 'punch-riven',
    displayName: 'Riven Holt',
    status: 'available',
    fatigue: 15,
    maxHp: 130,
    currentHp: 130,
    statTags: ['edge', 'forge'],
  },
  {
    id: 'punch-selene',
    displayName: 'Selene Vire',
    status: 'available',
    fatigue: 10,
    maxHp: 110,
    currentHp: 110,
    statTags: ['lantern', 'moth'],
  },
  {
    id: 'punch-kael',
    displayName: 'Kael Drift',
    status: 'injured',
    fatigue: 45,
    maxHp: 140,
    currentHp: 80,
    statTags: ['edge', 'grail'],
  },
];
