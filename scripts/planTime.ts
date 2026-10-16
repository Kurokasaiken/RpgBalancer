#!/usr/bin/env tsx
/**
 * planTime — per-plan wall-clock ledger (R-208 ROI measurement).
 *
 * Records lifecycle events for a plan and computes the elapsed time the
 * workflow actually spent on it. The question it answers: does the
 * single-agent contract-first workflow save the estimated ~30–60 min/plan
 * over the kanban/dispatch era? (R-204/PLAN-041 arena proved external lanes
 * don't pay today; this measures whether the slimmed workflow does.)
 *
 * Events live in `context/plan-timing.jsonl` — append-only, git-visible.
 *
 * Usage:
 *   npm run plan:stamp -- open  PLAN-044            # baptized / work started
 *   npm run plan:stamp -- close PLAN-044            # status → completed
 *   npm run plan:stamp -- note  PLAN-044 "waiting on Director" [--kind gate]
 *   npm run plan:stamp -- report                    # per-plan + aggregate table
 *
 * Optional `--lane local|external` on open records who executed, so the
 * report can split lanes when external executors return.
 */

import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const LEDGER = path.join(process.cwd(), 'context', 'plan-timing.jsonl');

interface PlanEvent {
  plan: string;
  event: 'open' | 'close' | 'note';
  at: string;
  lane?: string;
  kind?: string;
  text?: string;
}

function readLedger(): PlanEvent[] {
  if (!existsSync(LEDGER)) return [];
  return readFileSync(LEDGER, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l) as PlanEvent);
}

function fmtDur(ms: number): string {
  const m = Math.round(ms / 60000);
  return m >= 60 ? `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}m` : `${m}m`;
}

function report(): void {
  const events = readLedger();
  const byPlan = new Map<string, PlanEvent[]>();
  for (const e of events) {
    const l = byPlan.get(e.plan) ?? [];
    l.push(e);
    byPlan.set(e.plan, l);
  }
  console.log('| plan | opened | closed | elapsed | lane | notes |');
  console.log('|---|---|---|---|---|---|');
  const durations: number[] = [];
  for (const [plan, evs] of [...byPlan.entries()].sort()) {
    const open = evs.find((e) => e.event === 'open');
    const close = evs.filter((e) => e.event === 'close').pop();
    const lane = open?.lane ?? 'local';
    let elapsed = '';
    if (open && close) {
      const ms = new Date(close.at).getTime() - new Date(open.at).getTime();
      durations.push(ms);
      elapsed = fmtDur(ms);
    } else if (open) {
      elapsed = `open (${fmtDur(Date.now() - new Date(open.at).getTime())} so far)`;
    }
    console.log(
      `| ${plan} | ${open?.at.slice(0, 16) ?? '—'} | ${close?.at.slice(0, 16) ?? '—'} | ${elapsed} | ${lane} | ${evs.filter((e) => e.event === 'note').length} |`,
    );
  }
  if (durations.length > 0) {
    const mean = durations.reduce((a, b) => a + b, 0) / durations.length;
    console.log(`\nMean elapsed per closed plan: ${fmtDur(mean)} (n=${durations.length})`);
    console.log(`R-208 target: ≥30min/plan saved vs kanban-era baseline (to be compared against historical estimate, not absolute elapsed).`);
  }
}

function main(): void {
  const [cmd, plan, ...rest] = process.argv.slice(2);
  if (cmd === 'report') {
    report();
    return;
  }
  if (!plan || !/^PLAN-\d+/i.test(plan)) {
    console.error('usage: plan:stamp <open|close|note> PLAN-NNN [text] [--lane x] [--kind y]');
    process.exit(1);
  }
  const laneIdx = rest.indexOf('--lane');
  const kindIdx = rest.indexOf('--kind');
  const text = rest.filter((_, i) => i !== laneIdx && i !== laneIdx + 1 && i !== kindIdx && i !== kindIdx + 1).join(' ');
  const event: PlanEvent = {
    plan: plan.toUpperCase(),
    event: cmd === 'open' ? 'open' : cmd === 'close' ? 'close' : 'note',
    at: new Date().toISOString(),
  };
  if (laneIdx >= 0) event.lane = rest[laneIdx + 1];
  if (kindIdx >= 0) event.kind = rest[kindIdx + 1];
  if (text) event.text = text;
  appendFileSync(LEDGER, JSON.stringify(event) + '\n');
  console.log(`[planTime] ${event.plan} ${event.event} @ ${event.at}`);
}

main();
