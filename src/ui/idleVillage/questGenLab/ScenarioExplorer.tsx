/**
 * ScenarioExplorer — the catalog half of the Quest Generation Lab (R-140).
 *
 * Left: the GENERATED_CATALOG entries with gimmick/kit/origin badges.
 * Right: the selected scenario — offer metadata, initial vars, armRolls,
 * the DFS node tree (click a row for the node detail) and the playable
 * run harness (GenRunPlayer).
 */

import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { QuestNode } from '@/ui/idleVillage/questS1Lab/questScenario';
import { scenarioTreeRows, type TreeRow } from './labGraph';
import { gatesOfOption, type LabCatalogEntry } from './labModel';
import { Chip, ChipRow, KindBadge, LabCard, StatusBadge } from './labUi';
import { GenRunPlayer } from './GenRunPlayer';

/* ------------------------------------------------------------------ */
/* Node detail                                                          */
/* ------------------------------------------------------------------ */

const GotoText: React.FC<{ goto: import('@/ui/idleVillage/questS1Lab/questScenario').GotoSpec }> = ({
  goto,
}) => {
  if (typeof goto === 'string') return <span className="font-mono">{goto}</span>;
  return (
    <span className="font-mono">
      {goto.branches.map((b, i) => (
        <span key={i} className="block">
          {b.when.flag && `flag:${b.when.flag} `}
          {b.when.notFlag && `¬${b.when.notFlag} `}
          {b.when.varGE && `${b.when.varGE.var}≥${b.when.varGE.value} `}
          {b.when.varLT && `${b.when.varLT.var}<${b.when.varLT.value} `}
          → {b.then}
        </span>
      ))}
      <span className="block text-slate-500">else → {goto.else}</span>
    </span>
  );
};

/** Compact effect summary of an OutcomeSpec — what the verdict writes. */
function outcomeEffects(o: NonNullable<QuestNode['verdictTable']>[string]): string[] {
  if (!o) return [];
  const fx: string[] = [];
  if (o.vars?.length) fx.push(o.vars.map((v) => `${v.var}${v.op === 'inc' ? '+' : v.op === 'dec' ? '-' : '='}${v.value}`).join(' '));
  if (o.setFlags?.length) fx.push(`+flag:${o.setFlags.join(',')}`);
  if (o.clearFlags?.length) fx.push(`-flag:${o.clearFlags.join(',')}`);
  if (o.setInfo?.length) fx.push(`+info:${o.setInfo.join(',')}`);
  if (o.takeLoot?.length) fx.push(`+loot:${o.takeLoot.length}`);
  if (o.dropLoot?.length) fx.push(`-loot:${o.dropLoot.length}`);
  if (o.goldDelta) fx.push(`gold${o.goldDelta > 0 ? '+' : ''}${o.goldDelta}`);
  if (o.damage) fx.push(`dmg:${o.damage}`);
  if (o.setAlarm) fx.push('alarm');
  if (o.setObjective) fx.push(`objective:${o.setObjective}`);
  if (o.rollFlag) fx.push(`roll:${o.rollFlag.flag}@${o.rollFlag.chance}%`);
  return fx;
}

