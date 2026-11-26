#!/usr/bin/env node
/**
 * PLAN-135 deterministic crop-plan generator. No generation is performed here:
 * the output is the scale-locked geometric authority every future Gemini call must follow.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const outPath = process.argv[2] ?? '.mw/specs/mappa2-apron/crop-plan.json';
const canvas = { width: 2752, height: 1536 };
const apron = { top: 200, right: 560, bottom: 0, left: 560 };
const cropSize = { width: 1024, height: 572 };
const world = {
  x0: -apron.left,
  y0: -apron.top,
  x1: canvas.width + apron.right,
  y1: canvas.height + apron.bottom,
};
const overlapDesign = { horizontal: 256, vertical: 256 };
const SEA_ALPHA_PATH = 'public/assets/world/mappa2/base/layers/Mare.v2.webp';
const seaAlpha = await sharp(path.join(root, SEA_ALPHA_PATH)).extractChannel(3).raw().toBuffer({ resolveWithObject: true });
const alphaAt = (x, y) => seaAlpha.data[y * seaAlpha.info.width + x];

function paintedLandFraction(x0, y0, x1, y1) {
  const cx0 = Math.max(0, Math.floor(x0));
  const cy0 = Math.max(0, Math.floor(y0));
  const cx1 = Math.min(canvas.width - 1, Math.ceil(x1));
  const cy1 = Math.min(canvas.height - 1, Math.ceil(y1));
  if (cx1 < cx0 || cy1 < cy0) return 0;
  let landPx = 0;
  for (let y = cy0; y <= cy1; y += 1) {
    for (let x = cx0; x <= cx1; x += 1) {
      // In Mare.v2 alpha 255 is painted sea and alpha 0 is land/foreground.
      if (alphaAt(x, y) === 0) landPx += 1;
    }
  }
  return landPx / ((cx1 - cx0 + 1) * (cy1 - cy0 + 1));
}

/**
 * Land fraction in the 4px painted-canvas side of the future canvas/apron join.
 * The apron side does not exist yet, so the inward band is the only ground truth
 * available when classifying the seam before generation.
 */
function canvasJoinLandFraction(strip, kept) {
  const band = 4;
  if (strip === 'top') return paintedLandFraction(kept.x0, 0, kept.x1, band - 1);
  if (strip === 'left') return paintedLandFraction(0, kept.y0, band - 1, kept.y1);
  return paintedLandFraction(canvas.width - band, kept.y0, canvas.width - 1, kept.y1);
}

const rect = (x0, y0, x1, y1) => ({ x0, y0, x1, y1 });
const inclusiveWidth = (r) => r.x1 - r.x0 + 1;
const inclusiveHeight = (r) => r.y1 - r.y0 + 1;
const intersection = (a, b) => rect(Math.max(a.x0, b.x0), Math.max(a.y0, b.y0), Math.min(a.x1, b.x1), Math.min(a.y1, b.y1));
const positiveRect = (r) => r.x1 >= r.x0 && r.y1 >= r.y0;

function evenlySpacedStarts(min, maxStart, count) {
  if (count === 1) return [min];
  return Array.from({ length: count }, (_, i) => Math.round(min + ((maxStart - min) * i) / (count - 1)));
}

function cropClass(strip, kept, boundaryLandFraction) {
  const corner = (kept.x0 < 0 || kept.x1 >= canvas.width) && kept.y0 < 0;
  if (corner) return 'corner';
  return boundaryLandFraction <= 0.02 ? 'open-water' : 'coast-crossing';
}

const crops = [];
function addCrop(strip, index, source, kept, order) {
  const id = `${strip}-${String(index + 1).padStart(2, '0')}`;
  const boundaryLandFraction = canvasJoinLandFraction(strip, kept);
  crops.push({
    id,
    strip,
    order,
    joinClass: cropClass(strip, kept, boundaryLandFraction),
    canvasBoundaryLandFraction: Number(boundaryLandFraction.toFixed(8)),
    sourceRegionWorldPx: source,
    outputSizePx: { ...cropSize },
    worldToCropScaleX: 1,
    worldToCropScaleY: 1,
    transformationMatrix: [
      [1, 0, -source.x0],
      [0, 1, -source.y0],
      [0, 0, 1],
    ],
    paintedReferenceWorldPx: {
      x0: Math.max(0, source.x0),
      y0: Math.max(0, source.y0),
      x1: Math.min(canvas.width - 1, source.x1),
      y1: Math.min(canvas.height - 1, source.y1),
    },
    keptRegionWorldPx: kept,
    ownershipRule: 'keptRegionWorldPx is exclusive; painted reference and overlap are control-only',
    retryBudget: 2,
  });
}

// Top strip owns every corner (y < 0). Five crops span the 3872 world px width.
{
  const y0 = world.y0;
  const y1 = -1;
  const maxStartX = world.x1 - cropSize.width;
  const starts = evenlySpacedStarts(world.x0, maxStartX, 5);
  starts.forEach((x, i) => {
    const source = rect(x, y0, x + cropSize.width - 1, y0 + cropSize.height - 1);
    const next = starts[i + 1];
    const kept = rect(x, y0, (next ?? world.x1) - 1, y1);
    addCrop('top', i, source, kept, i + 1);
  });
}

