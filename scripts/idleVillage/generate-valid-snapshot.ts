#!/usr/bin/env tsx

/**
 * Quick snapshot generator for NP-MIN-PLAN-210 testing
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import {
  serializeSnapshot,
  type MinimalGameState,
} from '../../src/engine/game/idleVillage/minimalSnapshotSerializer';
import { saveMinimalGameplaySnapshot } from '../../src/shared/persistence/PersistenceService';

const DEFAULT_OUTPUT = join(process.cwd(), 'tmp', 'valid-minimal-snapshot.json');

const baseGameState: MinimalGameState = {
  gold: 120,
  food: 12,
  maxFood: 40,
  currentDay: 5,
  currentTime: 600,
  isPaused: false,
  speedMultiplier: 1,
  residents: [
    {
      id: 'resident-1',
      name: 'Aurora',
      level: 2,
      stats: { strength: 5, endurance: 4, agility: 3 },
      fatigue: 0.65,
      isWorking: true,
      isInjured: false,
    },
    {
      id: 'resident-2',
      name: 'Balthazar',
      level: 3,
      stats: { strength: 7, endurance: 6, agility: 4 },
      fatigue: 0.3,
      isWorking: false,
      isInjured: false,
    },
    {
      id: 'resident-3',
      name: 'Cassia',
      level: 1,
      stats: { strength: 3, endurance: 4, agility: 5 },
      fatigue: 0.85,
      isWorking: true,
      isInjured: true,
    },
  ],
  activeActivities: [],
  eventLog: [],
  lastSavedAt: Date.now(),
};

interface GenerateOptions {
  outputPath: string;
  persistKey?: string;
}

function parseArgs(): GenerateOptions {
  const args = process.argv.slice(2);
  const options: GenerateOptions = {
    outputPath: DEFAULT_OUTPUT,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--output':
      case '-o':
        options.outputPath = args[++i] ?? options.outputPath;
        break;
      case '--persist-key':
        options.persistKey = args[++i];
        break;
      case '--help':
      case '-h':
        console.log(`Usage: npm run generate-valid-snapshot [--output <path>] [--persist-key <key>]

Options:
  -o, --output <path>     Destination file (default: ${DEFAULT_OUTPUT})
      --persist-key <key> Persist snapshot via PersistenceService under key
  -h, --help              Show this help message
`);
        process.exit(0);
        break;
      default:
        if (arg.startsWith('-')) {
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
        }
    }
  }

  return options;
}

async function main(): Promise<void> {
  const options = parseArgs();
  const snapshot = serializeSnapshot(baseGameState);

  try {
    mkdirSync(dirname(options.outputPath), { recursive: true });
  } catch {
    // ignore mkdir errors (path may already exist or be a file path without directory)
  }
  writeFileSync(options.outputPath, JSON.stringify(snapshot, null, 2));
  console.log(`Valid snapshot written to ${options.outputPath}`);
  console.log(`Metadata → version: ${snapshot.metadata.version}, checksum: ${snapshot.metadata.checksum}`);

  if (options.persistKey) {
    await saveMinimalGameplaySnapshot(options.persistKey, snapshot.data);
    console.log(`Snapshot persisted under key ${options.persistKey}`);
  }
}

main().catch((error) => {
  console.error('Failed to generate snapshot:', error);
  process.exit(1);
});
