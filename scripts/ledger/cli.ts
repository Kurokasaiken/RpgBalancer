#!/usr/bin/env tsx
/**
 * mw-ledger — ops CLI for the work-item ledger (PLAN-077 T-001).
 *
 * Usage:
 *   tsx scripts/ledger/cli.ts init [--dir .mw/ledger]
 *   tsx scripts/ledger/cli.ts status [--dir .mw/ledger]
 *   tsx scripts/ledger/cli.ts verify [--dir .mw/ledger]      # exit 1 on corruption
 *   tsx scripts/ledger/cli.ts repair --reason "why" [--dir .mw/ledger]
 *   tsx scripts/ledger/cli.ts append --type <t> --payload '{…}' [--dir …]  # ops/dev only
 */

import {
  appendRecord,
  initLedger,
  journalPath,
  loadSnapshot,
  repairJournal,
  validateJournal,
  LEDGER_DIR,
} from './ledgerCore';

function arg(flag: string): string | undefined {
  const a = process.argv.find((x) => x.startsWith(`--${flag}=`));
  if (a) return a.split('=').slice(1).join('=');
  const i = process.argv.indexOf(`--${flag}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const cmd = process.argv[2];
const dir = arg('dir') ?? LEDGER_DIR;

function fail(msg: string, code = 1): never {
  console.error(`[mw-ledger] ${msg}`);
  process.exit(code);
}

if (!cmd || cmd === 'help') {
  console.log('commands: init | status | verify | repair --reason <why> | append --type <t> --payload <json>');
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
    default:
      fail(`unknown command: ${cmd}`, 2);
  }
} catch (e) {
  fail(e instanceof Error ? e.message : String(e));
}
