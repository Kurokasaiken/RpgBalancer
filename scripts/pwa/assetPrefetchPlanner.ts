#!/usr/bin/env tsx
/**
 * Punch Club Mobile Asset Prefetch Planner – NP-265
 * 
 * Calculates asset prefetch priorities based on telemetry data
 * and generates optimized prefetch configuration.
 * 
 * @since NP-265
 */

import { z } from 'zod';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Asset usage telemetry schema
 */
export const AssetUsageSchema = z.object({
  path: z.string(),
  type: z.enum(['image', 'audio', 'video', 'font', 'script', 'style']),
  loadCount: z.number().int().nonnegative(),
  avgLoadTime: z.number().nonnegative(),
  size: z.number().int().nonnegative(),
  firstLoadTime: z.number().nonnegative(),
  lastLoadTime: z.number().nonnegative(),
});

export type AssetUsage = z.infer<typeof AssetUsageSchema>;

/**
 * Priority tier schema
 */
export const PriorityTierSchema = z.enum(['critical', 'high', 'medium', 'low']);
export type PriorityTier = z.infer<typeof PriorityTierSchema>;

/**
 * Asset with priority
 */
export interface AssetWithPriority extends AssetUsage {
  priority: PriorityTier;
  score: number;
}

/**
 * Prefetch configuration
 */
export interface PrefetchConfig {
  version: string;
  generated: string;
  assets: {
    critical: string[];
    high: string[];
    medium: string[];
    low: string[];
  };
  metadata: {
    totalAssets: number;
    totalSize: number;
    avgLoadTime: number;
    thresholds: {
      critical: number;
      high: number;
      medium: number;
    };
  };
}

/**
 * Planner configuration
 */
export interface PlannerConfig {
  telemetryPath: string;
  outputPath: string;
  weights: {
    loadCount: number;
    loadTime: number;
    size: number;
    recency: number;
  };
  thresholds: {
    critical: number;
    high: number;
    medium: number;
  };
  maxAssetsPerTier: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: PlannerConfig = {
  telemetryPath: 'data/telemetry/asset-usage.json',
  outputPath: 'public/prefetch-config.json',
  weights: {
    loadCount: 0.4,
    loadTime: 0.2,
    size: 0.2,
    recency: 0.2,
  },
  thresholds: {
    critical: 0.8,
    high: 0.6,
    medium: 0.4,
  },
  maxAssetsPerTier: {
    critical: 10,
    high: 20,
    medium: 30,
    low: 50,
  },
};

/**
 * Asset Prefetch Planner
 */
export class AssetPrefetchPlanner {
  private config: PlannerConfig;
  private assets: AssetUsage[] = [];

