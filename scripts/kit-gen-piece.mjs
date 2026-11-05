#!/usr/bin/env node
/**
 * kit-gen-piece — generate variants of one zanara kit piece via Gemini (CDP :9222).
 *
 * Wraps scripts/gen-mappa2-sprite.mjs: one fresh background chat per variant,
 * appends CHAT_URL lines to kit/gen/<ID>/chats.txt, heartbeats the shutdown
 * registry between shots. Transport failures get ONE immediate retry (logged).
 *
 * Usage:
 *   node scripts/kit-gen-piece.mjs --id K2 --prompt .mw/specs/hud-zanara/kit/prompts/K2-plaque.txt \
 *     [--ref path.png ...] [--gen v1,v2,v3,v4]   # default v1..v4; retry dirs: v2r1, v2r2
 */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const argv = process.argv.slice(2);
const opts = { ref: [] };
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--ref') opts.ref.push(argv[++i]);
  else if (argv[i].startsWith('--')) opts[argv[i].slice(2)] = argv[++i];
}
const ID = opts.id;
const PROMPT = opts.prompt;
const GEN = (opts.gen || 'v1,v2,v3,v4').split(',');
if (!ID || !PROMPT) { console.error('need --id and --prompt'); process.exit(2); }
const ROOT = path.resolve(`.mw/specs/hud-zanara/kit/gen/${ID}`);
fs.mkdirSync(ROOT, { recursive: true });
const chatsFile = path.join(ROOT, 'chats.txt');

// --- shutdown registry heartbeat (schema of scripts/shutdownManager) ---
const REG = `${process.env.HOME}/.rpg-shutdown/session-registry.json`;
const SID = `kit-gen-${ID}`;
function heartbeat(state = 'RUNNING') {
  try {
    const cur = JSON.parse(fs.readFileSync(REG, 'utf8'));
    cur.projects = cur.projects || {};
    const proj = cur.projects.RPG = cur.projects.RPG || { status: 'active', sessions: {} };
    proj.sessions[SID] = {
      pid: process.pid, owner: 'devin-kit-gen', state,
      blockingReason: `kit generation ${ID} running`,
      heartbeatAt: new Date().toISOString(), createdAt: proj.sessions[SID]?.createdAt || new Date().toISOString(),
      ttlSeconds: 900,
    };
    cur.updatedAt = new Date().toISOString();
    fs.writeFileSync(REG, JSON.stringify(cur, null, 2));
  } catch (e) { console.log('registry heartbeat failed:', e.message); }
}
heartbeat();

function genOne(variant) {
  return new Promise((resolve) => {
    const out = path.join(ROOT, variant, 'img');
    const cmd = ['scripts/gen-mappa2-sprite.mjs', '--prompt', PROMPT, '--out', out, '--timeout', '300', '--close-tab'];
    for (const r of opts.ref) cmd.push('--ref', r);
    const p = spawn('node', cmd, { stdio: ['ignore', 'pipe', 'pipe'] });
    let buf = '';
    p.stdout.on('data', (d) => { buf += d; process.stdout.write(`  [${variant}] ${d}`); });
    p.stderr.on('data', (d) => process.stderr.write(`  [${variant}!] ${d}`));
    p.on('close', (code) => resolve({ code, log: buf }));
  });
}

for (const v of GEN) {
  heartbeat();
  console.log(`=== ${ID} ${v} ===`);
  let r = await genOne(v);
  if (r.code !== 0) {
    console.log(`  ${v} transport fail (exit ${r.code}) — one retry`);
    heartbeat();
    r = await genOne(v);
  }
  const url = (r.log.match(/CHAT_URL (\S+)/) || [])[1] || 'n/a';
  fs.appendFileSync(chatsFile, `${v}\t${url}\texit:${r.code}\n`);
  console.log(`=== ${ID} ${v} exit ${r.code} ===`);
}
heartbeat('COMPLETED');
console.log(`PIECE_DONE ${ID}`);
