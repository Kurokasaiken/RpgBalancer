#!/usr/bin/env node
/**
 * kit-piece-verify — canonical alpha-cut + metrics + compare sheet for zanara kit pieces.
 *
 * Cut: flood-fill from image borders over near-navy pixels (canonical fix for the
 * "verdi cancellati" chroma-key bug — interior dark enamel stays opaque).
 *
 * Kinds (--kind):
 *   ring      portrait ring: outer bg + enclosed navy hole keyed out (default)
 *   ring-full solid medallion (emblem, seal, dial): outer bg only, NO hole
 *   plaque    outer bg only, crop to piece bbox +4% margin
 *   vtile     like plaque + vertical seam metric (top vs bottom edge) + x3 stack preview
 *   tile      NO cut (texture fills frame): centered square crop, seam on both axes, 3x3 preview
 *   sheet     outer bg, connected components → per-item crops <label>-item-<n>.png + count
 *
 * Usage:
 *   node scripts/kit-piece-verify.mjs --kind <kind> --sheet <out.png> --alpha-dir <dir> \
 *     --labels v1,v2 [--real-h 56] [--box 224x224] img1.png img2.png ...
 *
 * Emits: <alpha-dir>/<label>-alpha.png, <sheet>, <sheet base>.json metrics.
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const argv = process.argv.slice(2);
const opts = {};
const images = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i].startsWith('--')) opts[argv[i].slice(2)] = argv[++i];
  else images.push(argv[i]);
}
const KIND = opts.kind || 'ring';
const sheetOut = opts.sheet;
const alphaDir = opts['alpha-dir'];
const labels = (opts.labels || '').split(',').filter(Boolean);
const REALH = parseInt(opts['real-h'] || '56', 10);
const [BOXW, BOXH] = (opts.box || '224x224').split('x').map(Number);
const TOL = 42;

if (!sheetOut || !alphaDir || images.length === 0) {
  console.error('need --sheet, --alpha-dir and >=1 image'); process.exit(2);
}
fs.mkdirSync(alphaDir, { recursive: true });

function hueOf(r, g, b) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  if (d === 0) return -1;
  let h;
  if (mx === r) h = ((g - b) / d) % 6;
  else if (mx === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}

/** Flood fill over `mask` seeded from given pixels. Returns visited set. */
function flood(mask, seeds, W, H) {
  const seen = new Uint8Array(W * H);
  const stack = [];
  for (const p of seeds) if (mask[p] && !seen[p]) { seen[p] = 1; stack.push(p); }
  while (stack.length) {
    const p = stack.pop(), x = p % W, y = (p / W) | 0;
    for (const q of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, y > 0 ? p - W : -1, y < H - 1 ? p + W : -1])
      if (q >= 0 && mask[q] && !seen[q]) { seen[q] = 1; stack.push(q); }
  }
  return seen;
}

/** Connected components (4-conn) over a binary mask. Returns [{px[],x0,y0,x1,y1,area,cx,cy}] */
function components(mask, W, H, minArea) {
  const seen = new Uint8Array(W * H);
  const out = [];
  for (let p = 0; p < W * H; p++) {
    if (!mask[p] || seen[p]) continue;
    const st = [p]; seen[p] = 1;
    let x0 = W, y0 = H, x1 = 0, y1 = 0, area = 0, sx = 0, sy = 0;
    while (st.length) {
      const q = st.pop(), x = q % W, y = (q / W) | 0;
      area++; sx += x; sy += y;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      for (const r of [x > 0 ? q - 1 : -1, x < W - 1 ? q + 1 : -1, y > 0 ? q - W : -1, y < H - 1 ? q + W : -1])
        if (r >= 0 && mask[r] && !seen[r]) { seen[r] = 1; st.push(r); }
    }
    if (area >= minArea) out.push({ x0, y0, x1, y1, area, cx: sx / area, cy: sy / area });
  }
  return out;
}

