import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const html = readFileSync(resolve(process.cwd(), '.mw/tools/mappa2-corner-composer/index.html'), 'utf8');
const server = readFileSync(resolve(process.cwd(), '.mw/tools/mappa2-corner-composer/serve.mjs'), 'utf8');

function extractFunction(source: string, name: string): string {
  const start = source.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`missing function ${name}`);
  const open = source.indexOf('{', start);
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    if (source[index] === '}') depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`unterminated function ${name}`);
}

function loadTransformMath() {
  const source = [
    'const SCALE_MIN = 0.25; const SCALE_MAX = 3;',
    extractFunction(html, 'clampScale'),
    extractFunction(html, 'pieceScale'),
    extractFunction(html, 'centroid'),
    extractFunction(html, 'transformSourcePoint'),
    extractFunction(html, 'inverseTransformPoint'),
    extractFunction(html, 'transformedPolygon'),
    'return { clampScale, pieceScale, centroid, transformSourcePoint, inverseTransformPoint, transformedPolygon };',
  ].join('\n');
  return new Function(source)() as {
    pieceScale: (piece: { scale?: number }) => number;
    centroid: (points: Array<{ x: number; y: number }>) => { x: number; y: number };
    transformSourcePoint: (
      piece: { polygon: Array<{ x: number; y: number }>; dx: number; dy: number; scale: number },
      point: { x: number; y: number },
      includeTranslation?: boolean,
    ) => { x: number; y: number };
    inverseTransformPoint: (
      piece: { polygon: Array<{ x: number; y: number }>; dx: number; dy: number; scale: number },
      point: { x: number; y: number },
    ) => { x: number; y: number };
    transformedPolygon: (
      piece: { polygon: Array<{ x: number; y: number }>; dx: number; dy: number; scale: number },
      includeTranslation?: boolean,
    ) => Array<{ x: number; y: number }>;
  };
}

describe('mappa2 corner composer scale contract', () => {
  it('exports schema v2 with planning-only scale semantics', () => {
    expect(html).toContain("const SCHEMA_V2 = 'mappa2-corner-composer/v2';");
    expect(html).toContain('target: { dx: round2(piece.dx), dy: round2(piece.dy), scale: round3(pieceScale(piece)) }');
    expect(html).toContain("scaleSemantics: 'planning-footprint-only; production assets are not implicitly resized'");
    expect(html).toContain('Alt</kbd>+rotella = scala visiva');
    expect(server).toContain("['mappa2-corner-composer/v1', 'mappa2-corner-composer/v2'].includes(data.schema)");
    expect(html).toContain("const BASE_URL = './composite.webp';");
    expect(html).toContain("const IS_FILE_PROTOCOL = window.location.protocol === 'file:';");
    expect(html).toContain('I poligoni non devono essere ritagli precisi: identificano semanticamente le parti di terra.');
  });

  it('scales around the source centroid before applying translation', () => {
    const math = loadTransformMath();
    const piece = {
      polygon: [
        { x: 0, y: 0 },
        { x: 12, y: 0 },
        { x: 12, y: 12 },
      ],
      dx: 100,
      dy: 50,
      scale: 1.5,
    };
    const c = math.centroid(piece.polygon);
    const movedCentroid = math.transformSourcePoint(piece, c);

    expect(movedCentroid.x).toBeCloseTo(c.x + piece.dx, 6);
    expect(movedCentroid.y).toBeCloseTo(c.y + piece.dy, 6);

    const unscaled = math.transformSourcePoint(piece, { x: 0, y: 0 }, false);
    expect(unscaled.x).toBeCloseTo(c.x + (0 - c.x) * piece.scale, 6);
    expect(unscaled.y).toBeCloseTo(c.y + (0 - c.y) * piece.scale, 6);
  });

  it('keeps inverse hit-test coordinates aligned with the scaled target', () => {
    const math = loadTransformMath();
    const piece = {
      polygon: [
        { x: 10, y: 10 },
        { x: 110, y: 20 },
        { x: 90, y: 130 },
      ],
      dx: 240,
      dy: -70,
      scale: 1.75,
    };

    for (const sourcePoint of piece.polygon) {
      const targetPoint = math.transformSourcePoint(piece, sourcePoint);
      const roundTrip = math.inverseTransformPoint(piece, targetPoint);
      expect(roundTrip.x).toBeCloseTo(sourcePoint.x, 6);
      expect(roundTrip.y).toBeCloseTo(sourcePoint.y, 6);
    }
  });
});
