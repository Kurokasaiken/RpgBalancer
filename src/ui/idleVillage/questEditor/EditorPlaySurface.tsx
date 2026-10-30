/**
 * EditorPlaySurface — real-engine debug run of the working-copy snapshot
 * (PLAN-102 T-7, ruling B). Same contract as GenRunPlayer:
 * createScenarioInstance + createRun('gen') + applyChoice + previewOption,
 * plus: node image, party HP bars, consumables row, inline text edit
 * (edit-where-you-see), stat chips, stale-run banner.
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  applyChoice,
  availableOptions,
  createRun,
  flee,
  nodesFor,
  previewOption,
  type QuestRunState,
} from '@/ui/idleVillage/questS1Lab/questRun';
import { createScenarioInstance } from '@/ui/idleVillage/questS1Lab/questOffer';
import { PARTY_PRESETS, type QuestNode } from '@/ui/idleVillage/questS1Lab/questScenario';
import { NODE_ART } from '@/ui/idleVillage/questS1Lab/questArt';
import { consumableBonusFor } from '@/ui/idleVillage/questS1Lab/questRun';
import { LabStatSchema } from '@/balancing/config/idleVillage/quests/questScenario.schema';
import type { QuestScenario } from '@/balancing/config/idleVillage/quests/questScenario.schema';
import { applyEditorOp, type WorkingCopy } from './workingCopy';
import { loopEvent } from './loopInstrument';

/** Small inline editor — text shown as-is, click to edit. */
const Ed: React.FC<{ v: string; onSave: (v: string) => void; className?: string }> = ({ v, onSave, className }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(v);
  if (!editing)
    return (
      <span className={`cursor-text border-b border-dashed border-slate-500 hover:bg-slate-700/40 ${className ?? ''}`} title="click to edit" onClick={() => { setDraft(v); setEditing(true); }}>
        {v}
      </span>
    );
  return (
    <input
      autoFocus
      className="w-full rounded border border-sky-500 bg-slate-900 px-1 text-slate-100"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => { setEditing(false); if (draft !== v) onSave(draft); }}
      onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setEditing(false); }}
    />
  );
};

const VERDICTS = ['bigwin', 'win', 'almost', 'fail', 'epicfail'] as const;