// Side strips own only y >= 0, so top/side ownership is mutually exclusive by construction.
for (const side of ['left', 'right']) {
  const x0 = side === 'left' ? world.x0 : canvas.width - 464;
  const sourceX1 = x0 + cropSize.width - 1;
  const maxStartY = canvas.height - cropSize.height;
  const starts = evenlySpacedStarts(0, maxStartY, 5);
  starts.forEach((y, i) => {
    const source = rect(x0, y, sourceX1, y + cropSize.height - 1);
    const next = starts[i + 1];
    const keptX0 = side === 'left' ? world.x0 : canvas.width;
    const keptX1 = side === 'left' ? -1 : world.x1 - 1;
    const kept = rect(keptX0, y, keptX1, (next ?? canvas.height) - 1);
    addCrop(side, i, source, kept, 5 + (side === 'right' ? 5 : 0) + i + 1);
  });
}

const joins = [];
for (const c of crops) {
  if (positiveRect(c.paintedReferenceWorldPx)) {
    const boundary = c.strip === 'top'
      ? { orientation: 'horizontal', coordinateWorldPx: 0, spanWorldPx: { x0: c.keptRegionWorldPx.x0, x1: c.keptRegionWorldPx.x1 } }
      : { orientation: 'vertical', coordinateWorldPx: c.strip === 'left' ? 0 : canvas.width, spanWorldPx: { y0: c.keptRegionWorldPx.y0, y1: c.keptRegionWorldPx.y1 } };
    joins.push({
      id: `${c.id}:canvas`,
      kind: 'canvas-apron',
      joinClass: c.joinClass,
      cropIds: [c.id],
      boundary,
      bandWidthPx: 4,
      coordinateConvention: 'boundary is a continuous world-coordinate edge; spans are inclusive pixel ranges',
    });
  }
}
for (const strip of ['top', 'left', 'right']) {
  const group = crops.filter((c) => c.strip === strip);
  for (let i = 0; i < group.length - 1; i += 1) {
    const a = group[i];
    const b = group[i + 1];
    const sourceOverlap = intersection(a.sourceRegionWorldPx, b.sourceRegionWorldPx);
    const boundary = strip === 'top'
      ? {
          orientation: 'vertical',
          coordinateWorldPx: b.keptRegionWorldPx.x0,
          spanWorldPx: { y0: Math.max(a.keptRegionWorldPx.y0, b.keptRegionWorldPx.y0), y1: Math.min(a.keptRegionWorldPx.y1, b.keptRegionWorldPx.y1) },
        }
      : {
          orientation: 'horizontal',
          coordinateWorldPx: b.keptRegionWorldPx.y0,
          spanWorldPx: { x0: Math.max(a.keptRegionWorldPx.x0, b.keptRegionWorldPx.x0), x1: Math.min(a.keptRegionWorldPx.x1, b.keptRegionWorldPx.x1) },
        };
    const joinClass = strip === 'top' && (boundary.coordinateWorldPx < 0 || boundary.coordinateWorldPx >= canvas.width)
      ? 'corner'
      : a.joinClass === 'open-water' && b.joinClass === 'open-water'
        ? 'open-water'
        : a.joinClass === 'corner' || b.joinClass === 'corner'
          ? 'corner'
          : 'coast-crossing';
    joins.push({
      id: `${a.id}:${b.id}`,
      kind: 'strip-strip',
      joinClass,
      cropIds: [a.id, b.id],
      boundary,
      sourceOverlapWorldPx: sourceOverlap,
      bandWidthPx: 4,
      coordinateConvention: 'boundary is the exclusive ownership edge; source overlap is inclusive pixel indices',
    });
  }
}

const adjacentOverlap = (strip, horizontal) => {
  const group = crops.filter((c) => c.strip === strip);
  const values = [];
  for (let i = 0; i < group.length - 1; i += 1) {
    const overlapRect = intersection(group[i].sourceRegionWorldPx, group[i + 1].sourceRegionWorldPx);
    values.push(horizontal ? inclusiveWidth(overlapRect) : inclusiveHeight(overlapRect));
  }
  return { minPx: Math.min(...values), maxPx: Math.max(...values), byJoinPx: values };
};
const measuredOverlap = {
  designInputPx: overlapDesign,
  policy: 'source regions overlap for reference/control only; kept regions remain mutually exclusive',
  topStripHorizontal: adjacentOverlap('top', true),
  sideStripVertical: {
    left: adjacentOverlap('left', false),
    right: adjacentOverlap('right', false),
  },
  paintedCanvasReferencePx: { top: 372, left: 464, right: 464 },
};

const ownership = {
  rule: 'if y<0 the top crop whose kept x-range contains the pixel owns it; otherwise the side strip containing x owns it through the crop whose kept y-range contains the pixel; no pixel is owned twice',
  cornerOwner: 'top',
  exclusive: true,
  coverage: 'complete',
  regions: crops.map((c) => ({ cropId: c.id, keptRegionWorldPx: c.keptRegionWorldPx })),
};

