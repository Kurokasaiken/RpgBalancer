// INV: PixiWorldMap — a sibling Pixi Application must never release Pixi's global (shared) resources.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '../../../src');

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(e.name) && !/\.test\./.test(e.name)) out.push(p);
  }
  return out;
}

describe('Pixi Application teardown keeps global resources', () => {
  it('no app/renderer .destroy(true …) — it releases the batch pool shared with the world map', () => {
    const offenders = walk(path.join(ROOT, 'ui'))
      .filter((f) => /new (PIXI\.)?Application\(/.test(fs.readFileSync(f, 'utf8')))
      .flatMap((f) =>
        fs
          .readFileSync(f, 'utf8')
          .split('\n')
          .map((l, i) => ({ f: path.relative(ROOT, f), line: i + 1, l }))
          .filter(({ l }) => /\b(app|renderer)\??\.destroy\(\s*true\b/.test(l) || /\bapp\??\.destroy\(\s*\{[^}]*releaseGlobalResources:\s*true/.test(l)),
      );
    expect(offenders).toEqual([]);
  });
});
