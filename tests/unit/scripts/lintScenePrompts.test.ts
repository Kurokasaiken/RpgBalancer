/**
 * Regressione permanente (R-247) per `scripts/lint-scene-prompts.py`
 * check Q13–Q17 (kernel pittorico, PLAN-080): ogni fixture degradata
 * deve far scattare esattamente il gate mirato, e il corpus negativo
 * misura FP/FN senza generare immagini.
 */
import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '../../..');
const LINT = path.join(ROOT, 'scripts/lint-scene-prompts.py');
const FIX = path.join(ROOT, 'tests/fixtures/scene-prompts');

function runLint(caseDir: string) {
  const r = spawnSync('python3', [LINT, path.join(FIX, caseDir)], {
    encoding: 'utf-8',
  });
  return { code: r.status, out: `${r.stdout}${r.stderr}` };
}

describe('lint-scene-prompts Q13–Q17 (kernel pittorico)', () => {
  it('pass-exemplar: prompt in formato Verso Mordor passa', () => {
    const r = runLint('pass-exemplar');
    expect(r.code).toBe(0);
  });

  it('fail-register-dusk-v1: apertura camera-first + coordinate + hedge', () => {
    const r = runLint('fail-register-dusk-v1');
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/Q13 medium-first/);
    expect(r.out).toMatch(/Q14 REG-CAM/);
    expect(r.out).toMatch(/Q14 REG-NUM/);
  });

  it('fail-numeric-layout: percentuali/coordinate nel blocco', () => {
    const r = runLint('fail-numeric-layout');
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/Q14 REG-NUM/);
    expect(r.out).not.toMatch(/Q14 REG-CAM/);
  });

  it('fail-style-thin: floor stile sotto soglia', () => {
    const r = runLint('fail-style-thin');
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/Q15 floor stile/);
  });

  it('fail-placeholder: marker AUTHOR residuo', () => {
    const r = runLint('fail-placeholder');
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/Q17 placeholder/);
  });

  it('corpus reale: tutte le dir scenes passano gli hard gate', () => {
    for (const d of [
      '.mw/specs/quest-goblin-scenes/scenes',
      '.mw/specs/quest-journey-legs/scenes',
      '.mw/specs/quest-rovine-scenes/scenes',
    ]) {
      const r = spawnSync('python3', [LINT, path.join(ROOT, d)], {
        encoding: 'utf-8',
      });
      expect(r.status, `${d} deve passare`).toBe(0);
    }
  });
});

const COMPILER = path.join(ROOT, 'scripts/build-scene-prompt.py');
const BRIEFS = path.join(ROOT, 'tests/fixtures/scene-brief');
const TMP = path.join(ROOT, 'tests/fixtures/scene-prompts/.tmp-compiled');

describe('build-scene-prompt (compiler, PLAN-080 T-003)', () => {
  it('compila un brief valido → prompt lint-clean', () => {
    const out = path.join(TMP, 'sample/prompt.md');
    const r = spawnSync('python3', [COMPILER, '--brief',
      path.join(BRIEFS, 'valid.json'), '--out', out, '--force'],
      { encoding: 'utf-8' });
    expect(r.status).toBe(0);
    const l = spawnSync('python3', [LINT, TMP], { encoding: 'utf-8' });
    expect(l.status, l.stdout + l.stderr).toBe(0);
  });

  it('deterministico: stessa brief → stesso output byte-per-byte', () => {
    const a = path.join(TMP, 'a/prompt.md');
    const b = path.join(TMP, 'b/prompt.md');
    for (const o of [a, b]) {
      spawnSync('python3', [COMPILER, '--brief',
        path.join(BRIEFS, 'valid.json'), '--out', o, '--force']);
    }
    const fa = require('node:fs').readFileSync(a, 'utf-8');
    const fb = require('node:fs').readFileSync(b, 'utf-8');
    expect(fa).toBe(fb);
  });

  it('rifiuta prose vuote senza --allow-placeholders', () => {
    const r = spawnSync('python3', [COMPILER, '--brief',
      path.join(BRIEFS, 'empty-prose.json'), '--out',
      path.join(TMP, 'c/prompt.md')], { encoding: 'utf-8' });
    expect(r.status).toBe(2);
  });

  it('rifiuta overwrite senza --force', () => {
    const fs = require('node:fs');
    const out = path.join(ROOT, 'tests/fixtures/scene-prompts-tmp-refusal/d/prompt.md');
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, '# preexisting\n');
    const r = spawnSync('python3', [COMPILER, '--brief',
      path.join(BRIEFS, 'valid.json'), '--out', out],
      { encoding: 'utf-8' });
    expect(r.status, r.stdout + r.stderr).toBe(2);
  });
});
