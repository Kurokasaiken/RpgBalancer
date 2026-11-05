#!/usr/bin/env node
/**
 * kit-gen-all — PLAN-109 batch orchestrator: generate all kit pieces K2..K15.
 *
 * - One fresh background Gemini chat per variant, SEQUENTIAL (a parallel burst
 *   on 2026-11-02 tripped google's /sorry wall — gentle pacing only).
 * - Before every generation, probes /app: if it lands on /sorry, backs off 5 min.
 * - Skips variants that already have img-0.png (resumable).
 * - Transport failure (attach/submit/timeout): up to 3 attempts per variant.
 * - Heartbeats the shutdown registry session `kit-gen-plan109`.
 *
 * Usage: node scripts/kit-gen-all.mjs [--pieces K2,K3] [--delay 15]
 */
import { spawn } from 'child_process';
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : d; };
const ONLY = opt('pieces', null)?.split(',');
const DELAY_S = parseInt(opt('delay', '15'), 10);

const KIT = '.mw/specs/hud-zanara/kit';
const R = `${KIT}/approved/K1-ring-ritratto-raw.png`;
const I = `${KIT}/approved/K1-ring-insegna-raw.png`;
const S = `${KIT}/refs/emblem-subject-sun.png`;

// PLAN-109 priority order (update 2026-11-02: scope K2–K17, Voce Z11)
const PIECES = [
  { id: 'K2', prompt: 'K2-plaque.txt', refs: [R] },
  { id: 'K3', prompt: 'K3-band.txt', refs: [R] },
  { id: 'K4', prompt: 'K4-gems.txt', refs: [R] },
  { id: 'K5', prompt: 'K5-emblem.txt', refs: [I, S] },
  { id: 'K6', prompt: 'K6-band-end.txt', refs: [R] },
  { id: 'K7', prompt: 'K7-lastra-9slice.txt', refs: [R] },
  { id: 'K10', prompt: 'K10-foglio-alabastro.txt', refs: [R] },
  { id: 'K11', prompt: 'K11-smalto-tile.txt', refs: [R] },
  { id: 'K12', prompt: 'K12-alabastro-tile.txt', refs: [] },
  { id: 'K8', prompt: 'K8-cartiglio.txt', refs: [R] },
  { id: 'K9', prompt: 'K9-giunto.txt', refs: [R] },
  { id: 'K13', prompt: 'K13-sigillo.txt', refs: [I] },
  { id: 'K16a', prompt: 'K16a-busto-sinistro.txt', refs: [R] },
  { id: 'K16b', prompt: 'K16b-busto-destro.txt', refs: [R] },
  { id: 'K17', prompt: 'K17-voce-amanuense.txt', refs: [R] },
  { id: 'K14a', prompt: 'K14a-quadrante.txt', refs: [I] },
  { id: 'K14b', prompt: 'K14b-ago.txt', refs: [I] },
  { id: 'K15', prompt: 'K15-icone-mondo.txt', refs: [] },
];

// --- shutdown registry heartbeat ---
const REG = `${process.env.HOME}/.rpg-shutdown/session-registry.json`;
const SID = 'kit-gen-plan109';
function heartbeat(state = 'RUNNING') {
  try {
    const cur = JSON.parse(fs.readFileSync(REG, 'utf8'));
    cur.projects = cur.projects || {};
    const proj = cur.projects.RPG = cur.projects.RPG || { status: 'active', sessions: {} };
    proj.sessions[SID] = {
      pid: process.pid, owner: 'devin-kit-gen', state,
      blockingReason: 'kit generation PLAN-109 running',
      heartbeatAt: new Date().toISOString(), createdAt: proj.sessions[SID]?.createdAt || new Date().toISOString(),
      ttlSeconds: 1200,
    };
    cur.updatedAt = new Date().toISOString();
    fs.writeFileSync(REG, JSON.stringify(cur, null, 2));
  } catch {}
}
const hbTimer = setInterval(() => heartbeat(), 120000);
heartbeat();

