import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'fs';
import path from 'path';

// Cartelle dove NON deve comparire randomness non controllata
const TARGET_DIRS = [
  'src/balancing',
  'src/engine',
  'src/simulation',
  'src/idle',
];

const FORBIDDEN_PATTERNS = [
  /Math\.random\s*\(/,
  /crypto\.random/i,
  /crypto\.getRandomValues/i,
  /Date\.now\s*\(/,    // concesso solo nei log, ma meglio segnalare
  /performance\.now\s*\(/,
];

function listFilesRecursively(dirPath: string): string[] {
  let results: string[] = [];
  const list = readdirSync(dirPath);

  list.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    const stat = statSync(fullPath);

    if (stat && stat.isDirectory()) {
      results = results.concat(listFilesRecursively(fullPath));
    } else {
      if (/\.(ts|js|tsx|jsx)$/.test(file)) {
        results.push(fullPath);
      }
    }
  });

  return results;
}

describe('RNG Guard – no uncontrolled randomness allowed', () => {
  it('should fail if Math.random(), crypto.random, or Date.now() appear in simulation code', () => {
    const repoRoot = path.resolve(process.cwd());

    const targetFiles = TARGET_DIRS.flatMap(dir => {
      const folder = path.join(repoRoot, dir);
      return listFilesRecursively(folder);
    });

    const offenders: { file: string; pattern: string; line: number; }[] = [];

    for (const file of targetFiles) {
      const content = readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, i) => {
        FORBIDDEN_PATTERNS.forEach((pat) => {
          if (pat.test(line)) {
            offenders.push({
              file,
              pattern: pat.toString(),
              line: i + 1,
            });
          }
        });
      });
    }

    if (offenders.length > 0) {
      console.error('\n❌ RNG-GUARD FAILED – Found forbidden randomness:');
      offenders.forEach(o => {
        console.error(`- ${o.file}:${o.line}  matches ${o.pattern}`);
      });
    }

    expect(offenders.length).toBe(0);
  });
});
