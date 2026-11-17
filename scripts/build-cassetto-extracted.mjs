#!/usr/bin/env node
/**
 * R-353 — bake della variante "estratta" della colonna cassetto.
 *
 * Sorgente: column-{1440,1280}.webp (arte firmata R-323, immutata).
 * Spec: src/balancing/config/idleVillage/cassettoExtractedEdge.json
 *   (tutto in design px sul reticolo artW x artH, Director pick).
 *
 * Pipeline:
 * 1) chirurgia sinistra + festone top-right — eraseRects (dest-out) su
 *    filigrana/smeraldo/ciondoli e sul "pezzo d'oro che scende cn i
 *    ciondoli" (Director: rigenerare pulito); barTile ripavimenta la
 *    barra gold; patchRects rattoppano i buchi con lacca piana.
 * 2) pezzi — `pieces` (angolo top-left = bottom-left specchiato flipV,
 *    feather+gamma contro la cucitura di tono).
 * 3) crop bilaterale — leftCutPx (sx) + edgeClipPx (dx, filo schermo).
 * 4) stretch orizzontale x wideFactor — "tutte le aree anche all'interno
 *    ... + grande a sinistra" (Director 2026-11-16).
 * 5) restore — elementi pittorici (teschio, forziere, placca CONFIRM)
 *    ricomposti 1:1 sopra il ghost stirato: patch lacca + icona centrata.
 *    Le zone DOM omologhe restano non-stirate (drawer.unstretchedZones).
 *
 * Nota sharp: extract gira prima di composite nella pipeline interna —
 * crop e composite vanno in chiamate sharp separate.
 *
 * Output:  column-{1440,1280}-extracted.webp.
 * Uso: node scripts/build-cassetto-extracted.mjs
 */
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const spec = JSON.parse(readFileSync(join(root, 'src/balancing/config/idleVillage/cassettoExtractedEdge.json'), 'utf8'));

const VARIANTS = {
  '1440': { src: 'column-1440.webp', out: 'column-1440-extracted.webp', imgW: 840, imgH: 1800, artW: 753, artH: 1613 },
  '1280': { src: 'column-1280.webp', out: 'column-1280-extracted.webp', imgW: 800, imgH: 1600, artW: 806, artH: 1613 },
};
const DIR = join(root, 'public/assets/ui/hud-real/cassetto');

/** Rampa alpha sui bordi (img px) — diffonde la cucitura su arte sottostante. */
async function featherBuf(buf, f) {
  const meta = await sharp(buf).metadata();
  const mw = meta.width, mh = meta.height;
  const fL = f.left ?? 0, fR = f.right ?? 0, fT = f.top ?? 0, fB = f.bottom ?? 0;
  if (!fL && !fR && !fT && !fB) return buf;
  const mask = Buffer.alloc(mw * mh * 4);
  for (let y = 0; y < mh; y++) for (let x = 0; x < mw; x++) {
    let a = 255;
    if (fL) a = Math.min(a, Math.round(255 * x / fL));
    if (fR) a = Math.min(a, Math.round(255 * (mw - 1 - x) / fR));
    if (fT) a = Math.min(a, Math.round(255 * y / fT));
    if (fB) a = Math.min(a, Math.round(255 * (mh - 1 - y) / fB));
    const i = (y * mw + x) * 4;
    mask[i] = mask[i + 1] = mask[i + 2] = 255; mask[i + 3] = a;
  }
  const maskPng = await sharp(mask, { raw: { width: mw, height: mh, channels: 4 } }).png().toBuffer();
  return sharp(buf).composite([{ input: maskPng, blend: 'dest-in' }]).png().toBuffer();
}

