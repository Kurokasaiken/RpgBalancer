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
import type { ContentOverlay } from '@/balancing/config/idleVillage/quests/questContentLocale';
import { applyEditorOp, type WorkingCopy } from './workingCopy';
import { loopEvent } from './loopInstrument';

/** Small inline editor — the same span turns editable in place (no input swap, no size change). */
const Ed: React.FC<{ v: string; onSave: (v: string) => void; className?: string }> = ({ v, onSave, className }) => {
  const ref = React.useRef<HTMLSpanElement>(null);
  const cancel = React.useRef(false);
  const [editing, setEditing] = useState(false);

  // Imperative text sync: React children and a contentEditable would fight.
  // Only fires when the prop changes (re-seed / op applied) — typed text
  // stays on screen while the run is stale.
  useEffect(() => { if (ref.current) ref.current.textContent = v; }, [v]);

  return (
    <span
      ref={ref}
      contentEditable={editing}
      suppressContentEditableWarning
      spellCheck={false}
      title="click to edit"
      className={`cursor-text border-b border-dashed border-slate-500 hover:bg-slate-700/40 ${editing ? 'bg-slate-700/40 outline-none' : ''} ${className ?? ''}`}
      onClick={(e) => {
        e.stopPropagation();
        if (editing) return;
        // contentEditable is flipped imperatively here (not just via React
        // state) so focus + caret land in THIS click — keys typed before the
        // re-render would otherwise hit the wrapping button and Enter would
        // fire the option's choice.
        const el = ref.current;
        setEditing(true);
        if (el) {
          el.contentEditable = 'true';
          el.focus();
          const sel = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(el);
          range.collapse(false);
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
      }}
      onBlur={() => {
        setEditing(false);
        const el = ref.current;
        if (!el) return;
        const t = el.textContent ?? '';
        if (cancel.current) {
          cancel.current = false;
          if (t !== v) el.textContent = v;
          return;
        }
        if (t !== v) onSave(t);
      }}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === 'Enter') { e.preventDefault(); ref.current?.blur(); }
        if (e.key === 'Escape') { e.preventDefault(); cancel.current = true; ref.current?.blur(); }
      }}
      onPaste={(e) => {
        e.preventDefault();
        e.stopPropagation();
        document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
      }}
    />
  );
};

/** Preview language of the play surface — EN edits the base manuscript, IT edits the overlay in place. */
export type EditorLang = 'EN' | 'IT';

/**
 * IT copy resolution for the in-place preview (PLAN-102 W-03): the session's
 * minimal write wins; then the authored overlay — only when its stored English
 * source still matches the live text (`stale` otherwise); nothing → `missing`
 * and the English shows. `key` is the W-03 key `${nodeId}.${field}`; the
 * authored overlay is keyed `nodes.${key}`.
 */
export const resolveItCopy = (
  key: string,
  en: string,
  overlay: ContentOverlay | undefined,
  edits: Record<string, string>,
): { v: string; mark?: 'missing' | 'stale' } => {
  const edited = edits[key];
  if (edited) return { v: edited };
  const hit = overlay?.[`nodes.${key}`];
  if (!hit) return { v: en, mark: 'missing' };
  return hit[0] === en ? { v: hit[1] } : { v: en, mark: 'stale' };
};

/** Amber badge naming a stale/missing IT entry — the same affordance rewrites it. */
const ItMark: React.FC<{ mark: 'missing' | 'stale' }> = ({ mark }) => (
  <span
    className="ml-1 whitespace-nowrap rounded border border-amber-500/60 px-1 text-amber-300"
    title={mark === 'stale' ? 'la sorgente EN è cambiata — riscrivere la traduzione' : 'nessuna traduzione IT — la riga mostra il testo EN'}
  >
    IT {mark}
  </span>
);

