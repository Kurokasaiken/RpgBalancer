// PLAN-112 G2-6: per-piece colour coherence of the HUD assets (thresholds widened by the Director on 2026-11-05).
// Runs the project's own checker (scripts/hud-real/check-palette.py); skipped when the Python environment is not installed.
import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const PY = 'tools/hud-real/venv/bin/python';
describe('HUD palette coherence (G2-6)', () => {
  it.skipIf(!existsSync(PY))('every HUD asset is inside the signed colour thresholds', () => {
    const r = spawnSync(PY, ['-I', 'scripts/hud-real/check-palette.py'], { encoding: 'utf8', timeout: 240000 });
    const out = `${r.stdout}\n${r.stderr}`.split('\n').filter((l) => /FAIL|pezzi controllati/.test(l)).join('\n');
    expect(r.status, out).toBe(0);
  }, 300000);
});
