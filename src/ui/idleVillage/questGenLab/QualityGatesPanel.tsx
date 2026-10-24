/**
 * QualityGatesPanel — the "Quality gates" card (PLAN-029 SP-3 T-10).
 *
 * Renders one row per inventory gate (coverage invariant — rows exist
 * even for unrun/unimplemented gates), the aggregate badge, the derived
 * STALE banner (report.scenarioHash ≠ current entry hash), and the
 * configIssues block. Run is manual; Cancel aborts in-flight work and
 * keeps the honest partial report. A PASS badge is never a runtime
 * authorization — the canonical engine keeps enforcing.
 */

import React, { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { runValidation } from '@/balancing/config/idleVillage/quests/validation';
import { computeScenarioVersion } from '@/balancing/config/idleVillage/quests/questScenario.schema';
import type { LabCandidate } from './candidate';
import type { LabExplorerEntry } from './labModel';
import type {
  GateResult,
  ValidationReport,
} from '@/balancing/config/idleVillage/quests/validation/types';
import { Chip, LabCard } from './labUi';

const STATUS_TONE: Record<string, 'default' | 'warn' | 'good' | 'mono'> = {
  PASS: 'good',
  WARNING: 'warn',
  FAIL: 'warn',
  NOT_RUN: 'mono',
};

const GateRow: React.FC<{ g: GateResult }> = ({ g }) => {
  const { t } = useTranslation('idleVillage');
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-md border border-white/5 bg-white/[0.02] px-2 py-1.5">
      <div className="flex items-center gap-2">
        <Chip tone={g.kind === 'hard' ? 'mono' : 'default'}>{g.kind === 'hard' ? 'H' : 'D'}</Chip>
        <span className="min-w-0 shrink-0 break-all font-mono text-[10px] text-slate-300" style={{ maxWidth: '42%' }}>{g.id}</span>
        <Chip tone={STATUS_TONE[g.status] ?? 'default'}>{g.status}</Chip>
        {g.notRunReason && <span className="font-mono text-[9px] text-slate-500">{g.notRunReason}</span>}
        {g.execution !== 'ok' && (
          <Chip tone="warn">{t('questGenLab.gates.exec', { state: g.execution })}</Chip>
        )}
        <span className="ml-auto min-w-0 truncate text-[10px] text-slate-500">{t(`questGenLab.gates.summary.${g.id}`, { defaultValue: g.summaryKey })}</span>
      </div>
      {g.issues && g.issues.length > 0 && (
        <button type="button" onClick={() => setOpen((v) => !v)} className="mt-1 text-[9px] text-slate-500 hover:text-slate-300">
          {open ? '▾' : '▸'} {g.issues.length} {t('questGenLab.gates.issues')}
        </button>
      )}
      {open && (
        <ul className="mt-1 space-y-0.5">
          {g.issues.map((i, idx) => (
            <li key={idx} className="font-mono text-[9px] text-slate-500">
              {t(`questGenLab.gates.${i.messageKey}`, { ...i.messageArgs, defaultValue: i.message ?? i.messageKey })}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export const QualityGatesPanel: React.FC<{ explorerEntry: LabExplorerEntry; sessionEpoch: number }> = ({
  explorerEntry,
  sessionEpoch,
}) => {
  const { t } = useTranslation('idleVillage');
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [running, setRunning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const entry = explorerEntry.entry;
  /** Baked entries derive their hash via the canonical qsv1 digest;
   *  candidates carry their sha256 from generation. */
  const entryHash = useMemo(
    () => explorerEntry.candidate?.scenarioHash ?? computeScenarioVersion(entry.scenario),
    [explorerEntry, entry],
  );
  const stale = report !== null && report.scenarioHash !== entryHash;

  const run = async () => {
    if (running) return;
    const ac = new AbortController();
    abortRef.current = ac;
    setRunning(true);
    try {
      const kitPayload =
        explorerEntry.candidate?.provenance.effectiveKit ?? entry.kit ?? undefined;
      const r = await runValidation(
        {
          entryId: entry.scenario.id,
          scenario: entry.scenario,
          scenarioHash: entryHash,
          kitId: entry.kitId,
          kit: kitPayload as never,
        } as never,
        { signal: ac.signal, sessionEpoch },
      );
      setReport(r);
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  };

  const cancel = () => abortRef.current?.abort();

  return (
    <LabCard
      title={t('questGenLab.gates.title')}
      aside={
        report ? (
          <Chip tone={STATUS_TONE[report.aggregate] ?? 'default'}>{report.aggregate}</Chip>
        ) : (
          <Chip tone="mono">{t('questGenLab.gates.notRun')}</Chip>
        )
      }
    >
      <div className="space-y-2">
        {stale && (
          <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-[10px] text-amber-200">
            {t('questGenLab.gates.stale', {
              reportHash: report!.scenarioHash.slice(0, 14),
              currentHash: entryHash.slice(0, 14),
            })}
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void run()}
            disabled={running}
            className="rounded-md border border-amber-500/50 bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-200 hover:bg-amber-500/25 disabled:opacity-40"
          >
            {running ? t('questGenLab.gates.running') : t('questGenLab.gates.run')}
          </button>
          {running && (
            <button type="button" onClick={cancel} className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-slate-400">
              {t('questGenLab.gates.cancel')}
            </button>
          )}
          <span className="ml-auto font-mono text-[9px] text-slate-600">{entryHash.slice(0, 18)}</span>
        </div>
        {report?.configIssues?.length ? (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-[10px] text-red-300">
            {report.configIssues.map((c, i) => (
              <div key={i}>{t(`questGenLab.gates.${c.messageKey}`, { ...c.messageArgs, defaultValue: c.messageKey })}</div>
            ))}
          </div>
        ) : null}
        <div className="space-y-1">
          {(report?.gates ?? []).map((g) => (
            <GateRow key={g.id} g={g} />
          ))}
          {!report && (
            <div className="text-[10px] text-slate-600">{t('questGenLab.gates.hint')}</div>
          )}
        </div>
      </div>
    </LabCard>
  );
};

export type { LabCandidate };
