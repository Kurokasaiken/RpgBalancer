#!/usr/bin/env node
/**
 * gen-queue — unattended Gemini generation for the HUD language (PLAN-110).
 *
 * Reads every .mw/specs/hud-real/gen-jobs/*.json (alphabetical), runs the pending jobs one at a
 * time through scripts/gen-mappa2-sprite.mjs (background tab, fresh chat per job), and records
 * the result back into the job file. Built to run all night:
 *  - quota/refusal (exit 4): wait for the next hourly reset (:04 past the hour) and retry the same job
 *  - attach/prompt failure (exit 3/5): retry twice, then mark the job failed and move on
 *  - duplicate image (same sha256 as any previous output): removed, job marked "dup" (counts as a miss)
 *  - global budget: stops when gen-budget.json `used` reaches `maxTotal` (protects the weekly cap)
 * Never commits, never touches approved/ files. Exits when nothing is pending (or budget is spent).
 *
 * Job file: { "component": "C3", "jobs": [ { "id": "left-1", "zone": "nav-left",
 *   "refs": ["path.png", ...], "prompt": "path.txt", "out": "dir/prefix", "status": "pending" } ] }
 * Usage: node scripts/hud-real/gen-queue.mjs [--once]
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const JOBS = path.join(ROOT, '.mw/specs/hud-real/gen-jobs');
const BUDGET = path.join(ROOT, '.mw/specs/hud-real/gen-budget.json');
const SEEN = path.join(ROOT, '.mw/specs/hud-real/gen-seen.sha');
const LOG = path.join(ROOT, '.mw/specs/hud-real/gen-queue.log');
const RUNS = path.join(ROOT, 'scripts/hud-real/runs.jsonl');
const ONCE = process.argv.includes('--once');

const log = (m) => { const l = `[${new Date().toISOString()}] ${m}`; console.log(l); fs.appendFileSync(LOG, l + '\n'); };
const readJson = (p, d) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return d; } };
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** ms until the next hourly quota reset (observed :01 past the hour) plus a margin. */
const msToNextReset = () => {
  const n = new Date(); const t = new Date(n); t.setMinutes(4, 0, 0); if (t <= n) t.setHours(t.getHours() + 1);
  return t - n;
};

const budget = () => readJson(BUDGET, { maxTotal: 160, used: 0 });
const spend = (n) => { const b = budget(); b.used += n; fs.writeFileSync(BUDGET, JSON.stringify(b, null, 2)); };

fs.mkdirSync(JOBS, { recursive: true });
if (!fs.existsSync(SEEN)) fs.writeFileSync(SEEN, '');

const files = () => fs.readdirSync(JOBS).filter((f) => f.endsWith('.json')).sort();

async function runJob(file, doc, job) {
  const out = path.join(ROOT, job.out);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const args = ['scripts/gen-mappa2-sprite.mjs'];
  for (const r of job.refs ?? []) args.push('--ref', r);
  args.push('--prompt', job.prompt, '--out', job.out, '--timeout', '300', '--close-tab');
  let softFails = 0;
  for (let attempt = 0; attempt < 40; attempt++) {
    if (budget().used >= budget().maxTotal) { log(`budget spent (${budget().used}/${budget().maxTotal}), stopping`); return 'budget'; }
    log(`${doc.component}/${job.id}: generating (attempt ${attempt + 1})`);
    const r = spawnSync(process.execPath, args, { cwd: ROOT, encoding: 'utf8', timeout: 6 * 60 * 1000 });
    fs.writeFileSync(`${out}.log`, (r.stdout ?? '') + (r.stderr ?? ''));
    const ec = r.status;
    if (ec === 0) {
      const img = `${out}-0.png`;
      if (!fs.existsSync(img)) { log('exit 0 but no image file'); job.status = 'failed'; return 'failed'; }
      const h = sha(img);
      spend(1);
      const seen = fs.readFileSync(SEEN, 'utf8');
      if (seen.includes(h)) { fs.rmSync(img); job.status = 'dup'; log(`${job.id}: duplicate of an earlier output, removed`); return 'dup'; }
      fs.appendFileSync(SEEN, h + '\n');
      job.status = 'done'; job.file = `${job.out}-0.png`; job.sha16 = h.slice(0, 16);
      fs.appendFileSync(RUNS, JSON.stringify({ ts: new Date().toISOString(), kind: 'first', component: doc.component, zone: job.zone, variant: job.id, model: 'gemini-auto', chosen: false, file: job.file }) + '\n');
      log(`${job.id}: done`);
      return 'done';
    }
    if (ec === 4) {
      const w = msToNextReset();
      log(`${job.id}: no image (quota or refusal), waiting ${Math.round(w / 60000)} min for the next reset`);
      job.status = 'waiting'; fs.writeFileSync(file, JSON.stringify(doc, null, 2));
      await sleep(w);
      continue;
    }
    softFails++;
    log(`${job.id}: exit ${ec} (attach/prompt/unknown), soft fail ${softFails}`);
    if (softFails >= 3) { job.status = 'failed'; return 'failed'; }
    await sleep(60 * 1000);
  }
  job.status = 'failed';
  return 'failed';
}

async function main() {
  log(`queue start, budget ${JSON.stringify(budget())}`);
  for (;;) {
    let ran = false;
    for (const f of files()) {
      const file = path.join(JOBS, f);
      const doc = readJson(file, null);
      if (!doc) continue;
      const job = doc.jobs.find((j) => j.status === 'pending' || j.status === 'waiting');
      if (!job) continue;
      const res = await runJob(file, doc, job);
      fs.writeFileSync(file, JSON.stringify(doc, null, 2));
      ran = true;
      if (res === 'budget') return;
      await sleep(12 * 1000);
      break;
    }
    if (!ran || ONCE) break;
  }
  log('queue empty — done');
}
main();