export const EditorPlaySurface: React.FC<{
  snapshot: QuestScenario;           // immutable derived scenario (re-created on re-seed)
  workingCopy: WorkingCopy;          // for inline edits → ops
  onOpsChange: (wc: WorkingCopy) => void;
  dirty: boolean;                    // ops since last re-seed → stale banner
  seed: number;
  onReseed: (s: number) => void;
  /** IT overlay edits — keyed `${nodeId}.${field}`, persisted in the candidate. */
  itEdits: Record<string, string>;
  onItEdit: (key: string, v: string) => void;
  /** Fires when the run moves to a different node — the strip follows it. */
  onNodeChange?: (nodeId: string) => void;
}> = ({ snapshot, workingCopy, onOpsChange, dirty, seed, onReseed, itEdits, onItEdit, onNodeChange }) => {
  const [presetId, setPresetId] = useState(PARTY_PRESETS[0]!.id);
  const [run, setRun] = useState<QuestRunState | null>(null);
  const [localSeed, setLocalSeed] = useState(seed);
  const preset = PARTY_PRESETS.find((p) => p.id === presetId) ?? PARTY_PRESETS[0]!;

  // Auto-start once a scenario snapshot exists — the page opens already playing.
  useEffect(() => { if (!run) start(localSeed); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [snapshot]);

  const start = (s: number) => {
    const instance = createScenarioInstance(snapshot, { dangerScale: 1, rewardScale: 1 }, 'gen');
    loopEvent('reseed');
    const r0 = createRun({ party: { members: preset.members.map((m) => ({ ...m })), gold: preset.gold, presetId: preset.id }, seed: s, questId: 'gen', scenarioInstance: instance });
    setRun(r0); onNodeChange?.(r0.nodeId);
    onReseed(s);
  };

  const advance = (next: QuestRunState) => { setRun(next); if (next.nodeId !== run?.nodeId) onNodeChange?.(next.nodeId); };

  const node: QuestNode | undefined = run ? nodesFor(run)[run.nodeId] : undefined;
  const opts = run ? availableOptions(run) : [];
  const edit = (nodeId: string, field: string, value: unknown) => {
    const wc = { ...workingCopy, ops: [...workingCopy.ops], rejected: [...workingCopy.rejected] };
    applyEditorOp(wc, { kind: 'setNodeField', nodeId, field, value });
    onOpsChange(wc);
  };

  return (
    <div className="flex flex-col gap-2 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <select className="rounded border border-slate-600 bg-slate-900 px-1 py-0.5" value={presetId} onChange={(e) => setPresetId(e.target.value)}>
          {PARTY_PRESETS.map((p) => <option key={p.id} value={p.id}>{p.id} · {p.members.length}p</option>)}
        </select>
        <label className="flex items-center gap-1">seed
          <input className="w-14 rounded border border-slate-600 bg-slate-900 px-1" type="number" value={localSeed} onChange={(e) => setLocalSeed(Number(e.target.value))} />
        </label>
        <button className="rounded border border-sky-400/60 px-2 py-0.5" onClick={() => start(localSeed)}>{run ? '⟲ re-seed' : '▶ start'}</button>
        <button className="rounded border border-amber-400/60 px-2 py-0.5" onClick={() => run && advance(flee(run))} disabled={!run || run.ended}>flee</button>
        {dirty && <span className="rounded border border-amber-500/60 px-2 py-0.5 text-amber-300">● stale run — edits since this run started</span>}
        {run?.ended && <span className="rounded border border-slate-500 px-2 py-0.5">outcome: {run.outcome}</span>}
      </div>

      {run && node && (
        <div className="flex gap-3">
          <div className="h-44 w-64 shrink-0 overflow-hidden rounded border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900">
            {NODE_ART[run.nodeId]
              ? <img src={NODE_ART[run.nodeId].src} alt={run.nodeId} className="h-full w-full" style={{ objectFit: NODE_ART[run.nodeId].fit }} />
              : <div className="flex h-full items-center justify-center text-slate-500">no art · {run.nodeId}</div>}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="rounded border border-slate-700 bg-slate-800/60 p-2">
              <Ed v={node.title ?? run.nodeId} onSave={(v) => edit(run.nodeId, 'title', v)} className="font-bold" /> <span className="text-slate-500">· {node.kind}</span>
              <div className="mt-1"><Ed v={node.body ?? ''} onSave={(v) => edit(run.nodeId, 'body', v)} /></div>
              {node.transit && <div className="mt-0.5 text-slate-400">transit: <Ed v={node.transit} onSave={(v) => edit(run.nodeId, 'transit', v)} /></div>}
              <div className="mt-0.5 text-amber-300/80">IT: <Ed v={itEdits[`${run.nodeId}.body`] ?? ''} onSave={(v) => onItEdit(`${run.nodeId}.body`, v)} /></div>
            </div>
            {opts.map((o, i) => {
              const p = node.options?.[i] ? previewOption(run, o.id) : null;
              return (
                <button key={o.id} disabled={o.disabled || run.ended} onClick={() => advance(applyChoice(run, o.id))}
                  className={`flex items-center justify-between gap-2 rounded border px-2 py-1 text-left ${o.disabled ? 'border-dashed border-slate-600 opacity-50' : 'border-slate-500 hover:bg-slate-700/40'}`}>
                  <Ed v={o.label + (o.detail ? ` — ${o.detail}` : '')} onSave={(v) => { const [label, ...d] = v.split(' — '); const wc = { ...workingCopy, ops: [...workingCopy.ops] }; applyEditorOp(wc, { kind: 'setOptionField', nodeId: run.nodeId, optionIdx: i, field: 'label', value: label }); if (d.length) applyEditorOp(wc, { kind: 'setOptionField', nodeId: run.nodeId, optionIdx: i, field: 'detail', value: d.join(' — ') }); onOpsChange(wc); }} />
                  <span className="whitespace-nowrap text-emerald-300">{p && 'wound' in p ? `win ${Math.round((p as { success?: number }).success ?? 0)}% · wound ${(p as { wound?: number }).wound ?? 0}% · death ${(p as { death?: number }).death ?? 0}%` : ''}</span>
                </button>
              );
            })}
            {node.kind === 'check' && (
              <div className="flex items-center gap-1">
                <span className="text-slate-500">stats:</span>
                {(node.stats ?? []).map((s) => (
                  <button key={s} className="rounded border border-slate-600 px-1" title="rimuovi"
                    onClick={() => edit(run.nodeId, 'stats', (node.stats ?? []).filter((x) => x !== s))}>{s} ✕</button>
                ))}
                <select className="rounded border border-dashed border-emerald-500/50 bg-slate-900 px-1 text-emerald-300" value=""
                  onChange={(e) => { if (e.target.value) edit(run.nodeId, 'stats', [...(node.stats ?? []), e.target.value]); }}>
                  <option value="" disabled>+ stat</option>
                  {LabStatSchema.options.filter((s) => !(node.stats ?? []).includes(s)).map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {(() => { const c = consumableBonusFor(run, node); return c ? (
                  <button className="ml-auto rounded border border-emerald-500/60 px-1.5 text-emerald-300" title={`usa ${c.label}`}
                    onClick={() => { const o = opts.find((x) => !x.disabled); if (o) advance(applyChoice(run, o.id, { useConsumable: true })); }}>
                    🧪 {c.label} +{c.bonus}%
                  </button>) : null; })()}
              </div>
            )}
            <div className="mt-1 flex gap-1">
              {run.party.map((m) => (
                <div key={m.id} className={`flex-1 rounded border px-1.5 py-1 ${m.dead ? 'border-red-800' : 'border-slate-700'}`}>
                  <b>{m.id}</b> {m.dead ? 'morto' : m.wounded ? 'ferito' : `${m.hp}/${m.maxHp}`}
                  <div className="mt-0.5 h-1 rounded bg-slate-700"><div className={`h-1 rounded ${m.dead ? 'bg-red-700' : 'bg-emerald-500'}`} style={{ width: `${Math.max(0, (m.hp / m.maxHp) * 100)}%` }} /></div>
                </div>
              ))}
            </div>
            {verdictFlavorEditor(node, workingCopy, onOpsChange)}
          </div>
        </div>
      )}
    </div>
  );
};

/** verdictFlavor per-verdict — the 5 outcome sentences of the node. */
function verdictFlavorEditor(node: QuestNode, wc: WorkingCopy, onOps: (w: WorkingCopy) => void) {
  const vf = (node.verdictFlavor ?? {}) as Record<string, string>;
  return (
    <details className="rounded border border-slate-700 p-1">
      <summary className="cursor-pointer text-slate-500">verdictFlavor + numeri</summary>
      {VERDICTS.map((k) => (
        <div key={k} className="flex gap-1"><span className="w-16 text-slate-500">{k}</span>
          <Ed v={vf[k] ?? ''} onSave={(v) => { const n = { ...wc, ops: [...wc.ops] }; applyEditorOp(n, { kind: 'setNodeField', nodeId: node.id, field: 'verdictFlavor', value: { ...vf, [k]: v } }); onOps(n); }} className="flex-1" />
        </div>
      ))}
    </details>
  );
}
