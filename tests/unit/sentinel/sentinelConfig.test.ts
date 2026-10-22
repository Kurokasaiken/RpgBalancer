/**
 * T-001 unit tests — SentinelConfig schema, normalizeSelector(), and
 * host-conditional renderer-backend resolution (PLAN-078).
 */
import { describe, it, expect } from 'vitest';
import {
  SentinelConfigSchema,
  DEFAULT_SENTINEL_CONFIG,
  loadSentinelConfig,
} from '../../../scripts/sentinel/sentinelConfig';
import { normalizeSelector, semanticSelectorOf } from '../../../scripts/sentinel/selectorNormalizer';
import { resolveAngleBackend, perfBaselineKey } from '../../../scripts/sentinel/rendererBackend';

describe('SentinelConfig schema', () => {
  it('parses the bare schema marker into the full default config', () => {
    const cfg = SentinelConfigSchema.parse({ schema: 'sentinel-config/1' });
    expect(cfg.poi).toBe('poi-goblin');
    expect(cfg.viewports).toHaveLength(5);
    expect(cfg.locales).toContain('it-IT');
    expect(cfg.perturbations).toContain('LIFECYCLE_INTERRUPT');
    expect(cfg.repeatGate.temporalPixelRuns).toBe(5);
    expect(cfg.repeatGate.temporalPixelMinExactMatches).toBe(3);
    expect(cfg.quiescence.rectDeltaPx).toBe(0.5);
    expect(cfg.temporalPixel.blackFrameThresholdMs).toBe(300);
    expect(cfg.ingest.maxPerRun).toBe(10);
    expect(cfg.ingest.dryRun).toBe(true);
  });

  it('includes the ultrawide viewport in the VP_SWEEP matrix (R-225)', () => {
    expect(DEFAULT_SENTINEL_CONFIG.viewports).toContainEqual({ width: 3440, height: 1440 });
  });

  it('rejects an unknown schema version', () => {
    expect(() => SentinelConfigSchema.parse({ schema: 'sentinel-config/0' })).toThrow();
  });

  it('rejects an empty viewport matrix', () => {
    expect(() =>
      SentinelConfigSchema.parse({ schema: 'sentinel-config/1', viewports: [] }),
    ).toThrow();
  });

  it('rejects a temporal/pixel gate weaker than 3-of-5', () => {
    expect(() =>
      SentinelConfigSchema.parse({
        schema: 'sentinel-config/1',
        repeatGate: { temporalPixelRuns: 2, temporalPixelMinExactMatches: 1 },
      }),
    ).toThrow();
  });

  it('returns defaults when no config file exists', () => {
    expect(loadSentinelConfig('.mw/sentinel/nonexistent.json')).toEqual(DEFAULT_SENTINEL_CONFIG);
  });
});

