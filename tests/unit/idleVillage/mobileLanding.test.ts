/**
 * Regression guard for R-328: the root path `/` lands on the game surface
 * (GameMappa2Page) on every device — supersedes R-297/R-305, which had moved
 * the landing to `/mappa2-lab`. The wiring lives in `src/App.tsx`; this test
 * keeps the render branches from silently drifting back to a lab landing.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const APP_SRC = readFileSync('src/App.tsx', 'utf8');

describe('root landing wiring (R-328)', () => {
  it('routes the root path into the game-surface branch on every device', () => {
    expect(APP_SRC).toMatch(/isGameLandingPath\s*=\s*isGamePath\s*\|\|\s*isRootPath/);
  });

  it('renders GameMappa2Page for the game landing branch', () => {
    const branch = APP_SRC.indexOf('if (isGameLandingPath)');
    const render = APP_SRC.indexOf('<GameMappa2Page />', branch);
    expect(branch).toBeGreaterThan(-1);
    expect(render).toBeGreaterThan(branch);
  });

  it('renders Mappa2LabPage only on its own route, not on `/`', () => {
    expect(APP_SRC).toMatch(/if \(isMappa2LabPath\)/);
    expect(APP_SRC).not.toMatch(/isMappa2LabPath \|\| isLandingPath/);
    expect(APP_SRC).not.toMatch(/isMappa2LabPath \|\| isRootPath/);
  });

  it('does not canonicalize the URL to /mappa2-lab', () => {
    expect(APP_SRC).not.toContain("`/mappa2-lab${window.location.search}${window.location.hash}`");
  });

  it('keeps the game landing branch evaluated before the mappa2 branch', () => {
    const gameBranch = APP_SRC.indexOf('if (isGameLandingPath)');
    const mappa2Branch = APP_SRC.indexOf('if (isMappa2LabPath)');
    expect(gameBranch).toBeGreaterThan(-1);
    expect(mappa2Branch).toBeGreaterThan(-1);
    expect(gameBranch).toBeLessThan(mappa2Branch);
  });
});
