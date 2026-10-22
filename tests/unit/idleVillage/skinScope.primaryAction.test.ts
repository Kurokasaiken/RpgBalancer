/**
 * PLAN-067 T-B11 (R-234, BTN-1 = A) — the primary action is the family plate, not the CTA plaque.
 * The Director banned the plaque (clip-path cut, teal enamel, spring-scale) everywhere; the primary
 * action keeps its `data-skin="cta"` role but is drawn as the lacquer plate with a brass hairline.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (p: string) => fs.readFileSync(path.resolve(__dirname, '../../../', p), 'utf8');
const css = read('src/ui/idleVillage/skins/skinScope.css').replace(/\/\*[\s\S]*?\*\//g, '');
const ctaBody = (): string => {
  const m = /\.skin-scope :where\(\[data-skin="cta"\]\)\s*\{([^{}]*)\}/.exec(css);
  expect(m, 'primary action rule exists').toBeTruthy();
  return m![1];
};

describe('primary action — family plate (R-234, BTN-1 = A)', () => {
  // INV:R-234-primary-action-plate — no plaque: no clip-path cut, no enamel token, a brass hairline.
  it('is not the CTA plaque', () => {
    const body = ctaBody();
    expect(body).not.toMatch(/clip-path/);
    expect(body).not.toMatch(/--skin-cta-(clip|bg|border|shadow)/);
    expect(body).toMatch(/border:\s*1px solid/);
    expect(body).toMatch(/border-radius:\s*6px/);
  });

  it('does not spring-scale on hover (the plaque juice)', () => {
    const src = read('src/ui/idleVillage/skins/primitives/SkinButton.tsx');
    expect(src).not.toMatch(/whileHover/);
    expect(src).not.toMatch(/whileTap/);
  });
});
