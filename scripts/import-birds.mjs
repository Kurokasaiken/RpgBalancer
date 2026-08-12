#!/usr/bin/env node
/**
 * Imports hand-cut bird frames into a sprite strip.
 *
 * The frames are one wing-flap cycle, exported at different sizes and with
 * different amounts of empty margin. A steps() animation reads them as a grid of
 * identical cells, so each frame is trimmed to its content and then re-centred in
 * a cell sized to the largest of them. Skipping that step is what made the first
 * attempt jitter: the bird jumped around inside its box every frame.
 *
 * Frames must be passed in flap order — the strip is played back in argument
 * order, and sorting by filename is the caller's job.
 *
 * Usage
 *   node scripts/import-birds.mjs "<frame1.png>" "<frame2.png>" ...
 */

import { mkdirSync, rmSync, existsSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const OUT_DIR = 'public/assets/atmosphere/birds';
const CONFIG_PATH = 'src/ui/idleVillage/config/atmosphereAssets.ts';

/** Width of one cell in the finished strip, in px. */
const CELL_WIDTH = 128;

/** Where the take-off points come from. */
const POINTS_PATH = 'public/assets/atmosphere/terrain/points.json';

/**
 * Flights, not loops.
 *
 * A flock lifts off from a point inland, climbs away diagonally for about a second
 * and is gone; the sky is then empty for a minute. `DESIGN_PILLARS.md` puts ambient
 * life at "80% calma, 15% comunicazione ambientale, 5% sorprese rare" and lists
 * "stormo" among the rare ones — a bird permanently crossing the screen is the
 * opposite of that, and read as an insect on the monitor.
 *
 * Sizes are deliberately small: the first pass used 320-480 world px, which put a
 * sparrow at roughly the size of the village.
 */
const FLIGHTS = [
  { name: 'a', width: 46, dx: 340, dy: -250, flightSeconds: 1.2, cycleSeconds: 54, flapSeconds: 0.16, opacity: 0.9, flip: false },
  { name: 'b', width: 52, dx: -300, dy: -230, flightSeconds: 1.35, cycleSeconds: 71, flapSeconds: 0.18, opacity: 0.85, flip: true },
  { name: 'c', width: 40, dx: 280, dy: -300, flightSeconds: 1.1, cycleSeconds: 92, flapSeconds: 0.15, opacity: 0.8, flip: false },
];

/**
 * Loose V formation, as fractions of one bird's width.
 *
 * The leader is at the origin and the others trail behind and to the side. Each one
 * also starts a fraction of the flight later, so the group unfolds rather than
 * moving as a rigid block.
 */
const FORMATION = [
  { ox: 0, oy: 0, delay: 0, scale: 1 },
  { ox: -1.4, oy: 0.9, delay: 0.05, scale: 0.88 },
  { ox: -1.5, oy: -0.8, delay: 0.08, scale: 0.84 },
  { ox: -2.9, oy: 1.7, delay: 0.13, scale: 0.76 },
];

/** Same golden-ratio scatter the cloud importer uses, for the same reason. */
function scatter(index, seed) {
  return (seed + index * 0.6180339887498949) % 1;
}

async function main() {
  const sources = process.argv.slice(2);
  if (sources.length === 0) throw new Error('pass the bird frame PNG paths as arguments, in flap order');

  if (existsSync(OUT_DIR)) rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(OUT_DIR, { recursive: true });

  // Trim every frame first: the cell has to fit the widest and tallest pose in the
  // cycle, which is not knowable until all of them have their margins removed.
  const trimmed = [];
  for (const src of sources) {
    const buffer = await sharp(src).ensureAlpha().trim({ threshold: 1 }).png().toBuffer();
    const meta = await sharp(buffer).metadata();
    trimmed.push({ buffer, width: meta.width, height: meta.height });
  }

  const maxWidth = Math.max(...trimmed.map((f) => f.width));
  const maxHeight = Math.max(...trimmed.map((f) => f.height));
  const scale = CELL_WIDTH / maxWidth;
  const cellHeight = Math.round(maxHeight * scale);

  console.log(`${trimmed.length} frames, largest pose ${maxWidth}x${maxHeight} → cell ${CELL_WIDTH}x${cellHeight}`);

  // Re-centre each pose in an identical cell. Centring on the bounding box lets the
  // body ride up and down slightly as the wings swap extent, which reads as the
  // natural bob of a flapping bird rather than as an error.
  const cells = await Promise.all(
    trimmed.map(async (frame) => {
      const width = Math.max(1, Math.round(frame.width * scale));
      const height = Math.max(1, Math.round(frame.height * scale));
      const resized = await sharp(frame.buffer).resize(width, height).png().toBuffer();

      return sharp({
        create: {
          width: CELL_WIDTH,
          height: cellHeight,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
      })
        .composite([
          {
            input: resized,
            left: Math.round((CELL_WIDTH - width) / 2),
            top: Math.round((cellHeight - height) / 2),
          },
        ])
        .png()
        .toBuffer();
    }),
  );

  // Horizontal strip: the flap animation steps background-position-x, so the cells
  // have to run along that axis.
  const stripInfo = await sharp({
    create: {
      width: CELL_WIDTH * cells.length,
      height: cellHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(cells.map((input, i) => ({ input, left: i * CELL_WIDTH, top: 0 })))
    .webp({ quality: 90, alphaQuality: 100 })
    .toFile(join(OUT_DIR, 'bird_strip.webp'));

  console.log(`  ✓ bird_strip.webp  ${stripInfo.width}x${stripInfo.height}  ${(stripInfo.size / 1024).toFixed(0)} KB`);

  if (!existsSync(POINTS_PATH)) {
    throw new Error(`missing ${POINTS_PATH} — run scripts/build-terrain-masks.mjs first`);
  }
  const { land } = JSON.parse(readFileSync(POINTS_PATH, 'utf8'));
  if (!land?.length) throw new Error('points.json carries no inland points');

  const aspect = cellHeight / CELL_WIDTH;
  const flights = FLIGHTS.map((flight, index) => {
    // Take-off points are sampled from the eroded landmass, so a flock always lifts
    // off from ground rather than from open water or from off-screen.
    const origin = land[Math.floor(scatter(index, 0.37) * land.length) % land.length];
    const birds = FORMATION.map((slot) => {
      const width = Math.round(flight.width * slot.scale);
      return (
        `          { width: ${width}, height: ${Math.round(width * aspect)}, ` +
        `offsetX: ${Math.round(slot.ox * flight.width)}, offsetY: ${Math.round(slot.oy * flight.width)}, ` +
        `delayFraction: ${slot.delay} },`
      );
    });

    // Indented deeper than the block terminator on purpose: the block is replaced
    // with a non-greedy regex ending at the first `\n  },\n`, so a flight closing at
    // that same depth would cut the block in half and duplicate its tail.
    return `      {
        name: '${flight.name}',
        originX: ${origin.x},
        originY: ${origin.y},
        dx: ${flight.dx},
        dy: ${flight.dy},
        flightSeconds: ${flight.flightSeconds},
        startDelaySeconds: ${Math.round(scatter(index, 0.53) * flight.cycleSeconds)},
        cycleSeconds: ${flight.cycleSeconds},
        flapSeconds: ${flight.flapSeconds},
        opacity: ${flight.opacity},
        flip: ${flight.flip},
        birds: [
${birds.join('\n')}
        ],
      },`;
  }).join('\n');

  const birdsBlock = `  birds: {
    strip: 'birds/bird_strip.webp',
    frameCount: ${cells.length},
    flights: [
${flights}
    ],
  },
`;

  // Rewrite only the birds block, so the cloud importer stays the owner of the rest.
  // Test for the block rather than comparing before/after: re-importing the same
  // frames regenerates a byte-identical block, and a successful no-op must not be
  // reported as a missing block.
  const blockPattern = / {2}birds: \{[\s\S]*?\n {2}\},\n/;
  const current = readFileSync(CONFIG_PATH, 'utf8');
  if (!blockPattern.test(current)) throw new Error('could not locate the birds block in ' + CONFIG_PATH);
  writeFileSync(CONFIG_PATH, current.replace(blockPattern, birdsBlock));

  console.log(`wrote config → ${CONFIG_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
