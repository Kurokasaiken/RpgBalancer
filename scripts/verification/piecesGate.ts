/**
 * Piece-kit gate (PLAN-130, OB-2 globale) — scoped in `closure:lint`.
 *
 * Verifica l'integrità del registry `src/config/hud/pieces.json` e dei
 * riferimenti meccanici ai pezzi (barrel `pieceMounts.ts`, manifest
 * slice-kit con `usedPieces`, `*.regions.json`):
 *
 * - schema Zod valido (id `<slug>-vN`, union per kind, provenance);
 * - role ∈ tabella ruolo→kind e kind coerente;
 * - dialect ∈ registry.dialects, materials ⊆ registry.materials;
 * - scope "family" richiede `family`; ornament|frame richiedono
 *   `ornamentScale`;
 * - `supersedes` punta a un pezzo esistente;
 * - sha256: frame/slice-kit → sha256(sha256(spec)+":"+sha256(golden));
 *   raster/standalone mono-asset → sha256(assets.master); raster multi-asset
 *   → sha256 del fingerprint canonico `<key>:<sha256(file)>`, chiavi ordinate;
 * - doppioni: due pezzi `baptized` con stesso role+dialect (e scala entro
 *   tolerance quando definita) richiedono `supersedes` o `nonFusionReason`;
 * - ogni `<id>-vN` citato in barrel/manifest/regions esiste ed è
 *   `baptized` (candidate|retired referenziato → rosso);
 * - `baptized` senza consumatori NON è errore (canonical derivato atteso
 *   dopo il battezzo).
 *
 * Limite dichiarato (PLAN-130 §8): il gate certifica identità/versione/
 * dichiarazione/montaggio — NON somiglianza visiva né armonia (Fase C,
 * witness Director, T-30).
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import {
  PIECE_ID_RE,
  ROLE_KIND_TABLE,
  registrySchema,
  regionsFileSchema,
  type PieceRegistry,
  type PieceRole,
} from '../../src/config/hud/pieceSchema';

export type PiecesGateReport = {
  checked: string[];
  errors: string[];
  warnings: string[];
};

const REGISTRY_PATH = path.join('src', 'config', 'hud', 'pieces.json');
const GENERATED_DIRS = [
  path.join('src', 'generated', 'hud'),
  path.join('src', 'generated', 'slicekit'),
];
const REGIONS_GLOB_DIR = path.join('scripts', 'hud-real', 'specs');

const sha256File = (absPath: string): string =>
  createHash('sha256').update(readFileSync(absPath)).digest('hex');

const combinedSha = (specSha: string, goldenSha: string): string =>
  createHash('sha256').update(`${specSha}:${goldenSha}`).digest('hex');

/**
 * Canonical multi-asset fingerprint (Director ruling 2026-11-26): sort the
 * asset keys, hash every file, then hash the newline-joined `<key>:<sha>`
 * rows. A single legacy `master` keeps the historical plain file sha so all
 * pre-existing immutable pieces remain valid without a rewrite.
 */
const rasterProvenanceSha = (
  repoRoot: string,
  assets: Record<string, string>,
): { expected: string; missing: string[] } => {
  const entries = Object.entries(assets).sort(([a], [b]) => a.localeCompare(b));
  const rows: string[] = [];
  const missing: string[] = [];
  for (const [key, rel] of entries) {
    const abs = path.join(repoRoot, rel);
    if (!existsSync(abs)) {
      missing.push(`${key}: ${rel}`);
      continue;
    }
    rows.push(`${key}:${sha256File(abs)}`);
  }
  if (entries.length === 1 && entries[0][0] === 'master' && rows.length === 1) {
    return { expected: rows[0].slice('master:'.length), missing };
  }
  return {
    expected: createHash('sha256').update(rows.join('\n')).digest('hex'),
    missing,
  };
};

