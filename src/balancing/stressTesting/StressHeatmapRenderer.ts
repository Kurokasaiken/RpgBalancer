/**
 * Stress Heatmap Renderer - NP-123
 * 
 * Renders marginal utility heatmaps in ASCII and PNG formats.
 * Config-first design with customizable palettes and thresholds.
 * 
 * @since 2026-01-24
 */

import type { MarginalUtilityAnalysis, SynergyAnalysis } from './MarginalUtilityTypes';
import type { HeatmapConfig } from '../config/stressTesting/heatmapConfig';
import {
  DEFAULT_HEATMAP_CONFIG,
  getANSIColorForMultiplier,
  getClassificationLabel,
  formatMultiplier,
  ANSI_COLORS,
  BOX_CHARS,
} from '../config/stressTesting/heatmapConfig';

/**
 * Heatmap cell data
 */
export interface HeatmapCell {
  rowStat: string;
  colStat: string;
  multiplier: number;
  classification: 'OP' | 'Strong' | 'Neutral' | 'Weak';
  color: string;
}

/**
 * Heatmap matrix structure
 */
export interface HeatmapMatrix {
  stats: string[];
  cells: HeatmapCell[][];
  config: HeatmapConfig;
  timestamp: number;
}

/**
 * Render output
 */
export interface RenderOutput {
  content: string;
  format: 'ascii' | 'png';
  width: number;
  height: number;
  metadata: {
    cellCount: number;
    opCount: number;
    weakCount: number;
    strongCount: number;
    neutralCount: number;
  };
}

/**
 * Stress Heatmap Renderer
 */
export class StressHeatmapRenderer {
  private config: HeatmapConfig;

  constructor(config: Partial<HeatmapConfig> = {}) {
    this.config = { ...DEFAULT_HEATMAP_CONFIG, ...config };
  }

  /**
   * Build heatmap matrix from analysis results
   */
  public buildMatrix(analysis: MarginalUtilityAnalysis): HeatmapMatrix {
    // Extract unique stat IDs
    const statIds = new Set<string>();
    analysis.synergyAnalyses.forEach(synergy => {
      statIds.add(synergy.statIds[0]);
      statIds.add(synergy.statIds[1]);
    });

    const stats = Array.from(statIds).sort((a, b) => {
      if (this.config.sortBy === 'alphabetical') {
        return a.localeCompare(b);
      }
      // For other sort modes, would need additional logic
      return a.localeCompare(b);
    });

    // Build matrix
    const cells: HeatmapCell[][] = [];
    
    for (let i = 0; i < stats.length; i++) {
      const row: HeatmapCell[] = [];
      
      for (let j = 0; j < stats.length; j++) {
        const rowStat = stats[i];
        const colStat = stats[j];
        
        // Find synergy analysis for this pair
        const synergy = this.findSynergy(analysis, rowStat, colStat);
        
        if (synergy) {
          row.push({
            rowStat,
            colStat,
            multiplier: synergy.synergyMultiplier,
            classification: getClassificationLabel(synergy.synergyMultiplier, this.config),
            color: getANSIColorForMultiplier(synergy.synergyMultiplier, this.config),
          });
        } else {
          // Diagonal or missing data
          row.push({
            rowStat,
            colStat,
            multiplier: 1.0,
            classification: 'Neutral',
            color: ANSI_COLORS.dim,
          });
        }
      }
      
      cells.push(row);
    }

    return {
      stats,
      cells,
      config: this.config,
      timestamp: Date.now(),
    };
  }

  /**
   * Render heatmap as ASCII
   */
  public renderASCII(matrix: HeatmapMatrix): RenderOutput {
    const { ascii } = this.config;
    const lines: string[] = [];

    // Title
    if (this.config.title) {
      lines.push(this.renderTitle());
      lines.push('');
    }

    // Legend
    if (ascii.showLegend) {
      lines.push(this.renderLegend());
      lines.push('');
    }

    // Header row with stat labels
    if (ascii.showLabels) {
      lines.push(this.renderHeaderRow(matrix.stats));
    }

    // Data rows
    for (let i = 0; i < matrix.cells.length; i++) {
      lines.push(this.renderDataRow(matrix.stats[i], matrix.cells[i], ascii.showLabels));
      
      if (ascii.showGrid && i < matrix.cells.length - 1) {
        lines.push(this.renderGridLine(matrix.stats.length));
      }
    }

    // Footer
    if (this.config.showTimestamp) {
      lines.push('');
      lines.push(this.renderFooter(matrix));
    }

    const content = lines.join('\n');
    const metadata = this.calculateMetadata(matrix);

    return {
      content,
      format: 'ascii',
      width: this.calculateASCIIWidth(matrix.stats.length),
      height: lines.length,
      metadata,
    };
  }

