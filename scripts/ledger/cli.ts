#!/usr/bin/env tsx
/**
 * mw-ledger — ops CLI for the work-item ledger (PLAN-077).
 *
 * Journal mechanics:
 *   init | status | verify | repair --reason <why> | append --type <t> --payload <json>  (ops/dev)
 *
 * Work-item domain commands (T-006) — all go through the dispatcher
 * (validate-before-journal), never a raw append:
 *   item-ingest --id <id> --kind defect|change|feature --title "…"
 *               [--files a.ts,b.ts] [--surfaces s1,s2] [--deps X,Y]
 *               [--no-confirm] [--max-attempts N]
 *   item-confirm --id <id> --feedback "Risolto" [--session s1]
 *   item-withdraw --id <id> --reason "…"
 *   surface-release --id <id> --force        (human act — releases all live holds)
 *   tick [--exec-cap N] [--verify-cap M]     (T-005 — pilot cap default 4, ruling R-262)
 *   report                                    (closed/blocked/awaiting/…)
 */

import { createHash } from 'node:crypto';
import {
  appendRecord,
  initLedger,
  journalPath,
  loadSnapshot,
  repairJournal,
  validateJournal,
  LEDGER_DIR,
} from './ledgerCore';
import { openLedger } from './dispatcher';
import { deriveLocks } from './surfaceLock';
import { queueReport, AWAIT_TTL_MS } from './workItem';
import { computeTick, runTick, PILOT_TICK } from './queue';

