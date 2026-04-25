/**
 * Synergy Heatmap API Handler
 * 
 * Provides filesystem-backed endpoint for synergy heatmap data.
 * Implements 5-minute TTL cache with regeneration fallback.
 * 
 * @module SynergyHeatmapAPI
 * @since 2026-01-12
 * @author Vector-Marginal
 */

import { readdir, readFile } from 'fs/promises';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { saveData, loadData } from '@/shared/persistence/PersistenceService';
import { DEFAULT_MARGINAL_UTILITY_CONFIG } from '@/balancing/config/stressTesting/marginalUtilityConfig';
import { MarginalUtilityCalculator } from '@/balancing/stressTesting/MarginalUtilityCalculator';
import type { MarginalUtilityAnalysis } from '@/balancing/stressTesting/MarginalUtilityTypes';
import type { SynergyAnalysis } from '@/balancing/stressTesting/MarginalUtilityTypes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '../../..');

/** Cache TTL in milliseconds (5 minutes) */
const CACHE_TTL_MS = 5 * 60 * 1000;

/** Cache key for API responses */
const API_CACHE_KEY = 'synergy-heatmap-api-cache';

/**
 * API cache entry with TTL
 */
interface CacheEntry {
  /** Heatmap data */
  heatmapData: Record<string, Record<string, number>>;
  /** Timestamp when cache was created */
  timestamp: number;
  /** Expiration timestamp */
  expiresAt: number;
  /** Source analysis ID */
  sourceAnalysisId: string;
}

/**
 * API response structure
 */
interface SynergyHeatmapResponse {
  /** Success flag */
  success: boolean;
  /** Heatmap data matrix */
  data?: Record<string, Record<string, number>>;
  /** Metadata about the source */
  metadata?: {
    analysisId: string;
    analysisTimestamp: number;
    cacheTimestamp: number;
    isFromCache: boolean;
  };
  /** Error message if failed */
  error?: string;
}

/**
 * Resolve the export directory path
 */
function getExportDirectory(): string {
  const exportPath = DEFAULT_MARGINAL_UTILITY_CONFIG.export.exportPath;
  // Handle both absolute and relative paths
  return exportPath.startsWith('/') ? exportPath : join(PROJECT_ROOT, exportPath);
}

/**
 * Find the most recent marginal utility analysis file
 */
async function findLatestExport(): Promise<string | null> {
  try {
    const exportDir = getExportDirectory();
    const files = await readdir(exportDir);
    
    // Filter for JSON files that match analysis pattern
    const analysisFiles = files
      .filter(file => file.endsWith('.json'))
      .filter(file => file.includes('mu-analysis') || file.includes('marginal-utility'))
      .sort((a, b) => {
        // Sort by filename (which includes timestamp)
        return b.localeCompare(a);
      });

    return analysisFiles.length > 0 ? join(exportDir, analysisFiles[0]) : null;
  } catch (error) {
    console.warn('[SynergyAPI] Failed to scan export directory:', error);
    return null;
  }
}

/**
 * Load and parse marginal utility analysis from file
 */
async function loadAnalysis(filePath: string): Promise<MarginalUtilityAnalysis | null> {
  try {
    const content = await readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    // Handle both direct analysis and wrapped export formats
    if (data.analysis && typeof data.analysis === 'object') {
      return data.analysis as MarginalUtilityAnalysis;
    }
    
    // Direct analysis format
    if (data.id && data.synergyAnalyses) {
      return data as MarginalUtilityAnalysis;
    }
    
    console.warn('[SynergyAPI] Invalid analysis format in file:', filePath);
    return null;
  } catch (error) {
    console.error('[SynergyAPI] Failed to load analysis from file:', filePath, error);
    return null;
  }
}

/**
 * Generate heatmap data from synergy analyses
 */
function generateHeatmapData(synergies: SynergyAnalysis[]): Record<string, Record<string, number>> {
  const heatmap: Record<string, Record<string, number>> = {};
  
  for (const synergy of synergies) {
    const [statA, statB] = synergy.statIds;
    
    // Initialize rows if needed
    if (!heatmap[statA]) heatmap[statA] = {};
    if (!heatmap[statB]) heatmap[statB] = {};
    
    // Set symmetric values
    const value = synergy.synergyMultiplier;
    heatmap[statA][statB] = value;
    heatmap[statB][statA] = value;
  }
  
  return heatmap;
}

/**
 * Check if cache entry is valid and not expired
 */
function isCacheValid(entry: CacheEntry): boolean {
  return Date.now() < entry.expiresAt;
}

/**
 * Load cache entry from storage
 */
async function loadCache(): Promise<CacheEntry | null> {
  try {
    return await loadData<CacheEntry>(API_CACHE_KEY, null);
  } catch (error) {
    console.warn('[SynergyAPI] Failed to load cache:', error);
    return null;
  }
}

/**
 * Save cache entry to storage
 */
async function saveCache(entry: CacheEntry): Promise<void> {
  try {
    await saveData(API_CACHE_KEY, entry);
  } catch (error) {
    console.warn('[SynergyAPI] Failed to save cache:', error);
  }
}

/**
 * Generate new heatmap data by running analysis
 * This is the fallback when no cached/exported data is available
 */
