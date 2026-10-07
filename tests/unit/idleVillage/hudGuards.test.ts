import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { BASE_SKIN_CSS_VARS } from '@/ui/idleVillage/skins/skinCssVariables';

/**
 * Guards for the rules in src/docs/docs/design/hud_component_guide.md that a machine can check:
 * every HUD token is defined, new HUD files carry no colour literals, no text under 12px.
 */
const ROOT = resolve(__dirname, '../../..');
const read = (path: string) => readFileSync(resolve(ROOT, path), 'utf8');
const stripComments = (source: string) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

/** Files built on the HUD material from scratch (the legacy ribbon/panel/astrolabe files are excluded on purpose). */
const STRICT_FILES = [
  'src/ui/idleVillage/skins/primitives/HudPlaque.tsx',
  'src/ui/idleVillage/components/gameFrame/ObjectiveCartouche.tsx',
  'src/ui/idleVillage/components/gameFrame/HudRecenterButton.tsx',
  'src/ui/idleVillage/components/gameFrame/HudPanelsMenu.tsx',
  'src/ui/idleVillage/components/gameFrame/WhenWhereCluster.tsx',
  'src/ui/idleVillage/components/gameFrame/MapQuestPoi.tsx',
];
const TOKEN_FILES = [
  ...STRICT_FILES,
  'src/ui/idleVillage/components/gameFrame/GameFrame.tsx',
  'src/ui/idleVillage/components/gameFrame/HudEventLedger.tsx',
  'src/ui/idleVillage/components/gameFrame/DirectorPanel.tsx',
  'src/ui/idleVillage/skins/skinScope.css',
];

describe('HUD guards', () => {
  it('defines every --skin-hud-* token that the HUD files read', () => {
    const missing: string[] = [];
    for (const file of TOKEN_FILES) {
      for (const match of read(file).matchAll(/var\((--skin-hud-[a-z0-9-]+)/g)) {
        if (!(match[1] in BASE_SKIN_CSS_VARS)) missing.push(`${file}: ${match[1]}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('keeps colour literals out of the HUD files built on the material', () => {
    const offenders: string[] = [];
    for (const file of STRICT_FILES) {
      const code = stripComments(read(file));
      const literal = code.match(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/g);
      if (literal) offenders.push(`${file}: ${[...new Set(literal)].join(' ')}`);
    }
    expect(offenders).toEqual([]);
  });

  it('never sets text under 12px in the HUD files', () => {
    const offenders: string[] = [];
    const files = [...STRICT_FILES, 'src/ui/idleVillage/components/gameFrame/HudEventLedger.tsx', 'src/ui/idleVillage/components/gameFrame/ResourceReadout.tsx'];
    for (const file of files) {
      const code = stripComments(read(file));
      for (const match of code.matchAll(/fontSize:\s*'?(\d+(?:\.\d+)?)(?:px)?'?(?![\d.]|em|rem|%)|font-size:\s*(\d+(?:\.\d+)?)px|text-\[(\d+(?:\.\d+)?)px\]/g)) {
        const size = Number(match[1] ?? match[2] ?? match[3]);
        if (size < 12) offenders.push(`${file}: ${match[0]}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('keeps the HUD controls role in skinScope.css free of colour literals', () => {
    const css = stripComments(read('src/ui/idleVillage/skins/skinScope.css'));
    const start = css.indexOf('[data-hud-controls]');
    expect(start).toBeGreaterThan(-1);
    const block = css.slice(start, css.indexOf('.skin-scope :where([data-skin="cta"])', start));
    expect(block.match(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/g)).toBeNull();
  });
});
