/**
 * PLAN-130 OB-2 — test negativi del gate globale piece-kit.
 * Ogni condizione di fallimento del check ha un test che la provoca.
 */
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkPiecesGate } from '../../../scripts/verification/piecesGate';

const sha = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');
const combined = (a: string, b: string) =>
  createHash('sha256').update(`${a}:${b}`).digest('hex');

type Fixture = {
  root: string;
  write: (rel: string, content: string | Buffer) => void;
  writeRegistry: (pieces: object[], extra?: object) => void;
  piece: (over?: object) => object;
};

const makeFixture = (): Fixture => {
  const root = mkdtempSync(path.join(tmpdir(), 'pieces-gate-'));
  const write = (rel: string, content: string | Buffer) => {
    const abs = path.join(root, rel);
    mkdirSync(path.dirname(abs), { recursive: true });
    writeFileSync(abs, content);
  };
  const specContent = JSON.stringify({ surface: 'x' });
  write('specs/frame.json', specContent);
  write('goldens/g.png', 'golden-bytes');
  const frameSha = combined(sha(specContent), sha('golden-bytes'));
  const base = {
    id: 'frame-x-v1',
    kind: 'frame',
    source: 'slice-kit',
    scope: 'hud',
    status: 'baptized',
    role: 'outerFrame',
    dialect: 'nav-filetto',
    materials: ['oro-filetto'],
    ornamentScale: 0.28,
    specRef: 'specs/frame.json',
    provenance: {
      golden: 'goldens/g.png',
      sha256: frameSha,
      ruling: 'R-test',
      date: '2026-11-21',
    },
  };
  const writeRegistry = (pieces: object[], extra: object = {}) =>
    write(
      'src/config/hud/pieces.json',
      JSON.stringify({
        version: 1,
        matching: { tolerance: 0.25 },
        dialects: ['nav-filetto'],
        materials: ['oro-filetto'],
        pieces,
        ...extra,
      }),
    );
  return { root, write, writeRegistry, piece: (over = {}) => ({ ...base, ...over }) };
};

const run = (f: Fixture) => checkPiecesGate(f.root).errors;

