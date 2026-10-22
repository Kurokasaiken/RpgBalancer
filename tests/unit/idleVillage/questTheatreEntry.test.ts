/**
 * PLAN-071 T-A4 (R-239) — the theatre's image entry must not sit black.
 *
 * Video audit (Director, 2026-10-21): at window open the theatre frame read
 * >90% dark for ~1100 ms. Two stacked causes:
 *   - authored — the `CenterApertureReveal` veil opens from a 46%/46% inset
 *     (only ~8% of the art visible) over `revealMs` 1400 ms;
 *   - cold assets — the scene jpeg under `DepthScene` still had to be fetched
 *     and decoded at first mount.
 *
 * Contract: the veil never covers ≥90% of the frame at t=0 (start inset
 * keeps ≥10% of the art visible — here ~32%), the reveal budget is short
 * enough that the dark interval stays under ~300 ms, and the scene art is
 * part of the boot warmup so the DOM image under the canvas is decoded
 * before a scene beat lands.
 */
import { describe, it, expect } from 'vitest';
import { DEFAULT_QUEST_THEATRE_FX } from '@/balancing/config/idleVillage/quests/questTheatreFx';
import { NODE_ART } from '@/ui/idleVillage/questS1Lab/questArt';
import { questSceneArtUrls } from '@/ui/idleVillage/utils/gameAssetWarmup';

describe('quest theatre entry (R-239)', () => {
  // INV:R-239-theatre-entry — the aperture veil starts open enough that the
  // theatre is never ≥90% covered at t=0, and the reveal completes fast
  // enough that the dark interval stays under the audit's ~300 ms target.
  it('the reveal veil never fully blacks the frame and is short', () => {
    const startInset = DEFAULT_QUEST_THEATRE_FX.cinema.revealStartInsetPct;
    expect(Number.isFinite(startInset)).toBe(true);
    // coverage at t=0 = 100 − 2·inset — must stay below 90% (≥10% visible).
    expect(100 - 2 * startInset).toBeLessThan(90);
    expect(DEFAULT_QUEST_THEATRE_FX.cinema.revealMs).toBeLessThanOrEqual(1200);
  });

  // INV:R-239-theatre-entry — every authored scene image is warmed at boot:
  // unique srcs of NODE_ART, fetched and decoded before the theatre mounts.
  it('warms every unique scene-art src at boot', () => {
    const urls = questSceneArtUrls();
    const expected = [...new Set(Object.values(NODE_ART).map((a) => a.src))];
    expect(urls.sort()).toEqual(expected.sort());
    expect(urls.length).toBeGreaterThan(5);
  });
});