describe('normalizeSelector', () => {
  it('strips positional pseudo-classes', () => {
    expect(normalizeSelector('ul > li:nth-child(3) > button')).toBe('ul > li > button');
    expect(normalizeSelector('[data-testid="row"]:nth-of-type(2)')).toBe('[data-testid="row"]');
    expect(normalizeSelector('div > p:first-child')).toBe('div > p');
    expect(normalizeSelector('div > p:nth-last-child(2)')).toBe('div > p');
  });

  it('strips numeric index attributes', () => {
    expect(normalizeSelector('[data-testid="row"][data-index="4"]')).toBe('[data-testid="row"]');
    expect(normalizeSelector('tr[data-row-index="12"]')).toBe('tr');
  });

  it('strips React internal attributes', () => {
    expect(normalizeSelector('div[data-reactroot] > span')).toBe('div > span');
    expect(normalizeSelector('[data-reactid=".0.1.2"]')).toBe('');
  });

  it('strips CSS module hash suffixes but keeps semantic classes', () => {
    expect(normalizeSelector('.plaque__a1b2c.open')).toBe('.plaque.open');
    expect(normalizeSelector('.hudPanel_x9y8z7')).toBe('.hudPanel');
    expect(normalizeSelector('.quest-window')).toBe('.quest-window');
    expect(normalizeSelector('.quest_window')).toBe('.quest_window');
  });

  it('strips dnd-kit and radix runtime ids', () => {
    expect(normalizeSelector('[data-dnd-kit-droppable-abc123]')).toBe('');
    expect(normalizeSelector('#dnd-kit-draggable-99')).toBe('');
    expect(normalizeSelector('button[aria-describedby="radix-:r3:"]')).toBe('button');
    expect(normalizeSelector('input[aria-labelledby="react-select-2-label"]')).toBe('input');
  });

  it('keeps semantic data selectors intact', () => {
    expect(normalizeSelector('[data-testid="quest-check-column"]')).toBe('[data-testid="quest-check-column"]');
    expect(normalizeSelector('[data-hud-panel="villageStash"]')).toBe('[data-hud-panel="villageStash"]');
    expect(normalizeSelector('[data-testid="quest-window-choice"]:not([disabled])')).toBe(
      '[data-testid="quest-window-choice"]:not([disabled])',
    );
  });

  it('collapses leftover combinators after strips', () => {
    expect(normalizeSelector('div > [data-dnd-kit-x] > span')).toBe('div > span');
    expect(normalizeSelector('  div   span  ')).toBe('div span');
  });

  it('normalizes the same real-world volatile selector to one fingerprint', () => {
    const a = '[data-dnd-kit-droppable-7f3a] > div:nth-child(2) > .medal__x9y8z[data-index="0"]';
    const b = '[data-dnd-kit-droppable-7f3a] > div:nth-child(5) > .medal__x9y8z[data-index="2"]';
    expect(normalizeSelector(a)).toBe(normalizeSelector(b));
  });
});

describe('semanticSelectorOf', () => {
  it('prefers data-testid over everything else', () => {
    expect(
      semanticSelectorOf({ tagName: 'DIV', testId: 'quest-window', hudPanel: 'p', skin: 'plaque' }),
    ).toBe('[data-testid="quest-window"]');
  });
  it('falls back through hud-panel, skin, role, tag', () => {
    expect(semanticSelectorOf({ tagName: 'SECTION', hudPanel: 'merchant' })).toBe('[data-hud-panel="merchant"]');
    expect(semanticSelectorOf({ tagName: 'DIV', skin: 'hud-plaque' })).toBe('[data-skin="hud-plaque"]');
    expect(semanticSelectorOf({ tagName: 'BUTTON', role: 'radio' })).toBe('button[role="radio"]');
    expect(semanticSelectorOf({ tagName: 'SPAN' })).toBe('span');
  });
});

describe('resolveAngleBackend', () => {
  it('uses metal on macOS', () => {
    const r = resolveAngleBackend({ platform: 'darwin', override: '' });
    expect(r.args).toContain('--use-angle=metal');
    expect(r.rendererClass).toBe('metal');
    expect(r.software).toBe(false);
    expect(r.source).toBe('host-default');
  });

  it('uses d3d11 on Windows', () => {
    const r = resolveAngleBackend({ platform: 'win32', override: '' });
    expect(r.args).toContain('--use-angle=d3d11');
    expect(r.rendererClass).toBe('d3d11');
  });

  it('falls back to SwiftShader on Linux/CI (advisory)', () => {
    const r = resolveAngleBackend({ platform: 'linux', override: '' });
    expect(r.args).toContain('--use-angle=swiftshader');
    expect(r.rendererClass).toBe('software');
    expect(r.software).toBe(true);
  });

  it('honours explicit env overrides, including none', () => {
    const m = resolveAngleBackend({ platform: 'linux', override: 'metal' });
    expect(m.args).toContain('--use-angle=metal');
    expect(m.source).toBe('env-override');
    const n = resolveAngleBackend({ platform: 'darwin', override: 'none' });
    expect(n.args).toHaveLength(0);
    expect(n.rendererClass).toBe('default');
  });

  it('keys perf baselines by renderer class', () => {
    expect(perfBaselineKey('fps_p95', 'software', 'S1_WorldMapIdle')).toBe(
      'fps_p95@software@S1_WorldMapIdle',
    );
  });
});