async function inspect(src, label) {
  const { data, info } = await sharp(src).raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, C = info.channels, N = W * H;
  const at = (x, y) => (y * W + x) * C;
  const cs = [];
  for (const [cx, cy] of [[2, 2], [W - 10, 2], [2, H - 10], [W - 10, H - 10]])
    for (let y = cy; y < cy + 8; y++) for (let x = cx; x < cx + 8; x++) cs.push(at(x, y));
  const med = (arr, off) => arr.map(i => data[i + off]).sort((a, b) => a - b)[cs.length >> 1];
  const bg = [med(cs, 0), med(cs, 1), med(cs, 2)];

  const noCut = KIND === 'tile';
  const nearBg = new Uint8Array(N);
  if (!noCut) for (let p = 0; p < N; p++) {
    const i = p * C;
    const d = Math.abs(data[i] - bg[0]) + Math.abs(data[i + 1] - bg[1]) + Math.abs(data[i + 2] - bg[2]);
    nearBg[p] = d <= TOL ? 1 : 0;
  }
  const seeds = [];
  if (!noCut) {
    for (let x = 0; x < W; x++) { seeds.push(x); seeds.push((H - 1) * W + x); }
    for (let y = 0; y < H; y++) { seeds.push(y * W); seeds.push(y * W + W - 1); }
  }
  const outer = noCut ? new Uint8Array(N) : flood(nearBg, seeds, W, H);

  // hole: only for kind 'ring' — nearBg component at image centre
  const hole = new Uint8Array(N);
  if (KIND === 'ring') {
    const c0 = (H >> 1) * W + (W >> 1);
    if (nearBg[c0] && !outer[c0]) {
      const h = flood(nearBg.map((v, i) => (v && !outer[i] ? 1 : 0)), [c0], W, H);
      h.forEach((v, i) => { if (v) hole[i] = 1; });
    }
  }

  const isOpaque = (p) => (noCut ? true : !outer[p] && !hole[p]);
  const px = new Uint8ClampedArray(N * 4);
  let minX = W, minY = H, maxX = 0, maxY = 0, holePx = 0;
  let hx0 = W, hy0 = H, hx1 = 0, hy1 = 0, innerNavy = 0;
  const alphaIdx = [];
  for (let p = 0; p < N; p++) {
    const i = p * C, a = isOpaque(p) ? 255 : 0;
    px[p * 4] = data[i]; px[p * 4 + 1] = data[i + 1]; px[p * 4 + 2] = data[i + 2]; px[p * 4 + 3] = a;
    const x = p % W, y = (p / W) | 0;
    if (a) { alphaIdx.push(p); if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
    if (hole[p]) { holePx++; if (x < hx0) hx0 = x; if (x > hx1) hx1 = x; if (y < hy0) hy0 = y; if (y > hy1) hy1 = y; }
    if (!noCut && nearBg[p] && !outer[p] && !hole[p]) innerNavy++;
  }
  const bboxW = maxX - minX + 1, bboxH = maxY - minY + 1, dia = Math.max(bboxW, bboxH);
  const edges = [];
  if (minX <= 2) edges.push('left'); if (maxX >= W - 3) edges.push('right');
  if (minY <= 2) edges.push('top'); if (maxY >= H - 3) edges.push('bottom');

  // metrics: crest hue / purple / brown
  const lums = alphaIdx.map(p => { const i = p * C; return 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]; });
  const lth = lums.length ? lums.slice().sort((a, b) => a - b)[Math.floor(lums.length * 0.9)] : 255;
  const crestHues = [];
  let purple = 0, brown = 0;
  alphaIdx.forEach((p, k) => {
    const i = p * C, r = data[i], g = data[i + 1], b = data[i + 2];
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    const sat = mx ? (mx - mn) / mx : 0;
    const lum = mx / 255;
    const h = hueOf(r, g, b);
    if (h >= 255 && h <= 330 && sat > 0.25 && mx > 60) purple++;
    if (h >= 15 && h <= 35 && sat < 0.55 && lum < 0.45) brown++;
    if (lums[k] >= lth && sat > 0.15 && h >= 0) crestHues.push(h);
  });
  crestHues.sort((a, b) => a - b);
  const medHue = crestHues.length ? crestHues[crestHues.length >> 1] : null;
  const inBand = crestHues.filter(h => h >= 35 && h <= 45).length;
  const over50 = crestHues.filter(h => h > 50).length;

  // crop rect
  let crop;
  if (KIND === 'ring' || KIND === 'ring-full') {
    const side = Math.round(dia * 1.06);
    const cx = minX + bboxW / 2, cy = minY + bboxH / 2;
    crop = {
      left: Math.max(0, Math.min(W - side, Math.round(cx - side / 2))),
      top: Math.max(0, Math.min(H - side, Math.round(cy - side / 2))),
      width: side, height: side,
    };
    crop.width = Math.min(crop.width, W - crop.left); crop.height = Math.min(crop.height, H - crop.top);
  } else if (KIND === 'tile') {
    const side = Math.min(W, H);
    crop = { left: Math.round((W - side) / 2), top: Math.round((H - side) / 2), width: side, height: side };
  } else if (KIND === 'sheet') {
    crop = { left: 0, top: 0, width: W, height: H };
  } else { // plaque, vtile: bbox + 4%
    const mxp = Math.round(bboxW * 0.04), myp = Math.round(bboxH * 0.04);
    crop = {
      left: Math.max(0, minX - mxp), top: Math.max(0, minY - myp),
      width: Math.min(W, maxX + mxp + 1) - Math.max(0, minX - mxp),
      height: Math.min(H, maxY + myp + 1) - Math.max(0, minY - myp),
    };
  }

  const rgbaImg = sharp(px, { raw: { width: W, height: H, channels: 4 } });
  const cropped = await rgbaImg.clone().extract(crop).png().toBuffer();

  // seam metric: mean |diff| between opposite edge bands of the crop (0-255)
  let seamV = null, seamH = null;
  if (KIND === 'vtile' || KIND === 'tile') {
    const { data: cd, info: ci } = await sharp(cropped).raw().toBuffer({ resolveWithObject: true });
    const cw = ci.width, ch = ci.height, cc = ci.channels, band = Math.min(4, Math.floor(ch / 8) || 1);
    let dv = 0, dn = 0;
    for (let y = 0; y < band; y++) for (let x = 0; x < cw; x++) {
      const a = (y * cw + x) * cc, b = ((ch - 1 - y) * cw + x) * cc;
      dv += Math.abs(cd[a] - cd[b]) + Math.abs(cd[a + 1] - cd[b + 1]) + Math.abs(cd[a + 2] - cd[b + 2]); dn += 3;
    }
    seamV = +(dv / dn).toFixed(2);
    if (KIND === 'tile') {
      let dh = 0; dn = 0;
      for (let y = 0; y < ch; y++) for (let x = 0; x < band; x++) {
        const a = (y * cw + x) * cc, b = (y * cw + (cw - 1 - x)) * cc;
        dh += Math.abs(cd[a] - cd[b]) + Math.abs(cd[a + 1] - cd[b + 1]) + Math.abs(cd[a + 2] - cd[b + 2]); dn += 3;
      }
      seamH = +(dh / dn).toFixed(2);
    }
  }

  // sheet items
  let items = [];
  if (KIND === 'sheet') {
    const amask = new Uint8Array(N);
    for (let p = 0; p < N; p++) amask[p] = isOpaque(p) ? 1 : 0;
    items = components(amask, W, H, Math.max(1500, N * 0.002));
    // row-major: cluster by cy (median height), then x
    const mh = items.map(i => i.y1 - i.y0).sort((a, b) => a - b)[items.length >> 1] || 1;
    items.sort((a, b) => (Math.abs(a.cy - b.cy) > mh * 0.6 ? a.cy - b.cy : a.cx - b.cx));
    for (let n = 0; n < items.length; n++) {
      const it = items[n], m = 4;
      const ic = {
        left: Math.max(0, it.x0 - m), top: Math.max(0, it.y0 - m),
        width: Math.min(W, it.x1 + m + 1) - Math.max(0, it.x0 - m),
        height: Math.min(H, it.y1 + m + 1) - Math.max(0, it.y0 - m),
      };
      items[n].file = path.join(alphaDir, `${label}-item-${n + 1}.png`);
      await rgbaImg.clone().extract(ic).png().toFile(items[n].file);
    }
  }

  const alphaFile = path.join(alphaDir, `${label}-alpha.png`);
  fs.writeFileSync(alphaFile, cropped);
  return {
    label, src, W, H, bg,
    ring: (KIND === 'ring' || KIND === 'ring-full') ? { cx: minX + bboxW / 2, cy: minY + bboxH / 2, dia, bboxW, bboxH } : { bboxW, bboxH, dia },
    hole: holePx ? { dia: Math.max(hx1 - hx0 + 1, hy1 - hy0 + 1), px: holePx } : null,
    crestHue: { median: medHue ? +medHue.toFixed(1) : null, pct35_45: +(100 * inBand / (crestHues.length || 1)).toFixed(1), pctOver50: +(100 * over50 / (crestHues.length || 1)).toFixed(1) },
    purpleFrac: +(100 * purple / (alphaIdx.length || 1)).toFixed(3),
    brownFrac: +(100 * brown / (alphaIdx.length || 1)).toFixed(3),
    innerNavyFrac: +(100 * innerNavy / (alphaIdx.length || 1)).toFixed(2),
    edgesTouched: edges,
    seamV, seamH,
    itemCount: KIND === 'sheet' ? items.length : null,
    items: items.map(i => ({ w: i.x1 - i.x0 + 1, h: i.y1 - i.y0 + 1, area: i.area, file: i.file })),
    alphaFile, cropped,
  };
}

