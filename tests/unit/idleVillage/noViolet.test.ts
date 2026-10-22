/**
 * PLAN-067 T-B12 (R-234, COL-D = B) — «mai viola, in nessun ruolo». The fallen state is cold iron
 * (#93a4ad) in every skin, and the HUD/skin sources that carry colour tokens hold no violet hex
 * (hue 255–300°, visibly saturated).
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (p: string) => fs.readFileSync(path.resolve(__dirname, '../../../', p), 'utf8');
const violetHexes = (src: string): string[] =>
  [...src.matchAll(/#([0-9a-fA-F]{6})\b/g)].map((m) => m[0]).filter((hex) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
    if (d === 0) return false;
    const s = d / (1 - Math.abs(2 * l - 1));
    const h = (max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4) * 60;
    const hue = (h + 360) % 360;
    return hue >= 250 && hue <= 300 && s > 0.2 && l > 0.12 && l < 0.85;
  });

const SOURCES = [
  'src/ui/idleVillage/skins/skinCssVariables.ts',
  'src/ui/idleVillage/skins/dayNightPoiSkinConfig.ts',
  'src/ui/idleVillage/components/destinyAstrolabeV3/engineV3.ts',
  'src/ui/idleVillage/components/destinyAstrolabeV4/engineV4.ts',
  'src/ui/idleVillage/components/destinyAstrolabeV5/engineV5.ts',
  'src/ui/idleVillage/components/destinyAstrolabeV5/astrolabe-v5.css',
];

describe('no violet (R-234, T-B12)', () => {
  // INV:R-234-no-violet — the fallen state is cold iron in every skin; no violet hex in the colour sources.
  it('the fallen token is cold iron in every skin', () => {
    const values = [...read('src/ui/idleVillage/skins/skinCssVariables.ts').matchAll(/'--skin-status-death':\s*'([^']+)'/g)].map((m) => m[1]);
    expect(values.length).toBeGreaterThan(0);
    values.forEach((v) => expect(v.toLowerCase()).toBe('#93a4ad'));
  });

  it.each(SOURCES)('%s holds no violet', (file) => {
    expect(violetHexes(read(file))).toEqual([]);
  });
});
