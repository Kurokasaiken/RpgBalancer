/**
 * PLAN-071 T-B5 (R-239) — contrast audit on the quest chrome.
 *
 * Measured live (probe16/17, .mw/runs/plan071-t001/contrast-report*.json):
 * every text leaf on the lacquer chrome passed EXCEPT the semantic status
 * tones used as bare text — `--skin-status-wound` (#a11d33) is 2.52:1 and
 * `--skin-status-death` (#6d3fb0) is 2.75:1 on `--skin-hud-lacquer-deep`
 * (#060f16). R-234 had already fixed this inside `HudChip` (CHIP_TEXT_LIFT);
 * the bare `color:` call sites were never lifted.
 *
 * Contract (INV:R-239-contrast):
 * - `toneText(tone)` is the only legal way to paint status tones as TEXT in
 *   the quest chrome — it lifts danger/death toward text-primary ≥4.5:1;
 * - no `color:` property in the gameFrame quest components may still use the
 *   bare failing tones (borders/fills/icons stay raw — non-text);
 * - the lifted mixes provably clear 4.5:1 on the lacquer base.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { toneText, TONE } from '@/ui/idleVillage/questS1Lab/hud/atoms';

/* -- WCAG math (same sRGB model the live probe used) --------------------- */
const parseCss = (c: string): [number, number, number, number] => {
  c = c.trim();
  if (c.startsWith('#')) {
    const h = c.slice(1);
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 1];
  }
  const v = /rgba?\(([^)]+)\)/.exec(c)![1].split(',').map(Number);
  return v.length === 3 ? [...v, 1] : (v as [number, number, number, number]);
};
const lum = ([r, g, b]: number[]) => {
  const f = (v: number) => (v / 255 <= 0.03928 ? v / 255 / 12.92 : Math.pow((v / 255 + 0.055) / 1.055, 2.4));
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const over = (fg: number[], bg: number[]) => fg.map((v, i) => v * fg[3] + bg[i] * bg[3] * (1 - fg[3])).slice(0, 3);
const ratio = (fg: number[], bg: number[]) => {
  const [hi, lo] = [lum(fg), lum(bg)].sort((a, b) => b - a);
  return (hi + 0.05) / (lo + 0.05);
};

const LACQUER: [number, number, number, number] = [6, 15, 22, 1]; // --skin-hud-lacquer-deep
const TOKEN: Record<string, string> = {
  danger: '#a11d33', // --skin-status-wound
  death: '#6d3fb0', // --skin-status-death
  muted: 'rgba(245,242,232,0.50)', // --skin-text-muted
};
const TEXT_PRIMARY = [245, 242, 232, 1];

/** Replicates `color-mix(in srgb, <tone> <100-lift>%, var(--skin-text-primary))`. */
const liftMix = (tone: keyof typeof TOKEN, liftPct: number): number[] =>
  over([...parseCss(TOKEN[tone]).slice(0, 3), 1 - liftPct / 100], TEXT_PRIMARY);

const DIR = join(process.cwd(), 'src/ui/idleVillage/components/gameFrame');
const QUEST_CHROME = readdirSync(DIR)
  .filter((f) => /^(Quest|DamageFloater)/.test(f) && f.endsWith('.tsx'))
  .map((f) => join(DIR, f));

describe('contrast — status tones as text (R-239)', () => {
  // INV:R-239-contrast — the raw tokens fail; the lifted mixes must clear 4.5.
  it('bare wound/death fail on lacquer; toneText lifts clear 4.5:1', () => {
    expect(ratio(parseCss(TOKEN.danger).slice(0, 3), LACQUER.slice(0, 3))).toBeLessThan(4.5);
    expect(ratio(parseCss(TOKEN.death).slice(0, 3), LACQUER.slice(0, 3))).toBeLessThan(4.5);
    // CHIP_TEXT_LIFT: danger/death → 40% text-primary.
    for (const tone of ['danger', 'death'] as const) {
      expect(ratio(liftMix(tone, 40), LACQUER.slice(0, 3)), tone).toBeGreaterThanOrEqual(4.5);
      expect(toneText(tone)).toBe(`color-mix(in srgb, ${TONE[tone]} 60%, var(--skin-text-primary))`);
    }
  });

  // INV:R-239-contrast — no `color:` property may paint the raw failing tones
  // as text anywhere in the quest chrome. (borders/backgrounds stay raw.)
  it('no bare failing tone is used as a text color in quest chrome', () => {
    const offenders: string[] = [];
    for (const file of QUEST_CHROME) {
      const src = readFileSync(file, 'utf8');
      for (const m of src.matchAll(/color:\s*[^,};\n]*TONE\.(death|danger|wound)/g)) {
        offenders.push(`${file.split('/').pop()}: ${m[0].trim()}`);
      }
    }
    expect(offenders, offenders.join('\n')).toEqual([]);
  });
});
