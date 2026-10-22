/**
 * check-quest-art-aspect — PLAN-061 (R-231 #8): the theatre stage contract
 * gate. Every cover-fit NODE_ART asset rendered inside the quest theatre
 * must match the declared `theaterAspect` from `gameFrameConfig` within
 * `theaterAssetAspectTolerance`. `fit: 'contain'` assets are skipped —
 * contain never crops, so aspect is presentation choice not contract.
 *
 * Known non-conforming assets live in `WARN` (never silent): pending
 * regeneration entries tracked in `public/assets/scene-library/CATALOG.md`
 * and legacy pre-contract quest art pending its own plan.
 *
 * Usage: `npm run check:quest-art` — exits 1 on any non-listed mismatch.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { DEFAULT_GAME_FRAME_CONFIG } from '../src/balancing/config/idleVillage/gameFrameConfig';
import { NODE_ART } from '../src/ui/idleVillage/questS1Lab/questArt';

const PUBLIC_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');

/** Assets allowed to deviate — each carries its reason + removal pointer. */
const WARN: ReadonlyArray<{ match: (src: string) => boolean; reason: string }> = [
  {
    match: (src) => src === '/assets/quest-goblin/ritorno.jpg',
    reason:
      'public-domain placeholder — transit art `ritorno` pending external ' +
      'regeneration (scene-library CATALOG "Mancanti/pending"); remove on drop-in',
  },
  {
    match: (src) => src.startsWith('/assets/quest-robine/'),
    reason:
      'legacy pre-contract quest art (downloaded 2026-10-04, before the ' +
      'theatre aspect contract); Rovine quest format pass is its own task',
  },
];

interface Row {
  src: string;
  nodes: string[];
  aspect: number | null;
  verdict: 'PASS' | 'WARN' | 'FAIL';
  note: string;
}

async function main() {
  const declared = DEFAULT_GAME_FRAME_CONFIG.questWindow.theaterAspect;
  const tolerance = DEFAULT_GAME_FRAME_CONFIG.questWindow.theaterAssetAspectTolerance;

  /* Unique cover-fit srcs → the nodes that render them in the theatre. */
  const coverSrcs = new Map<string, string[]>();
  for (const [nodeId, art] of Object.entries(NODE_ART)) {
    if (art.fit !== 'cover') continue;
    const nodes = coverSrcs.get(art.src) ?? [];
    nodes.push(nodeId);
    coverSrcs.set(art.src, nodes);
  }

  const rows: Row[] = [];
  for (const [src, nodes] of coverSrcs) {
    const file = path.join(PUBLIC_DIR, src);
    let aspect: number | null = null;
    let note = '';
    try {
      const meta = await sharp(file).metadata();
      if (meta.width && meta.height) aspect = meta.width / meta.height;
    } catch {
      note = 'unreadable';
    }
    const warn = WARN.find((w) => w.match(src));
    let verdict: Row['verdict'];
    if (aspect === null) {
      verdict = warn ? 'WARN' : 'FAIL';
      note ||= 'sharp could not read dimensions';
    } else {
      const delta = Math.abs(aspect - declared) / declared;
      if (delta <= tolerance) {
        verdict = 'PASS';
      } else if (warn) {
        verdict = 'WARN';
        note = warn.reason;
      } else {
        verdict = 'FAIL';
        note = `aspect ${aspect.toFixed(3)} deviates ${(delta * 100).toFixed(1)}% from declared ${declared}`;
      }
    }
    rows.push({ src, nodes, aspect, verdict, note });
  }

  console.log(`quest-art aspect gate — declared theaterAspect ${declared}, tolerance ±${tolerance * 100}%`);
  for (const r of rows) {
    const a = r.aspect === null ? '   —  ' : r.aspect.toFixed(3).padStart(7);
    console.log(` ${r.verdict.padEnd(4)} ${a}  ${r.src}  (${r.nodes.length} node${r.nodes.length === 1 ? '' : 's'}${r.note ? `) — ${r.note}` : ')'}`);
  }
  const fails = rows.filter((r) => r.verdict === 'FAIL');
  const warns = rows.filter((r) => r.verdict === 'WARN');
  console.log(`\n${rows.length - fails.length - warns.length} pass, ${warns.length} warn, ${fails.length} fail`);
  if (fails.length > 0) {
    console.error('FAIL: cover-fit theatre assets outside the declared aspect contract');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