/** Translatable {@link Ed}: EN edits the base field via `onSave`, IT shows/edits the overlay copy in place. */
const TEd: React.FC<{
  lang: EditorLang;
  en: string;
  itKey: string;
  overlay?: ContentOverlay;
  edits: Record<string, string>;
  onItEdit: (k: string, v: string) => void;
  onSave: (v: string) => void;
  /** IT-mode extra: fires with the Italian text so the caller can auto-translate → EN manuscript. */
  onEnAuto?: (itText: string) => void;
  className?: string;
}> = ({ lang, en, itKey, overlay, edits, onItEdit, onSave, onEnAuto, className }) => {
  if (lang === 'EN') return <Ed v={en} onSave={onSave} className={className} />;
  const r = resolveItCopy(itKey, en, overlay, edits);
  return (
    <span className={className}>
      <Ed v={r.v} onSave={(v) => { onItEdit(itKey, v); onEnAuto?.(v); }} />
      {r.mark && <ItMark mark={r.mark} />}
    </span>
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
  /** Preview language — EN edits the manuscript, IT shows/edits the overlay copy in place. */
  lang?: EditorLang;
  /** Authored it-IT overlay of the parent quest — resolves fresh copy and stale/missing marks. */
  authoredOverlay?: ContentOverlay;
  /** Fires when the run moves to a different node — the strip follows it. */
  onNodeChange?: (nodeId: string) => void;
  /** Parent-driven jump: when `tick` changes, the run teleports to `nodeId`. */
  jumpRequest?: { nodeId: string; tick: number } | null;
}> = ({ snapshot, workingCopy, onOpsChange, dirty, seed, onReseed, itEdits, onItEdit, lang = 'EN', authoredOverlay, onNodeChange, jumpRequest }) => {
  const [presetId, setPresetId] = useState(PARTY_PRESETS[0]!.id);
  const [run, setRun] = useState<QuestRunState | null>(null);
  const [localSeed, setLocalSeed] = useState(seed);
  const [past, setPast] = useState<QuestRunState[]>([]);
  const [future, setFuture] = useState<QuestRunState[]>([]);
  const preset = PARTY_PRESETS.find((p) => p.id === presetId) ?? PARTY_PRESETS[0]!;

  // Auto-start once a scenario snapshot exists — the page opens already playing.
  useEffect(() => { if (!run) start(localSeed); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [snapshot]);

  const start = (s: number) => {
    const instance = createScenarioInstance(snapshot, { dangerScale: 1, rewardScale: 1 }, 'gen');
    loopEvent('reseed');
    const r0 = createRun({ party: { members: preset.members.map((m) => ({ ...m })), gold: preset.gold, presetId: preset.id }, seed: s, questId: 'gen', scenarioInstance: instance });
    setPast([]); setFuture([]);
    setRun(r0); onNodeChange?.(r0.nodeId);
    onReseed(s);
  };

  /** applyChoice/flee mutate the run in place — snapshot BEFORE, clone AFTER
   *  so history is clean and the state ref actually changes. */
  const choose = (fn: (r: QuestRunState) => QuestRunState) => {
    if (!run) return;
    const before = structuredClone(run);
    const next = structuredClone(fn(run));
    setPast((p) => [...p, before]);
    setFuture([]);
    setRun(next);
    if (next.nodeId !== before.nodeId) onNodeChange?.(next.nodeId);
  };
  /** Jump to a node without consuming an option — the editor strip's ▶ moves
   *  the real run so "where you are = what you edit" works both ways. */
  const jumpTick = jumpRequest?.tick;
  useEffect(() => {
    if (!run || !jumpRequest) return;
    const target = nodesFor(run)[jumpRequest.nodeId];
    if (!target || run.nodeId === jumpRequest.nodeId) return;
    const before = structuredClone(run);
    const next = structuredClone(run);
    next.nodeId = jumpRequest.nodeId;
    setPast((p) => [...p, before]);
    setFuture([]);
    setRun(next);
    onNodeChange?.(next.nodeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jumpTick]);

  const goBack = () => {
    if (!run || !past.length) return;
    const prev = past[past.length - 1]!;
    setPast(past.slice(0, -1));
    setFuture((f) => [structuredClone(run), ...f]);
    setRun(prev);
    if (prev.nodeId !== run.nodeId) onNodeChange?.(prev.nodeId);
  };
  const goForward = () => {
    if (!run || !future.length) return;
    const [next, ...rest] = future;
    setFuture(rest);
    setPast((p) => [...p, structuredClone(run)]);
    setRun(next!);
    if (next!.nodeId !== run.nodeId) onNodeChange?.(next!.nodeId);
  };

  const node: QuestNode | undefined = run ? nodesFor(run)[run.nodeId] : undefined;
  const opts = run ? availableOptions(run) : [];
  const edit = (nodeId: string, field: string, value: unknown) => {
    const wc = { ...workingCopy, ops: [...workingCopy.ops], rejected: [...workingCopy.rejected] };
    applyEditorOp(wc, { kind: 'setNodeField', nodeId, field, value });
    onOpsChange(wc);
  };

  /** IT→EN auto-translation (R-320): an Italian edit also lands on the EN
   *  manuscript as an op. Dev-only endpoint; failure degrades to IT-only. */
  const [trState, setTrState] = useState<'idle' | 'busy' | 'ok' | 'err'>('idle');
  const autoEn = (parts: string[], apply: (en: string[]) => void) => {
    setTrState('busy');
    fetch('/__qe-translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: parts }),
    })
      .then(async (r) => (r.ok ? ((await r.json()) as { translations?: string[] }).translations : null))
      .then((t) => { if (t?.length) { apply(t); setTrState('ok'); } else setTrState('err'); })
      .catch(() => setTrState('err'));
  };
  const autoEnField = (nodeId: string, field: string) => (itText: string) =>
    autoEn([itText], (en) => { if (en[0]) edit(nodeId, field, en[0]); });

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
        <button className="rounded border border-slate-500 px-2 py-0.5 disabled:opacity-40" title="scena precedente della run"
          disabled={!past.length} onClick={goBack}>◀ scena</button>
        <button className="rounded border border-slate-500 px-2 py-0.5 disabled:opacity-40" title="scena successiva (dopo ◀)"
          disabled={!future.length} onClick={goForward}>scena ▶</button>
        <button className="rounded border border-amber-400/60 px-2 py-0.5" onClick={() => choose((r) => flee(r))} disabled={!run || run.ended}>flee</button>
        {dirty && <span className="rounded border border-amber-500/60 px-2 py-0.5 text-amber-300">● stale run — edits since this run started</span>}
        {lang === 'IT' && (
          <span className={`rounded border px-2 py-0.5 ${trState === 'err' ? 'border-red-500/60 text-red-300' : 'border-slate-500 text-slate-400'}`}
            title="gli edit IT vengono tradotti automaticamente nel manuscript EN">
            EN auto {trState === 'busy' ? '⏳' : trState === 'ok' ? '✓' : trState === 'err' ? '✗' : '—'}
          </span>
        )}
        {run?.ended && <span className="rounded border border-slate-500 px-2 py-0.5">outcome: {run.outcome}</span>}
      </div>

      {run && node && (
        <div className="flex gap-3">
          <div className="h-44 w-64 shrink-0 overflow-hidden rounded border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 relative">
            {NODE_ART[run.nodeId]
              ? <img src={NODE_ART[run.nodeId].src} alt={run.nodeId} className="h-full w-full" style={{ objectFit: NODE_ART[run.nodeId].fit }} />
              : <div className="flex h-full items-center justify-center text-slate-500">no art · {run.nodeId}</div>}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            {/* Latest check verdict — the result type of the die that brought
                the run here (typology only: win / big win / epic fail…). */}
            {run.lastCheck && (
              <div className={`self-start rounded border px-2 py-0.5 font-bold uppercase tracking-wider text-[11px] ${
                run.lastCheck.verdict === 'bigwin' ? 'border-amber-400/70 bg-amber-500/15 text-amber-200'
                : run.lastCheck.verdict === 'win' ? 'border-emerald-500/70 bg-emerald-500/15 text-emerald-200'
                : run.lastCheck.verdict === 'almost' ? 'border-yellow-500/60 bg-yellow-500/10 text-yellow-200'
                : run.lastCheck.verdict === 'fail' ? 'border-red-500/60 bg-red-500/10 text-red-300'
                : 'border-red-700/80 bg-red-900/25 text-red-300'}`}
                title={`roll ${run.lastCheck.rollPct} vs ${run.lastCheck.score}`}>
                {run.lastCheck.verdict === 'bigwin' ? 'BIG WIN' : run.lastCheck.verdict === 'epicfail' ? 'EPIC FAIL' : run.lastCheck.verdict.toUpperCase()}
              </div>
            )}
            <div className="rounded border border-slate-700 bg-slate-800/60 p-2">
              <TEd lang={lang} en={node.title ?? run.nodeId} itKey={`${run.nodeId}.title`} overlay={authoredOverlay} edits={itEdits} onItEdit={onItEdit} onSave={(v) => edit(run.nodeId, 'title', v)} onEnAuto={autoEnField(run.nodeId, 'title')} className="font-bold" /> <span className="text-slate-500">· {node.kind}</span>
              <div className="mt-1"><TEd lang={lang} en={node.body ?? ''} itKey={`${run.nodeId}.body`} overlay={authoredOverlay} edits={itEdits} onItEdit={onItEdit} onSave={(v) => edit(run.nodeId, 'body', v)} onEnAuto={autoEnField(run.nodeId, 'body')} /></div>
              {node.transit && <div className="mt-0.5 text-slate-400">transit: <TEd lang={lang} en={node.transit} itKey={`${run.nodeId}.transit`} overlay={authoredOverlay} edits={itEdits} onItEdit={onItEdit} onSave={(v) => edit(run.nodeId, 'transit', v)} onEnAuto={autoEnField(run.nodeId, 'transit')} /></div>}
              {lang === 'EN' && <div className="mt-0.5 text-amber-300/80">IT: <Ed v={itEdits[`${run.nodeId}.body`] ?? ''} onSave={(v) => onItEdit(`${run.nodeId}.body`, v)} /></div>}
            </div>
            {opts.map((o, i) => {
              const p = node.options?.[i] ? previewOption(run, o.id) : null;
              const labelKey = `${run.nodeId}.options[${i}].label`;
              const detailKey = `${run.nodeId}.options[${i}].detail`;
              const enText = o.label + (o.detail ? ` — ${o.detail}` : '');
              let text = enText;
              let mark: 'missing' | 'stale' | undefined;
              let onSave = (v: string) => {
                const [label, ...d] = v.split(' — ');
                const wc = { ...workingCopy, ops: [...workingCopy.ops] };
                applyEditorOp(wc, { kind: 'setOptionField', nodeId: run.nodeId, optionIdx: i, field: 'label', value: label });
                if (d.length) applyEditorOp(wc, { kind: 'setOptionField', nodeId: run.nodeId, optionIdx: i, field: 'detail', value: d.join(' — ') });
                onOpsChange(wc);
              };
              // Engine-synthesized options (info/combat) have no authored copy — nothing to overlay.
              if (lang === 'IT' && node.options?.[i]) {
                const rl = resolveItCopy(labelKey, o.label, authoredOverlay, itEdits);
                const rd = o.detail ? resolveItCopy(detailKey, o.detail, authoredOverlay, itEdits) : undefined;
                text = rl.v + (rd ? ` — ${rd.v}` : '');
                mark = rl.mark === 'stale' || rd?.mark === 'stale' ? 'stale' : rl.mark ?? rd?.mark;
                onSave = (v) => {
                  const [label, ...d] = v.split(' — ');
                  onItEdit(labelKey, label ?? '');
                  if (d.length) onItEdit(detailKey, d.join(' — '));
                  autoEn([label ?? '', ...(d.length ? [d.join(' — ')] : [])], (en) => {
                    const wc2 = { ...workingCopy, ops: [...workingCopy.ops], rejected: [...workingCopy.rejected] };
                    if (en[0]) applyEditorOp(wc2, { kind: 'setOptionField', nodeId: run.nodeId, optionIdx: i, field: 'label', value: en[0] });
                    if (en[1]) applyEditorOp(wc2, { kind: 'setOptionField', nodeId: run.nodeId, optionIdx: i, field: 'detail', value: en[1] });
                    onOpsChange(wc2);
                  });
                };
              }
              return (
                // Row = text (editable in place) + dedicated ▶ — no editable
                // inside a clickable button: clicks for caret placement must
                // never fire the choice.
                <div key={o.id}
                  className={`flex items-center justify-between gap-2 rounded border px-2 py-1 ${o.disabled || run.ended ? 'border-dashed border-slate-600 opacity-50' : 'border-slate-500'}`}>
                  <span className="min-w-0 flex-1 text-left"><Ed v={text} onSave={onSave} />{mark && <ItMark mark={mark} />}</span>
                  <span className="whitespace-nowrap text-emerald-300">{p && 'wound' in p ? `win ${Math.round((p as { success?: number }).success ?? 0)}% · wound ${(p as { wound?: number }).wound ?? 0}% · death ${(p as { death?: number }).death ?? 0}%` : ''}</span>
                  {(() => {
                    const next = node.options?.[i]?.next ?? '';
                    const isCheck = next.startsWith('CHECK:');
                    const checkNode = isCheck ? snapshot.nodes[next.slice(6)] : undefined;
                    const statLabel = (checkNode?.stats ?? []).join('+');
                    return (
                      <button disabled={o.disabled || run.ended}
                        title={isCheck ? `lancia il dado (${statLabel || 'check'})` : 'gioca questa scelta'}
                        className={`rounded border px-2 py-0.5 hover:bg-slate-700/40 disabled:opacity-40 ${isCheck ? 'border-amber-400/70 text-amber-200' : 'border-sky-400/60 text-sky-200'}`}
                        onClick={() => choose((r) => applyChoice(r, o.id))}>
                        {isCheck ? `🎲${statLabel ? ` ${statLabel}` : ''}` : '▶'}
                      </button>
                    );
                  })()}
                </div>
              );
            })}
            {node.options && !run.ended && (
              <button className="self-start rounded border border-dashed border-emerald-500/50 px-2 py-0.5 text-emerald-300"
                title="aggiunge una scelta — visibile dopo re-seed; punta a questa stessa scena, riassegna il next in ③"
                onClick={() => {
                  const wc = { ...workingCopy, ops: [...workingCopy.ops], rejected: [...workingCopy.rejected] };
                  applyEditorOp(wc, { kind: 'addOption', nodeId: run.nodeId, option: { id: `opt-${node.options!.length + 1}`, label: 'nuova scelta', detail: '', next: run.nodeId } });
                  loopEvent('op');
                  onOpsChange(wc);
                }}>
                + scelta
              </button>
            )}
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
                    onClick={() => { const o = opts.find((x) => !x.disabled); if (o) choose((r) => applyChoice(r, o.id, { useConsumable: true })); }}>
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
            {verdictFlavorEditor(node, workingCopy, onOpsChange, lang, authoredOverlay, itEdits, onItEdit, autoEn)}
          </div>
        </div>
      )}
    </div>
  );
};

/** verdictFlavor per-verdict — the 5 outcome sentences of the node. */
function verdictFlavorEditor(
  node: QuestNode,
  wc: WorkingCopy,
  onOps: (w: WorkingCopy) => void,
  lang: EditorLang,
  overlay: ContentOverlay | undefined,
  edits: Record<string, string>,
  onItEdit: (k: string, v: string) => void,
  autoEn: (parts: string[], apply: (en: string[]) => void) => void,
) {
  const vf = (node.verdictFlavor ?? {}) as Record<string, string>;
  const saveEn = (k: string, v: string) => { const n = { ...wc, ops: [...wc.ops] }; applyEditorOp(n, { kind: 'setNodeField', nodeId: node.id, field: 'verdictFlavor', value: { ...vf, [k]: v } }); onOps(n); };
  return (
    <details className="rounded border border-slate-700 p-1">
      <summary className="cursor-pointer text-slate-500">verdictFlavor + numeri</summary>
      {VERDICTS.map((k) => (
        <div key={k} className="flex gap-1"><span className="w-16 text-slate-500">{k}</span>
          <TEd lang={lang} en={vf[k] ?? ''} itKey={`${node.id}.verdictFlavor.${k}`} overlay={overlay} edits={edits} onItEdit={onItEdit}
            onSave={(v) => saveEn(k, v)} onEnAuto={(it) => autoEn([it], (en) => { if (en[0]) saveEn(k, en[0]); })} className="flex-1" />
        </div>
      ))}
    </details>
  );
}
