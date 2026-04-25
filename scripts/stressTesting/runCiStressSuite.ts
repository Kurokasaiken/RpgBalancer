#!/usr/bin/env node

/**
 * CI Stress Testing Suite Runner
 * 
 * Node script that orchestrates the complete stress testing pipeline
 * for CI/CD automation with caching, scheduling, and report generation.
 * 
 * @module runCiStressSuite
 * @since 2026-01-11
 * @author Hermes-CI
 */

import { Command } from 'commander';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { createHash } from 'crypto';
import { BalancerConfigStore } from '@/balancing/config/BalancerConfigStore';
import { StressTestArchetypeGenerator } from '@/balancing/stressTesting/StressTestArchetypeGenerator';
import { MarginalUtilityCalculator } from '@/balancing/stressTesting/MarginalUtilityCalculator';
import { saveData } from '@/shared/persistence/PersistenceService';
import { exportStressTestTelemetry, getStressTestTelemetrySummary } from '@/analytics/telemetry/telemetryProvider';
import type { BalancerConfig } from '@/balancing/config/types';
import type { StressTestArchetype } from '@/balancing/stressTesting/types';
import type { MarginalUtilityAnalysis } from '@/balancing/stressTesting/MarginalUtilityTypes';

/**
 * CI configuration interface
 */
interface CIConfig {
  iterations: number;
  seed: number;
  outputPath: string;
  cacheDir: string;
  enableTelemetry: boolean;
  enableCaching: boolean;
  parallelJobs: number;
  timeoutMinutes: number;
  environment: 'ci' | 'local';
}

/**
 * CI run metadata for tracking and persistence
 */
interface CIRunMetadata {
  id: string;
  timestamp: string;
  config: CIConfig;
  environment: string;
  balancerConfigHash: string;
  duration: number;
  status: 'running' | 'completed' | 'failed' | 'cached';
  error?: string;
  cacheHit?: boolean;
  results?: {
    archetypesGenerated: number;
    simulationsRun: number;
    pairsAnalyzed: number;
    topSynergies: number;
    topWeaknesses: number;
    outputPath: string;
    telemetryId?: string;
  };
}

/**
 * Cache entry interface
 */
interface CacheEntry {
  key: string;
  timestamp: string;
  configHash: string;
  results: CIRunMetadata['results'];
  expiresAt: string;
}

/**
 * Generate unique run ID with timestamp and config hash
 */
function generateRunId(config: CIConfig): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const configHash = createHash('md5')
    .update(JSON.stringify(config))
    .digest('hex')
    .substring(0, 8);
  return `ci-stress-${timestamp}-${configHash}`;
}

/**
 * Generate config hash for caching
 */
function generateConfigHash(config: CIConfig, balancerConfig: BalancerConfig): string {
  const configString = JSON.stringify({
    ci: config,
    balancer: balancerConfig,
  });
  return createHash('sha256').update(configString).digest('hex');
}

/**
 * Check if cached results exist and are valid
 */
async function checkCache(configHash: string, cacheDir: string): Promise<CacheEntry | null> {
  try {
    const cacheFile = join(cacheDir, `stress-test-${configHash}.json`);
    const { readFileSync } = await import('fs');
    const cacheData = JSON.parse(readFileSync(cacheFile, 'utf8')) as CacheEntry;
    
    // Check if cache is expired (24 hours)
    const expiresAt = new Date(cacheData.expiresAt);
    const now = new Date();
    if (expiresAt < now) {
      return null;
    }
    
    return cacheData;
  } catch (error) {
    return null;
  }
}

/**
 * Save results to cache
 */
async function saveToCache(
  configHash: string, 
  results: CIRunMetadata['results'], 
  cacheDir: string
): Promise<void> {
  try {
    await mkdir(cacheDir, { recursive: true });
    
    const cacheEntry: CacheEntry = {
      key: configHash,
      timestamp: new Date().toISOString(),
      configHash,
      results,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    };
    
    const cacheFile = join(cacheDir, `stress-test-${configHash}.json`);
    const { writeFileSync } = await import('fs');
    writeFileSync(cacheFile, JSON.stringify(cacheEntry, null, 2));
  } catch (error) {
    console.warn('Failed to save to cache:', error);
  }
}

