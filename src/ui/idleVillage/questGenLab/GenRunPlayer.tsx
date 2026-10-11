/**
 * GenRunPlayer — text-mode playable run of a generated catalog scenario
 * (R-140).
 *
 * Drives the real engine: `createScenarioInstance` (content-addressed,
 * frozen) + `createRun({party, seed, questId:'gen'})` + `applyChoice`.
 * Options render the full declared set — locked ones greyed with their
 * gate chips, so the lab shows the whole possibility space the party
 * could have unlocked. Check options carry the exact `previewOption`
 * numbers (success / wound / death per slot), same contract as the
 * production preview.
 */

import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  applyChoice,
  availableOptions,
  createRun,
  flee,
  nodesFor,
  partyHasTrait,
  previewOption,
  type QuestRunState,
} from '@/ui/idleVillage/questS1Lab/questRun';
import { createScenarioInstance } from '@/ui/idleVillage/questS1Lab/questOffer';
import { PARTY_PRESETS, type LabMember, type QuestOption } from '@/ui/idleVillage/questS1Lab/questScenario';
import { deriveSettlementPlan } from '@/ui/idleVillage/quests/questSettlement';
import { buildQuestEpilogue } from '@/ui/idleVillage/quests/questEpilogue';
import type { LabCatalogEntry } from './labModel';
import { Chip, ChipRow, KindBadge } from './labUi';

const VERDICT_STYLE: Record<string, string> = {
  epicfail: 'text-red-400',
  fail: 'text-red-300',
  almost: 'text-amber-300',
  win: 'text-emerald-300',
  bigwin: 'text-emerald-200',
};

const OUTCOME_STYLE: Record<string, string> = {
  reward: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200',
  survived: 'border-sky-500/50 bg-sky-500/10 text-sky-200',
  fled: 'border-amber-500/50 bg-amber-500/10 text-amber-200',
  wipe: 'border-red-500/50 bg-red-500/10 text-red-200',
};

/** Why an option is locked for this run — same rules as `availableOptions`. */
function lockReasons(run: QuestRunState, o: QuestOption): string[] {
  const reasons: string[] = [];
  if (o.requiresInfo && !run.info.includes(o.requiresInfo)) reasons.push(`info:${o.requiresInfo}`);
  if (o.requiresFlag && !run.flags.includes(o.requiresFlag)) reasons.push(`flag:${o.requiresFlag}`);
  if (o.hiddenIfFlag && run.flags.includes(o.hiddenIfFlag)) reasons.push(`¬${o.hiddenIfFlag}`);
  if (o.requiresTrait && !partyHasTrait(run, o.requiresTrait)) reasons.push(`trait:${o.requiresTrait}`);
  if (o.hiddenIfTrait && partyHasTrait(run, o.hiddenIfTrait)) reasons.push(`¬trait:${o.hiddenIfTrait}`);
  if (o.costGold && run.gold < o.costGold) reasons.push(`gold:${o.costGold}`);
  return reasons;
}

/** Member row — hp bar + wounded/dead marks + traits. */
const MemberChip: React.FC<{ m: LabMember & { hp: number; maxHp: number; wounded: boolean; dead: boolean } }> = ({
  m,
}) => (
  <div className={`rounded border px-2 py-1 ${m.dead ? 'border-red-500/40 opacity-50' : 'border-white/10'}`}>
    <div className="flex items-center gap-1.5 text-[11px]">
      <span className="font-semibold text-slate-200">{m.name}</span>
      <span className="text-[9px] uppercase text-slate-500">{m.role}</span>
      {m.dead && <span className="text-red-400">✝</span>}
      {m.wounded && !m.dead && <span className="text-amber-400">✚</span>}
      {(m.traits ?? []).map((tr) => (
        <Chip key={tr} tone="warn">{tr}</Chip>
      ))}
    </div>
    <div className="mt-1 h-1 w-24 overflow-hidden rounded bg-slate-800">
      <div
        className={`h-full ${m.dead ? 'bg-red-800' : m.wounded ? 'bg-amber-500' : 'bg-emerald-500'}`}
        style={{ width: `${Math.max(0, Math.round((m.hp / m.maxHp) * 100))}%` }}
      />
    </div>
  </div>
);