describe('checkPiecesGate (PLAN-130 OB-2 negativi)', () => {
  it('registry mancante → errore', () => {
    const f = makeFixture();
    expect(run(f).join(' ')).toMatch(/registry mancante/);
  });

  it('id non conforme <slug>-vN → errore schema', () => {
    const f = makeFixture();
    f.writeRegistry([f.piece({ id: 'frameX' })]);
    expect(run(f).join(' ')).toMatch(/schema.*id/);
  });

  it('role non in tabella → errore', () => {
    const f = makeFixture();
    f.writeRegistry([f.piece({ role: 'ruoloInventato' })]);
    expect(run(f).join(' ')).toMatch(/non in tabella/);
  });

  it('kind non ammesso dal role → errore', () => {
    const f = makeFixture();
    f.writeRegistry([f.piece({ role: 'laurel' })]);
    expect(run(f).join(' ')).toMatch(/non ammesso per role/);
  });

  it('dialect fuori vocabolario → errore', () => {
    const f = makeFixture();
    f.writeRegistry([f.piece({ dialect: 'oro-inventato' })]);
    expect(run(f).join(' ')).toMatch(/dialect.*fuori vocabolario/);
  });

  it('material fuori vocabolario → errore', () => {
    const f = makeFixture();
    f.writeRegistry([f.piece({ materials: ['mat-x'] })]);
    expect(run(f).join(' ')).toMatch(/material.*fuori vocabolario/);
  });

  it('scope family senza family → errore', () => {
    const f = makeFixture();
    f.writeRegistry([f.piece({ scope: 'family' })]);
    expect(run(f).join(' ')).toMatch(/scope "family" senza/);
  });

  it('frame senza ornamentScale → errore', () => {
    const f = makeFixture();
    const { ornamentScale: _dropped, ...noScale } = f.piece() as Record<string, unknown>;
    f.writeRegistry([noScale]);
    expect(run(f).join(' ')).toMatch(/ornamentScale obbligatorio/);
  });

  it('supersedes a id inesistente → errore', () => {
    const f = makeFixture();
    f.writeRegistry([f.piece({ supersedes: 'ghost-v9' })]);
    expect(run(f).join(' ')).toMatch(/supersedes.*inesistente/);
  });

  it('sha spec+golden ≠ provenance → errore', () => {
    const f = makeFixture();
    f.writeRegistry([f.piece({ provenance: { golden: 'goldens/g.png', sha256: sha('altro'), ruling: 'r', date: 'd' } })]);
    expect(run(f).join(' ')).toMatch(/spec\+golden.*mutati/);
  });

  it('specRef inesistente → errore', () => {
    const f = makeFixture();
    f.writeRegistry([f.piece({ specRef: 'specs/ghost.json' })]);
    expect(run(f).join(' ')).toMatch(/specRef.*inesistente/);
  });

  it('doppione baptized senza supersedes né motivo → errore', () => {
    const f = makeFixture();
    const twin = f.piece({ id: 'frame-x-v2' });
    f.writeRegistry([f.piece(), twin]);
    expect(run(f).join(' ')).toMatch(/doppione baptized/);
  });

  it('doppione con nonFusionReason → verde', () => {
    const f = makeFixture();
    const twin = f.piece({ id: 'frame-x-v2', nonFusionReason: 'golden diversi' });
    f.writeRegistry([f.piece(), twin]);
    expect(run(f)).toEqual([]);
  });

  it('id referenziato nel barrel ma assente → errore', () => {
    const f = makeFixture();
    f.writeRegistry([f.piece()]);
    f.write('src/generated/hud/pieceMounts.ts', 'export const m = {"ghost-v1": "x"};');
    expect(run(f).join(' ')).toMatch(/ghost-v1.*assente dal registry/);
  });

  it('candidate referenziato nel barrel → errore', () => {
    const f = makeFixture();
    f.writeRegistry([f.piece({ status: 'candidate' })]);
    f.write('src/generated/hud/pieceMounts.ts', 'export const m = {"frame-x-v1": "x"};');
    expect(run(f).join(' ')).toMatch(/candidate.*referenziato/);
  });

  it('baptized referenziato nel barrel → verde', () => {
    const f = makeFixture();
    f.writeRegistry([f.piece()]);
    f.write('src/generated/hud/pieceMounts.ts', 'export const m = {"frame-x-v1": "x"};');
    expect(run(f)).toEqual([]);
  });

  it('regions.json con reuse su pezzo inesistente → errore', () => {
    const f = makeFixture();
    f.writeRegistry([f.piece()]);
    f.write(
      'scripts/hud-real/specs/x.regions.json',
      JSON.stringify({
        surface: 'x',
        regions: [
          { region: 'a', expectedRole: 'outerFrame', expectedScale: 0.3, strategy: 'reuse', pieceId: 'ghost-v1' },
        ],
      }),
    );
    expect(run(f).join(' ')).toMatch(/ghost-v1.*assente dal registry/);
  });

  it('regions.json schema invalido (reuse senza pieceId) → errore', () => {
    const f = makeFixture();
    f.writeRegistry([f.piece()]);
    f.write(
      'scripts/hud-real/specs/x.regions.json',
      JSON.stringify({ surface: 'x', regions: [{ region: 'a', expectedRole: 'outerFrame', expectedScale: 0.3, strategy: 'reuse' }] }),
    );
    expect(run(f).join(' ')).toMatch(/regions\.json|pieceId|required|invalid/i);
  });

  it('registry coerente → verde', () => {
    const f = makeFixture();
    f.writeRegistry([f.piece()]);
    expect(run(f)).toEqual([]);
  });
});
