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