function arg(flag: string): string | undefined {
  const a = process.argv.find((x) => x.startsWith(`--${flag}=`));
  if (a) return a.split('=').slice(1).join('=');
  const i = process.argv.indexOf(`--${flag}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const has = (flag: string) => process.argv.includes(`--${flag}`);
const list = (flag: string): string[] => (arg(flag) ?? '').split(',').map((s) => s.trim()).filter(Boolean);

const cmd = process.argv[2];
const dir = arg('dir') ?? LEDGER_DIR;

function fail(msg: string, code = 1): never {
  console.error(`[mw-ledger] ${msg}`);
  process.exit(code);
}
function applied(r: { applied: boolean; error?: string; record?: { seq: number } }, what: string): void {
  if (!r.applied) fail(`${what}: ${r.error}`);
  console.log(`[mw-ledger] ${what} → seq ${r.record!.seq}`);
}

if (!cmd || cmd === 'help') {
  console.log(
    'commands: init | status | verify | repair | append (ops) — domain: item-ingest | item-confirm | item-withdraw | surface-release --force | tick | report',
  );
  process.exit(0);
}

try {
  switch (cmd) {
    case 'init': {
      const g = initLedger(dir);
      console.log(`[mw-ledger] initialized ${journalPath(dir)} (genesis seq ${g.seq}, checksum ${g.checksum.slice(0, 12)}…)`);
      break;
    }
    case 'status': {
      const v = validateJournal(dir);
      const snap = loadSnapshot(dir);
      console.log(
        JSON.stringify(
          {
            journal: journalPath(dir),
            ok: v.ok,
            history_complete: v.history_complete,
            records: v.records.length,
            watermark: v.records.length > 0 ? v.records[v.records.length - 1].seq : null,
            corrupt: v.corrupt ?? null,
            snapshot_at_seq: snap?.at_seq ?? null,
          },
          null,
          2,
        ),
      );
      if (!v.ok) process.exit(1);
      break;
    }
    case 'verify': {
      const v = validateJournal(dir);
      if (v.ok && v.history_complete) {
        console.log(`[mw-ledger] OK — ${v.records.length} records, chain intact, history complete`);
      } else {
        fail(`corrupt at seq ${v.corrupt?.seq}: ${v.corrupt?.reason}`);
      }
      break;
    }
    case 'repair': {
      const reason = arg('reason');
      if (!reason) fail('repair requires --reason', 2);
      const v = repairJournal(dir, reason);
      console.log(`[mw-ledger] repaired — ${v.records.length} records, journal_repair journaled`);
      break;
    }
    case 'append': {
      const type = arg('type');
      if (!type) fail('append requires --type', 2);
      const payload = arg('payload') ? JSON.parse(arg('payload') as string) : {};
      const rec = appendRecord(type, payload, dir);
      console.log(`[mw-ledger] appended seq ${rec.seq} (${type})`);
      break;
    }

    /* ------------------ domain commands (dispatcher) ------------------ */

    case 'item-ingest': {
      const id = arg('id');
      const kind = arg('kind') ?? 'defect';
      if (!id) fail('item-ingest requires --id', 2);
      if (!['defect', 'change', 'feature'].includes(kind)) fail(`--kind must be defect|change|feature`, 2);
      const L = openLedger(dir);
      applied(
        L.apply('item_ingested', {
          item_id: id,
          kind,
          title: arg('title') ?? id,
          expected_files: list('files'),
          surfaces: list('surfaces'),
          depends_on: list('deps'),
          requires_director_confirmation: !has('no-confirm'),
          ...(arg('max-attempts') ? { max_fix_attempts: Number(arg('max-attempts')) } : {}),
        }),
        `item_ingested ${id}`,
      );
      break;
    }

    case 'item-confirm': {
      const id = arg('id');
      const feedback = arg('feedback');
      if (!id || !feedback) fail('item-confirm requires --id and --feedback', 2);
      const L = openLedger(dir);
      const it = L.item(id);
      if (!it) fail(`unknown item ${id}`);
      const awaited = it.awaiting;
      if (it.status !== 'AWAITING_DIRECTOR' || !awaited) {
        fail(`${id} is not AWAITING_DIRECTOR (status: ${it.status}) — a confirmation would be journaled stale`);
      }
      const attempt = it.attempts.find((a) => a.attempt_id === awaited!.attempt_id)!;
      applied(
        L.apply('confirmation', {
          item_id: id,
          attempt_id: attempt.attempt_id,
          revision_hash: attempt.surface_manifest_hash ?? '',
          feedback_hash: createHash('sha256').update(feedback).digest('hex'),
          session_id: arg('session') ?? 'cli',
          feedback_text: feedback,
          at: new Date().toISOString(),
        }),
        `confirmation ${id} @${attempt.attempt_id}`,
      );
      break;
    }

    case 'item-withdraw': {
      const id = arg('id');
      if (!id) fail('item-withdraw requires --id', 2);
      const L = openLedger(dir);
      applied(L.apply('item_withdrawn', { item_id: id, reason: arg('reason') ?? 'director' }), `item_withdrawn ${id}`);
      break;
    }

    case 'surface-release': {
      const id = arg('id');
      if (!id || !has('force')) fail('surface-release requires --id and --force (human act)', 2);
      const L = openLedger(dir);
      const v = L.validate();
      const st = L.state();
      const live = [...deriveLocks(v.records, st).values()].filter((l) => l.item_id === id);
      if (live.length === 0) {
        console.log(`[mw-ledger] ${id}: no live locks`);
        break;
      }
      // Force-release: journaled as the holder's own release, marked forced —
      // a Director act, auditable forever.
      for (const l of live) {
        applied(
          L.apply('lock_released', {
            item_id: id,
            attempt_id: l.attempt_id,
            attempt_token: l.attempt_token,
            keys: [l.key],
            forced: true,
            actor: 'director',
          }),
          `force-release ${l.key}`,
        );
      }
      break;
    }

    case 'tick': {
      const L = openLedger(dir);
      const r = runTick(L, {
        execution_cap: Number(arg('exec-cap') ?? PILOT_TICK.execution_cap),
        verification_cap: Number(arg('verify-cap') ?? PILOT_TICK.verification_cap),
      });
      console.log(
        JSON.stringify(
          {
            tick_id: r.tick_id,
            running_now: r.running_now,
            verifying_now: r.verifying_now,
            assignments: r.assignments.map((a) => ({ item: a.item_id, attempt: a.attempt_id, id: a.assignment_id })),
            skipped: r.skipped,
            suspect_fixed: r.suspect_fixed,
            journaled: r.journaled,
          },
          null,
          2,
        ),
      );
      break;
    }

    case 'report': {
      const L = openLedger(dir);
      const v = L.validate();
      const st = L.state();
      const wm = v.records.length ? v.records[v.records.length - 1]!.seq : 0;
      // seq-TTL disabled (0): staleness is wall-clock — AWAIT_TTL_MS (48h).
      const report = queueReport(st, wm, 0);
      const now = Date.now();
      for (const it of st.items.values()) {
        if (
          it.status === 'AWAITING_DIRECTOR' &&
          it.awaiting?.since_at &&
          now - Date.parse(it.awaiting.since_at) > AWAIT_TTL_MS
        ) {
          report.awaiting_director = report.awaiting_director.filter((x) => x !== it.item_id);
          report.awaiting_stale.push(it.item_id);
        }
      }
      const locks = [...deriveLocks(v.records, st).values()];
      const tick = computeTick(st, v.records, PILOT_TICK);
      console.log(
        JSON.stringify(
          {
            watermark: wm,
            queue: report,
            suspect_fixed: tick.suspect_fixed,
            live_locks: locks.map((l) => ({ key: l.key, item: l.item_id, attempt: l.attempt_id })),
          },
          null,
          2,
        ),
      );
      break;
    }

    default:
      fail(`unknown command: ${cmd}`, 2);
  }
} catch (e) {
  fail(e instanceof Error ? e.message : String(e));
}
