#!/usr/bin/env node
/**
 * hud-recon-loop — overnight runner for the r002 reconstruction protocol.
 * For each selected component: generate asset (Gemini bg tab) -> alpha-cut ->
 * side-by-side composite vs source crop -> optional repair iteration (anchored
 * chat edit) -> log verdict-ish metrics to OVERNIGHT-REPORT.md.
 * Usage: node scripts/hud-recon-loop.mjs [--only id1,id2] [--max-iters 2]
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const ONLY = opt('only', null)?.split(',');
const MAX_ITERS = parseInt(opt('max-iters', '2'), 10);
const OUT = '.mw/specs/hud-zanara/overnight';
const REPORT = `${OUT}/OVERNIGHT-REPORT.md`;
// ensure an authenticated CDP browser on :9222: launches the shared MW-profile
// Canary in background when down; polls until ready. Called before every gen.
const SHARED_PROFILE = '/Users/faustoboni/progetti_personali/mind-weaver/.mw/providers/profiles/shared';
async function ensureCDP(maxMin = 60) {
  const up = async () => {
    try { const r = await fetch('http://127.0.0.1:9222/json/version'); return r.ok; }
    catch { return false; }
  };
  const t0 = Date.now();
  for (;;) {
    if (await up()) { await sleep(8000); return true; }
    console.log('CDP down — launching shared-profile Canary in background');
    try {
      execFileSync('open', ['-g', '-j', '-na', 'Google Chrome Canary', '--args',
        '--remote-debugging-port=9222', `--user-data-dir=${SHARED_PROFILE}`,
        '--no-first-run', '--no-default-browser-check', '--remote-allow-origins=*',
        '--disable-blink-features=AutomationControlled', '--hide-crash-restore-bubble'], { timeout: 15000 });
    } catch (e) { console.log('canary launch failed:', String(e).slice(0, 120)); }
    await sleep(15000);
    if (await up()) { await sleep(10000); console.log('CDP up (+warmup)'); return true; }
    if (Date.now() - t0 > maxMin * 60000) return false;
    await sleep(15000);
  }
}
// register this run so the shutdown manager does not power off mid-loop
function registerSession() {
  try {
    const reg = `${process.env.HOME}/.rpg-shutdown/session-registry.json`;
    const cur = fs.existsSync(reg) ? JSON.parse(fs.readFileSync(reg, 'utf8')) : { sessions: [] };
    cur.sessions = (cur.sessions || []).filter((s) => s.id !== 'hud-recon-overnight');
    cur.sessions.push({ id: 'hud-recon-overnight', kind: 'asset-generation-loop', started: new Date().toISOString(), heartbeat: new Date().toISOString() });
    fs.writeFileSync(reg, JSON.stringify(cur, null, 2));
  } catch (e) { console.log('session-registry write failed:', e.message); }
}
setInterval(() => {
  try {
    const reg = `${process.env.HOME}/.rpg-shutdown/session-registry.json`;
    const cur = JSON.parse(fs.readFileSync(reg, 'utf8'));
    const s = (cur.sessions || []).find((x) => x.id === 'hud-recon-overnight');
    if (s) { s.heartbeat = new Date().toISOString(); fs.writeFileSync(reg, JSON.stringify(cur, null, 2)); }
  } catch {}
}, 60000);

const cfg = JSON.parse(fs.readFileSync(opt('config', `${OUT}/components.json`), 'utf8'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function cutNavy(src, out) {
  const { data, info } = await sharp(src).raw().toBuffer({ resolveWithObject: true });
  const px = new Uint8ClampedArray((data.length / info.channels) * 4);
  let n = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const d = Math.abs(r - 10) + Math.abs(g - 22) + Math.abs(b - 34);
    px[n * 4] = r; px[n * 4 + 1] = g; px[n * 4 + 2] = b; px[n * 4 + 3] = d <= 30 ? 0 : d >= 70 ? 255 : Math.round(((d - 30) / 40) * 255);
    n++;
  }
  await sharp(px, { raw: { width: info.width, height: info.height, channels: 4 } }).trim({ threshold: 8 }).png().toFile(out);
}

async function sideBySide(srcPath, genPath, outPath) {
  const h = 480;
  const a = await sharp(srcPath).resize({ height: h }).png().toBuffer();
  const b = await sharp(genPath).resize({ height: h }).png().toBuffer();
  const [ma, mb] = await Promise.all([sharp(a).metadata(), sharp(b).metadata()]);
  await sharp({ create: { width: ma.width + mb.width + 30, height: h, channels: 4, background: { r: 7, g: 18, b: 28, alpha: 1 } } })
    .composite([{ input: a, left: 0, top: 0 }, { input: b, left: ma.width + 30, top: 0 }]).png().toFile(outPath);
}

const log = (s) => { fs.appendFileSync(REPORT, s + '\n'); console.log(s); };
const targets = ONLY ? cfg.components.filter((c) => ONLY.includes(c.id)) : cfg.components;

fs.writeFileSync(REPORT, `# HUD recon overnight — ${new Date().toISOString()}\n\ncomponents: ${targets.map((t) => t.id).join(', ')}\n\n`);

registerSession();
for (const comp of targets) {
  const dir = `${OUT}/${comp.id}`;
  fs.mkdirSync(dir, { recursive: true });
  if (fs.existsSync(`${dir}/DONE`)) { log(`## ${comp.id} — already DONE, skipping`); continue; }
  fs.writeFileSync(`${dir}/prompt.txt`, comp.prompt);
  log(`\n## ${comp.id} — ${comp.title}`);
  let chatUrl = comp.chat || null, best = null;
  for (let it = 0; it < MAX_ITERS; it++) {
    const prefix = `${dir}/iter${it}`;
    const genArgs = ['scripts/gen-mappa2-sprite.mjs', '--prompt', `${dir}/prompt.txt`, '--out', prefix, '--timeout', '420'];
    if (it === 0 && comp.ref && fs.existsSync(comp.ref)) genArgs.push('--ref', comp.ref);
    if (chatUrl) genArgs.push('--chat', chatUrl);
    log(`### iter ${it} — generation…`);
    const findImgs = () => fs.readdirSync(dir)
      .filter((f) => f.startsWith(`iter${it}-`) && /-\d+\.png$/.test(f))
      .sort().map((f) => `${dir}/${f}`);
    let imgs = findImgs();
    if (imgs.length === 0) {
      try {
        if (!(await ensureCDP())) { log('CDP unavailable — aborting iter'); continue; }
        const out = execFileSync('node', genArgs, { encoding: 'utf8', timeout: 480000 });
        const chatMatch = out.match(/CHAT_URL (\S+)/);
        if (chatMatch) chatUrl = chatMatch[1];
      } catch (e) { log(`gen FAILED iter ${it}: ${String(e.message || e).slice(0, 300)}`); }
      imgs = findImgs();
    }
    if (imgs.length === 0) { log('no images produced'); continue; }
    best = imgs[imgs.length - 1];
    log(`using ${best}`);
    // alpha cut + side-by-side
    try {
      await cutNavy(best, `${prefix}-alpha.png`);
      if (comp.ref && fs.existsSync(comp.ref)) await sideBySide(comp.ref, best, `${prefix}-compare.png`);
      log(`cut+compare done`);
    } catch (e) { log(`cut FAILED: ${String(e).slice(0, 200)}`); }
    // single repair iteration on subsequent iters uses same chat (anchored)
    await sleep(90000); // breathing room for the account
  }
  log(`done ${comp.id} — best: ${best ?? 'NONE'}`);
  if (best) fs.writeFileSync(`${dir}/DONE`, best);
}
log('\n## END — components with no saved asset need manual repair.');
process.exit(0);