// --- /app sorry-wall probe ---
// Three-way: 'walled' (sorry/captcha page), 'ok' (real app shell), 'unknown'
// (target missing, redirect pending, load error). Only 'ok' clears the gate —
// everything else is treated as walled so flaky probes can't burn retries.
let browser = null;
async function probeState() {
  try {
    if (!browser || !browser.isConnected()) browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
    const s = await browser.newBrowserCDPSession();
    const { targetId } = await s.send('Target.createTarget', { url: 'https://gemini.google.com/app', background: true });
    let url = '';
    for (let i = 0; i < 15; i++) {
      await new Promise(r => setTimeout(r, 1000));
      const { targetInfos } = await s.send('Target.getTargets');
      const t = targetInfos.find(t => t.targetId === targetId);
      url = t ? t.url : '';
      if (url.includes('/sorry') || url.includes('gemini.google.com/app/')) break;
    }
    await s.send('Target.closeTarget', { targetId }).catch(() => {});
    if (url.includes('/sorry')) return 'walled';
    if (url.includes('gemini.google.com/app')) return 'ok';
    return 'unknown';
  } catch (e) {
    console.log('probe error:', e.message.slice(0, 80));
    return 'unknown';
  }
}
async function sorryWall() { return (await probeState()) !== 'ok'; }

const sleep = (s) => new Promise(r => setTimeout(r, s * 1000));

async function waitForWall(maxMin = 90) {
  const deadline = Date.now() + maxMin * 60000;
  while (Date.now() < deadline) {
    const walled = await sorryWall();
    if (!walled) return true;
    console.log(`[${new Date().toISOString().slice(11, 19)}] /app still sorry-walled — retry in 5 min`);
    await sleep(300);
  }
  return false;
}

function genOne(id, variant, promptFile, refs) {
  return new Promise((resolve) => {
    const out = `${KIT}/gen/${id}/${variant}/img`;
    const cmd = ['scripts/gen-mappa2-sprite.mjs', '--prompt', `${KIT}/prompts/${promptFile}`, '--out', out, '--timeout', '300', '--close-tab'];
    for (const r of refs) cmd.push('--ref', r);
    const p = spawn('node', cmd, { stdio: ['ignore', 'pipe', 'pipe'] });
    let buf = '';
    p.stdout.on('data', d => { buf += d; });
    p.stderr.on('data', d => { buf += d; });
    p.on('close', code => resolve({ code, log: buf }));
  });
}

const pieces = ONLY ? PIECES.filter(p => ONLY.includes(p.id)) : PIECES;
for (const piece of pieces) {
  const dir = `${KIT}/gen/${piece.id}`;
  fs.mkdirSync(dir, { recursive: true });
  for (let v = 1; v <= 4; v++) {
    const variant = `v${v}`;
    if (fs.existsSync(`${dir}/${variant}/img-0.png`)) { console.log(`${piece.id} ${variant}: already done`); continue; }
    let done = false, quotaWaits = 0;
    for (let attempt = 1; attempt <= 3 && !done; attempt++) {
      if (!(await waitForWall())) { console.log('WALL_TIMEOUT — giving up'); heartbeat('COMPLETED'); clearInterval(hbTimer); process.exit(6); }
      heartbeat();
      console.log(`=== ${piece.id} ${variant} attempt ${attempt} ===`);
      const r = await genOne(piece.id, variant, piece.prompt, piece.refs);
      const url = (r.log.match(/CHAT_URL (\S+)/) || [])[1] || 'n/a';
      fs.appendFileSync(`${dir}/chats.txt`, `${variant}\t${url}\texit:${r.code}\tattempt:${attempt}\n`);
      console.log(`  exit ${r.code} ${url}`);
      done = r.code === 0 && fs.existsSync(`${dir}/${variant}/img-0.png`);
      if (!done) {
        if (r.code === 4) {
          // daily image quota exhausted ("limit resets" message) — long backoff,
          // does NOT consume the attempt. Cap ~6h of waits then give up.
          quotaWaits++;
          if (quotaWaits > 24) { console.log('  QUOTA_TIMEOUT — giving up on piece'); break; }
          console.log('  quota hit (no image generated) — backoff 15 min');
          await sleep(900); attempt--; continue;
        }
        const walled = await sorryWall();
        if (walled) { console.log('  fail + wall detected — backoff 5 min'); await sleep(300); attempt--; }
        else await sleep(20);
      }
    }
    if (!done) console.log(`${piece.id} ${variant}: EXHAUSTED attempts`);
    await sleep(DELAY_S);
  }
  console.log(`PIECE_DONE ${piece.id}`);
}
heartbeat('COMPLETED');
clearInterval(hbTimer);
if (browser) await browser.close().catch(() => {});
console.log('ALL_DONE');
process.exit(0);
