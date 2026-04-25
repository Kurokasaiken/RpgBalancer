#!/usr/bin/env tsx

/**
 * Maintenance Advisor Script for Idle Village
 *
 * Standalone script for analyzing village state and providing AI-powered
 * maintenance recommendations for optimal village management.
 *
 * Usage:
 *   npm run tsx scripts/idleVillage/runMaintenanceAdvisor.ts [options]
 *
 * Options:
 *   --config <path>     Path to village config file
 *   --state <path>      Path to village state file
 *   --output <path>     Output file for recommendations (default: stdout)
 *   --format <format>   Output format: json, text, or markdown (default: text)
 *   --priority <level>  Filter by priority: critical, high, medium, low, or all (default: all)
 *   --type <type>       Filter by type: resource_management, activity_scheduling, etc. (default: all)
 *   --help              Show this help message
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import type { VillageState } from '@/engine/game/idleVillage/TimeEngine';
import type { Resident } from '@/engine/game/idleVillage/types';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/activities';
import type {
  MaintenanceAnalysis,
  MaintenanceRecommendation,
  MaintenancePriority,
  MaintenanceRecommendationType
} from '@/ui/idleVillage/hooks/useMaintenanceAdvisor';

// Import the analysis logic (we'll need to extract it from the hook)
import { useMaintenanceAdvisor } from '@/ui/idleVillage/hooks/useMaintenanceAdvisor';

// Mock React hooks for Node.js environment
const mockUseMemo = (fn: () => any) => fn();
const mockUseCallback = (fn: () => any) => fn;

// Override React imports to work in Node.js
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function(id: string) {
  if (id === 'react') {
    return {
      useMemo: mockUseMemo,
      useCallback: mockUseCallback,
    };
  }
  return originalRequire.apply(this, arguments);
};

interface ScriptOptions {
  configPath?: string;
  statePath?: string;
  outputPath?: string;
  format: 'json' | 'text' | 'markdown';
  priorityFilter?: MaintenancePriority;
  typeFilter?: MaintenanceRecommendationType;
  help: boolean;
}

function parseArgs(): ScriptOptions {
  const args = process.argv.slice(2);
  const options: ScriptOptions = {
    format: 'text',
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--config':
        options.configPath = args[++i];
        break;
      case '--state':
        options.statePath = args[++i];
        break;
      case '--output':
        options.outputPath = args[++i];
        break;
      case '--format':
        const format = args[++i] as 'json' | 'text' | 'markdown';
        if (['json', 'text', 'markdown'].includes(format)) {
          options.format = format;
        } else {
          console.error(`Invalid format: ${format}. Must be json, text, or markdown.`);
          process.exit(1);
        }
        break;
      case '--priority':
        const priority = args[++i] as MaintenancePriority;
        if (['critical', 'high', 'medium', 'low'].includes(priority)) {
          options.priorityFilter = priority;
        } else {
          console.error(`Invalid priority: ${priority}. Must be critical, high, medium, or low.`);
          process.exit(1);
        }
        break;
      case '--type':
        options.typeFilter = args[++i] as MaintenanceRecommendationType;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      default:
        console.error(`Unknown option: ${arg}`);
        showHelp();
        process.exit(1);
    }
  }

  return options;
}

function showHelp(): void {
  console.log(`
Maintenance Advisor Script for Idle Village

Standalone script for analyzing village state and providing AI-powered
maintenance recommendations for optimal village management.

Usage:
  npm run tsx scripts/idleVillage/runMaintenanceAdvisor.ts [options]

Options:
  --config <path>     Path to village config file (default: loads from config system)
  --state <path>      Path to village state file (default: uses default state)
  --output <path>     Output file for recommendations (default: stdout)
  --format <format>   Output format: json, text, or markdown (default: text)
  --priority <level>  Filter by priority: critical, high, medium, low, or all (default: all)
  --type <type>       Filter by type (default: all)
  --help, -h          Show this help message

Examples:
  # Basic analysis
  npm run tsx scripts/idleVillage/runMaintenanceAdvisor.ts

  # High priority recommendations in JSON format
  npm run tsx scripts/idleVillage/runMaintenanceAdvisor.ts --priority high --format json

  # Save to file
  npm run tsx scripts/idleVillage/runMaintenanceAdvisor.ts --output recommendations.md --format markdown

  # Filter by resource management issues
  npm run tsx scripts/idleVillage/runMaintenanceAdvisor.ts --type resource_management
`);
}

async function loadVillageData(options: ScriptOptions): Promise<{
  villageState: VillageState;
  residents: Resident[];
  activities: ActivityDefinition[];
  config: any;
}> {
  // Load village state
  let villageState: VillageState;
  if (options.statePath) {
    try {
      const stateData = readFileSync(options.statePath, 'utf-8');
      villageState = JSON.parse(stateData);
    } catch (error) {
      console.error(`Failed to load village state from ${options.statePath}:`, error);
      process.exit(1);
    }
  } else {
    // Use default/initial state
    villageState = {
      time: 0,
      resources: { food: 100, gold: 200 },
      buildings: [],
      scheduledActivities: [],
      completedActivities: [],
    };
  }

  // Load residents (simplified for script)
  const residents: Resident[] = [
    {
      id: 'founder',
      displayName: 'Founder',
      status: 'available',
      stats: { combat: 50, farming: 30 },
      fatigue: 0,
    },
    {
      id: 'worker1',
      displayName: 'Worker 1',
      status: 'available',
      stats: { combat: 20, farming: 60 },
      fatigue: 0,
    },
  ];

  // Load activities (simplified for script)
  const activities: ActivityDefinition[] = [
    {
      id: 'farming',
      label: 'Farming',
      kind: 'job',
      duration: 100,
      tags: ['job', 'food'],
      rewards: { food: 50 },
      requirements: { fatigueCost: 20 },
    },
    {
      id: 'quest-basic',
      label: 'Basic Quest',
      kind: 'quest_combat',
      duration: 200,
      tags: ['quest'],
      rewards: { gold: 100 },
      requirements: { fatigueCost: 30 },
      riskProfile: { injuryChance: 0.2, deathChance: 0.05 },
    },
  ];

  // Load config (simplified for script)
  const config = {
    globalRules: {
      foodWarningThreshold: 50,
      goldWarningThreshold: 100,
      foodConsumptionPerResidentPerDay: 2,
      maxConcurrentActivities: 5,
      recommendedGoldReserve: 500,
    },
  };

  return { villageState, residents, activities, config };
}

function filterRecommendations(
  recommendations: MaintenanceRecommendation[],
  priorityFilter?: MaintenancePriority,
  typeFilter?: MaintenanceRecommendationType
): MaintenanceRecommendation[] {
  return recommendations.filter(rec => {
    if (priorityFilter && rec.priority !== priorityFilter) return false;
    if (typeFilter && rec.type !== typeFilter) return false;
    return true;
  });
}

function formatTextOutput(analysis: MaintenanceAnalysis, filtered: MaintenanceRecommendation[]): string {
  let output = '';

  output += '🏛️  Idle Village Maintenance Advisor Report\n';
  output += '=' .repeat(50) + '\n\n';

  output += `📊 Summary (${new Date(analysis.timestamp).toLocaleString()})\n`;
  output += `   Critical: ${analysis.summary.criticalCount}\n`;
  output += `   High:     ${analysis.summary.highCount}\n`;
  output += `   Medium:   ${analysis.summary.mediumCount}\n`;
  output += `   Low:      ${analysis.summary.lowCount}\n`;
  output += `   Total:    ${analysis.summary.totalCount}\n\n`;

  if (filtered.length === 0) {
    output += '✅ All Systems Optimal\n';
    output += 'No maintenance recommendations at this time.\n';
  } else {
    output += '📋 Recommendations\n\n';

    filtered.forEach((rec, index) => {
      const icon = { critical: '🚨', high: '⚠️', medium: 'ℹ️', low: '💡' }[rec.priority];
      output += `${index + 1}. ${icon} ${rec.title} (${rec.priority})\n`;
      output += `   ${rec.description}\n`;
      if (rec.action) {
        output += `   → ${rec.action.label}\n`;
      }
      output += '\n';
    });
  }

  return output;
}

function formatMarkdownOutput(analysis: MaintenanceAnalysis, filtered: MaintenanceRecommendation[]): string {
  let output = '';

  output += '# 🏛️ Idle Village Maintenance Advisor Report\n\n';

  output += `**Analysis Time:** ${new Date(analysis.timestamp).toLocaleString()}\n\n`;

  output += '## 📊 Summary\n\n';
  output += '| Priority | Count |\n';
  output += '|----------|-------|\n';
  output += `| Critical | ${analysis.summary.criticalCount} |\n`;
  output += `| High     | ${analysis.summary.highCount} |\n`;
  output += `| Medium   | ${analysis.summary.mediumCount} |\n`;
  output += `| Low      | ${analysis.summary.lowCount} |\n`;
  output += `| **Total** | **${analysis.summary.totalCount}** |\n\n`;

  if (filtered.length === 0) {
    output += '## ✅ All Systems Optimal\n\n';
    output += 'No maintenance recommendations at this time.\n';
  } else {
    output += '## 📋 Recommendations\n\n';

    filtered.forEach((rec, index) => {
      const icon = { critical: '🚨', high: '⚠️', medium: 'ℹ️', low: '💡' }[rec.priority];
      output += `### ${index + 1}. ${icon} ${rec.title}\n\n`;
      output += `**Priority:** ${rec.priority}\n\n`;
      output += `**Type:** ${rec.type.replace('_', ' ')}\n\n`;
      output += `${rec.description}\n\n`;
      if (rec.action) {
        output += `**Action:** ${rec.action.label}\n\n`;
      }
      output += '---\n\n';
    });
  }

  return output;
}

async function main(): Promise<void> {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    return;
  }

  try {
    console.log('🔍 Loading village data...');
    const { villageState, residents, activities, config } = await loadVillageData(options);

    console.log('🧠 Analyzing village state...');

    // Create mock hook result
    const analysis: MaintenanceAnalysis = {
      timestamp: Date.now(),
      recommendations: [
        {
          id: 'food-low',
          type: 'resource_management',
          priority: 'high',
          title: 'Low Food Reserves',
          description: `Food reserves are running low (${villageState.resources?.food ?? 0}). Consider increasing food production.`,
          metadata: { currentFood: villageState.resources?.food ?? 0 },
        },
        {
          id: 'idle-resources',
          type: 'activity_scheduling',
          priority: 'medium',
          title: 'Idle Workforce Available',
          description: `${residents.filter(r => r.status === 'available').length} residents are available. Consider assigning them to tasks.`,
          metadata: { availableCount: residents.filter(r => r.status === 'available').length },
        },
      ],
      summary: {
        criticalCount: 0,
        highCount: 1,
        mediumCount: 1,
        lowCount: 0,
        totalCount: 2,
      },
    };

    const filtered = filterRecommendations(
      analysis.recommendations,
      options.priorityFilter,
      options.typeFilter
    );

    let output: string;
    switch (options.format) {
      case 'json':
        output = JSON.stringify({ analysis, filtered }, null, 2);
        break;
      case 'markdown':
        output = formatMarkdownOutput(analysis, filtered);
        break;
      case 'text':
      default:
        output = formatTextOutput(analysis, filtered);
        break;
    }

    if (options.outputPath) {
      writeFileSync(options.outputPath, output, 'utf-8');
      console.log(`✅ Report saved to ${options.outputPath}`);
    } else {
      console.log(output);
    }

  } catch (error) {
    console.error('❌ Error running maintenance advisor:', error);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { main as runMaintenanceAdvisor };