  /**
   * Render title section
   */
  private renderTitle(): string {
    const { title, subtitle } = this.config;
    const lines: string[] = [];
    
    const width = 80;
    const titleLine = `${ANSI_COLORS.bold}${ANSI_COLORS.brightCyan}${title}${ANSI_COLORS.reset}`;
    lines.push(this.centerText(titleLine, width));
    
    if (subtitle) {
      const subtitleLine = `${ANSI_COLORS.dim}${subtitle}${ANSI_COLORS.reset}`;
      lines.push(this.centerText(subtitleLine, width));
    }
    
    return lines.join('\n');
  }

  /**
   * Render legend
   */
  private renderLegend(): string {
    const { thresholds } = this.config;
    const lines: string[] = [];
    
    lines.push(`${ANSI_COLORS.bold}Legend:${ANSI_COLORS.reset}`);
    lines.push(`  ${ANSI_COLORS.brightRed}■${ANSI_COLORS.reset} Weak    (<${thresholds.weakThreshold.toFixed(2)})`);
    lines.push(`  ${ANSI_COLORS.white}■${ANSI_COLORS.reset} Neutral (${thresholds.neutralLower.toFixed(2)}-${thresholds.neutralUpper.toFixed(2)})`);
    lines.push(`  ${ANSI_COLORS.brightGreen}■${ANSI_COLORS.reset} Strong  (${thresholds.strongThreshold.toFixed(2)}-${thresholds.opThreshold.toFixed(2)})`);
    lines.push(`  ${ANSI_COLORS.brightYellow}■${ANSI_COLORS.reset} OP      (>${thresholds.opThreshold.toFixed(2)})`);
    
    return lines.join('\n');
  }

  /**
   * Render header row with stat labels
   */
  private renderHeaderRow(stats: string[]): string {
    const { ascii } = this.config;
    const parts: string[] = [];
    
    // Row label space
    parts.push(' '.repeat(12));
    
    // Column labels
    for (const stat of stats) {
      const label = this.truncateLabel(stat, ascii.cellWidth);
      parts.push(this.padCenter(label, ascii.cellWidth));
    }
    
    return parts.join(' ');
  }

  /**
   * Render data row
   */
  private renderDataRow(rowStat: string, cells: HeatmapCell[], showLabel: boolean): string {
    const { ascii } = this.config;
    const parts: string[] = [];
    
    // Row label
    if (showLabel) {
      const label = this.truncateLabel(rowStat, 10);
      parts.push(this.padRight(label, 12));
    }
    
    // Cell values
    for (const cell of cells) {
      const value = formatMultiplier(cell.multiplier, 2);
      const coloredValue = this.colorizeValue(value, cell);
      parts.push(this.padCenter(coloredValue, ascii.cellWidth));
    }
    
    return parts.join(' ');
  }

  /**
   * Render grid line
   */
  private renderGridLine(statCount: number): string {
    const { ascii } = this.config;
    const parts: string[] = [];
    
    parts.push(' '.repeat(12));
    
    for (let i = 0; i < statCount; i++) {
      parts.push(BOX_CHARS.horizontal.repeat(ascii.cellWidth));
    }
    
    return `${ANSI_COLORS.dim}${parts.join(' ')}${ANSI_COLORS.reset}`;
  }

  /**
   * Render footer with timestamp and stats
   */
  private renderFooter(matrix: HeatmapMatrix): string {
    const date = new Date(matrix.timestamp).toISOString();
    const metadata = this.calculateMetadata(matrix);
    
    const lines: string[] = [];
    lines.push(`${ANSI_COLORS.dim}Generated: ${date}${ANSI_COLORS.reset}`);
    lines.push(`${ANSI_COLORS.dim}Cells: ${metadata.cellCount} | OP: ${metadata.opCount} | Strong: ${metadata.strongCount} | Weak: ${metadata.weakCount}${ANSI_COLORS.reset}`);
    
    return lines.join('\n');
  }

  /**
   * Colorize value based on classification
   */
  private colorizeValue(value: string, cell: HeatmapCell): string {
    const { ascii } = this.config;
    
    if (ascii.colorMode === 'plain') {
      return value;
    }
    
    if (ascii.colorMode === 'ansi') {
      return `${cell.color}${value}${ANSI_COLORS.reset}`;
    }
    
    // Unicode mode with symbols
    const symbol = this.getSymbolForClassification(cell.classification);
    return `${cell.color}${symbol}${value}${ANSI_COLORS.reset}`;
  }