/**
 * Run the complete stress testing pipeline
 */
async function runStressTestingPipeline(
  config: CIConfig,
  balancerConfig: BalancerConfig
): Promise<CIRunMetadata['results']> {
  const startTime = Date.now();
  
  try {
    console.log('🚀 Starting CI Stress Testing Pipeline...');
    console.log(`📊 Iterations: ${config.iterations}`);
    console.log(`🎲 Seed: ${config.seed}`);
    console.log(`⚙️  Environment: ${config.environment}`);
    
    // Step 1: Generate archetypes
    console.log('📦 Generating archetypes...');
    const generator = new StressTestArchetypeGenerator({
      seed: config.seed,
      includeDerivedStats: false,
      maxArchetypes: 100,
    });
    
    const archetypes = generator.generateArchetypes(balancerConfig);
    console.log(`✅ Generated ${archetypes.length} archetypes`);
    
    // Step 2: Calculate marginal utility
    console.log('🔬 Calculating marginal utility...');
    const calculator = new MarginalUtilityCalculator({
      iterations: config.iterations,
      seed: config.seed,
      parallelJobs: config.parallelJobs,
    });
    
    const analysis = await calculator.calculateMarginalUtility(
      archetypes,
      balancerConfig
    );
    console.log(`✅ Analyzed ${analysis.pairAnalyses.length} stat pairs`);
    
    // Step 3: Export results
    console.log('💾 Exporting results...');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputPath = join(config.outputPath, `stress-test-${timestamp}`);
    
    await mkdir(outputPath, { recursive: true });
    
    // Export analysis results
    await writeFile(
      join(outputPath, 'analysis.json'),
      JSON.stringify(analysis, null, 2)
    );
    
    // Export archetypes
    await writeFile(
      join(outputPath, 'archetypes.json'),
      JSON.stringify(archetypes, null, 2)
    );
    
    // Export metadata
    const metadata = {
      timestamp: new Date().toISOString(),
      config,
      balancerConfigHash: generateConfigHash(config, balancerConfig),
      archetypes: archetypes.length,
      iterations: config.iterations,
      seed: config.seed,
      environment: config.environment,
    };
    
    await writeFile(
      join(outputPath, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );
    
    // Step 4: Export telemetry (if enabled)
    let telemetryId: string | undefined;
    if (config.enableTelemetry) {
      console.log('📡 Exporting telemetry...');
      telemetryId = await exportStressTestTelemetry({
        runId: metadata.timestamp,
        config: metadata.config,
        balancerConfigHash: metadata.balancerConfigHash,
        archetypes: metadata.archetypes,
        iterations: metadata.iterations,
        seed: metadata.seed,
        environment: metadata.environment,
        analysis,
        outputPath,
      });
    }
    
    // Step 5: Generate summary report
    const summary = getStressTestTelemetrySummary();
    await writeFile(
      join(outputPath, 'summary.json'),
      JSON.stringify(summary, null, 2)
    );
    
    // Calculate statistics
    const topSynergies = analysis.pairAnalyses.filter(
      pair => pair.synergyMultiplier > 1.15
    ).length;
    
    const topWeaknesses = analysis.pairAnalyses.filter(
      pair => pair.synergyMultiplier < 0.95
    ).length;
    
    const duration = Date.now() - startTime;
    
    const results: CIRunMetadata['results'] = {
      archetypesGenerated: archetypes.length,
      simulationsRun: config.iterations * analysis.pairAnalyses.length,
      pairsAnalyzed: analysis.pairAnalyses.length,
      topSynergies,
      topWeaknesses,
      outputPath,
      telemetryId,
    };
    
    console.log(`✅ Pipeline completed in ${(duration / 1000).toFixed(1)}s`);
    console.log(`📊 Top synergies: ${topSynergies}`);
    console.log(`⚠️  Top weaknesses: ${topWeaknesses}`);
    console.log(`💾 Results saved to: ${outputPath}`);
    
    return results;
    
  } catch (error) {
    console.error('❌ Pipeline failed:', error);
    throw error;
  }
}

/**
 * Main CLI command
 */
async function main(): Promise<void> {
  const program = new Command();
  
  program
    .name('ci-stress-suite')
    .description('CI Stress Testing Suite Runner')
    .option('-i, --iterations <number>', 'Number of simulation iterations', '10000')
    .option('-s, --seed <number>', 'Random seed for reproducibility', '42')
    .option('-o, --output <path>', 'Output directory', './data/stressTesting/ci')
    .option('--cache-dir <path>', 'Cache directory', './data/stressTesting/cache')
    .option('--parallel-jobs <number>', 'Parallel simulation jobs', '4')
    .option('--timeout <minutes>', 'Timeout in minutes', '30')
    .option('--no-cache', 'Disable caching')
    .option('--no-telemetry', 'Disable telemetry export')
    .option('--environment <type>', 'Environment type', 'ci')
    .action(async (options) => {
      const config: CIConfig = {
        iterations: parseInt(options.iterations),
        seed: parseInt(options.seed),
        outputPath: options.output,
        cacheDir: options.cacheDir,
        enableTelemetry: options.telemetry !== false,
        enableCaching: options.cache !== false,
        parallelJobs: parseInt(options.parallelJobs),
        timeoutMinutes: parseInt(options.timeout),
        environment: options.environment as 'ci' | 'local',
      };
      
      const runId = generateRunId(config);
      const startTime = Date.now();
      
      console.log(`🔧 CI Stress Testing Suite - ${runId}`);
      console.log(`⏰ Started at: ${new Date().toISOString()}`);
      
      try {
        // Load balancer configuration
        console.log('📋 Loading balancer configuration...');
        const balancerConfig = await BalancerConfigStore.load();
        const configHash = generateConfigHash(config, balancerConfig);
        
        // Check cache
        let cacheHit = false;
        let results: CIRunMetadata['results'];
        
        if (config.enableCaching) {
          console.log('🔍 Checking cache...');
          const cached = await checkCache(configHash, config.cacheDir);
          
          if (cached) {
            console.log('✅ Cache hit! Using cached results.');
            cacheHit = true;
            results = cached.results;
          } else {
            console.log('❌ Cache miss. Running pipeline...');
          }
        }
        
        // Run pipeline if not cached
        if (!cacheHit) {
          results = await runStressTestingPipeline(config, balancerConfig);
          
          if (config.enableCaching) {
            await saveToCache(configHash, results, config.cacheDir);
            console.log('💾 Results cached for future runs.');
          }
        }
        
        // Save run metadata
        const metadata: CIRunMetadata = {
          id: runId,
          timestamp: new Date().toISOString(),
          config,
          environment: config.environment,
          balancerConfigHash: configHash,
          duration: Date.now() - startTime,
          status: 'completed',
          cacheHit,
          results,
        };
        
        await mkdir(config.outputPath, { recursive: true });
        await writeFile(
          join(config.outputPath, 'ci-metadata.json'),
          JSON.stringify(metadata, null, 2)
        );
        
        console.log('✅ CI Stress Testing Suite completed successfully!');
        console.log(`📊 Results: ${results.archetypesGenerated} archetypes, ${results.pairsAnalyzed} pairs analyzed`);
        console.log(`⏱️  Total duration: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
        console.log(`💾 Metadata saved to: ${join(config.outputPath, 'ci-metadata.json')}`);
        
        // Exit with success code
        process.exit(0);
        
      } catch (error) {
        const metadata: CIRunMetadata = {
          id: runId,
          timestamp: new Date().toISOString(),
          config,
          environment: config.environment,
          balancerConfigHash: '',
          duration: Date.now() - startTime,
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
        };
        
        try {
          await mkdir(config.outputPath, { recursive: true });
          await writeFile(
            join(config.outputPath, 'ci-metadata.json'),
            JSON.stringify(metadata, null, 2)
          );
        } catch (writeError) {
          console.warn('Failed to write error metadata:', writeError);
        }
        
        console.error('❌ CI Stress Testing Suite failed!');
        console.error(`💥 Error: ${metadata.error}`);
        console.error(`💾 Error metadata saved to: ${join(config.outputPath, 'ci-metadata.json')}`);
        
        // Exit with error code
        process.exit(1);
      }
    });
  
  await program.parseAsync();
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}