for (const [key, v] of Object.entries(VARIANTS)) {
  const kx = v.imgW / v.artW, ky = v.imgH / v.artH;
  const srcPath = join(DIR, v.src);
  const clipImg = Math.round(spec.edgeClipPx[key] * kx);
  const leftCutImg = Math.round(spec.leftCutPx[key] * kx);
  const wide = spec.wideFactor;

  const composites = [];

  // — 1a: erase rects (dest-out) —
  const lt = spec.leftTrim?.[key];
  if (lt) {
    for (const r of lt.eraseRects ?? []) {
      const rect = await sharp({
        create: {
          width: Math.max(1, Math.round(r.w * kx)),
          height: Math.max(1, Math.round(r.h * ky)),
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 255 },
        },
      }).png().toBuffer();
      composites.push({ input: rect, left: Math.round(r.x * kx), top: Math.round(r.y * ky), blend: 'dest-out' });
    }
    // — 1b: barTile — la corsa pulita della barra ripetuta sugli stub —
    if (lt.barTile) {
      const t = lt.barTile;
      if (t.srcImage) {
        // striscia da file esterno (px): unica pasta stirata a tutta altezza — niente repeat = zero banding
        const meta = await sharp(t.srcImage).metadata();
        const strip = await sharp(t.srcImage)
          .resize(meta.width, Math.round((t.destY1 - t.destY0) * ky), { fit: 'fill' })
          .toBuffer();
        composites.push({ input: strip, left: Math.round(t.destX * kx), top: Math.round(t.destY0 * ky) });
      } else {
        const strip = await sharp(srcPath)
          .extract({ left: Math.round(t.srcX * kx), top: Math.round(t.srcY * ky),
                     width: Math.round(t.srcW * kx), height: Math.round(t.srcH * ky) })
          .toBuffer();
        for (let y = t.destY0; y < t.destY1; y += t.srcH) {
          composites.push({ input: strip, left: Math.round(t.destX * kx), top: Math.round(y * ky) });
        }
      }
    }
    // — 1c: patchRects — rattoppi di lacca piana sulle cancellazioni —
    for (const p of lt.patchRects ?? []) {
      let patch = await sharp(srcPath)
        .extract({ left: Math.round(p.src.x * kx), top: Math.round(p.src.y * ky),
                   width: Math.round(p.src.w * kx), height: Math.round(p.src.h * ky) })
        .resize(Math.max(1, Math.round(p.dest.w * kx)), Math.max(1, Math.round(p.dest.h * ky)), { fit: 'fill' })
        .toBuffer();
      if (p.feather) patch = await featherBuf(patch, {
        left: Math.round((p.feather.left ?? 0) * kx), right: Math.round((p.feather.right ?? 0) * kx),
        top: Math.round((p.feather.top ?? 0) * ky), bottom: Math.round((p.feather.bottom ?? 0) * ky),
      });
      composites.push({ input: patch, left: Math.round(p.dest.x * kx), top: Math.round(p.dest.y * ky) });
    }
  }

  // — 2: pezzi ricomposti (angolo top-left specchiato, feather/gamma; srcImage = file esterno con alpha già bakata) —
  for (const pc of spec.pieces[key] ?? []) {
    let buf;
    if (pc.srcImage) {
      buf = await sharp(pc.srcImage)
        .resize(Math.round(pc.destW * kx), Math.round(pc.destH * ky), { fit: 'fill' })
        .toBuffer();
    } else {
      buf = await sharp(srcPath)
        .extract({ left: Math.round(pc.src.x * kx), top: Math.round(pc.src.y * ky),
                   width: Math.round(pc.src.w * kx), height: Math.round(pc.src.h * ky) })
        .toBuffer();
    }
    if (pc.flipH) buf = await sharp(buf).flop().toBuffer();
    if (pc.flipV) buf = await sharp(buf).flip().toBuffer();
    if (pc.feather) buf = await featherBuf(buf, {
      left: Math.round((pc.feather.left ?? 0) * kx), right: Math.round((pc.feather.right ?? 0) * kx),
      top: Math.round((pc.feather.top ?? 0) * ky), bottom: Math.round((pc.feather.bottom ?? 0) * ky),
    });
    if (pc.brighten) buf = await sharp(buf).modulate({ brightness: pc.brighten }).toBuffer();
    if (pc.gamma) buf = await sharp(buf).gamma(pc.gamma).toBuffer();
    composites.push({ input: buf, left: Math.round(pc.dest.x * kx), top: Math.round(pc.dest.y * ky) });
  }

  // — 3: composite su tela piena, POI crop bilaterale —
  const visW = v.imgW - leftCutImg - clipImg;
  const composited = await sharp(srcPath).composite(composites).png().toBuffer();
  const extracted = await sharp(composited)
    .extract({ left: leftCutImg, top: 0, width: visW, height: v.imgH })
    .png().toBuffer();

  // — 4: stretch orizzontale x wideFactor —
  const wideW = Math.round(visW * wide);
  let out = await sharp(extracted)
    .resize(wideW, v.imgH, { fit: 'fill', kernel: 'lanczos3' })
    .png().toBuffer();

  // — 5: restore — elementi pittorici ricomposti 1:1 sul ghost stirato —
  const restComp = [];
  for (const r of spec.restore?.[key] ?? []) {
    const sx = Math.round(r.src.x * kx), sy = Math.round(r.src.y * ky);
    const sw = Math.round(r.src.w * kx), sh = Math.round(r.src.h * ky);
    const gx = Math.round((sx - leftCutImg) * wide), gy = sy;
    const gw = Math.round(sw * wide);
    // patch lacca (da sorgente, stirata al ghost) con feather
    const p = r.patch;
    let patch = await sharp(srcPath)
      .extract({ left: Math.round(p.x * kx), top: Math.round(p.y * ky),
                 width: Math.round(p.w * kx), height: Math.round(p.h * ky) })
      .resize(gw, sh, { fit: 'fill' }).toBuffer();
    if (r.feather) patch = await featherBuf(patch, { left: r.feather, right: r.feather, top: r.feather, bottom: r.feather });
    restComp.push({ input: patch, left: gx, top: gy });
    // icona originale 1:1 centrata sul ghost
    const icon = await sharp(srcPath).extract({ left: sx, top: sy, width: sw, height: sh }).png().toBuffer();
    restComp.push({ input: icon, left: gx + Math.round((gw - sw) / 2), top: gy });
  }
  out = await sharp(out).composite(restComp).webp({ quality: 92 }).toBuffer();

  const { writeFileSync } = await import('node:fs');
  writeFileSync(join(DIR, v.out), out);

  console.log(`${v.out}: ${wideW}x${v.imgH}px (leftCut ${leftCutImg}, clip ${clipImg}, x${wide}, ${(spec.pieces[key] ?? []).length} pezzi, ${restComp.length / 2} restore)`);
}
