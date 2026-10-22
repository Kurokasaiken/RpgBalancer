/**
 * PLAN-067 T-B7 / T-B8 (R-234, FAM-1 = A, INV-1 = B) — the teaser sheets (hero sheet, warehouse,
 * merchant, buildings) speak the Roster family: Cinzel + EB Garamond only (no system sans), no cyan /
 * green / red used as MEANING, no row of zeros on the hero sheet, and a disabled BUY that still reads.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { heroSheetViewModel } from '@/ui/idleVillage/components/gameFrame/heroSheetViewModel';
import { STAT_DESCRIPTORS } from '@/balancing/config/idleVillage/statDescriptors';

const read = (p: string) => fs.readFileSync(path.resolve(__dirname, '../../../', p), 'utf8');
const G = 'src/ui/idleVillage/components/gameFrame/';
const SHEETS = ['HeroSheetPanel.tsx', 'VillageStashPanel.tsx', 'MerchantPanel.tsx', 'MockBuyControl.tsx', 'MockUpgradeControl.tsx', 'VillageScreenView.tsx'];

const lum = (hex: string) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a: string, b: string) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };

describe('teaser sheets — one family (R-234, FAM-1)', () => {
  // INV:R-234-fam-roster — display + serif only, no meaning-colours, no zero rows, readable BUY.
  it('no teaser sheet uses the system sans', () => {
    for (const f of SHEETS) expect(read(G + f), f).not.toContain('--skin-font-sans');
  });

  it('the hero sheet carries no cyan / green / red as meaning', () => {
    const src = read(G + 'HeroSheetPanel.tsx');
    const tones = /const (CATEGORY_TONE|STATUS_TONE)[\s\S]*?\n\};/g;
    const block = [...src.matchAll(tones)].map((m) => m[0]).join('\n');
    expect(block).not.toMatch(/skin-icon-accent|skin-status-met|skin-status-wound/);
    expect(src).not.toMatch(/vital\.key === 'hp' \? STATUS_TONE\[vm\.status\] : 'var\(--skin-icon-accent\)'/);
  });

  it('no teaser sheet paints the cyan accent', () => {
    for (const f of SHEETS) expect(read(G + f), f).not.toContain('--skin-icon-accent');
  });

  it('hides stats whose value is zero', () => {
    const key = Object.keys(STAT_DESCRIPTORS)[0];
    const vm = heroSheetViewModel({ id: 'r', displayName: 'R', status: 'active', currentHp: 1, maxHp: 1, isInjured: false, statSnapshot: { [key]: 0 } } as never, {}, ((k: string) => k) as never);
    expect(vm.stats.flatMap((g) => g.entries)).toHaveLength(0);
  });

  it('keeps the disabled BUY readable (>= 4.5:1, no opacity dimming)', () => {
    const src = read(G + 'MockBuyControl.tsx');
    expect(src).not.toMatch(/opacity:\s*0\.\d+/);
    expect(ratio('#c9a84e', '#060f16')).toBeGreaterThanOrEqual(4.5);
  });
});
