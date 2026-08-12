#!/usr/bin/env node
/**
 * Generates wave marks that match the painted coastline idiom.
 *
 * Instead of smooth curves, the painted water is dense clusters of short, broken,
 * near-parallel white dashes with variable opacity — the artist's hand-drawn swell.
 * This script generates three variants using the same dash idiom, seeded for
 * deterministic output.
 */

import { existsSync, mkdirSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const OUT_DIR = 'public/assets/atmosphere/waves';
const POINTS_PATH = 'public/assets/atmosphere/terrain/points.json';
const CONFIG_PATH = 'src/ui/idleVillage/config/atmosphereAssets.ts';

/** Rasterised size of one mark, in px. */
const SPRITE_WIDTH = 320;
const SPRITE_HEIGHT = 134;

/**
 * Deterministic LCG for reproducible scatter.
 * Same seed always yields the same marks.
 */
function seededRandom(seed) {
  let s = seed;
  return () => (s = (s * 9301 + 49297) % 233280) / 233280;
}

/**
 * Three variants of painted-water idiom: dense clusters of dashes.
 *
 * Each variant uses a different seed and dash pattern, so repetition reads as
 * variation rather than tiling. All three use short, broken, nearly-parallel
 * white strokes with variable spacing and opacity — matching the artist's hand.
 */
function generateWaveSVG(variant) {
  const width = SPRITE_WIDTH;
  const height = SPRITE_HEIGHT;
  const rnd = seededRandom(variant * 117 + 13);

  let d = '';

  // Generate 4-6 horizontal bands of dashes.
  const bands = 4 + Math.floor(rnd() * 3);
  for (let b = 0; b < bands; b++) {
    const y = 14 + (b / bands) * (height - 28) + rnd() * 6;
    let x = 8;

    // Fill the band with dashes, leaving gaps.
    while (x < width - 20) {
      const len = 16 + rnd() * 28;
      const lift = 2 + rnd() * 4;
      const sw = (1.2 + rnd() * 1.1).toFixed(1);
      const op = (0.4 + rnd() * 0.55).toFixed(2);

      // Dash: short arc that dips slightly, like a swell line.
      d += `<path d="M${x.toFixed(0)},${y.toFixed(0)} q${(len / 2).toFixed(0)},-${lift.toFixed(0)} ${len.toFixed(0)},0" ` +
           `fill="none" stroke="#f5faf9" stroke-linecap="round" stroke-width="${sw}" opacity="${op}"/>`;

      x += len + 6 + rnd() * 18;
    }
  }

  // Overlay a few denser clusters (whitewater effect).
  const clusters = 1 + Math.floor(rnd() * 3);
  for (let c = 0; c < clusters; c++) {
    const cx = 20 + rnd() * (width - 40);
    const cy = 20 + rnd() * (height - 40);

    // Tight group of short dashes.
    for (let i = 0; i < 3 + Math.floor(rnd() * 2); i++) {
      const x = cx + rnd() * 40;
      const y = cy + rnd() * 30;
      const len = 10 + rnd() * 18;
      const sw = (1.4 + rnd() * 0.9).toFixed(1);
      const op = (0.6 + rnd() * 0.4).toFixed(2);
      d += `<path d="M${x.toFixed(0)},${y.toFixed(0)} q${(len / 2).toFixed(0)},-2 ${len.toFixed(0)},0" ` +
           `fill="none" stroke="#ffffff" stroke-linecap="round" stroke-width="${sw}" opacity="${op}"/>`;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${d}</svg>`;
}

async function main() {
  if (!existsSync(POINTS_PATH)) {
    throw new Error(`missing ${POINTS_PATH} — run scripts/build-terrain-masks.mjs first`);
  }
  const { sea } = JSON.parse(readFileSync(POINTS_PATH, 'utf8'));
  if (!sea?.length) throw new Error('points.json carries no open-sea points');

  if (existsSync(OUT_DIR)) rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(OUT_DIR, { recursive: true });

  const shapes = [];
  for (let i = 1; i <= 3; i++) {
    const svg = generateWaveSVG(i);
    const info = await sharp(Buffer.from(svg))
      .blur(0.8)
      .webp({ quality: 92, alphaQuality: 100 })
      .toFile(join(OUT_DIR, `wave_0${i}.webp`));
    console.log(`  ✓ wave_0${i}.webp  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(1)} KB`);
    shapes.push(i);
  }

  // Place marks on sea points, cycling through the three variants.
  const marks = sea.map((point, i) => {
    const shape = (i % shapes.length) + 1;
    const widths = [280, 340, 420];
    const rnd = seededRandom(i * 0.6180339887498949 + 0.31);
    const width = widths[Math.floor(rnd() * widths.length)];
    const markHeight = Math.round(width * (SPRITE_HEIGHT / SPRITE_WIDTH));

    return (
      `    { src: 'waves/wave_0${shape}.webp', x: ${point.x - Math.round(width / 2)}, ` +
      `y: ${point.y - Math.round(markHeight / 2)}, width: ${width}, height: ${markHeight}, ` +
      `delaySeconds: ${(((i * 0.77) % 1) * 100).toFixed(1)}, flip: ${((i * 0.19) % 1) > 0.5} },`
    );
  });

  const block = `  waves: {
    cycleSeconds: 46,
    visibleFraction: 0.16,
    opacity: 0.46,
    bobWorldPx: 3,
    marks: [
${marks.join('\n')}
    ],
  },
`;

  const current = readFileSync(CONFIG_PATH, 'utf8');
  const pattern = / {2}waves: \{[\s\S]*?\n {2}\},\n/;
  const next = pattern.test(current)
    ? current.replace(pattern, block)
    : current.replace(/\n\};\n$/, `\n${block}};\n`);
  if (next === current) throw new Error(`could not place the waves block in ${CONFIG_PATH}`);
  writeFileSync(CONFIG_PATH, next);

  console.log(`\n${marks.length} segni d'onda → ${CONFIG_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
