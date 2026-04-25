import { z } from 'zod';
import type { StressTestArchetype, StressTestScenario } from '../stressTesting/types';
import type { BalancerConfig } from '../config/types';

/**
 * Synergy matrix entry type
 */
type SynergyMatrixEntry = {
  stat1: string;
  stat2: string;
  synergyMultiplier: number;
  combinedWinRate: number;
  expectedWinRate: number;
  synergyLevel: 'weak' | 'normal' | 'strong' | 'op';
};

/**
 * Schema for stress test report data
 */
export const StressReportSchema = z.object({
  metadata: z.object({
    reportId: z.string(),
    generatedAt: z.string(),
    totalSimulations: z.number(),
    configVersion: z.string(),
    seed: z.number(),
  }),
  summary: z.object({
    totalArchetypes: z.number(),
    singleStatArchetypes: z.number(),
    pairStatArchetypes: z.number(),
    averageWinRate: z.number(),
    topPerformingArchetype: z.string(),
    worstPerformingArchetype: z.string(),
  }),
  archetypePerformance: z.array(z.object({
    archetypeId: z.string(),
    archetypeName: z.string(),
    type: z.enum(['baseline', 'single', 'pair']),
    winRate: z.number(),
    totalSimulations: z.number(),
    wins: z.number(),
    losses: z.number(),
    averageTurns: z.number(),
    testedStats: z.array(z.string()),
    kpiScore: z.number(),
  })),
  synergyMatrix: z.array(z.object({
    stat1: z.string(),
    stat2: z.string(),
    synergyMultiplier: z.number(),
    combinedWinRate: z.number(),
    expectedWinRate: z.number(),
    synergyLevel: z.enum(['weak', 'normal', 'strong', 'op']),
  })),
  kpiAnalysis: z.object({
    highestValueStat: z.string(),
    lowestValueStat: z.string(),
    mostSynergisticPair: z.array(z.string()),
    leastSynergisticPair: z.array(z.string()),
    overallBalanceScore: z.number(),
  }),
});

export type StressReport = z.infer<typeof StressReportSchema>;

/**
 * Generator for comprehensive stress test reports
 */
export class StressReportGenerator {
  private config: BalancerConfig;
  private reportId: string;
  private static counter = 0;

  constructor(config: BalancerConfig) {
    this.config = config;
    this.reportId = `stress-report-${Date.now()}-${++StressReportGenerator.counter}`;
  }

  /**
   * Generate comprehensive report from stress test scenarios
   */
  async generateReport(scenarios: StressTestScenario[]): Promise<StressReport> {
    const allArchetypes = scenarios.flatMap(s => s.archetypes);
    
    const metadata = {
      reportId: this.reportId,
      generatedAt: new Date().toISOString(),
      totalSimulations: allArchetypes.reduce((sum, a) => sum + (a as any).totalSimulations || 1000, 0),
      configVersion: '1.0.0',
      seed: scenarios[0]?.archetypes[0]?.seed || 42,
    };

    const summary = this.calculateSummary(allArchetypes);
    const archetypePerformance = this.calculateArchetypePerformance(allArchetypes);
    const synergyMatrix = this.calculateSynergyMatrix(allArchetypes);
    const kpiAnalysis = this.calculateKPIAnalysis(allArchetypes, synergyMatrix);

    return {
      metadata,
      summary,
      archetypePerformance,
      synergyMatrix,
      kpiAnalysis,
    };
  }

  private calculateSummary(archetypes: StressTestArchetype[]) {
    const single = archetypes.filter(a => a.type === 'single').length;
    const pair = archetypes.filter(a => a.type === 'pair').length;
    // const baseline = archetypes.filter(a => a.type === 'baseline').length;
    
    // Mock performance data - in real implementation would come from simulation results
    const winRates = archetypes.map(() => Math.random() * 0.8 + 0.1);
    const avgWinRate = winRates.reduce((sum, rate) => sum + rate, 0) / winRates.length;
    
    return {
      totalArchetypes: archetypes.length,
      singleStatArchetypes: single,
      pairStatArchetypes: pair,
      averageWinRate: avgWinRate,
      topPerformingArchetype: archetypes[winRates.indexOf(Math.max(...winRates))]?.name || 'N/A',
      worstPerformingArchetype: archetypes[winRates.indexOf(Math.min(...winRates))]?.name || 'N/A',
    };
  }

  private calculateArchetypePerformance(archetypes: StressTestArchetype[]) {
    return archetypes.map(archetype => ({
      archetypeId: archetype.id,
      archetypeName: archetype.name,
      type: archetype.type,
      winRate: Math.random() * 0.8 + 0.1, // Mock data
      totalSimulations: 1000,
      wins: Math.floor(Math.random() * 800 + 100),
      losses: Math.floor(Math.random() * 200 + 100),
      averageTurns: Math.floor(Math.random() * 10 + 5),
      testedStats: archetype.testedStats,
      kpiScore: Math.random() * 100,
    }));
  }

  private calculateSynergyMatrix(_archetypes: StressTestArchetype[]): SynergyMatrixEntry[] {
    const pairArchetypes = _archetypes.filter(a => a.type === 'pair');
    
    return pairArchetypes.map(archetype => {
      const testedStats = archetype.testedStats;
      const synergyMultiplier = Math.random() * 0.5 + 0.8; // Mock data
      
      return {
        stat1: testedStats[0] || 'unknown',
        stat2: testedStats[1] || 'unknown',
        synergyMultiplier,
        combinedWinRate: Math.random() * 0.8 + 0.1,
        expectedWinRate: Math.random() * 0.8 + 0.1,
        synergyLevel: this.getSynergyLevel(synergyMultiplier),
      };
    });
  }

  private getSynergyLevel(multiplier: number): 'weak' | 'normal' | 'strong' | 'op' {
    if (multiplier < 0.95) return 'weak';
    if (multiplier < 1.05) return 'normal';
    if (multiplier < 1.15) return 'strong';
    return 'op';
  }

  private calculateKPIAnalysis(_archetypes: StressTestArchetype[], _synergyMatrix: SynergyMatrixEntry[]) {
    // Mock KPI analysis - in real implementation would analyze actual data
    return {
      highestValueStat: 'hp',
      lowestValueStat: 'speed',
      mostSynergisticPair: ['hp', 'damage'],
      leastSynergisticPair: ['speed', 'defense'],
      overallBalanceScore: Math.random() * 50 + 50,
    };
  }
}