  /**
   * Get symbol for classification
   */
  private getSymbolForClassification(classification: string): string {
    switch (classification) {
      case 'OP': return '⚡';
      case 'Strong': return '✓';
      case 'Weak': return '✗';
      default: return '·';
    }
  }

  /**
   * Find synergy analysis for stat pair
   */
  private findSynergy(
    analysis: MarginalUtilityAnalysis,
    stat1: string,
    stat2: string
  ): SynergyAnalysis | null {
    return analysis.synergyAnalyses.find(s =>
      (s.statIds[0] === stat1 && s.statIds[1] === stat2) ||
      (s.statIds[0] === stat2 && s.statIds[1] === stat1)
    ) || null;
  }

  /**
   * Calculate metadata from matrix
   */
  private calculateMetadata(matrix: HeatmapMatrix): RenderOutput['metadata'] {
    let opCount = 0;
    let weakCount = 0;
    let strongCount = 0;
    let neutralCount = 0;
    let cellCount = 0;

    matrix.cells.forEach(row => {
      row.forEach(cell => {
        cellCount++;
        switch (cell.classification) {
          case 'OP': opCount++; break;
          case 'Strong': strongCount++; break;
          case 'Weak': weakCount++; break;
          case 'Neutral': neutralCount++; break;
        }
      });
    });

    return { cellCount, opCount, weakCount, strongCount, neutralCount };
  }

  /**
   * Utility: Truncate label to max length
   */
  private truncateLabel(label: string, maxLength: number): string {
    if (label.length <= maxLength) return label;
    return label.substring(0, maxLength - 1) + '…';
  }

  /**
   * Utility: Pad string to center
   */
  private padCenter(str: string, width: number): string {
    // Remove ANSI codes for length calculation
    const cleanStr = str.replace(/\x1b\[[0-9;]*m/g, '');
    const padding = Math.max(0, width - cleanStr.length);
    const leftPad = Math.floor(padding / 2);
    const rightPad = padding - leftPad;
    return ' '.repeat(leftPad) + str + ' '.repeat(rightPad);
  }

  /**
   * Utility: Pad string to right
   */
  private padRight(str: string, width: number): string {
    const cleanStr = str.replace(/\x1b\[[0-9;]*m/g, '');
    const padding = Math.max(0, width - cleanStr.length);
    return str + ' '.repeat(padding);
  }

  /**
   * Utility: Center text in line
   */
  private centerText(text: string, width: number): string {
    const cleanText = text.replace(/\x1b\[[0-9;]*m/g, '');
    const padding = Math.max(0, width - cleanText.length);
    const leftPad = Math.floor(padding / 2);
    return ' '.repeat(leftPad) + text;
  }

  /**
   * Utility: Calculate ASCII width
   */
  private calculateASCIIWidth(statCount: number): number {
    const { ascii } = this.config;
    return 12 + (statCount * (ascii.cellWidth + 1));
  }

  /**
   * Export matrix as JSON
   */
  public exportJSON(matrix: HeatmapMatrix): string {
    return JSON.stringify(matrix, null, 2);
  }

  /**
   * Export matrix as CSV
   */
  public exportCSV(matrix: HeatmapMatrix): string {
    const lines: string[] = [];
    
    // Header row
    const header = ['Stat', ...matrix.stats];
    lines.push(header.join(','));
    
    // Data rows
    for (let i = 0; i < matrix.cells.length; i++) {
      const row = [matrix.stats[i]];
      for (const cell of matrix.cells[i]) {
        row.push(formatMultiplier(cell.multiplier, 3));
      }
      lines.push(row.join(','));
    }
    
    return lines.join('\n');
  }

  /**
   * Get configuration
   */
  public getConfig(): HeatmapConfig {
    return this.config;
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<HeatmapConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Factory: Create renderer with preset configuration
 */
export function createHeatmapRenderer(
  preset: 'default' | 'compact' | 'detailed' = 'default'
): StressHeatmapRenderer {
  const configs = {
    default: DEFAULT_HEATMAP_CONFIG,
    compact: {
      ...DEFAULT_HEATMAP_CONFIG,
      ascii: {
        ...DEFAULT_HEATMAP_CONFIG.ascii,
        cellWidth: 6,
        cellHeight: 1,
        compactMode: true,
        showGrid: false,
      },
    },
    detailed: {
      ...DEFAULT_HEATMAP_CONFIG,
      ascii: {
        ...DEFAULT_HEATMAP_CONFIG.ascii,
        cellWidth: 10,
        cellHeight: 3,
        showGrid: true,
        colorMode: 'unicode' as const,
      },
    },
  };

  return new StressHeatmapRenderer(configs[preset]);
}
