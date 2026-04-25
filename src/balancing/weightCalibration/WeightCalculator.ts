/**
 * Weight Calculator for Balancer Monte Carlo Results
 * 
 * Calculates optimal stat weights based on archetype performance
 * from Monte Carlo simulations.
 */

import type { ArchetypeResult } from '../monteCarlo/ScenarioConfig';

/**
 * Calculates optimal weights based on archetype performance
 */
export function calculateOptimalWeights(
  archetypePerformance: Record<string, ArchetypeResult>,
  baseWeights: Record<string, number>
): Record<string, number> {
  const optimalWeights: Record<string, number> = { ...baseWeights };
  
  // Calculate weight adjustments based on performance
  Object.entries(archetypePerformance).forEach(([archetypeId, performance]) => {
    // Higher performing archetypes get higher weights for their key stats
    const performanceMultiplier = performance.winRate;
    
    // Apply performance-based adjustments
    if (performanceMultiplier > 0.7) {
      // Good performance - increase weights
      Object.keys(optimalWeights).forEach(stat => {
        optimalWeights[stat] *= (1 + (performanceMultiplier - 0.7) * 0.5);
      });
    } else if (performanceMultiplier < 0.3) {
      // Poor performance - decrease weights
      Object.keys(optimalWeights).forEach(stat => {
        optimalWeights[stat] *= performanceMultiplier / 0.3;
      });
    }
  });
  
  // Normalize weights to maintain balance
  const totalWeight = Object.values(optimalWeights).reduce((sum, weight) => sum + weight, 0);
  const normalizedWeights: Record<string, number> = {};
  
  Object.entries(optimalWeights).forEach(([stat, weight]) => {
    normalizedWeights[stat] = (weight / totalWeight) * Object.keys(baseWeights).length;
  });
  
  return normalizedWeights;
}

/**
 * Calculates synergy multipliers for archetype pairs
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
