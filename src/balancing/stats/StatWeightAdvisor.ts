import type { BalancerConfig, StatDefinition } from '../config/types';
import type { StatEfficiency } from '../testing/RoundRobinRunner';

export interface StatWeightAdvisorOptions {
  targetMin: number;
  targetMax: number;
  maxRelativeDelta: number;
  minEfficiencyDeviation: number;
}

export const DEFAULT_STAT_WEIGHT_ADVISOR_OPTIONS: StatWeightAdvisorOptions = {
  targetMin: 0.45,
  targetMax: 0.55,
  maxRelativeDelta: 0.15,
  minEfficiencyDeviation: 0.02,
};

export interface StatWeightSuggestion {
  statId: string;
  label: string;
  currentWeight: number;
  suggestedWeight: number;
  delta: number;
  deltaPercent: number;
  efficiency: number;
  assessment: StatEfficiency['assessment'];
  reason: string;
  safe: boolean;
}

function isConfigStatEligible(stat: StatDefinition): boolean {
  if (stat.isDerived) return false;
  if (typeof stat.formula === 'string') return false;
  if (stat.isHidden) return false;
  return true;
}

export function computeStatWeightSuggestions(
  config: BalancerConfig,
  efficiencies: StatEfficiency[],
  options?: Partial<StatWeightAdvisorOptions>,
): StatWeightSuggestion[] {
  const opts: StatWeightAdvisorOptions = {
    ...DEFAULT_STAT_WEIGHT_ADVISOR_OPTIONS,
    ...options,
  };

  const center = (opts.targetMin + opts.targetMax) / 2;
  const halfBand = (opts.targetMax - opts.targetMin) / 2;

  const suggestions: StatWeightSuggestion[] = [];

  for (const eff of efficiencies) {
    const stat = config.stats[eff.statId];
    if (!stat) continue;
    if (!isConfigStatEligible(stat)) continue;

    const currentWeight = stat.weight;
    if (!Number.isFinite(currentWeight) || currentWeight <= 0) continue;

    const deviation = eff.efficiency - center;

    if (Math.abs(deviation) < opts.minEfficiencyDeviation) {
      suggestions.push({
        statId: eff.statId,
        label: stat.label ?? eff.statId,
        currentWeight,
        suggestedWeight: currentWeight,
        delta: 0,
        deltaPercent: 0,
        efficiency: eff.efficiency,
        assessment: eff.assessment,
        reason: 'Efficiency already close to target band; no change suggested.',
        safe: true,
      });
      continue;
    }

    let direction: 'increase' | 'decrease' | 'none' = 'none';
    if (eff.efficiency > opts.targetMax) {
      direction = 'decrease';
    } else if (eff.efficiency < opts.targetMin) {
      direction = 'increase';
    } else {
      direction = 'none';
    }

    if (direction === 'none') {
      suggestions.push({
        statId: eff.statId,
        label: stat.label ?? eff.statId,
        currentWeight,
        suggestedWeight: currentWeight,
        delta: 0,
        deltaPercent: 0,
        efficiency: eff.efficiency,
        assessment: eff.assessment,
        reason: 'Efficiency within target band; no change suggested.',
        safe: true,
      });
      continue;
    }

    const outside = Math.max(0, Math.abs(deviation) - halfBand);
    const severityRaw = halfBand > 0 ? outside / halfBand : 0;
    const severity = Math.max(0.25, Math.min(1, severityRaw));

    const relativeChange = opts.maxRelativeDelta * severity;
    const signedRelativeChange = direction === 'increase' ? relativeChange : -relativeChange;
    const deltaPercent = signedRelativeChange * 100;

    const suggestedWeight = currentWeight * (1 + signedRelativeChange);
    const delta = suggestedWeight - currentWeight;

    const safe = Math.abs(deltaPercent) <= opts.maxRelativeDelta * 100 * 0.6;

    const targetBandText = `[${(opts.targetMin * 100).toFixed(0)}–${(
      opts.targetMax * 100
    ).toFixed(0)}%]`;

    const directionText =
      direction === 'decrease' ? 'above' : 'below';

    const reason =
      `Efficiency ${(eff.efficiency * 100).toFixed(1)}% (${eff.assessment}) is ${directionText} target band ${targetBandText}. ` +
      `Suggested ${direction === 'decrease' ? 'decrease' : 'increase'} weight by ${deltaPercent.toFixed(
        1,
      )}%.`;

    suggestions.push({
      statId: eff.statId,
      label: stat.label ?? eff.statId,
      currentWeight,
      suggestedWeight,
      delta,
      deltaPercent,
      efficiency: eff.efficiency,
      assessment: eff.assessment,
      reason,
      safe,
    });
  }

  return suggestions;
}