const results = [];
for (let i = 0; i < images.length; i++) {
  const r = await inspect(images[i], labels[i] || `v${i + 1}`);
  results.push(r);
}

// ---- compare sheet -------------------------------------------------------
const PAD = 16, LBL = 20;
const zone2H = (KIND === 'vtile' || KIND === 'tile') ? REALH * 3 + 8 : REALH + 8;
const colW = BOXW + PAD;
const sheetW = results.length * colW + PAD;
const sheetH = LBL + BOXH + 6 + zone2H + 2 * LBL + PAD;
const embeds = [];
for (let i = 0; i < results.length; i++) {
  const r = results[i];
  const x0 = PAD / 2 + i * colW;
  const head = KIND === 'sheet' ? `${r.label} · ${r.itemCount} el.` :
    KIND === 'tile' ? `${r.label} · ${r.ring.bboxW}²` :
    `${r.label} · ${r.ring.bboxW}×${r.ring.bboxH}`;
  embeds.push(`<text x="${x0 + BOXW / 2}" y="${LBL - 6}" fill="#d8c890" font-size="13" font-family="monospace" text-anchor="middle">${head}</text>`);
  // big preview: fit inside BOXW×BOXH
  const cm = await sharp(r.cropped).metadata();
  const fit = Math.min(BOXW / cm.width, BOXH / cm.height, 1.5);
  const bw = Math.round(cm.width * fit), bh = Math.round(cm.height * fit);
  const big = (await sharp(r.cropped).resize(bw, bh).png().toBuffer()).toString('base64');
  embeds.push(`<rect x="${x0}" y="${LBL}" width="${BOXW}" height="${BOXH}" fill="#0d1c2b"/>`);
  embeds.push(`<image x="${x0 + (BOXW - bw) / 2}" y="${LBL + (BOXH - bh) / 2}" width="${bw}" height="${bh}" href="data:image/png;base64,${big}"/>`);
  const y2 = LBL + BOXH + 6;
  if (KIND === 'vtile') {
    const rep = await sharp(r.cropped).resize(Math.round(cm.width * REALH / cm.height), REALH).png().toBuffer();
    const rm = await sharp(rep).metadata();
    const stack = await sharp({ create: { width: rm.width, height: REALH * 3, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: rep, top: 0, left: 0 }, { input: rep, top: REALH, left: 0 }, { input: rep, top: REALH * 2, left: 0 }]).png().toBuffer();
    embeds.push(`<image x="${x0 + (BOXW - rm.width) / 2}" y="${y2}" width="${rm.width}" height="${REALH * 3}" href="data:image/png;base64,${stack.toString('base64')}"/>`);
  } else if (KIND === 'tile') {
    const cell = REALH;
    const t = await sharp(r.cropped).resize(cell, cell).png().toBuffer();
    const grid = await sharp({ create: { width: cell * 3, height: cell * 3, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([...Array(9)].map((_, k) => ({ input: t, top: ((k / 3) | 0) * cell, left: (k % 3) * cell }))).png().toBuffer();
    embeds.push(`<image x="${x0 + (BOXW - cell * 3) / 2}" y="${y2}" width="${cell * 3}" height="${cell * 3}" href="data:image/png;base64,${grid.toString('base64')}"/>`);
  } else {
    const smallSrc = (KIND === 'sheet' && r.items.length && r.items[0].file)
      ? await sharp(r.items[0].file).png().toBuffer()
      : r.cropped;
    const s0 = await sharp(smallSrc).metadata();
    const sh = await sharp(smallSrc).resize(Math.round(s0.width * REALH / s0.height), REALH).png().toBuffer();
    const sm = await sharp(sh).metadata();
    embeds.push(`<image x="${x0 + (BOXW - sm.width) / 2}" y="${y2 + (zone2H - REALH) / 2}" width="${sm.width}" height="${REALH}" href="data:image/png;base64,${sh.toString('base64')}"/>`);
    embeds.push(`<text x="${x0 + BOXW / 2}" y="${y2 + zone2H - 2}" fill="#7d94a8" font-size="10" font-family="monospace" text-anchor="middle">h=${REALH}px</text>`);
  }
  const m1 = `hue ${r.crestHue.median}° ·35-45:${r.crestHue.pct35_45}% >50:${r.crestHue.pctOver50}%`;
  const m2 = `brn ${r.brownFrac}% purp ${r.purpleFrac}%${r.seamV != null ? ` seamV ${r.seamV}` : ''}${r.seamH != null ? ` seamH ${r.seamH}` : ''}${r.edgesTouched.length ? ' edge:' + r.edgesTouched.join('+') : ''}${+r.innerNavyFrac > 0.5 ? ` innerNavy ${r.innerNavyFrac}%` : ''}`;
  const my = y2 + zone2H;
  embeds.push(`<text x="${x0 + BOXW / 2}" y="${my + LBL - 6}" fill="#9fb4c8" font-size="10" font-family="monospace" text-anchor="middle">${m1}</text>`);
  embeds.push(`<text x="${x0 + BOXW / 2}" y="${my + 2 * LBL - 8}" fill="#7d94a8" font-size="10" font-family="monospace" text-anchor="middle">${m2}</text>`);
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${sheetW}" height="${sheetH}"><rect width="100%" height="100%" fill="#0a1622"/>${embeds.join('')}</svg>`;
await sharp(Buffer.from(svg)).png().toFile(sheetOut);
fs.writeFileSync(sheetOut.replace(/\.png$/, '.json'), JSON.stringify(results.map(({ cropped, ...m }) => m), null, 2));
for (const r of results) {
  console.log(`${r.label}: ${r.ring.bboxW}×${r.ring.bboxH}${r.hole ? ' holeØ' + r.hole.dia : ''} hue ${r.crestHue.median}° 35-45:${r.crestHue.pct35_45}% >50:${r.crestHue.pctOver50}% brn:${r.brownFrac}% purp:${r.purpleFrac}%${r.seamV != null ? ' seamV:' + r.seamV : ''}${r.seamH != null ? ' seamH:' + r.seamH : ''}${r.itemCount != null ? ' items:' + r.itemCount : ''}${r.edgesTouched.length ? ' EDGE:' + r.edgesTouched.join('+') : ''}`);
}
console.log('SHEET', sheetOut);