const failures = [];
for (const c of crops) {
  if (inclusiveWidth(c.sourceRegionWorldPx) !== cropSize.width || inclusiveHeight(c.sourceRegionWorldPx) !== cropSize.height) failures.push(`${c.id}: source is not ${cropSize.width}x${cropSize.height}`);
  if (c.worldToCropScaleX !== 1 || c.worldToCropScaleY !== 1) failures.push(`${c.id}: scale lock broken`);
}
const topCover = crops.filter((c) => c.strip === 'top');
if (topCover[0]?.keptRegionWorldPx.x0 !== world.x0 || topCover.at(-1)?.keptRegionWorldPx.x1 !== world.x1 - 1) failures.push('top ownership does not cover the full apron pixel width');
for (let i = 0; i < topCover.length - 1; i += 1) {
  if (topCover[i].keptRegionWorldPx.x1 + 1 !== topCover[i + 1].keptRegionWorldPx.x0) failures.push(`top ownership gap/overlap at ${i}`);
}
for (const strip of ['left', 'right']) {
  const group = crops.filter((c) => c.strip === strip);
  if (group[0]?.keptRegionWorldPx.y0 !== 0 || group.at(-1)?.keptRegionWorldPx.y1 !== canvas.height - 1) failures.push(`${strip} ownership does not cover y 0..${canvas.height - 1}`);
  for (let i = 0; i < group.length - 1; i += 1) {
    if (group[i].keptRegionWorldPx.y1 + 1 !== group[i + 1].keptRegionWorldPx.y0) failures.push(`${strip} ownership gap/overlap at ${i}`);
  }
}

const expectedApronPixels = (canvas.width + apron.left + apron.right) * apron.top + apron.left * canvas.height + apron.right * canvas.height;
const ownedPixels = crops.reduce((acc, c) => acc + inclusiveWidth(c.keptRegionWorldPx) * inclusiveHeight(c.keptRegionWorldPx), 0);
if (ownedPixels !== expectedApronPixels) failures.push(`ownership pixel count ${ownedPixels} != expected apron pixels ${expectedApronPixels}`);
for (const strip of ['left', 'right']) {
  const group = crops.filter((c) => c.strip === strip);
  for (const c of group) {
    const expectedWidth = strip === 'left' ? apron.left : apron.right;
    if (inclusiveWidth(c.keptRegionWorldPx) !== expectedWidth) failures.push(`${c.id}: kept width ${inclusiveWidth(c.keptRegionWorldPx)} != apron width ${expectedWidth}`);
  }
}

const scriptSha = createHash('sha256').update(readFileSync(new URL(import.meta.url))).digest('hex');
const plan = {
  schema: 'plan135-crop-plan/v1',
  generatedBy: 'scripts/plan135/build-crop-plan.mjs',
  generatorSha256: scriptSha,
  canvas,
  apron,
  apronWorldRect: world,
  coordinateConvention: {
    apronWorldRect: 'continuous world-coordinate edges, matching PLAN-135 x∈[-560,3312], y∈[-200,1536]',
    cropAndOwnershipRects: 'inclusive integer pixel indices at 1 image px = 1 world px',
  },
  cropSize,
  overlap: measuredOverlap,
  scaleLock: { worldToCropScaleX: 1, worldToCropScaleY: 1, resampling: 'forbidden' },
  joinClassification: {
    corner: 'a crop whose kept region owns an apron corner, and strip-strip joins adjoining it, are corner regardless of land fraction',
    canvasApron: 'non-corner crops use the measured land/foreground fraction of the 4px inward painted-canvas band along the canvas join: <=0.02 open-water, otherwise coast-crossing',
    stripStrip: 'derived deterministically from the adjoining crop classes; overlap is control geometry because no generated apron pixels exist before T2',
    sourceAlpha: { path: SEA_ALPHA_PATH, encoding: 'alpha 255=painted sea, alpha 0=land/foreground' },
  },
  outerWaterBands: {
    top: rect(world.x0, -200, world.x1, -141),
    left: rect(-560, 0, -393, canvas.height - 1),
    right: rect(3144, 0, world.x1, canvas.height - 1),
    continuationZones: {
      top: rect(world.x0, -140, world.x1, -1),
      left: rect(-392, 0, -1, canvas.height - 1),
      right: rect(canvas.width, 0, 3143, canvas.height - 1),
    },
  },
  crops,
  joins,
  ownership,
  validation: failures.length ? { ok: false, failures } : { ok: true, failures: [] },
};
if (failures.length) {
  console.error(JSON.stringify(failures, null, 2));
  process.exit(1);
}
mkdirSync(path.dirname(path.join(root, outPath)), { recursive: true });
const outFile = path.join(root, outPath);
const nextText = `${JSON.stringify(plan, null, 2)}\n`;
if (!existsSync(outFile) || readFileSync(outFile, 'utf8') !== nextText) writeFileSync(outFile, nextText);
console.log(`crop-plan ok: ${crops.length} crops, ${joins.length} joins -> ${outPath}`);
