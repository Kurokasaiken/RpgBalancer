#!/usr/bin/env tsx

/**
 * Minimal Telemetry Flush CLI
 *
 * CLI tool to read persisted loop telemetry buffer, force flush, and save JSON output.
 * Usage: npm run minimal-telemetry-flush [--output <file>] [--clear]
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { LoopTelemetryBuffer, MinimalLoopTelemetryPayload } from '../src/analytics/minimalGameplay/loopTelemetryBuffer';
import { loadData, saveData } from '../src/shared/persistence/PersistenceService';

// Mock implementations for CLI environment
const mockTraceMinimalGameplay = vi?.fn?.() || (() => {});
const mockSaveData = vi?.fn?.() || saveData;
const mockLoadData = vi?.fn?.() || loadData;

interface FlushOptions {
  output?: string;
  clear?: boolean;
  verbose?: boolean;
}

interface FlushResult {
  success: boolean;
  eventsFlushed: number;
  outputFile?: string;
  error?: string;
  stats: {
    bufferSizeBefore: number;
    bufferSizeAfter: number;
    flushDuration: number;
  };
}

/**
 * Flush telemetry buffer and save results.
 */
async function flushTelemetryBuffer(options: FlushOptions = {}): Promise<FlushResult> {
  const startTime = Date.now();

  try {
    console.log('🚀 Starting Minimal Telemetry Flush');

    // Create buffer instance with persistence enabled
    const buffer = new LoopTelemetryBuffer({
      enablePersistence: true,
      persistenceKey: 'minimal-loop-telemetry-buffer',
    });

    const bufferSizeBefore = buffer.getBufferSize();
    console.log(`📊 Buffer size before flush: ${bufferSizeBefore}`);

    // Force flush
    await buffer.flush();

    const bufferSizeAfter = buffer.getBufferSize();
    const flushDuration = Date.now() - startTime;

    console.log(`✅ Flush completed in ${flushDuration}ms`);
    console.log(`📊 Buffer size after flush: ${bufferSizeAfter}`);

    // Generate output data
    const outputData = {
      flushedAt: new Date().toISOString(),
      eventsFlushed: bufferSizeBefore - bufferSizeAfter,
      flushDuration,
      stats: buffer.getStats(),
      metadata: {
        version: '1.0',
        cli: 'minimal-telemetry-flush',
        timestamp: Date.now(),
      },
    };

    // Save to file if output specified
    let outputFile: string | undefined;
    if (options.output) {
      const fileName = options.output.endsWith('.json')
        ? options.output
        : `${options.output}.json`;

      outputFile = join(process.cwd(), 'test-results', fileName);
      writeFileSync(outputFile, JSON.stringify(outputData, null, 2));
      console.log(`💾 Output saved to: ${outputFile}`);
    } else {
      // Default output location
      outputFile = join(process.cwd(), 'test-results', `minimal-loop-telemetry-${Date.now()}.json`);
      writeFileSync(outputFile, JSON.stringify(outputData, null, 2));
      console.log(`💾 Output saved to: ${outputFile}`);
    }

    // Print summary to console
    console.log('\n📈 Flush Summary:');
    console.log(`   Events flushed: ${outputData.eventsFlushed}`);
    console.log(`   Duration: ${outputData.flushDuration}ms`);
    console.log(`   Final buffer size: ${outputData.stats.bufferSize}`);

    // Clean up
    buffer.destroy();

    return {
      success: true,
      eventsFlushed: outputData.eventsFlushed,
      outputFile,
      stats: {
        bufferSizeBefore,
        bufferSizeAfter,
        flushDuration,
      },
    };

  } catch (error) {
    const flushDuration = Date.now() - startTime;
    console.error('❌ Flush failed:', error);

    return {
      success: false,
      eventsFlushed: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
      stats: {
        bufferSizeBefore: 0,
        bufferSizeAfter: 0,
        flushDuration,
      },
    };
  }
}

/**
 * Main CLI function.
 */
async function main() {
  const args = process.argv.slice(2);
  const options: FlushOptions = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--output':
      case '-o':
        options.output = args[++i];
        break;
      case '--clear':
        options.clear = true;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--help':
      case '-h':
        console.log(`
Minimal Telemetry Flush CLI

Usage: npm run minimal-telemetry-flush [options]

Options:
  -o, --output <file>    Output file name (default: test-results/minimal-loop-telemetry-<timestamp>.json)
  --clear                Clear buffer after flush (not implemented in this version)
  -v, --verbose          Verbose output
  -h, --help            Show this help

Examples:
  npm run minimal-telemetry-flush
  npm run minimal-telemetry-flush --output custom-flush.json
  npm run minimal-telemetry-flush --verbose

Description:
  Reads the persisted Minimal Gameplay loop telemetry buffer, forces a flush of all events,
  and saves the results to a JSON file. Use this to manually trigger telemetry processing
  or for debugging telemetry buffering behavior.
`);
        process.exit(0);
        break;
      default:
        if (args[i].startsWith('-')) {
          console.error(`Unknown option: ${args[i]}`);
          process.exit(1);
        }
    }
  }

  // Execute flush
  const result = await flushTelemetryBuffer(options);

  // Exit with appropriate code
  process.exit(result.success ? 0 : 1);
}

// Run CLI if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('CLI execution failed:', error);
    process.exit(1);
  });
}

export { flushTelemetryBuffer, FlushOptions, FlushResult };
