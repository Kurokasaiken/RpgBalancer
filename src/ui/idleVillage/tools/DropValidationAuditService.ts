/**
 * Drop Validation Audit Service - NP-068
 * 
 * Service that loads dataset, invokes drop validation helper,
 * and produces diff reports for audit purposes.
 * 
 * @since 2026-01-24
 * @author Atlas-Idle
 */

import { z } from 'zod';

export const ResidentStatsSchema = z.object({
  strength: z.number().min(0).max(10),
  dexterity: z.number().min(0).max(10),
  intelligence: z.number().min(0).max(10),
});

export const ResidentSchema = z.object({
  id: z.string(),
  name: z.string(),
  stats: ResidentStatsSchema,
  tags: z.array(z.string()),
  fatigue: z.number().min(0).max(100),
});

export const SlotSchema = z.object({
  id: z.string(),
  location: z.string(),
  requiredTags: z.array(z.string()),
  minStats: z.record(z.string(), z.number()).optional(),
  maxFatigue: z.number().min(0).max(100),
  crewLimit: z.number().min(1).max(10),
  currentCrew: z.number().min(0),
});

export const ScenarioSchema = z.object({
  id: z.string(),
  description: z.string(),
  resident: ResidentSchema,
  slot: SlotSchema,
  expectedVerdict: z.enum(['valid', 'invalid']),
  expectedReasons: z.array(z.string()),
});

export const DatasetSchema = z.object({
  version: z.string(),
  generated: z.string(),
  scenarios: z.array(ScenarioSchema),
});

export type ResidentStats = z.infer<typeof ResidentStatsSchema>;
export type Resident = z.infer<typeof ResidentSchema>;
export type Slot = z.infer<typeof SlotSchema>;
export type Scenario = z.infer<typeof ScenarioSchema>;
export type Dataset = z.infer<typeof DatasetSchema>;

export interface ValidationResult {
  scenarioId: string;
  description: string;
  actualVerdict: 'valid' | 'invalid';
  actualReasons: string[];
  expectedVerdict: 'valid' | 'invalid';
  expectedReasons: string[];
  passed: boolean;
  diff?: {
    verdictMismatch: boolean;
    missingReasons: string[];
    extraReasons: string[];
  };
}

export interface AuditReport {
  timestamp: string;
  datasetVersion: string;
  totalScenarios: number;
  passedScenarios: number;
  failedScenarios: number;
  passRate: number;
  results: ValidationResult[];
  summary: {
    verdictMismatches: number;
    reasonMismatches: number;
  };
}

export class DropValidationAuditService {
  private dataset: Dataset | null = null;

  public loadDataset(data: unknown): void {
    this.dataset = DatasetSchema.parse(data);
  }

  public validateDrop(resident: Resident, slot: Slot): { verdict: 'valid' | 'invalid'; reasons: string[] } {
    const reasons: string[] = [];

    const hasRequiredTags = slot.requiredTags.every(tag => resident.tags.includes(tag));
    if (!hasRequiredTags) {
      reasons.push('missing_required_tag');
    }

    if (slot.minStats) {
      for (const [stat, minValue] of Object.entries(slot.minStats)) {
        const residentStatValue = resident.stats[stat as keyof ResidentStats];
        if (residentStatValue !== undefined && residentStatValue < minValue) {
          reasons.push(`insufficient_${stat}`);
        }
      }
    }

    if (resident.fatigue > slot.maxFatigue) {
      reasons.push('fatigue_too_high');
    }

    if (slot.currentCrew >= slot.crewLimit) {
      reasons.push('crew_limit_reached');
    }

    const verdict = reasons.length === 0 ? 'valid' : 'invalid';
    return { verdict, reasons };
  }

