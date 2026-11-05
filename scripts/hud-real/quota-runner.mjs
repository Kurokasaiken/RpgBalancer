#!/usr/bin/env node
/**
 * quota-runner.mjs — PLAN-110 §13 E-09 quota ledger + resume (zero generations).
 *
 * quota.json (per window):
 * { "window": "2026-11-03", "probe": 0, "first": 0, "repair": 0, "slack": 0 }
 * Caps: probe 8, first 12, repair 12, slack 8 — total 40/window.
 * Per-zone repair cap: repairs per zone id (zone.counters).
 *
 * runs.jsonl: every generation attempt appended
 * {ts, kind, component, zone, variant, prompt_sha, model, chosen, file}
 * → resume reconstructs state without re-running the first pass.
 *
 * Usage:
 *   quota-runner.mjs can <probe|first|repair|slack> [--zone Z]   exit 0/3
 *   quota-runner.mjs spend <kind> [--component C --zone Z --variant N --file F --model M]
 *   quota-runner.mjs status
 *   quota-runner.mjs resume            → reconstruction report
 *   quota-runner.mjs blocked           → mark window inconclusive
 */
import { existsSync, readFileSync, writeFileSync, appendFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = join(dirname(fileURLToPath(import.meta.url)));
const QUOTA = join(DIR, 'quota.json');
const RUNS = join(DIR, 'runs.jsonl');
const CAPS = { probe: 8, first: 12, repair: 12, slack: 8 };
const REPAIR_CAP_PER_ZONE = 3;
const today = () => new Date().toISOString().slice(0, 10);

const load = () => {
  const q = existsSync(QUOTA) ? JSON.parse(readFileSync(QUOTA, 'utf8')) : null;
  if (!q || q.window !== today()) {
    return { window: today(), probe: 0, first: 0, repair: 0, slack: 0, zones: {}, blocked: false };
  }
  return q;
};
const save = (q) => writeFileSync(QUOTA, JSON.stringify(q, null, 2));
const remaining = (q) => Object.values(CAPS).reduce((s, c) => s + c, 0) - (q.probe + q.first + q.repair + q.slack);

const [cmd, kind, ...rest] = process.argv.slice(2);
const opt = (k) => { const i = rest.indexOf(`--${k}`); return i >= 0 ? rest[i + 1] : undefined; };
const q = load();

if (cmd === 'status') {
  console.log(JSON.stringify({ window: q.window, used: { probe: q.probe, first: q.first, repair: q.repair, slack: q.slack }, remaining: remaining(q), caps: CAPS, blocked: q.blocked, zones: q.zones }, null, 1));
  process.exit(0);
}
if (cmd === 'blocked') {
  q.blocked = true; save(q);
  console.log('window marked inconclusive — runner pauses, ask the Director; resume on next window.');
  process.exit(0);
}
if (cmd === 'resume') {
  if (!existsSync(RUNS)) { console.log('no runs.jsonl — nothing to resume'); process.exit(0); }
  const lines = readFileSync(RUNS, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
  const byZone = {};
  for (const r of lines) {
    const k = `${r.component}/${r.zone}`;
    byZone[k] = byZone[k] || { runs: 0, variants: [], chosen: null, repairs: 0 };
    byZone[k].runs += 1;
    byZone[k].variants.push(r.variant);
    if (r.chosen) byZone[k].chosen = r.variant;
    if (r.kind === 'repair') byZone[k].repairs += 1;
  }
  console.log(JSON.stringify({ window: q.window, resume: byZone }, null, 1));
  process.exit(0);
}
if (cmd === 'can') {
  if (!CAPS[kind]) { console.error(`unknown kind ${kind}`); process.exit(2); }
  if (q.blocked) { console.error(`BLOCKED window — inconclusive, ask the Director`); process.exit(3); }
  if (q[kind] >= CAPS[kind]) { console.error(`${kind} cap ${CAPS[kind]} reached`); process.exit(3); }
  const z = opt('zone');
  if (kind === 'repair' && z && (q.zones?.[z] ?? 0) >= REPAIR_CAP_PER_ZONE) {
    console.error(`repair cap for zone ${z} reached (${REPAIR_CAP_PER_ZONE})`); process.exit(3);
  }
  console.log(`${kind} ok — ${remaining(q)} left in window`);
  process.exit(0);
}
if (cmd === 'spend') {
  if (!CAPS[kind]) { console.error(`unknown kind ${kind}`); process.exit(2); }
  mkdirSync(DIR, { recursive: true });
  q[kind] += 1;
  const z = opt('zone');
  if (kind === 'repair' && z) q.zones[z] = (q.zones[z] ?? 0) + 1;
  save(q);
  const rec = {
    ts: new Date().toISOString(), kind,
    component: opt('component'), zone: z, variant: opt('variant'),
    prompt_sha: opt('prompt') ? createHash('sha256').update(opt('prompt')).digest('hex').slice(0, 12) : undefined,
    model: opt('model'), chosen: opt('chosen') === '1', file: opt('file'),
  };
  appendFileSync(RUNS, JSON.stringify(rec) + '\n');
  console.log(`spent ${kind} — ${remaining(q)} left`);
  process.exit(0);
}
console.error(`usage: can|spend|status|resume|blocked`); process.exit(2);
