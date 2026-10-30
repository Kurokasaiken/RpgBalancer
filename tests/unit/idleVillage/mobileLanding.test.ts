/**
 * Regression guard for R-297: on mobile (`useIsMobile`, viewport ≤767px) the
 * root path `/` must land on the mappa2 lab page instead of the game frame.
 * The wiring lives in `src/App.tsx`; this test keeps the two render branches
 * from silently drifting back to "game frame on every device".
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const APP_SRC = readFileSync('src/App.tsx', 'utf8');

describe('mobile landing wiring (R-297)', () => {
  it('computes a mobile landing path from isMobile && isRootPath', () => {
    expect(APP_SRC).toMatch(/isMobileLandingPath\s*=\s*isMobile\s*&&\s*isRootPath/);
  });

  it('excludes the mobile landing path from the game-frame branch', () => {
    expect(APP_SRC).toMatch(/isRootPath && !isMobileLandingPath/);
  });

  it('renders Mappa2LabPage for the mobile landing path too', () => {
    expect(APP_SRC).toMatch(/isMappa2LabPath \|\| isMobileLandingPath/);
  });

  it('canonicalizes the URL to /mappa2-lab without a reload', () => {
    expect(APP_SRC).toContain('history.replaceState');
    expect(APP_SRC).toContain("'/mappa2-lab'");
  });

  it('keeps the game-frame branch evaluated before the mappa2 branch', () => {
    const gameBranch = APP_SRC.indexOf('isGameFramePixiPath || isGamePath');
    const mappa2Branch = APP_SRC.indexOf('isMappa2LabPath || isMobileLandingPath');
    expect(gameBranch).toBeGreaterThan(-1);
    expect(mappa2Branch).toBeGreaterThan(-1);
    expect(gameBranch).toBeLessThan(mappa2Branch);
  });
});
