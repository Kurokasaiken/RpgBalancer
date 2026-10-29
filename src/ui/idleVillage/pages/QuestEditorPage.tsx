/**
 * QuestEditorPage — `/quest-editor` (PLAN-102). Ruling B flow:
 * header → EditorPlaySurface (real run, inline edit) → scene strip
 * (▶ = where you are = what you edit) → inspector (numbers/options/next).
 */
import { useEffect, useMemo, useState } from 'react';
import { LabPanel } from '@/ui/idleVillage/questGenLab/labUi';
import type { QuestNode } from '@/ui/idleVillage/questS1Lab/questScenario';
import type { QuestScenario } from '@/balancing/config/idleVillage/quests/questScenario.schema';
import {
  applyEditorOp, derive, inboundRefs, resetToParent, undo,
  type LoadedScenario, type WorkingCopy,
} from '@/ui/idleVillage/questEditor';
import { loadAuthored, loadFromCandidate, loadFromCatalog } from '@/ui/idleVillage/questEditor/loaders';

import { GENERATED_CATALOG } from '@/balancing/config/idleVillage/quests/generation/catalog';
import { EditorPlaySurface } from '@/ui/idleVillage/questEditor/EditorPlaySurface';
import { clearDraft, loadDraft, saveDraft } from '@/ui/idleVillage/questEditor/draftPersistence';
import { loopEvent } from '@/ui/idleVillage/questEditor/loopInstrument';
import { validateDraft, FORK_FIDELITY_MANIFEST } from '@/ui/idleVillage/questEditor/validation';
import { buildEditedCandidate, buildEditedExportEnvelope, unwaivedFidelityItems } from '@/ui/idleVillage/questEditor/editedCandidate';
import { loadFromEnvelope } from '@/ui/idleVillage/questEditor/loaders';
import { loadCandidates, saveCandidates } from '@/ui/idleVillage/questGenLab/candidatePersistence';

