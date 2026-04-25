/**
 * A/B Test Framework
 * Deterministic variant assignment with statistical significance calculation
 * 
 * @see NP-223 – A/B Test Framework
 */

import { z } from 'zod';

/**
 * A/B test variant schema
 */
export const ABTestVariantSchema = z.object({
  id: z.string(),
  name: z.string(),
  weight: z.number().min(0).max(1),
  config: z.record(z.unknown()).optional(),
});

export type ABTestVariant = z.infer<typeof ABTestVariantSchema>;

/**
 * A/B test configuration schema
 */
export const ABTestConfigSchema = z.object({
  testId: z.string(),
  testName: z.string(),
  variants: z.array(ABTestVariantSchema).min(2),
  enabled: z.boolean().default(true),
  startDate: z.number().optional(),
  endDate: z.number().optional(),
  targetAudience: z.object({
    userSegments: z.array(z.string()).optional(),
    platforms: z.array(z.enum(['web', 'mobile', 'desktop'])).optional(),
    regions: z.array(z.string()).optional(),
  }).optional(),
});

export type ABTestConfig = z.infer<typeof ABTestConfigSchema>;

/**
 * A/B test result schema
 */
export const ABTestResultSchema = z.object({
  variantId: z.string(),
  conversions: z.number(),
  impressions: z.number(),
  conversionRate: z.number(),
});

export type ABTestResult = z.infer<typeof ABTestResultSchema>;

/**
 * Statistical significance result
 */
export interface SignificanceResult {
  isSignificant: boolean;
  pValue: number;
  chiSquare: number;
  degreesOfFreedom: number;
  confidenceLevel: number;
  winner: string | null;
}

/**
 * A/B Test Framework
 * Manages variant assignment and statistical analysis
 */
export class ABTestFramework {
  private config: ABTestConfig;

  constructor(config: ABTestConfig) {
    this.config = ABTestConfigSchema.parse(config);
  }

  /**
   * Assign variant to user using deterministic hash-based assignment
   */
  assignVariant(userId: string): ABTestVariant {
    if (!this.config.enabled) {
      return this.config.variants[0];
    }

    const hash = this.hashUserId(userId, this.config.testId);
    const normalizedHash = hash / 0xffffffff;

    let cumulativeWeight = 0;
    for (const variant of this.config.variants) {
      cumulativeWeight += variant.weight;
      if (normalizedHash <= cumulativeWeight) {
        return variant;
      }
    }

    return this.config.variants[this.config.variants.length - 1];
  }

  /**
   * Calculate statistical significance using chi-square test
   */
  calculateSignificance(
    results: ABTestResult[],
    confidenceLevel: number = 0.95
  ): SignificanceResult {
    if (results.length < 2) {
      return {
        isSignificant: false,
        pValue: 1,
        chiSquare: 0,
        degreesOfFreedom: 0,
        confidenceLevel,
        winner: null,
      };
    }

    const totalImpressions = results.reduce((sum, r) => sum + r.impressions, 0);
    const totalConversions = results.reduce((sum, r) => sum + r.conversions, 0);
    const expectedRate = totalConversions / totalImpressions;

    let chiSquare = 0;
    for (const result of results) {
      const expected = result.impressions * expectedRate;
      const observed = result.conversions;
      chiSquare += Math.pow(observed - expected, 2) / expected;
    }

    const degreesOfFreedom = results.length - 1;
    const pValue = this.chiSquareToPValue(chiSquare, degreesOfFreedom);
    const isSignificant = pValue < (1 - confidenceLevel);

    let winner: string | null = null;
    if (isSignificant) {
      const maxRate = Math.max(...results.map(r => r.conversionRate));
      const winnerResult = results.find(r => r.conversionRate === maxRate);
      winner = winnerResult?.variantId || null;
    }

    return {
      isSignificant,
      pValue,
      chiSquare,
      degreesOfFreedom,
      confidenceLevel,
      winner,
    };
  }

  /**
   * Hash user ID for deterministic variant assignment
   */
  private hashUserId(userId: string, testId: string): number {
    const str = `${userId}-${testId}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Convert chi-square to p-value (simplified approximation)
   */
  private chiSquareToPValue(chiSquare: number, df: number): number {
    if (df === 1) {
      const z = Math.sqrt(chiSquare);
      return 2 * (1 - this.normalCDF(z));
    }
    
    const k = df / 2;
    const x = chiSquare / 2;
    
    if (x < 0 || k < 1) return 1;
    
    let sum = 1;
    let term = 1;
    for (let i = 1; i < 100; i++) {
      term *= x / (k + i - 1);
      sum += term;
      if (term < 1e-10) break;
    }
    
    return 1 - (Math.pow(x, k - 1) * Math.exp(-x) * sum / this.gamma(k));
  }

  /**
   * Normal cumulative distribution function
   */
  private normalCDF(x: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - prob : prob;
  }

  /**
   * Gamma function approximation
   */
  private gamma(n: number): number {
    if (n === 1) return 1;
    if (n === 0.5) return Math.sqrt(Math.PI);
    return (n - 1) * this.gamma(n - 1);
  }

  /**
   * Get test configuration
   */
  getConfig(): ABTestConfig {
    return this.config;
  }

  /**
   * Check if test is active
   */
  isActive(): boolean {
    if (!this.config.enabled) return false;
    
    const now = Date.now();
    if (this.config.startDate && now < this.config.startDate) return false;
    if (this.config.endDate && now > this.config.endDate) return false;
    
    return true;
  }
}
