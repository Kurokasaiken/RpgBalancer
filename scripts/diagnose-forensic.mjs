import { createCanvas, loadImage } from '@napi-rs/canvas';
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import { basename, extname, join } from 'node:path';

const CANVAS_W = 4240;
const CANVAS_H = 2828;
const RADIUS = 3;
const ZOOM = 0.25;
const PREVIEW_W = 1280;
const PREVIEW_H = 720;

async function loadRgba(path) {
  const { data, info } = await sharp(path)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: info.channels };
}

async function savePng(path, width, height, channels, data) {
  await sharp(data, { raw: { width, height, channels } })
    .png({ compressionLevel: 9 })
    .toFile(path);
}

function copyBuffer(buf) {
  return Buffer.from(buf);
}

function alphaBleed(data, width, height, channels, radius) {
  const out = copyBuffer(data);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      if (out[i + 3] > 0) continue;
      let best = null;
      for (let dy = -radius; dy <= radius; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= width) continue;
          const j = (ny * width + nx) * channels;
          if (data[j + 3] === 0) continue;
          const d = dx * dx + dy * dy;
          if (!best || d < best.d) {
            best = { d, r: data[j], g: data[j + 1], b: data[j + 2] };
          }
        }
      }
      if (best) {
        out[i] = best.r;
        out[i + 1] = best.g;
        out[i + 2] = best.b;
      }
    }
  }
  return out;
}

function erodeAlpha(data, width, height, channels, radius) {
  const out = copyBuffer(data);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const a = data[i + 3];
      if (a === 0 || a === 255) continue;
      let killed = false;
      for (let dy = -radius; dy <= radius && !killed; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= width) continue;
          const j = (ny * width + nx) * channels;
          if (data[j + 3] === 0) {
            out[i + 3] = 0;
            killed = true;
            break;
          }
        }
      }
    }
  }
  return out;
}

function computeMetrics(data, width, height, channels) {
  let transparentCount = 0;
  let semiCount = 0;
  let transparentContaminationSum = 0;
  let semiContaminationSum = 0;
  const maxDist = Math.sqrt(3 * 255 * 255);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const a = data[i + 3];
      let sr = 0, sg = 0, sb = 0, n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          if (nx < 0 || nx >= width) continue;
          const j = (ny * width + nx) * channels;
          if (data[j + 3] > 0) {
            sr += data[j];
            sg += data[j + 1];
            sb += data[j + 2];
            n++;
          }
        }
      }
      if (n === 0) continue;
      const er = sr / n, eg = sg / n, eb = sb / n;
      if (a === 0) {
        transparentCount++;
        const dist = Math.hypot(data[i] - er, data[i + 1] - eg, data[i + 2] - eb);
        transparentContaminationSum += dist / maxDist;
      } else if (a < 255) {
        semiCount++;
        const f = a / 255;
        const dist = Math.hypot(data[i] - f * er, data[i + 1] - f * eg, data[i + 2] - f * eb);
        semiContaminationSum += dist / maxDist;
      }
    }
  }

  return {
    transparentEdgePixels: transparentCount,
    semiTransparentEdgePixels: semiCount,
    transparentEdgeContamination: transparentCount ? +(transparentContaminationSum / transparentCount).toFixed(4) : 0,
    semiTransparentEdgeContamination: semiCount ? +(semiContaminationSum / semiCount).toFixed(4) : 0,
  };
}

function silhouetteDelta(a, b, width, height, channels) {
  let changed = 0;
  let total = 0;
  for (let i = 0; i < width * height; i++) {
    const idx = i * channels;
    if (a[idx + 3] > 0 || b[idx + 3] > 0) {
      total++;
      if (Math.abs(a[idx + 3] - b[idx + 3]) > 10) changed++;
    }
  }
  return total ? +(changed / total).toFixed(6) : 0;
}