export default function QuestEditorPage() {
  const [loaded, setLoaded] = useState<LoadedScenario | null>(null);
  const [wc, setWc] = useState<WorkingCopy | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [seed, setSeed] = useState(1);
  const [runStartedAt, setRunStartedAt] = useState(0); // op count at last re-seed
  const [candList, setCandList] = useState<{ id: string }[]>([]);
  const [msg, setMsg] = useState('');
  const [waived, setWaived] = useState<Set<string>>(new Set());
  const [itEdits, setItEdits] = useState<Record<string, string>>({});
  const [lang, setLang] = useState<'EN' | 'IT'>('EN');

  // Director 2026-10-29: the goblin quest loads by default.
  useEffect(() => { pick(loadAuthored('goblin')); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const scenario: QuestScenario | null = useMemo(() => (wc ? derive(wc) : null), [wc]);
  const dirty = !!wc && wc.ops.length !== runStartedAt;

  const pick = (l: LoadedScenario | null) => {
    setLoaded(l); setWc(l?.workingCopy ?? null); setSelected(null); setRunStartedAt(0); setMsg(l ? `loaded ${l.parent.parentSource}/${l.parent.parentRef}` : 'not found');
  };
  const mut = (op: Parameters<typeof applyEditorOp>[1], label: string) => {
    if (!wc) return;
    const n = { ...wc, ops: [...wc.ops], rejected: [...wc.rejected] };
    const r = applyEditorOp(n, op);
    loopEvent('op');
    setWc(n); setMsg(r.ok ? label : `✗ ${r.reason}`);
  };
  const setField = (nodeId: string, field: string, value: unknown) =>
    mut({ kind: 'setNodeField', nodeId, field, value }, `${nodeId}.${field} → ${JSON.stringify(value)}`);

  const diag = scenario ? validateDraft(scenario) : null;
  const blockedFidelity = loaded ? unwaivedFidelityItems(loaded.parent.parentSource, loaded.parent.parentRef, waived) : [];

  const saveCandidate = async () => {
    if (!wc || !loaded || !diag) return;
    if (blockedFidelity.length) { setMsg(`✗ approve bloccato: ${blockedFidelity.length} comportamenti questId non risolti`); return; }
    if (!diag.valid) { setMsg(`✗ approve bloccato: scenario invalid`); return; }
    const c = buildEditedCandidate(wc, loaded.parent.parentSource, loaded.parent.parentRef, [...waived], itEdits);
    const list = await loadCandidates();
    await saveCandidates([...list.filter((x) => x.id !== c.id), c]);
    setMsg(`✓ candidato salvato: ${c.id} (${wc.ops.length} ops)`);
  };
  const exportEnvelope = () => {
    if (!wc || !loaded || !diag) return;
    try {
      const c = buildEditedCandidate(wc, loaded.parent.parentSource, loaded.parent.parentRef, [...waived], itEdits);
      const env = buildEditedExportEnvelope(c, diag);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(env, null, 1)], { type: 'application/json' }));
      a.download = `quest-${loaded.parent.parentRef}-edited.json`; a.click();
      setMsg('✓ export — envelope validato');
    } catch (e) { setMsg(`✗ ${e instanceof Error ? e.message : e}`); }
  };

  const node: QuestNode | undefined = scenario && selected ? scenario.nodes[selected] : undefined;
  const inbound = scenario && selected ? inboundRefs(scenario, selected) : [];

  return (
    <div className="min-h-screen bg-slate-950 p-4 text-xs text-slate-200">
      <div className="mx-auto flex max-w-6xl flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2 rounded border border-slate-700 bg-slate-900 px-3 py-2">
          <span className="rounded border border-slate-600 px-2 py-0.5">quest: <b>{loaded?.parent.parentRef ?? '—'}</b></span>
          <span className="rounded border border-slate-600 px-2 py-0.5">{loaded?.parent.parentSource}</span>
          <button className="rounded border border-slate-600 px-2 py-0.5" onClick={() => setLang((l) => l === 'EN' ? 'IT' : 'EN')}>lingua: <b>{lang}</b></button>
          <span className="ml-auto" />
          <select className="rounded border border-slate-600 bg-slate-900 px-1 py-0.5" defaultValue="" onChange={(e) => { e.target.value === 'goblin' || e.target.value === 'rovine' ? pick(loadAuthored(e.target.value)) : pick(loadFromCatalog(e.target.value)); }}>
            <option value="" disabled>Carica ▸ authored / catalog</option>
            <option value="goblin">authored · goblin</option>
            <option value="rovine">authored · rovine</option>
            {Object.keys(GENERATED_CATALOG).map((id) => <option key={id} value={id}>{id}</option>)}
          </select>
          <select className="rounded border border-slate-600 bg-slate-900 px-1 py-0.5" defaultValue="" onFocus={async () => setCandList(await loadCandidates())} onChange={async (e) => pick(await loadFromCandidate(e.target.value))}>
            <option value="" disabled>candidates</option>
            {candList.map((c) => <option key={c.id} value={c.id}>{c.id}</option>)}
          </select>
          <button className="rounded border border-sky-400/60 px-2 py-0.5" onClick={() => wc && loaded && void saveDraft({ v: 1, ...loaded.parent, ops: [...wc.ops], savedAt: new Date().toISOString() }).then(() => setMsg('draft saved'))}>Salva draft</button>
          <button className="rounded border border-sky-400/60 px-2 py-0.5" onClick={() => wc && setWc(undo(wc))}>undo</button>
          <button className="rounded border border-amber-500/60 px-2 py-0.5 text-amber-300" onClick={() => wc && setWc(resetToParent(wc))}>reset</button>
          <button className="rounded border border-emerald-500/60 px-2 py-0.5 text-emerald-300" onClick={() => void saveCandidate()}
            title={blockedFidelity.length ? `bloccato: ${blockedFidelity.length} fidelity` : ''}>Salva candidato</button>
          <button className="rounded border border-emerald-500/60 px-2 py-0.5 text-emerald-300" onClick={exportEnvelope}>Esporta</button>
          <button className="rounded border border-slate-600 px-2 py-0.5" onClick={async () => {
            const txt = await navigator.clipboard.readText().catch(() => '');
            const l = loadFromEnvelope(txt ? JSON.parse(txt) : null);
            setMsg(l ? '' : '✗ clipboard non contiene un envelope valido');
            if (l) pick(l);
          }}>importa (clip)</button>
          <button className="rounded border border-slate-600 px-2 py-0.5 text-slate-400" onClick={async () => { const d = await loadDraft(); setMsg(d ? `draft found: ${d.parentRef} (${d.ops.length} ops)` : 'no draft'); if (d) void clearDraft(); }}>draft?</button>
        </div>
        {msg && <div className="text-slate-400">{msg}</div>}

        {scenario && wc && (
          <>
            <LabPanel title="① play — run reale (stateful)">
              <EditorPlaySurface snapshot={scenario} workingCopy={wc} onOpsChange={setWc} dirty={dirty} seed={seed}
                onReseed={(s) => { setSeed(s); setRunStartedAt(wc.ops.length); }} itEdits={itEdits} onItEdit={(k, v) => setItEdits((m) => ({ ...m, [k]: v }))} />
            </LabPanel>

            <LabPanel title="② scene — ▶ dove sei = cosa editi">
              <div className="flex flex-wrap items-center gap-1">
                {Object.keys(scenario.nodes).map((id) => (
                  <button key={id} onClick={() => setSelected(id)}
                    className={`rounded border px-1.5 py-0.5 ${selected === id ? 'border-amber-400 bg-amber-500/10 text-amber-200' : 'border-slate-600'}`}>
                    {selected === id ? '▶ ' : ''}{id}
                  </button>
                ))}
                <button className="rounded border border-dashed border-emerald-500/50 px-1.5 py-0.5 text-emerald-300"
                  onClick={() => { const id = `nuova-${Object.keys(scenario.nodes).length}`; mut({ kind: 'addNode', node: { id, kind: 'info', title: id, body: '' } as QuestNode }, `+ ${id}`); setSelected(id); }}>+ scena</button>
                {selected && (
                  <button className="rounded border border-red-500/60 px-1.5 py-0.5 text-red-300"
                    onClick={() => {
                      if (inbound.length) { setMsg(`✗ ${inbound.length} riferimenti entranti — riassegna sotto prima di rimuovere`); return; }
                      mut({ kind: 'removeNode', nodeId: selected }, `− ${selected}`); setSelected(null);
                    }}>− scena</button>
                )}
              </div>
            </LabPanel>

            {diag && (
              <LabPanel title={`validation — ${diag.valid ? 'valid' : 'INVALID'} · gates Approve/Export`}>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {diag.schemaErrors.map((e, i) => <span key={i} className="text-red-300">schema: {e.slice(0, 90)}</span>)}
                  {diag.dangling.map((d, i) => <span key={i} className="text-red-300">dangling {d.from} → {d.to}</span>)}
                  {diag.unreachable.length > 0 && <span className="text-amber-300">unreachable: {diag.unreachable.join(', ')}</span>}
                  {diag.engineOwned.length > 0 && <span className="text-slate-400">engine-owned: {diag.engineOwned.length} nodi (routing read-only)</span>}
                  {diag.valid && !diag.unreachable.length && <span className="text-emerald-300">✓ schema + grafo puliti</span>}
                </div>
              </LabPanel>
            )}

            {blockedFidelity.length > 0 && (
              <LabPanel title={`fork fidelity — ${blockedFidelity.length} comportamenti persi su questId 'gen' (W-04: bloccanti)`}>
                <div className="flex flex-col gap-1">
                  {FORK_FIDELITY_MANIFEST[loaded!.parent.parentRef].map((i) => (
                    <label key={i.key} className="flex items-center gap-2">
                      <input type="checkbox" checked={waived.has(i.key)} onChange={(e) => setWaived((w) => { const n = new Set(w); e.target.checked ? n.add(i.key) : n.delete(i.key); return n; })} />
                      <span className={waived.has(i.key) ? 'text-slate-500 line-through' : ''}>{i.label}</span>
                      <span className="text-slate-600">{waived.has(i.key) ? 'waived — registrato nel candidato' : ''}</span>
                    </label>
                  ))}
                </div>
              </LabPanel>
            )}

            {node && selected && (
              <LabPanel title={`③ ${selected} · ${node.kind}`}>
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-500">numeri</span>
                    <label>risk.wound % <input className="w-16 rounded border border-slate-600 bg-slate-900 px-1" value={(node.risk?.wound as number) ?? ''} onChange={(e) => setField(selected, 'risk', { ...(node.risk ?? {}), wound: Number(e.target.value) })} /></label>
                    <label>risk.death % <input className="w-16 rounded border border-slate-600 bg-slate-900 px-1" value={(node.risk?.death as number) ?? ''} onChange={(e) => setField(selected, 'risk', { ...(node.risk ?? {}), death: Number(e.target.value) })} /></label>
                    <label>beat <input className="w-24 rounded border border-slate-600 bg-slate-900 px-1" value={(node.beat as string) ?? ''} onChange={(e) => setField(selected, 'beat', e.target.value)} /></label>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-500">opzioni → next</span>
                    {(node.options ?? []).map((o, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <span className="truncate">{o.label}</span>
                        <select className="ml-auto rounded border border-slate-600 bg-slate-900 px-1" value={o.next}
                          onChange={(e) => mut({ kind: 'rewireNext', nodeId: selected, optionIdx: i, to: e.target.value }, `${selected}[${i}] → ${e.target.value}`)}>
                          {Object.keys(scenario.nodes).map((id) => <option key={id} value={id}>{id}</option>)}
                        </select>
                        <button className="text-red-300" onClick={() => mut({ kind: 'removeOption', nodeId: selected, optionIdx: i }, `− opzione ${i}`)}>✕</button>
                      </div>
                    ))}
                    <button className="self-start rounded border border-dashed border-emerald-500/50 px-1.5 text-emerald-300"
                      onClick={() => mut({ kind: 'addOption', nodeId: selected, option: { label: 'nuova', next: selected } }, '+ opzione')}>+ opzione</button>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-500">riferimenti entranti ({inbound.length})</span>
                    {inbound.map((r, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <span>{r.nodeId}[{r.optionIdx}]</span>
                        <select className="ml-auto rounded border border-slate-600 bg-slate-900 px-1" defaultValue=""
                          onChange={(e) => mut({ kind: 'rewireNext', nodeId: r.nodeId, optionIdx: r.optionIdx, to: e.target.value }, `${r.nodeId}[${r.optionIdx}] → ${e.target.value}`)}>
                          <option value="" disabled>repoint…</option>
                          {Object.keys(scenario.nodes).filter((id) => id !== selected).map((id) => <option key={id} value={id}>{id}</option>)}
                        </select>
                      </div>
                    ))}
                    {!inbound.length && <span className="text-slate-600">nessuno — rimozione sicura</span>}
                  </div>
                </div>
              </LabPanel>
            )}
          </>
        )}
      </div>
    </div>
  );
}