  constructor(config: Partial<PlannerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Load telemetry data
   */
  loadTelemetry(): void {
    if (!existsSync(this.config.telemetryPath)) {
      console.warn(`⚠️  Telemetry file not found: ${this.config.telemetryPath}`);
      console.log('   Generating sample data...');
      this.generateSampleData();
      return;
    }

    const data = JSON.parse(readFileSync(this.config.telemetryPath, 'utf-8'));
    this.assets = data.assets || [];
    console.log(`✓ Loaded ${this.assets.length} assets from telemetry`);
  }

  /**
   * Generate sample telemetry data
   */
  private generateSampleData(): void {
    this.assets = [
      { path: '/assets/logo.png', type: 'image', loadCount: 1000, avgLoadTime: 50, size: 25000, firstLoadTime: 0, lastLoadTime: Date.now() },
      { path: '/assets/hero-bg.jpg', type: 'image', loadCount: 950, avgLoadTime: 120, size: 150000, firstLoadTime: 0, lastLoadTime: Date.now() },
      { path: '/assets/icon-192.png', type: 'image', loadCount: 800, avgLoadTime: 30, size: 15000, firstLoadTime: 0, lastLoadTime: Date.now() },
      { path: '/assets/fonts/main.woff2', type: 'font', loadCount: 900, avgLoadTime: 40, size: 35000, firstLoadTime: 0, lastLoadTime: Date.now() },
      { path: '/assets/sounds/click.mp3', type: 'audio', loadCount: 500, avgLoadTime: 80, size: 45000, firstLoadTime: 0, lastLoadTime: Date.now() },
      { path: '/assets/tutorial-1.png', type: 'image', loadCount: 300, avgLoadTime: 90, size: 80000, firstLoadTime: 0, lastLoadTime: Date.now() - 86400000 },
      { path: '/assets/tutorial-2.png', type: 'image', loadCount: 250, avgLoadTime: 85, size: 75000, firstLoadTime: 0, lastLoadTime: Date.now() - 86400000 },
      { path: '/assets/badge-gold.png', type: 'image', loadCount: 150, avgLoadTime: 60, size: 20000, firstLoadTime: 0, lastLoadTime: Date.now() - 172800000 },
      { path: '/assets/background-music.mp3', type: 'audio', loadCount: 100, avgLoadTime: 200, size: 500000, firstLoadTime: 0, lastLoadTime: Date.now() - 259200000 },
      { path: '/assets/rare-item.png', type: 'image', loadCount: 50, avgLoadTime: 70, size: 30000, firstLoadTime: 0, lastLoadTime: Date.now() - 604800000 },
    ];
    console.log(`✓ Generated ${this.assets.length} sample assets`);
  }

  /**
   * Calculate priority score for an asset
   */
  private calculateScore(asset: AssetUsage): number {
    const maxLoadCount = Math.max(...this.assets.map(a => a.loadCount));
    const maxLoadTime = Math.max(...this.assets.map(a => a.avgLoadTime));
    const maxSize = Math.max(...this.assets.map(a => a.size));
    const now = Date.now();
    const maxAge = now - Math.min(...this.assets.map(a => a.lastLoadTime));

    // Normalize metrics (0-1)
    const loadCountScore = asset.loadCount / maxLoadCount;
    const loadTimeScore = 1 - (asset.avgLoadTime / maxLoadTime); // Lower is better
    const sizeScore = 1 - (asset.size / maxSize); // Smaller is better
    const recencyScore = 1 - ((now - asset.lastLoadTime) / maxAge); // More recent is better

    // Weighted score
    const score = 
      loadCountScore * this.config.weights.loadCount +
      loadTimeScore * this.config.weights.loadTime +
      sizeScore * this.config.weights.size +
      recencyScore * this.config.weights.recency;

    return score;
  }

  /**
   * Assign priority tier based on score
   */
  private assignPriority(score: number): PriorityTier {
    if (score >= this.config.thresholds.critical) return 'critical';
    if (score >= this.config.thresholds.high) return 'high';
    if (score >= this.config.thresholds.medium) return 'medium';
    return 'low';
  }

  /**
   * Calculate priorities for all assets
   */
  calculatePriorities(): AssetWithPriority[] {
    const assetsWithPriority: AssetWithPriority[] = this.assets.map(asset => {
      const score = this.calculateScore(asset);
      const priority = this.assignPriority(score);
      return { ...asset, score, priority };
    });

    // Sort by score descending
    assetsWithPriority.sort((a, b) => b.score - a.score);

    // Enforce tier limits
    const limited: AssetWithPriority[] = [];
    const tierCounts = { critical: 0, high: 0, medium: 0, low: 0 };

    for (const asset of assetsWithPriority) {
      if (tierCounts[asset.priority] < this.config.maxAssetsPerTier[asset.priority]) {
        limited.push(asset);
        tierCounts[asset.priority]++;
      } else {
        // Downgrade to next tier if current tier is full
        let downgraded = false;
        const tiers: PriorityTier[] = ['critical', 'high', 'medium', 'low'];
        const currentIndex = tiers.indexOf(asset.priority);
        
        for (let i = currentIndex + 1; i < tiers.length; i++) {
          const nextTier = tiers[i];
          if (tierCounts[nextTier] < this.config.maxAssetsPerTier[nextTier]) {
            limited.push({ ...asset, priority: nextTier });
            tierCounts[nextTier]++;
            downgraded = true;
            break;
          }
        }
        
        if (!downgraded) {
          // Skip asset if all tiers are full
          continue;
        }
      }
    }

    return limited;
  }

  /**
   * Generate prefetch configuration
   */
  generateConfig(): PrefetchConfig {
    const assetsWithPriority = this.calculatePriorities();

    const config: PrefetchConfig = {
      version: '1.0.0',
      generated: new Date().toISOString(),
      assets: {
        critical: assetsWithPriority.filter(a => a.priority === 'critical').map(a => a.path),
        high: assetsWithPriority.filter(a => a.priority === 'high').map(a => a.path),
        medium: assetsWithPriority.filter(a => a.priority === 'medium').map(a => a.path),
        low: assetsWithPriority.filter(a => a.priority === 'low').map(a => a.path),
      },
      metadata: {
        totalAssets: assetsWithPriority.length,
        totalSize: assetsWithPriority.reduce((sum, a) => sum + a.size, 0),
        avgLoadTime: assetsWithPriority.reduce((sum, a) => sum + a.avgLoadTime, 0) / assetsWithPriority.length,
        thresholds: this.config.thresholds,
      },
    };

    return config;
  }

  /**
   * Save configuration to file
   */
  saveConfig(config: PrefetchConfig): void {
    const dir = join(this.config.outputPath, '..');
    mkdirSync(dir, { recursive: true });
    
    writeFileSync(this.config.outputPath, JSON.stringify(config, null, 2));
    console.log(`\n✓ Saved prefetch config: ${this.config.outputPath}`);
  }

  /**
   * Generate dashboard report
   */
  generateDashboard(assetsWithPriority: AssetWithPriority[]): string {
    const lines: string[] = [];

    lines.push('# Asset Prefetch Priority Dashboard');
    lines.push('');
    lines.push(`**Generated**: ${new Date().toISOString()}`);
    lines.push(`**Total Assets**: ${assetsWithPriority.length}`);
    lines.push('');

    // Summary by tier
    lines.push('## Priority Distribution');
    lines.push('');
    const tierCounts = {
      critical: assetsWithPriority.filter(a => a.priority === 'critical').length,
      high: assetsWithPriority.filter(a => a.priority === 'high').length,
      medium: assetsWithPriority.filter(a => a.priority === 'medium').length,
      low: assetsWithPriority.filter(a => a.priority === 'low').length,
    };
    lines.push(`- **Critical**: ${tierCounts.critical}`);
    lines.push(`- **High**: ${tierCounts.high}`);
    lines.push(`- **Medium**: ${tierCounts.medium}`);
    lines.push(`- **Low**: ${tierCounts.low}`);
    lines.push('');

    // Top assets by tier
    ['critical', 'high', 'medium', 'low'].forEach(tier => {
      const tierAssets = assetsWithPriority.filter(a => a.priority === tier);
      if (tierAssets.length === 0) return;

      lines.push(`## ${tier.toUpperCase()} Priority Assets`);
      lines.push('');
      lines.push('| Asset | Score | Load Count | Avg Load Time | Size |');
      lines.push('|-------|-------|------------|---------------|------|');
      
      tierAssets.slice(0, 10).forEach(asset => {
        lines.push(`| ${asset.path} | ${asset.score.toFixed(3)} | ${asset.loadCount} | ${asset.avgLoadTime}ms | ${(asset.size / 1024).toFixed(1)}KB |`);
      });
      lines.push('');
    });

    return lines.join('\n');
  }

  /**
   * Run planner
   */
  run(): void {
    console.log('\n📊 Asset Prefetch Planner\n');

    this.loadTelemetry();
    
    console.log('\n🔍 Calculating priorities...');
    const assetsWithPriority = this.calculatePriorities();
    
    console.log('\n📋 Priority Summary:');
    console.log(`   Critical: ${assetsWithPriority.filter(a => a.priority === 'critical').length}`);
    console.log(`   High: ${assetsWithPriority.filter(a => a.priority === 'high').length}`);
    console.log(`   Medium: ${assetsWithPriority.filter(a => a.priority === 'medium').length}`);
    console.log(`   Low: ${assetsWithPriority.filter(a => a.priority === 'low').length}`);

    const config = this.generateConfig();
    this.saveConfig(config);

    const dashboard = this.generateDashboard(assetsWithPriority);
    const dashboardPath = this.config.outputPath.replace('.json', '-dashboard.md');
    writeFileSync(dashboardPath, dashboard);
    console.log(`✓ Saved dashboard: ${dashboardPath}\n`);
  }
}

// CLI execution
if (require.main === module) {
  new AssetPrefetchPlanner().run();
}
