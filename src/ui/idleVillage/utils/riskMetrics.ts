/**
 * Risk metrics for injury and death percentages.
 * Used to calculate proportional visual stripes.
 */
export interface RiskMetrics {
  /** Injury risk percentage (0-100) */
  injuryPct: number;
  /** Death risk percentage (0-100) */
  deathPct: number;
}

/**
 * Result of risk stripe calculations.
 */
export interface RiskStripeResult {
  /** Height percentage for injury stripe (0-100) */
  injuryHeight: number;
  /** Height percentage for death stripe (0-100) */
  deathHeight: number;
  /** CSS color for injury stripe */
  injuryColor: string;
  /** CSS color for death stripe */
  deathColor: string;
  /** ARIA label describing the risks */
  ariaLabel: string;
  /** Warning messages if any (e.g., total >100%) */
  warnings: string[];
}

/**
 * Calculates proportional heights and colors for risk stripes.
 * Injury is yellow, death is red. Heights are proportional to percentages.
 * Warns if total risk exceeds 100%.
 *
 * @param metrics - Risk percentages from config
 * @returns Calculated stripe properties
 */
export function calculateRiskStripes(metrics: RiskMetrics): RiskStripeResult {
  const { injuryPct, deathPct } = metrics;
  const totalPct = injuryPct + deathPct;

  const warnings: string[] = [];
  if (totalPct > 100) {
    warnings.push(`Total risk ${totalPct}% exceeds 100%`);
  }

  // Heights proportional, but ensure minimum visibility
  const injuryHeight = Math.max(3, (injuryPct / 100) * 100); // min 3% for visibility
  const deathHeight = Math.max(3, (deathPct / 100) * 100);

  const ariaLabel = `Injury risk: ${injuryPct}%, Death risk: ${deathPct}%`;

  return {
    injuryHeight,
    deathHeight,
    injuryColor: 'var(--risk-injury, #fbbf24)', // yellow
    deathColor: 'var(--risk-death, #dc2626)', // red
    ariaLabel,
    warnings,
  };
}
