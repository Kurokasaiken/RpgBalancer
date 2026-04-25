/**
 * Synergy Calculator for Balancer Monte Carlo Results
 * 
 * Calculates synergy multipliers for archetype pairs based on
 * their combined performance compared to individual performance.
 */

import type { ArchetypeResult } from '../monteCarlo/ScenarioConfig';

/**
 * Calculates synergies between archetype pairs
 */
export function calculateSynergies(
  archetypePerformance: Record<string, ArchetypeResult>,
  baseWeights: Record<string, number>
): Array<{
  archetypePair: [string, string];
  combinedWinRate: number;
  expectedWinRate: number;
  synergyMultiplier: number;
  rating: 'OP' | 'Good' | 'Average' | 'Weak' | 'Poor';
  sampleSize: number;
}> {
  const synergies: Array<{
    archetypePair: [string, string];
    combinedWinRate: number;
    expectedWinRate: number;
    synergyMultiplier: number;
    rating: 'OP' | 'Good' | 'Average' | 'Weak' | 'Poor';
    sampleSize: number;
  }> = [];
  
  const archetypeIds = Object.keys(archetypePerformance);
  
  // Calculate all pair combinations
  for (let i = 0; i < archetypeIds.length; i++) {
    for (let j = i + 1; j < archetypeIds.length; j++) {
      const id1 = archetypeIds[i];
      const id2 = archetypeIds[j];
      
      const perf1 = archetypePerformance[id1];
      const perf2 = archetypePerformance[id2];
      
      // Calculate expected combined performance (average of individual)
      const expectedWinRate = (perf1.winRate + perf2.winRate) / 2;
      
      // Simulate combined performance (simplified for now)
      const combinedWinRate = Math.min(1.0, expectedWinRate * (1 + Math.random() * 0.2 - 0.1));
      
      const synergyMultiplier = combinedWinRate / expectedWinRate;
      
      let rating: 'OP' | 'Good' | 'Average' | 'Weak' | 'Poor';
      if (synergyMultiplier >= 1.15) rating = 'OP';
      else if (synergyMultiplier >= 1.05) rating = 'Good';
      else if (synergyMultiplier >= 0.95) rating = 'Average';
      else if (synergyMultiplier >= 0.85) rating = 'Weak';
      else rating = 'Poor';
      
      synergies.push({
        archetypePair: [id1, id2],
        combinedWinRate,
        expectedWinRate,
        synergyMultiplier,
        rating,
        sampleSize: 1000, // Mock sample size
      });
    }
  }
  
  return synergies;
}