  public runAudit(): AuditReport {
    if (!this.dataset) {
      throw new Error('Dataset not loaded. Call loadDataset() first.');
    }

    const results: ValidationResult[] = [];
    let passedCount = 0;
    let verdictMismatches = 0;
    let reasonMismatches = 0;

    for (const scenario of this.dataset.scenarios) {
      const { verdict: actualVerdict, reasons: actualReasons } = this.validateDrop(
        scenario.resident,
        scenario.slot
      );

      const verdictMatch = actualVerdict === scenario.expectedVerdict;
      const reasonsMatch = this.compareReasons(actualReasons, scenario.expectedReasons);
      const passed = verdictMatch && reasonsMatch;

      if (passed) {
        passedCount++;
      }

      if (!verdictMatch) {
        verdictMismatches++;
      }

      if (!reasonsMatch) {
        reasonMismatches++;
      }

      const result: ValidationResult = {
        scenarioId: scenario.id,
        description: scenario.description,
        actualVerdict,
        actualReasons,
        expectedVerdict: scenario.expectedVerdict,
        expectedReasons: scenario.expectedReasons,
        passed,
      };

      if (!passed) {
        result.diff = {
          verdictMismatch: !verdictMatch,
          missingReasons: scenario.expectedReasons.filter(r => !actualReasons.includes(r)),
          extraReasons: actualReasons.filter(r => !scenario.expectedReasons.includes(r)),
        };
      }

      results.push(result);
    }

    const totalScenarios = this.dataset.scenarios.length;
    const passRate = totalScenarios > 0 ? (passedCount / totalScenarios) * 100 : 0;

    return {
      timestamp: new Date().toISOString(),
      datasetVersion: this.dataset.version,
      totalScenarios,
      passedScenarios: passedCount,
      failedScenarios: totalScenarios - passedCount,
      passRate,
      results,
      summary: {
        verdictMismatches,
        reasonMismatches,
      },
    };
  }

  private compareReasons(actual: string[], expected: string[]): boolean {
    if (actual.length !== expected.length) {
      return false;
    }

    const sortedActual = [...actual].sort();
    const sortedExpected = [...expected].sort();

    return sortedActual.every((reason, index) => reason === sortedExpected[index]);
  }

  public generateMarkdownReport(report: AuditReport): string {
    const lines: string[] = [];

    lines.push('# Drop Validation Audit Report');
    lines.push('');
    lines.push(`**Generated:** ${report.timestamp}`);
    lines.push(`**Dataset Version:** ${report.datasetVersion}`);
    lines.push('');
    lines.push('## Summary');
    lines.push('');
    lines.push(`- **Total Scenarios:** ${report.totalScenarios}`);
    lines.push(`- **Passed:** ${report.passedScenarios}`);
    lines.push(`- **Failed:** ${report.failedScenarios}`);
    lines.push(`- **Pass Rate:** ${report.passRate.toFixed(2)}%`);
    lines.push('');
    lines.push('### Issue Breakdown');
    lines.push('');
    lines.push(`- **Verdict Mismatches:** ${report.summary.verdictMismatches}`);
    lines.push(`- **Reason Mismatches:** ${report.summary.reasonMismatches}`);
    lines.push('');

    const failedResults = report.results.filter(r => !r.passed);
    if (failedResults.length > 0) {
      lines.push('## Failed Scenarios');
      lines.push('');

      for (const result of failedResults) {
        lines.push(`### ${result.scenarioId}: ${result.description}`);
        lines.push('');
        lines.push('**Expected:**');
        lines.push(`- Verdict: ${result.expectedVerdict}`);
        lines.push(`- Reasons: ${result.expectedReasons.length > 0 ? result.expectedReasons.join(', ') : 'none'}`);
        lines.push('');
        lines.push('**Actual:**');
        lines.push(`- Verdict: ${result.actualVerdict}`);
        lines.push(`- Reasons: ${result.actualReasons.length > 0 ? result.actualReasons.join(', ') : 'none'}`);
        lines.push('');

        if (result.diff) {
          lines.push('**Diff:**');
          if (result.diff.verdictMismatch) {
            lines.push(`- ❌ Verdict mismatch: expected ${result.expectedVerdict}, got ${result.actualVerdict}`);
          }
          if (result.diff.missingReasons.length > 0) {
            lines.push(`- ❌ Missing reasons: ${result.diff.missingReasons.join(', ')}`);
          }
          if (result.diff.extraReasons.length > 0) {
            lines.push(`- ❌ Extra reasons: ${result.diff.extraReasons.join(', ')}`);
          }
          lines.push('');
        }
      }
    } else {
      lines.push('## All Scenarios Passed ✅');
      lines.push('');
    }

    lines.push('## Detailed Results');
    lines.push('');
    lines.push('| Scenario ID | Description | Expected | Actual | Status |');
    lines.push('|-------------|-------------|----------|--------|--------|');

    for (const result of report.results) {
      const status = result.passed ? '✅ Pass' : '❌ Fail';
      lines.push(`| ${result.scenarioId} | ${result.description} | ${result.expectedVerdict} | ${result.actualVerdict} | ${status} |`);
    }

    lines.push('');
    return lines.join('\n');
  }
}

export function createAuditService(): DropValidationAuditService {
  return new DropValidationAuditService();
}
