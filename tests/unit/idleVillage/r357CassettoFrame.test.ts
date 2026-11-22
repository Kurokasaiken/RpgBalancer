/**
 * R-357 / PLAN-125 — cassetto frame residues baked out of the `-extracted` art.
 * The bake (scripts/build-cassetto-extracted.mjs, step 6 `cleanup`) removes
 * the stray rules/arrow/dot the stretch left in the wells and the translucent
 * glow with a hard edge above the top-left corner. Pixels are read from the
 * shipped asset, so a re-bake that drops the cleanup fails here.
 */
import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';

const ASSET = (k: string) => join(process.cwd(), 'public/assets/ui/hud-real/cassetto', `column-${k}-extracted.webp`);
const lumAt = (d: Buffer, w: number, ch: number, x: number, y: number) => d[(y * w + x) * ch] + d[(y * w + x) * ch + 1] + d[(y * w + x) * ch + 2];

describe('R-357 cassetto frame cleanup', () => {
  /* the baked-art residue tests (stray rules/arrow/dot, top-left haze) were retired with the baked column art (DOM drawer). */
  // INV:cassetto-cta-tips-intact — R-357 (Director 2026-11-18, error made twice): the CTA button is a standalone generated
  // piece (refs/button-launch-gemini.png): both arrow tips (left AND right) must survive in the baked asset.
  it('CTA button asset keeps BOTH arrow tips, symmetric, with a transparent ground', async () => {
    const { data, info } = await sharp(join(process.cwd(), 'public/assets/ui/hud-real/cassetto3/cta-plaque.webp')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const { width: w, height: h, channels: ch } = info;
    const opaqueIn = (x0: number, x1: number, y0: number, y1: number) => {
      let n = 0;
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (data[(y * w + x) * ch + 3] > 160) n++;
      return n;
    };
    const mid = Math.round(h * 0.5), band = Math.round(h * 0.12), edge = Math.round(w * 0.04);
    const left = opaqueIn(0, edge, mid - band, mid + band), right = opaqueIn(w - edge, w, mid - band, mid + band);
    expect(left, 'left tip spike at the leftmost 4%').toBeGreaterThan(20);
    expect(right, 'right tip spike at the rightmost 4%').toBeGreaterThan(20);
    expect(Math.abs(left - right) / Math.max(left, right), 'tips are symmetric').toBeLessThan(0.5);
    expect(data[3], 'top-left corner is transparent').toBeLessThan(10);
    expect(data[((h - 1) * w + (w - 1)) * ch + 3], 'bottom-right corner is transparent').toBeLessThan(10);
  });

  // INV:hud-real-cassetto.INV-7 — R-357 (Director 2026-11-21: «un pezzo nero che esce ad angolo» at frame top-left AND
  // bottom-left — BL is the same image with scaleY(-1)). Black opaque shards escaped the gold silhouette at the
  // arch→rail joint of frame-corner-tl.webp. The frame's outer edge must be gold or transparent: for every column
  // x>=240 (the joint band — the ornament cluster x<240 is painted filigree by design) no opaque DARK pixel may sit
  // above the column's first gold pixel inside the top rows. Reading the shipped asset: a regeneration that
  // reintroduces leading dark runs fails here.
  it('frame-corner-tl: no black shard above the gold silhouette at the arch→rail joint', async () => {
    const { data, info } = await sharp(join(process.cwd(), 'public/assets/ui/hud-real/slicekit/cassetto/frame-corner-tl.webp')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const { width: w, channels: ch } = info;
    const TOP = 20, X0 = 240, LUM_DARK = 115;
    const px = (x: number, y: number) => (y * w + x) * ch;
    const isGold = (x: number, y: number) => {
      const i = px(x, y), r = data[i], g = data[i + 1], b = data[i + 2], mx = Math.max(r, g, b);
      return data[i + 3] > 120 && r > g - 12 && r > b + 18 && mx > 105;
    };
    const isDark = (x: number, y: number) => {
      const i = px(x, y);
      return data[i + 3] > 120 && !isGold(x, y) && (data[i] + data[i + 1] + data[i + 2]) / 3 < LUM_DARK;
    };
    /* A shard = a contiguous run of dark pixels leading a column above its first gold. Webp re-encoding
     * jitters a few boundary pixels per save (measured ~9-11 px, runs ≤5): the bug was 157 px in runs to 16.
     * Thresholds sit an order of magnitude under the defect, above codec noise. */
    let shards = 0, maxRun = 0;
    for (let x = X0; x < w; x++) {
      let firstGold = TOP;
      for (let y = 0; y < TOP; y++) if (isGold(x, y)) { firstGold = y; break; }
      let run = 0;
      for (let y = 0; y < firstGold; y++) {
        if (isDark(x, y)) { run++; shards++; maxRun = Math.max(maxRun, run); } else run = 0;
      }
    }
    expect(shards, 'opaque dark px above the first gold (joint band, top edge)').toBeLessThanOrEqual(40);
    expect(maxRun, 'longest contiguous dark shard above the gold edge').toBeLessThanOrEqual(7);

    /* Under-arch side (Director 2026-11-21 bis: «parte esterna dell'angolo, una specie di triangolo nero»):
     * a translucent dark smudge dripped BELOW the gold teeth into open background. In the golden the space
     * under the arch is open background, so under each column's lowest gold pixel only gold/transparent may
     * exist. Buggy=631, fixed≈54 (webp boundary jitter). */
    const AX0 = 195, AX1 = 460, AY0 = 30, AY1 = 170;
    const isOpaqueLo = (x: number, y: number) => data[px(x, y) + 3] > 15;
    let under = 0;
    for (let x = AX0; x < AX1; x++) {
      let bot = -1;
      for (let y = AY0; y < AY1; y++) if (isGold(x, y)) bot = y;
      if (bot < 0) continue;
      for (let y = bot + 1; y < AY1; y++) if (isOpaqueLo(x, y) && !isGold(x, y)) under++;
    }
    expect(under, 'non-gold px below the arch teeth (under-arch protrusion)').toBeLessThanOrEqual(150);
  });

  // INV:hud-real-cassetto.INV-8 — R-357 (Director 2026-11-21: «nero tutto dietro il frame … in alto e in basso,
  // esterno al frame di sinistra», then «un angolo colorato invece di essere ritagliato … eliminarlo e basta»).
  // (a) The frame silhouette is CUT OUT: no DOM backing rect may sit under the lattice — it pokes outside the
  // organic edge as a coloured corner. The enamel stays at u(36). (b) A near-black anti-aliased fringe hugged the
  // OUTER silhouette of rail-mid-fold / frame-corner-tl (dark tendrils past the gold rim). Check (a) is a source
  // assertion; check (b) reads the shipped assets: dark px (lum<50, non-gold, non-gem) within ~2 px of EXTERIOR
  // transparency (connected to the image border) must stay at codec-jitter level.
  it('left frame is ritagliata (no DOM backing) and has no black halo on its outer silhouette', async () => {
    // (a) NO DOM backing may sit under the frame: the silhouette is ritagliata — outside it the world shows.
    // The enamel starts at u(36) (the inner edge): a backing rect from left:0 pokes outside the organic edge
    // as a coloured corner (Director 2026-11-21 quinquies: «un angolo colorato invece di essere ritagliato … eliminarlo e basta»).
    // The lattice gaps stay transparent («si vede sotto»); anything under them must carry no straight edge — the
    // vignette's left edge is therefore tucked under the opaque vines and masked off («quel quadrato», 2026-11-21).
    const src = readFileSync(join(process.cwd(), 'src/ui/idleVillage/hudReal/HudRealCassetto.tsx'), 'utf8');
    expect(/left: u\(36\)[\s\S]{0,300}paintedGround/.test(src), 'enamel stays inside the frame edge — nothing under the lattice').toBe(true);
    // and its straight left edge must be masked: seen through the lattice gaps it reads as a flat dark
    // rectangle running the full column height («il rettangolo … sia sopra che sotto», Director 2026-11-21).
    expect(/paintedGround\(\)[\s\S]{0,400}maskImage: `linear-gradient\(90deg/.test(src), 'enamel left edge dissolves under the ornament').toBe(true);
    expect(src).not.toContain('under-frame ground');

    // (b) exterior-silhouette halo on both frame pieces
    const haloCount = async (file: string) => {
      const { data, info } = await sharp(join(process.cwd(), 'public/assets/ui/hud-real/slicekit/cassetto', file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      const { width: w, height: h, channels: ch } = info;
      const px = (x: number, y: number) => (y * w + x) * ch;
      const transp = new Uint8Array(w * h);
      for (let i = 0; i < w * h; i++) transp[i] = data[i * ch + 3] <= 15 ? 1 : 0;
      // flood fill transparent px from the borders = EXTERIOR (map side)
      const ext = new Uint8Array(w * h);
      const q: number[] = [];
      const push = (x: number, y: number) => { const i = y * w + x; if (transp[i] && !ext[i]) { ext[i] = 1; q.push(i); } };
      for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
      for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
      while (q.length) {
        const i = q.pop()!, x = i % w, y = (i / w) | 0;
        if (x > 0) push(x - 1, y); if (x < w - 1) push(x + 1, y);
        if (y > 0) push(x, y - 1); if (y < h - 1) push(x, y + 1);
      }
      // dilate exterior by 2 (Chebyshev ~5x5 kernel)
      const near = new Uint8Array(ext);
      for (let pass = 0; pass < 2; pass++) {
        const src2 = near.slice();
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          if (src2[y * w + x]) continue;
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            const xx = x + dx, yy = y + dy;
            if (xx >= 0 && xx < w && yy >= 0 && yy < h && src2[yy * w + xx]) { near[y * w + x] = 1; dy = 9; break; }
          }
        }
      }
      let halo = 0;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (!near[i] || transp[i]) continue;
        const o = px(x, y), r = data[o], g = data[o + 1], b = data[o + 2], mx = Math.max(r, g, b);
        const gold = r > g - 12 && r > b + 18 && mx > 105;
        const gem = g > r * 1.15 && g > b * 1.25 && mx > 90;
        if (!gold && !gem && (r + g + b) / 3 < 50) halo++;
      }
      return halo;
    };
    /* buggy: rail 26, corner 518 — fixed: rail 0, corner ~285 (the residual is painted rim under the north bar,
     * invisible over the enamel). Thresholds split the populations. */
    expect(await haloCount('rail-mid-fold.webp'), 'rail outer-edge black fringe').toBeLessThanOrEqual(15);
    expect(await haloCount('frame-corner-tl.webp'), 'corner outer-edge black fringe').toBeLessThanOrEqual(400);
  });
});