/** Node inspector — everything the engine will read at this node. */
export const NodeDetail: React.FC<{ node: QuestNode }> = ({ node }) => {
  const { t } = useTranslation('idleVillage');
  return (
    <div className="rounded-lg border border-white/15 bg-white/[0.04] p-3">
      <div className="mb-1 flex items-center gap-2">
        <KindBadge kind={node.kind} />
        <span className="font-mono text-[10px] text-slate-500">{node.id}</span>
        <span className="text-[10px] uppercase tracking-wider text-slate-500">{node.kind}</span>
        {node.hidden && <Chip tone="warn">hidden</Chip>}
      </div>
      <h5 className="text-sm font-semibold text-white">{node.title}</h5>
      <p className="mt-1 text-[11px] leading-relaxed text-slate-300">{node.body}</p>
      {node.transit && <p className="mt-1 text-[10px] italic text-slate-500">↳ {node.transit}</p>}
      <div className="mt-2 flex flex-wrap gap-1">
        {node.stats?.length ? <Chip tone="mono">stats:{node.stats.join(',')}</Chip> : null}
        {node.risk && <Chip tone="warn">wound:{node.risk.wound}% death:{node.risk.death}%</Chip>}
        {node.upfrontDamage && (
          <Chip tone="warn">
            toll:{node.upfrontDamage.amount}
            {node.upfrontDamage.epicfailAmount ? `/${node.upfrontDamage.epicfailAmount}` : ''}
          </Chip>
        )}
        {node.failHint && <Chip>fail: {node.failHint}</Chip>}
        {node.combat && (
          <Chip tone="warn">
            combat {node.combat.enemies}×{node.combat.hitDamage}dmg · {node.combat.turns}t
          </Chip>
        )}
      </div>

      {node.options && node.options.length > 0 && (
        <div className="mt-2">
          <div className="mb-1 text-[9px] uppercase tracking-wider text-slate-500">
            {t('questGenLab.labels.options')}
          </div>
          {node.options.map((o) => (
            <div key={o.id} className="mb-1 flex flex-wrap items-center gap-1 text-[11px]">
              <span className="font-mono text-slate-400">{o.id}</span>
              <span className="text-slate-200">{o.label}</span>
              <span className="font-mono text-slate-500">→ {o.next}</span>
              {gatesOfOption(o).map((g) => (
                <Chip key={g} tone="warn">{g}</Chip>
              ))}
            </div>
          ))}
        </div>
      )}

      {node.verdictTable && (
        <div className="mt-2">
          <div className="mb-1 text-[9px] uppercase tracking-wider text-slate-500">verdictTable</div>
          {Object.entries(node.verdictTable).map(([verdict, outcome]) =>
            outcome ? (
              <div key={verdict} className="mb-1 text-[10px]">
                <span className="font-mono font-semibold text-slate-300">{verdict}</span>
                <span className="ml-1 text-slate-400">
                  <GotoText goto={outcome.goto} />
                </span>
                {outcomeEffects(outcome).map((fx, i) => (
                  <Chip key={i} tone="mono">{fx}</Chip>
                ))}
              </div>
            ) : null,
          )}
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* DFS tree                                                             */
/* ------------------------------------------------------------------ */

const EDGE_TONE: Record<string, string> = {
  option: 'text-sky-300',
  verdict: 'text-amber-300',
  branch: 'text-violet-300',
  else: 'text-slate-500',
  next: 'text-slate-400',
  combat: 'text-red-300',
};

const TreeRowView: React.FC<{
  row: TreeRow;
  selected: boolean;
  onSelect: (id: string) => void;
}> = ({ row, selected, onSelect }) => (
  <button
    type="button"
    onClick={() => onSelect(row.nodeId)}
    className={`block w-full rounded px-1.5 py-0.5 text-left hover:bg-white/10 ${
      selected ? 'bg-amber-500/15' : ''
    }`}
    style={{ paddingLeft: `${row.depth * 14 + 6}px` }}
  >
    <span className="flex items-center gap-1.5 text-[11px]">
      {row.edge && (
        <span className={`font-mono text-[9px] ${EDGE_TONE[row.edge.via]}`}>
          {row.edge.via === 'verdict' || row.edge.via === 'branch' || row.edge.via === 'else'
            ? row.edge.label
            : row.edge.label}
          {row.edge.cond ? ` [${row.edge.cond}]` : ''} →
        </span>
      )}
      <KindBadge kind={row.node.kind} />
      <span className="font-mono text-slate-400">{row.nodeId}</span>
      <span className="truncate text-slate-300">{row.node.title}</span>
      {row.edge?.gates.map((g) => <Chip key={g} tone="warn">{g}</Chip>)}
      {row.repeated && <span className="text-[9px] text-slate-500">↩</span>}
    </span>
  </button>
);

/* ------------------------------------------------------------------ */
/* Explorer                                                             */
/* ------------------------------------------------------------------ */

export const ScenarioExplorer: React.FC<{ entries: LabCatalogEntry[] }> = ({ entries }) => {
  const { t } = useTranslation('idleVillage');
  const [selId, setSelId] = useState(entries[0]?.scenario.id ?? '');
  const [nodeId, setNodeId] = useState<string | null>(null);
  const entry = entries.find((e) => e.scenario.id === selId) ?? entries[0];
  const rows = useMemo(() => (entry ? scenarioTreeRows(entry.scenario) : []), [entry]);
  const selNode = nodeId ? entry?.scenario.nodes[nodeId] : undefined;

  if (!entry) return null;
  const s = entry.scenario;

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      {/* Catalog list */}
      <div className="space-y-2">
        {entries.map((e) => (
          <button
            key={e.scenario.id}
            type="button"
            onClick={() => {
              setSelId(e.scenario.id);
              setNodeId(null);
            }}
            className={`block w-full rounded-xl border p-3 text-left transition-colors ${
              e.scenario.id === selId
                ? 'border-amber-500/60 bg-amber-500/10'
                : 'border-white/10 bg-white/5 hover:border-amber-500/30'
            }`}
          >
            <div className="text-xs font-semibold text-white">{e.scenario.title}</div>
            <div className="mt-1 flex flex-wrap gap-1">
              <Chip>{e.gimmick?.label ?? e.gimmickId}</Chip>
              <Chip>{e.kitId}</Chip>
              {e.kit?.origin === 'narrated' && <Chip tone="good">{t('questGenLab.labels.narrated')}</Chip>}
            </div>
            <div className="mt-1 font-mono text-[9px] text-slate-500">
              {e.stats.nodes}n · {e.stats.checks}check · {e.stats.gatedOptions}/{e.stats.options} gated
            </div>
          </button>
        ))}
      </div>

      {/* Detail */}
      <div className="space-y-3">
        <LabCard
          title={s.title}
          aside={<span className="font-mono text-[9px] text-slate-500">{s.id}</span>}
        >
          <p className="text-[11px] text-slate-400">{s.flavour}</p>
          <p className="mt-1 text-xs text-slate-300">
            <span className="text-slate-500">{t('questGenLab.labels.objective')}: </span>
            {s.offer.objective}
          </p>
          <div className="mt-2 space-y-1">
            <ChipRow label={t('questGenLab.labels.primaryStats')}>
              {s.primaryStats.map((p) => <Chip key={p} tone="mono">{p}</Chip>)}
            </ChipRow>
            {s.offer.tags?.length ? (
              <ChipRow label={t('questGenLab.labels.tags')}>
                {s.offer.tags.map((tg) => <Chip key={tg}>{tg}</Chip>)}
              </ChipRow>
            ) : null}
            {s.initialVars && (
              <ChipRow label="vars">
                {Object.entries(s.initialVars).map(([k, v]) => <Chip key={k} tone="mono">{`${k}:${v}`}</Chip>)}
              </ChipRow>
            )}
            {s.armRolls?.length ? (
              <ChipRow label="armRolls">
                {s.armRolls.map((r) => (
                  <Chip key={r.flag} tone="warn">
                    {r.flag}@{r.chance}%{r.requiresTrait ? ` · ${r.requiresTrait}` : ''}
                  </Chip>
                ))}
              </ChipRow>
            ) : null}
            <ChipRow label={t('questGenLab.labels.mechanicsUsed')}>
              {entry.mechanicsUsed.map((m) => <Chip key={m} tone="mono">{m}</Chip>)}
            </ChipRow>
            {entry.traitsUsed.length > 0 && (
              <ChipRow label={t('questGenLab.labels.traitsUsed')}>
                {entry.traitsUsed.map((tr) => <Chip key={tr} tone="warn">{tr}</Chip>)}
              </ChipRow>
            )}
          </div>
          <div className="mt-2 font-mono text-[9px] text-slate-600">
            hash {s.scenarioVersion} · banda {s.offer.dangerBandRef ?? '—'} · reward {s.offer.rewardBase ?? '—'}
          </div>
        </LabCard>

        {/* Node tree */}
        <LabCard title={t('questGenLab.labels.tree')} aside={<StatusBadge status="implemented" />}>
          <div className="max-h-80 overflow-y-auto">
            {rows.map((row, i) => (
              <TreeRowView key={`${row.nodeId}-${i}`} row={row} selected={nodeId === row.nodeId && !row.repeated} onSelect={setNodeId} />
            ))}
          </div>
          {selNode && <div className="mt-2"><NodeDetail node={selNode} /></div>}
        </LabCard>

        {/* Play */}
        <LabCard title={t('questGenLab.labels.play')} aside={<StatusBadge status="implemented" />}>
          <GenRunPlayer entry={entry} />
        </LabCard>
      </div>
    </div>
  );
};