export const GenRunPlayer: React.FC<{ entry: LabCatalogEntry }> = ({ entry }) => {
  const { t } = useTranslation('idleVillage');
  const { scenario } = entry;
  const [presetId, setPresetId] = useState(PARTY_PRESETS[0]!.id);
  const [seed, setSeed] = useState(1);
  const [run, setRun] = useState<QuestRunState | null>(null);
  const [logOpen, setLogOpen] = useState(false);

  const preset = PARTY_PRESETS.find((p) => p.id === presetId) ?? PARTY_PRESETS[0]!;

  const start = (s = seed) => {
    const instance = createScenarioInstance(scenario, { dangerScale: 1, rewardScale: 1 }, 'gen');
    setRun(
      createRun({
        party: { members: preset.members.map((m) => ({ ...m })), gold: preset.gold, presetId: preset.id },
        seed: s,
        questId: 'gen',
        scenarioInstance: instance,
      }),
    );
  };

  const choose = (optionId: string) => {
    if (!run) return;
    applyChoice(run, optionId);
    setRun({ ...run });
  };

  const node = useMemo(() => (run ? nodesFor(run)[run.nodeId] : undefined), [run]);
  const settlement = useMemo(
    () => (run?.ended ? deriveSettlementPlan(run, { questTitle: scenario.title }) : null),
    [run, scenario.title],
  );
  const epilogue = useMemo(
    () => (run?.ended ? buildQuestEpilogue(run, scenario) : []),
    [run, scenario],
  );

  /* ------------------------------ setup ------------------------------ */
  if (!run) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
        <div className="mb-2 text-[10px] uppercase tracking-wider text-slate-500">
          {t('questGenLab.play.setup')}
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-400">{t('questGenLab.play.preset')}</span>
            <select
              value={presetId}
              onChange={(e) => setPresetId(e.target.value)}
              className="rounded border border-white/15 bg-slate-900 px-2 py-1 text-xs text-slate-200"
            >
              {PARTY_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-400">{t('questGenLab.play.seed')}</span>
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(Number(e.target.value) || 0)}
              className="w-20 rounded border border-white/15 bg-slate-900 px-2 py-1 text-xs text-slate-200"
            />
          </label>
          <button
            type="button"
            onClick={() => start()}
            className="rounded-md border border-amber-500/50 bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-200 hover:bg-amber-500/25"
          >
            {t('questGenLab.play.start')}
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {preset.members.map((m) => (
            <Chip key={m.id}>
              {m.name} · {m.role}
              {(m.traits ?? []).length > 0 ? ` · ${(m.traits ?? []).join(', ')}` : ''}
            </Chip>
          ))}
        </div>
      </div>
    );
  }

  /* ------------------------------ run -------------------------------- */
  const opts = availableOptions(run).map((o) => o.id);
  const declared = node?.kind === 'choice' ? (node.options ?? []) : [];

  return (
    <div className="rounded-lg border border-amber-500/25 bg-white/[0.03] p-3">
      {/* HUD */}
      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-300">
        <span className="font-mono">seed {run.seed}</span>
        <span>{t('questGenLab.play.gold')} {run.gold}</span>
        {run.vars && (
          <span className="flex gap-1">
            {Object.entries(run.vars).map(([k, v]) => (
              <Chip key={k} tone="mono">{`${k}:${v}`}</Chip>
            ))}
          </span>
        )}
        {run.flags.length > 0 && <ChipRow label={t('questGenLab.play.flags')}>{run.flags.map((f) => <Chip key={f} tone="warn">{f}</Chip>)}</ChipRow>}
        {run.info.length > 0 && <ChipRow label={t('questGenLab.play.intel')}>{run.info.map((i) => <Chip key={i} tone="good">{scenario.intelLabels?.[i] ?? i}</Chip>)}</ChipRow>}
        {run.loot.length > 0 && <ChipRow label={t('questGenLab.play.loot')}>{run.loot.map((l, i) => <Chip key={`${l}-${i}`}>{l}</Chip>)}</ChipRow>}
        <button
          type="button"
          onClick={() => setLogOpen((v) => !v)}
          className="ml-auto text-[10px] text-slate-400 underline"
        >
          {t('questGenLab.play.chronicle')} ({run.log.length})
        </button>
        {!run.ended && (
          <>
            <button
              type="button"
              onClick={() => setRun({ ...flee(run) })}
              className="rounded border border-amber-500/40 px-2 py-0.5 text-[10px] text-amber-300"
            >
              {t('questGenLab.play.flee')}
            </button>
            <button
              type="button"
              onClick={() => setRun(null)}
              className="rounded border border-white/20 px-2 py-0.5 text-[10px] text-slate-300"
            >
              {t('questGenLab.play.reset')}
            </button>
          </>
        )}
      </div>

      {/* Party */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {run.party.map((m) => (
          <MemberChip key={m.id} m={m} />
        ))}
      </div>

      {/* Ended: outcome + real settlement + epilogue */}
      {run.ended && settlement ? (
        <div className="space-y-3">
          <div className={`rounded-lg border p-3 text-sm font-semibold ${OUTCOME_STYLE[run.outcome]}`}>
            {t(`questGenLab.play.outcome.${run.outcome}`)}
            {run.objectiveDone ? ` — ${t('questGenLab.play.objectiveDone')}` : ''}
          </div>
          <div>
            <div className="mb-1 text-[10px] uppercase tracking-wider text-slate-500">
              {t('questGenLab.play.settlement')}
            </div>
            <ul className="space-y-0.5">
              {settlement.effects.map((e) => (
                <li key={e.key} className="font-mono text-[10px] text-slate-400">
                  {e.kind}
                  {e.residentId ? ` · ${run.party.find((m) => m.id === e.residentId)?.name ?? e.residentId}` : ''}
                  {e.amount ? ` · ${e.amount}` : ''}
                </li>
              ))}
            </ul>
          </div>
          {epilogue.length > 0 && (
            <div>
              <div className="mb-1 text-[10px] uppercase tracking-wider text-slate-500">
                {t('questGenLab.play.epilogue')}
              </div>
              {epilogue.map((sec) => (
                <div key={sec.id} className="mb-1">
                  <span className="text-[10px] font-semibold text-amber-200/80">{sec.id}: </span>
                  <span className="text-[11px] text-slate-300">
                    {sec.lines.map((l) => (l.key ? t(l.key, l.params) : l.text)).join(' · ')}
                  </span>
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => setRun(null)}
            className="rounded-md border border-white/20 px-3 py-1 text-xs text-slate-200"
          >
            {t('questGenLab.play.newRun')}
          </button>
        </div>
      ) : node ? (
        <>
          {/* Node card */}
          <div className="mb-2 rounded-lg border border-white/10 bg-white/[0.04] p-3">
            <div className="mb-1 flex items-center gap-2">
              <KindBadge kind={node.kind} />
              <span className="font-mono text-[10px] text-slate-500">{node.id}</span>
            </div>
            <h5 className="text-sm font-semibold text-white">{node.title}</h5>
            <p className="mt-1 text-xs leading-relaxed text-slate-300">{node.body}</p>
          </div>

          {/* Resolved checks of the last action */}
          {run.checkQueue.map((c) => (
            <div key={c.id} className="mb-2 rounded-lg border border-white/10 bg-white/[0.04] p-2">
              <div className="flex items-baseline gap-2 text-[11px]">
                <span className={`font-bold uppercase ${VERDICT_STYLE[c.verdict]}`}>{c.verdict}</span>
                <span className="text-slate-400">{c.title}</span>
                <span className="ml-auto font-mono text-slate-500">
                  {t('questGenLab.play.roll')} {c.rollPct} / {c.score}
                </span>
              </div>
              {c.outcomeText && <p className="mt-1 text-[11px] text-slate-300">{c.outcomeText}</p>}
              {c.harmLines.map((l, i) => (
                <p key={i} className="text-[11px] text-red-300">{l}</p>
              ))}
            </div>
          ))}

          {/* Options — declared set, locked greyed with gate chips */}
          {node.kind === 'choice' ? (
            <div className="space-y-1.5">
              {declared.map((o) => {
                const enabled = opts.includes(o.id);
                const reasons = enabled ? [] : lockReasons(run, o);
                const preview = enabled ? previewOption(run, o.id) : null;
                return (
                  <button
                    key={o.id}
                    type="button"
                    disabled={!enabled}
                    onClick={() => choose(o.id)}
                    className={`block w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                      enabled
                        ? 'border-white/15 bg-white/5 hover:border-amber-500/50 hover:bg-white/10'
                        : 'border-white/5 bg-white/[0.02] opacity-45'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-100">{o.label}</span>
                      {reasons.map((r) => (
                        <Chip key={r} tone="warn">{`requires ${r}`}</Chip>
                      ))}
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-400">{o.detail}</div>
                    {preview && (
                      <div className="mt-1 flex flex-wrap gap-x-3 font-mono text-[10px] text-slate-400">
                        <span>
                          {t('questGenLab.play.success')} {preview.successPct}%
                        </span>
                        <span>
                          {t('questGenLab.play.wound')} {preview.woundPct}%
                        </span>
                        <span>
                          {t('questGenLab.play.death')} {preview.deathPct}%
                        </span>
                        {preview.contributors.map((c) => (
                          <span key={c.stat} className="text-slate-500">
                            {c.stat}:{c.bestName}({c.bestValue})
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex gap-2">
              {availableOptions(run).map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => choose(o.id)}
                  className="rounded-md border border-amber-500/50 bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-500/25"
                >
                  {o.id === 'advance' ? t('questGenLab.play.continue') : o.label}
                </button>
              ))}
            </div>
          )}

          {/* Chronicle */}
          {logOpen && (
            <div className="mt-3 max-h-48 overflow-y-auto rounded-lg border border-white/10 bg-black/30 p-2">
              {[...run.log].reverse().map((l, i) => (
                <div key={i} className="text-[10px] leading-relaxed text-slate-400">
                  <span className="mr-1 font-mono text-slate-600">{l.kind}</span>
                  {l.text}
                </div>
              ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
};
