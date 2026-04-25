import { useMemo } from 'react';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { useLocalization } from '@/hooks/useLocalization';
import type {
  WorkerRecommendationKey,
  WorkerTooltipCopy,
} from '@/localization/LocalizationService';

/**
 * Configuration for worker bios and personality traits
 */
export interface WorkerBioConfig {
  id: string;
  displayName: string;
  shortBio: string;
  fullBio?: string;
  personality: string[];
  skills: string[];
  preferences: string[];
  background?: string;
  quotes?: string[];
}

/**
 * Processed worker tooltip data with formatted information
 */
export interface WorkerTooltipData {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  fatigue: number;
  status: string;
  statTags?: string[];
  bio?: WorkerBioConfig;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  performanceScore: number;
  recommendations: string[];
}

/**
 * Hook to fetch and process worker tooltip data
 * Reads from worker bio configs and resident state
 */
export function useWorkerTooltipData(resident: ResidentState): WorkerTooltipData {
  const { workerTooltip } = useLocalization();

  const tooltipData = useMemo(() => {
    // Calculate risk level based on HP and fatigue
    const hpPercent = (resident.currentHp / resident.maxHp) * 100;
    const fatiguePercent = resident.fatigue;

    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (hpPercent < 25 || fatiguePercent > 85) {
      riskLevel = 'critical';
    } else if (hpPercent < 50 || fatiguePercent > 70) {
      riskLevel = 'high';
    } else if (hpPercent < 75 || fatiguePercent > 50) {
      riskLevel = 'medium';
    }

    // Calculate performance score (0-100)
    const performanceScore = Math.round(hpPercent * 0.6 + (100 - fatiguePercent) * 0.4);

    const { statuses, recommendations: recommendationCopy } = workerTooltip;

    const resolveStatusText = (status: string): string => {
      if (!statuses) return status || 'Available';
      const statusKey = status as keyof WorkerTooltipCopy['statuses'];
      return statuses[statusKey] ?? statuses.available ?? status ?? 'Available';
    };

    const recommendations: string[] = [];
    const addRecommendation = (
      condition: boolean,
      key: WorkerRecommendationKey,
    ) => {
      if (!condition || !recommendationCopy) return;
      const recommendation = recommendationCopy[key];
      if (recommendation) {
        recommendations.push(recommendation);
      }
    };

    addRecommendation(hpPercent < 50, 'lowHp');
    addRecommendation(fatiguePercent > 70, 'highFatigue');
    addRecommendation(Boolean(resident.isInjured), 'injured');
    addRecommendation(riskLevel === 'critical', 'critical');

    return {
      id: resident.id,
      name: resident.displayName || resident.id,
      hp: resident.currentHp,
      maxHp: resident.maxHp,
      fatigue: resident.fatigue,
      status: resolveStatusText(resident.status),
      statTags: resident.statTags || [],
      riskLevel,
      performanceScore,
      recommendations,
    };
  }, [resident, workerTooltip]);

  return tooltipData;
}

/**
 * Hook to get worker bio configuration
 * In a real implementation, this would read from config files
 */
export function useWorkerBioConfig(workerId: string): WorkerBioConfig | undefined {
  // Mock bio configs - in production these would come from config files
  const bioConfigs: Record<string, WorkerBioConfig> = {
    'pc-trainee-1': {
      id: 'pc-trainee-1',
      displayName: 'Lucia "Lantern" Bassi',
      shortBio: 'Dedicated trainee with exceptional agility and quick thinking',
      fullBio: 'Lucia earned her nickname "Lantern" during her first trial when she guided her team through darkness using quick thinking and natural leadership. Her agility stats make her perfect for reconnaissance missions.',
      personality: ['Quick-thinking', 'Natural leader', 'Agile'],
      skills: ['Reconnaissance', 'Quick response', 'Team coordination'],
      preferences: ['Morning assignments', 'Team missions', 'Scouting duties'],
      background: 'Former village scout who joined the training program to formalize her skills',
      quotes: [
        'Darkness is just an opportunity for light to shine brighter',
        'Quick feet save lives',
        'The best path is the one we create together'
      ]
    },
    'founder-miner': {
      id: 'founder-miner',
      displayName: 'Marco "Stonehammer" Rossi',
      shortBio: 'Experienced miner with unmatched strength and endurance',
      fullBio: 'Marco has been mining since childhood and knows every tunnel in the surrounding mountains. His strength is legendary among the mining community.',
      personality: ['Strong', 'Reliable', 'Experienced'],
      skills: ['Mining', 'Strength tasks', 'Tunnel navigation'],
      preferences: ['Underground work', 'Heavy lifting', 'Solo missions'],
      background: 'Third-generation miner from the northern mountains',
      quotes: [
        'Stone remembers the hand that shapes it',
        'Strength without wisdom is just weight',
        'Every tunnel has a story'
      ]
    }
  };

  return bioConfigs[workerId];
}