async function generateFreshData(): Promise<{ heatmapData: Record<string, Record<string, number>>; analysisId: string } | null> {
  try {
    console.log('[SynergyAPI] No cached data found, generating fresh analysis...');
    
    // Import required modules dynamically to avoid circular dependencies
    const { StressTestArchetypeGenerator } = await import('@/balancing/stressTesting/StressTestArchetypeGenerator');
    const { BalancerConfigStore } = await import('@/balancing/config/BalancerConfigStore');
    
    // Load balancer configuration
    const balancerConfig = await BalancerConfigStore.load();
    
    // Generate archetypes
    const generator = await StressTestArchetypeGenerator.create(42);
    
    const singleStats = await generator.generateSingleStatArchetypes();
    const pairStats = await generator.generatePairStatArchetypes();
    const archetypes = [generator.generateBaselineArchetype(), ...singleStats, ...pairStats];
    if (archetypes.length === 0) {
      throw new Error('No archetypes generated');
    }
    
    // Run analysis
    const calculator = new MarginalUtilityCalculator({
      simulation: {
        simulationCount: 1000, // Reduced for API performance
        seed: 42,
        concurrencyLimit: 2,
      },
      thresholds: {
        opThreshold: 1.15,
        weakThreshold: 0.95,
      },
      export: DEFAULT_MARGINAL_UTILITY_CONFIG.export,
      enableLogging: false,
      enableCaching: false, // Use our own cache
    });
    
    const analysis = await calculator.runAnalysis(archetypes, archetypes[0], balancerConfig);
    
    // Generate heatmap data
    const heatmapData = generateHeatmapData(analysis.synergyAnalyses);
    
    return {
      heatmapData,
      analysisId: analysis.id,
    };
  } catch (error) {
    console.error('[SynergyAPI] Failed to generate fresh data:', error);
    return null;
  }
}

/**
 * Main handler function for synergy heatmap API
 */
export async function handleSynergyHeatmapRequest(): Promise<SynergyHeatmapResponse> {
  const startTime = Date.now();
  
  try {
    // Check cache first
    const cache = await loadCache();
    if (cache && isCacheValid(cache)) {
      console.log(`[SynergyAPI] Cache hit, serving cached data (age: ${Date.now() - cache.timestamp}ms)`);
      
      return {
        success: true,
        data: cache.heatmapData,
        metadata: {
          analysisId: cache.sourceAnalysisId,
          analysisTimestamp: cache.timestamp,
          cacheTimestamp: cache.timestamp,
          isFromCache: true,
        },
      };
    }
    
    // Try to load from latest export file
    const latestExportPath = await findLatestExport();
    let analysis: MarginalUtilityAnalysis | null = null;
    let sourceAnalysisId = '';
    
    if (latestExportPath) {
      console.log(`[SynergyAPI] Loading latest export: ${latestExportPath}`);
      analysis = await loadAnalysis(latestExportPath);
      if (analysis) {
        sourceAnalysisId = analysis.id;
      }
    }
    
    // Fallback to fresh generation if no export available
    if (!analysis) {
      const freshResult = await generateFreshData();
      if (!freshResult) {
        return {
          success: false,
          error: 'Failed to load or generate synergy data',
        };
      }
      
      // Create minimal analysis object for cache
      analysis = {
        id: freshResult.analysisId,
        config: {
          simulationCount: 1000,
          seed: 42,
          thresholds: { opThreshold: 1.15, weakThreshold: 0.95 },
        },
        statMetrics: [],
        synergyAnalyses: [], // Not needed for heatmap
        summary: {
          totalSimulations: 0,
          totalRuntimeMs: 0,
          avgSimulationsPerSecond: 0,
          opSynergiesCount: 0,
          weakSynergiesCount: 0,
          significantSynergiesCount: 0,
        },
        timestamp: Date.now(),
      };
      sourceAnalysisId = freshResult.analysisId;
    }
    
    // Generate heatmap data
    const heatmapData = generateHeatmapData(analysis.synergyAnalyses);
    
    // Update cache
    const cacheEntry: CacheEntry = {
      heatmapData,
      timestamp: Date.now(),
      expiresAt: Date.now() + CACHE_TTL_MS,
      sourceAnalysisId,
    };
    await saveCache(cacheEntry);
    
    const duration = Date.now() - startTime;
    console.log(`[SynergyAPI] Request completed in ${duration}ms (cache miss)`);
    
    return {
      success: true,
      data: heatmapData,
      metadata: {
        analysisId: sourceAnalysisId,
        analysisTimestamp: analysis.timestamp,
        cacheTimestamp: cacheEntry.timestamp,
        isFromCache: false,
      },
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[SynergyAPI] Request failed after ${duration}ms:`, error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Health check endpoint for the API
 */
export async function handleHealthCheck(): Promise<{ status: string; timestamp: number; cacheInfo?: { hasValidCache: boolean; cacheTimestamp: number | null; hasLatestExport: boolean; latestExportPath: string | null } }> {
  try {
    const cache = await loadCache();
    const latestExport = await findLatestExport();
    
    return {
      status: 'healthy',
      timestamp: Date.now(),
      cacheInfo: {
        hasValidCache: cache ? isCacheValid(cache) : false,
        cacheTimestamp: cache?.timestamp || null,
        hasLatestExport: !!latestExport,
        latestExportPath: latestExport,
      },
    };
  } catch {
    return {
      status: 'unhealthy',
      timestamp: Date.now(),
    };
  }
}

/**
 * Clear cache endpoint (for debugging/admin)
 */
export async function handleClearCache(): Promise<{ success: boolean; message: string }> {
  try {
    await saveData(API_CACHE_KEY, null);
    return {
      success: true,
      message: 'Cache cleared successfully',
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to clear cache',
    };
  }
}