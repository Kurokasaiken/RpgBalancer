import type { TTKResult, TTKValidation } from './types';

/**
 * Generates reports from TTK validation and simulation results.
 */
export class TTKReportGenerator {

    /**
     * Generates a Markdown report from TTK validations.
     */
    public static generateMarkdownReport(validations: TTKValidation[]): string {
        const total = validations.length;
        const valid = validations.filter(v => v.isValid).length;
        const invalid = total - valid;
        const validPercent = ((valid / total) * 100).toFixed(1);

        const date = new Date().toISOString().split('T')[0];

        let report = `# TTK Balance Report\nGenerated: ${date}\n\n`;

        // Summary
        report += `## Summary\n`;
        report += `- Total Matchups: ${total}\n`;
        report += `- Valid: ${valid} (${validPercent}%)\n`;
        report += `- Invalid: ${invalid} (${(100 - parseFloat(validPercent)).toFixed(1)}%)\n\n`;

        // Critical Issues
        report += `## Critical Issues\n`;
        const criticals = validations.filter(v => !v.isValid);
        if (criticals.length === 0) {
            report += `No critical issues found! 🎉\n`;
        } else {
            criticals.forEach(v => {
                const { matchup, budget } = v.result;
                const errors = v.errors.join(', ');
                report += `- **${matchup.archetypeA} vs ${matchup.archetypeB} @ ${budget} HP**: ${errors}\n`;
                report += `  - TTK: ${v.result.roundsToKill.avg.toFixed(1)} (Target: ${v.target.targetRounds})\n`;
            });
        }
        report += `\n`;

        // Warnings
        const warnings = validations.filter(v => v.isValid && v.warnings.length > 0);
        if (warnings.length > 0) {
            report += `## Warnings\n`;
            warnings.forEach(v => {
                const { matchup, budget } = v.result;
                const warn = v.warnings.join(', ');
                report += `- ${matchup.archetypeA} vs ${matchup.archetypeB} @ ${budget}: ${warn}\n`;
            });
            report += `\n`;
        }

        return report;
    }

    public static generateCSV(results: TTKResult[]): string {
        const header = [
            'archetypeA',
            'archetypeB',
            'budget',
            'avgRounds',
            'minRounds',
            'maxRounds',
            'stdDev',
            'winRateA',
            'winRateB',
            'totalSims'
        ].join(',');

        const rows = results.map(r => [
            r.matchup.archetypeA,
            r.matchup.archetypeB,
            r.budget,
            r.roundsToKill.avg.toFixed(2),
            r.roundsToKill.min,
            r.roundsToKill.max,
            r.roundsToKill.stdDev.toFixed(2),
            r.winRate.A.toFixed(2),
            r.winRate.B.toFixed(2),
            r.totalSimulations
        ].join(','));

        return [header, ...rows].join('\n');
    }
}