export function checkPiecesGate(repoRoot: string): PiecesGateReport {
  const report: PiecesGateReport = { checked: [], errors: [], warnings: [] };
  const registryAbs = path.join(repoRoot, REGISTRY_PATH);
  if (!existsSync(registryAbs)) {
    report.errors.push(`piece-kit: registry mancante ${REGISTRY_PATH}`);
    return report;
  }

  let registry: PieceRegistry;
  try {
    const parsed = registrySchema.safeParse(
      JSON.parse(readFileSync(registryAbs, 'utf8')),
    );
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        report.errors.push(
          `piece-kit: schema ${issue.path.join('.') || '(root)'}: ${issue.message}`,
        );
      }
      return report;
    }
    registry = parsed.data;
  } catch (err) {
    report.errors.push(`piece-kit: registry illeggibile: ${String(err)}`);
    return report;
  }

  const byId = new Map(registry.pieces.map((p) => [p.id, p]));
  const dialectSet = new Set(registry.dialects);
  const materialSet = new Set(registry.materials);
  const tolerance = registry.matching.tolerance;

  for (const piece of registry.pieces) {
    report.checked.push(piece.id);
    const tag = `piece-kit(${piece.id})`;

    const tableKind = ROLE_KIND_TABLE[piece.role as PieceRole];
    if (!tableKind) {
      report.errors.push(`${tag}: role "${piece.role}" non in tabella ruolo→kind`);
    } else if (tableKind !== piece.kind) {
      report.errors.push(
        `${tag}: kind "${piece.kind}" non ammesso per role "${piece.role}" (${tableKind})`,
      );
    }
    if (!dialectSet.has(piece.dialect)) {
      report.errors.push(`${tag}: dialect "${piece.dialect}" fuori vocabolario`);
    }
    for (const m of piece.materials) {
      if (!materialSet.has(m)) {
        report.errors.push(`${tag}: material "${m}" fuori vocabolario`);
      }
    }
    if (piece.scope === 'family' && !piece.family) {
      report.errors.push(`${tag}: scope "family" senza campo family`);
    }
    if (
      (piece.kind === 'ornament' || piece.kind === 'frame') &&
      piece.ornamentScale === undefined
    ) {
      report.errors.push(`${tag}: ornamentScale obbligatorio per kind ${piece.kind}`);
    }
    if (piece.supersedes && !byId.has(piece.supersedes)) {
      report.errors.push(`${tag}: supersedes "${piece.supersedes}" inesistente`);
    }

    // provenance sha
    if (piece.kind === 'frame' && piece.source === 'slice-kit') {
      const specAbs = path.join(repoRoot, piece.specRef ?? '');
      const goldenAbs = path.join(repoRoot, piece.provenance.golden);
      if (!piece.specRef || !existsSync(specAbs)) {
        report.errors.push(`${tag}: specRef mancante o inesistente (${piece.specRef})`);
      } else if (!existsSync(goldenAbs)) {
        report.errors.push(`${tag}: golden inesistente (${piece.provenance.golden})`);
      } else {
        const expected = combinedSha(sha256File(specAbs), sha256File(goldenAbs));
        if (expected !== piece.provenance.sha256) {
          report.errors.push(
            `${tag}: sha256(spec+golden) ≠ provenance.sha256 — spec o golden mutati`,
          );
        }
      }
    } else if (piece.assets) {
      const provenance = rasterProvenanceSha(repoRoot, piece.assets);
      for (const missing of provenance.missing) {
        report.errors.push(`${tag}: asset inesistente (${missing})`);
      }
      if (provenance.missing.length === 0 && provenance.expected !== piece.provenance.sha256) {
        const mode = Object.keys(piece.assets).length === 1 && piece.assets.master
          ? 'sha256(assets.master)'
          : 'sha256(fingerprint multi-asset canonico)';
        report.errors.push(`${tag}: ${mode} ≠ provenance.sha256`);
      }
    }
  }

  // doppioni baptized: stesso role+dialect (+scala entro tolerance)
  const baptized = registry.pieces.filter((p) => p.status === 'baptized');
  for (let i = 0; i < baptized.length; i += 1) {
    for (let j = i + 1; j < baptized.length; j += 1) {
      const a = baptized[i];
      const b = baptized[j];
      if (a.role !== b.role || a.dialect !== b.dialect) continue;
      if (
        a.ornamentScale !== undefined &&
        b.ornamentScale !== undefined &&
        Math.abs(a.ornamentScale / b.ornamentScale - 1) > tolerance
      ) {
        continue;
      }
      const linked =
        a.supersedes === b.id || b.supersedes === a.id;
      if (!linked && !a.nonFusionReason && !b.nonFusionReason) {
        report.errors.push(
          `piece-kit: doppione baptized ${a.id} / ${b.id} (role ${a.role}, dialect ${a.dialect}) senza supersedes né nonFusionReason`,
        );
      }
    }
  }

  // riferimenti meccanici: barrel + manifest generati
  const referenced = new Map<string, string[]>();
  for (const dir of GENERATED_DIRS) {
    const abs = path.join(repoRoot, dir);
    if (!existsSync(abs)) continue;
    for (const file of readdirSync(abs).filter((f) => f.endsWith('.ts'))) {
      const rel = path.join(dir, file);
      const text = readFileSync(path.join(abs, file), 'utf8');
      for (const match of text.matchAll(/"([a-z0-9]+(?:-[a-z0-9]+)*-v[1-9]\d*)"/g)) {
        const id = match[1];
        if (!referenced.has(id)) referenced.set(id, []);
        referenced.get(id)!.push(rel);
      }
    }
  }
  // *.regions.json
  const regionsDir = path.join(repoRoot, REGIONS_GLOB_DIR);
  if (existsSync(regionsDir)) {
    for (const file of readdirSync(regionsDir).filter((f) =>
      f.endsWith('.regions.json'),
    )) {
      const rel = path.join(REGIONS_GLOB_DIR, file);
      let parsed: ReturnType<typeof regionsFileSchema.safeParse>;
      try {
        parsed = regionsFileSchema.safeParse(
          JSON.parse(readFileSync(path.join(regionsDir, file), 'utf8')),
        );
      } catch {
        report.errors.push(`piece-kit: ${rel} non è JSON valido`);
        continue;
      }
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          report.errors.push(`piece-kit: ${rel} ${issue.path.join('.')}: ${issue.message}`);
        }
        continue;
      }
      for (const region of parsed.data.regions) {
        const ids: string[] = [];
        if (region.strategy === 'reuse') ids.push(region.pieceId);
        if (region.strategy === 'slice-kit' && region.pieceRefs) {
          ids.push(...Object.values(region.pieceRefs));
        }
        if (region.strategy === 'generate') {
          ids.push(...region.checkedPieces.map((c) => c.pieceId));
        }
        for (const id of ids) {
          if (!referenced.has(id)) referenced.set(id, []);
          referenced.get(id)!.push(rel);
        }
      }
    }
  }

  for (const [id, sources] of referenced) {
    const piece = byId.get(id);
    if (!piece) {
      report.errors.push(
        `piece-kit: id "${id}" referenziato in ${sources.join(', ')} ma assente dal registry`,
      );
    } else if (piece.status !== 'baptized') {
      report.errors.push(
        `piece-kit: pezzo ${piece.status} "${id}" referenziato in produzione (${sources.join(', ')})`,
      );
    }
    void sources;
  }

  void PIECE_ID_RE;
  return report;
}