function diffPng(a, b, width, height, channels, threshold = 5) {
  const out = Buffer.alloc(width * height * 4, 0);
  for (let i = 0; i < width * height; i++) {
    const idx = i * channels;
    const outIdx = i * 4;
    const diff = Math.abs(a[idx] - b[idx])
      + Math.abs(a[idx + 1] - b[idx + 1])
      + Math.abs(a[idx + 2] - b[idx + 2])
      + Math.abs(a[idx + 3] - b[idx + 3]);
    if (diff > threshold) {
      out[outIdx] = 255;
      out[outIdx + 1] = 0;
      out[outIdx + 2] = 0;
      out[outIdx + 3] = 255;
    }
  }
  return out;
}

async function renderPreview(imgPath, bg, outPath) {
  const canvas = createCanvas(PREVIEW_W, PREVIEW_H);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, PREVIEW_W, PREVIEW_H);
  const img = await loadImage(imgPath);
  const dw = Math.round(CANVAS_W * ZOOM);
  const dh = Math.round(CANVAS_H * ZOOM);
  const dx = (PREVIEW_W - dw) / 2;
  const dy = (PREVIEW_H - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
  const buf = canvas.toBuffer('image/png');
  writeFileSync(outPath, buf);
}

async function main() {
  const inputPath = process.argv[2] || 'public/assets/world/wanderlust/base/layers/Montagne scure destra.png';
  const name = basename(inputPath, extname(inputPath));
  const outDir = join('diagnostics', name.replace(/\s+/g, '-').toLowerCase());
  const renderDir = join(outDir, 'render');
  const diffDir = join(outDir, 'diff');
  mkdirSync(outDir, { recursive: true });
  mkdirSync(renderDir, { recursive: true });
  mkdirSync(diffDir, { recursive: true });

  console.log(`Loading ${inputPath}...`);
  const { data, width, height, channels } = await loadRgba(inputPath);
  if (width !== CANVAS_W || height !== CANVAS_H) {
    throw new Error(`Image must be ${CANVAS_W}x${CANVAS_H} (full canvas), got ${width}x${height}`);
  }

  const rawPng = join(outDir, '00-raw.png');
  const bleedPng = join(outDir, '01-alpha-bleed.png');
  const erodePng = join(outDir, '02-erode.png');

  console.log('Saving raw...');
  await savePng(rawPng, width, height, channels, data);

  console.log('Applying alpha-bleed...');
  const bleedData = alphaBleed(data, width, height, channels, RADIUS);
  await savePng(bleedPng, width, height, channels, bleedData);

  console.log('Applying erode...');
  const erodeData = erodeAlpha(bleedData, width, height, channels, RADIUS);
  await savePng(erodePng, width, height, channels, erodeData);

  const metrics = {
    raw: computeMetrics(data, width, height, channels),
    alphaBleed: computeMetrics(bleedData, width, height, channels),
    erode: computeMetrics(erodeData, width, height, channels),
    deltas: {
      rawToBleed: silhouetteDelta(data, bleedData, width, height, channels),
      bleedToErode: silhouetteDelta(bleedData, erodeData, width, height, channels),
    },
    canvas: { width, height },
    zoom: ZOOM,
    renderSize: { width: PREVIEW_W, height: PREVIEW_H },
  };

  writeFileSync(join(outDir, 'report.json'), JSON.stringify(metrics, null, 2));

  console.log('Generating previews...');
  await renderPreview(rawPng, '#000000', join(renderDir, '00-raw-black.png'));
  await renderPreview(rawPng, '#ffffff', join(renderDir, '00-raw-white.png'));
  await renderPreview(bleedPng, '#000000', join(renderDir, '01-bleed-black.png'));
  await renderPreview(bleedPng, '#ffffff', join(renderDir, '01-bleed-white.png'));
  await renderPreview(erodePng, '#000000', join(renderDir, '02-erode-black.png'));
  await renderPreview(erodePng, '#ffffff', join(renderDir, '02-erode-white.png'));

  console.log('Generating diffs...');
  await savePng(join(diffDir, 'raw-vs-bleed.png'), width, height, 4, diffPng(data, bleedData, width, height, channels));
  await savePng(join(diffDir, 'bleed-vs-erode.png'), width, height, 4, diffPng(bleedData, erodeData, width, height, channels));

  console.log(`Done. Output in ${outDir}`);
  console.log(JSON.stringify(metrics, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
