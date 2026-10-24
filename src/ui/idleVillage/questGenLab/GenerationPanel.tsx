/**
 * GenerationPanel — the live generation surface (PLAN-029 SP-2 T-5).
 *
 * Pickers: gimmick (GIMMICK_REGISTRY) → kit (kitsByGimmick) → tuning
 * (tuningFormDescriptors). Pipeline per contract: kitSchema.safeParse +
 * tuningSchema.safeParse → generate() → sha256 hashes → add().
 *
 * Rules enforced:
 * - Synchronous GenerationRequest capture — nothing re-reads form state
 *   after the first await; the request carries `sessionEpoch` and a late
 *   hash resolving after clear() is dropped silently (error surface
 *   suppressed too — epoch check precedes setError).
 * - Generate is disabled only on incomplete pickers; invalid tuning
 *   stays enabled so the schema-error surface is reachable.
 * - Pending generate disables duplicate submits.
 * - Failed generation mutates nothing: no row, no fabricated link.
 */

import React, { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  GIMMICK_REGISTRY,
  gimmickRow,
  type GimmickId,
} from '@/balancing/config/idleVillage/quests/generation/gimmickRegistry';
import type { JsonValue } from '@/balancing/config/idleVillage/quests/generation/canonicalize';
import { QuestScenarioSchema, type QuestScenario } from '@/balancing/config/idleVillage/quests/questScenario.schema';
import { kitsByGimmick } from './labGenConfig';
import { TUNING_DEFAULTS, tuningFieldsFor } from './tuningFormDescriptors';
import { computeKitHash, computeScenarioHash } from './hash';
import type { CandidateProvenance, LabCandidate } from './candidate';
import type { CandidatesApi } from './candidateStore';
import { buildExportEnvelope, parseExportEnvelope } from './exportEnvelope';
import { Chip, LabCard } from './labUi';

/** Everything the generation pipeline needs — captured synchronously. */
export interface GenerationRequest {
  readonly gimmickId: GimmickId;
  readonly kitId: string;
  readonly effectiveKit: JsonValue;
  readonly effectiveTuning: JsonValue;
  readonly supersedesCandidateId?: string;
  readonly sessionEpoch: number;
}

type ErrorKind = 'kit-schema' | 'tuning-schema' | 'generator-throw' | 'hash-failure';

interface PanelError {
  readonly kind: ErrorKind;
  readonly detail: string;
}

export interface GenerationPanelProps {
  readonly api: CandidatesApi;
  /** Called whenever the pickers produce a complete input set — the page
   *  uses it for candidate staleness badges. */
  readonly onInputsChange: (inputs: {
    gimmickId: GimmickId;
    kitId: string;
    kitHash: string;
    effectiveTuning: JsonValue;
  } | null) => void;
}

export const GenerationPanel: React.FC<GenerationPanelProps> = ({ api, onInputsChange }) => {
  const { t } = useTranslation('idleVillage');
  const [gimmickId, setGimmickId] = useState<GimmickId>('race');
  const [kitId, setKitId] = useState<string>(kitsByGimmick.race[0]!.kitId);
  const [tuning, setTuning] = useState<Record<string, number>>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<PanelError | null>(null);
  const epochRef = useRef(api.sessionEpoch);
  epochRef.current = api.sessionEpoch;

  const fields = tuningFieldsFor(gimmickId);
  const kits = kitsByGimmick[gimmickId];
  const kit = kits.find((k) => k.kitId === kitId);

  /* SP-5 — raw-JSON escape hatch: the kit payload is editable as JSON
   * (validated by the same kitSchema on generate). Narrated kits
   * ({en,it} localized payloads) are read-only — their copy is frozen
   * by contract, tuning stays editable. */
  const kitIsNarrated = useMemo(
    () =>
      !!kit &&
      typeof kit.kit === 'object' &&
      kit.kit !== null &&
      'en' in kit.kit &&
      'it' in kit.kit,
    [kit],
  );
  const [kitDraft, setKitDraft] = useState('');
  const [kitDirty, setKitDirty] = useState(false);
  const kitDraftShown = kitDirty
    ? kitDraft
    : kit
      ? JSON.stringify(kit.kit, null, 2)
      : '';

  /* The tuning schemas are partial (no embedded defaults) — the
   * effective generator defaults live in TUNING_DEFAULTS; showing
   * f.min instead would misrepresent what generate() actually uses. */
  const defaults = useMemo(() => TUNING_DEFAULTS[gimmickId] ?? {}, [gimmickId]);

  const pickGimmick = (g: GimmickId) => {
    setGimmickId(g);
    setKitId(kitsByGimmick[g][0]!.kitId);
    setTuning({});
    setKitDraft('');
    setKitDirty(false);
    setError(null);
  };

  const generate = async () => {
    const row = gimmickRow(gimmickId);
    if (!row || !kit || pending) return;
    // SP-5: an edited kit draft replaces the frozen kit payload —
    // same schema validation path, never a silent parse.
    let effectiveKit: unknown = kit.kit;
    if (kitDirty) {
      try {
        effectiveKit = JSON.parse(kitDraft);
      } catch {
        setError({ kind: 'kit-schema', detail: 'invalid-json' });
        return;
      }
    }
    const request: GenerationRequest = {
      gimmickId,
      kitId: kit.kitId,
      effectiveKit: effectiveKit as JsonValue,
      effectiveTuning: { ...defaults, ...tuning } as JsonValue,
      sessionEpoch: api.sessionEpoch,
    };
    setPending(true);
    setError(null);
    try {
      const kitParsed = row.kitSchema.safeParse(request.effectiveKit);
      if (!kitParsed.success) {
        setError({ kind: 'kit-schema', detail: String(kitParsed.error.issues[0]?.path) });
        return;
      }
      const tuningParsed = row.tuningSchema.safeParse(request.effectiveTuning);
      if (!tuningParsed.success) {
        setError({ kind: 'tuning-schema', detail: String(tuningParsed.error.issues[0]?.path) });
        return;
      }
      let scenario: QuestScenario;
      try {
        scenario = row.generate(kitParsed.data as never, tuningParsed.data as never);
      } catch (e) {
        setError({ kind: 'generator-throw', detail: e instanceof Error ? e.message : String(e) });
        return;
      }
      let scenarioHash: string;
      let kitHash: string;
      try {
        [scenarioHash, kitHash] = await Promise.all([
          computeScenarioHash(scenario as unknown as JsonValue),
          computeKitHash(kitParsed.data as JsonValue),
        ]);
      } catch (e) {
        if (epochRef.current !== request.sessionEpoch) return; // cleared mid-flight
        setError({ kind: 'hash-failure', detail: e instanceof Error ? e.message : String(e) });
        return;
      }
      if (epochRef.current !== request.sessionEpoch) return; // late resolve after clear()
      const provenance: CandidateProvenance = {
        gimmickId: request.gimmickId,
        kitId: request.kitId,
        kitHash,
        effectiveKit: kitParsed.data as JsonValue,
        effectiveTuning: tuningParsed.data as JsonValue,
      };
      const prior = [...api.candidates].reverse().find(
        (c) =>
          c.provenance.gimmickId === provenance.gimmickId &&
          c.provenance.kitId === provenance.kitId &&
          c.provenance.kitHash === provenance.kitHash,
      );
      api.add({
        id: `cand-${scenarioHash.slice(7, 15)}-${api.nextSeq}`,
        scenario,
        scenarioHash,
        provenance,
        ...(prior ? { supersedes: prior.id } : {}),
      });
      onInputsChange({
        gimmickId: provenance.gimmickId,
        kitId: provenance.kitId,
        kitHash: provenance.kitHash,
        effectiveTuning: provenance.effectiveTuning,
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <LabCard
      title={t('questGenLab.generate.title')}
      aside={<Chip tone="mono">{t('questGenLab.generate.authorOnly')}</Chip>}
    >
      <div className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {GIMMICK_REGISTRY.map((row) => (
            <button
              key={row.gimmickId}
              type="button"
              onClick={() => pickGimmick(row.gimmickId)}
              className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                gimmickId === row.gimmickId
                  ? 'border-amber-500/60 bg-amber-500/15 text-amber-200'
                  : 'border-white/10 bg-white/5 text-slate-400 hover:border-amber-500/30'
              }`}
            >
              {row.gimmickId}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {kits.map((k) => (
            <button
              key={k.kitId}
              type="button"
              onClick={() => {
                setKitId(k.kitId);
                setKitDraft('');
                setKitDirty(false);
              }}
              className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                kitId === k.kitId
                  ? 'border-amber-500/60 bg-amber-500/15 text-amber-200'
                  : 'border-white/10 bg-white/5 text-slate-400 hover:border-amber-500/30'
              }`}
            >
              {k.kitId}
            </button>
          ))}
        </div>
        {/* SP-5 — kit authoring drawer (raw-JSON escape hatch). */}
        <details className="rounded-md border border-white/5 bg-white/[0.02] px-2 py-1.5">
          <summary className="cursor-pointer text-[10px] text-slate-500">
            {t('questGenLab.generate.kitDrawer')}
            {kitIsNarrated && (
              <span className="ml-2 font-mono text-[9px] text-slate-600">
                {t('questGenLab.generate.kitReadonly')}
              </span>
            )}
          </summary>
          <textarea
            value={kitDraftShown}
            readOnly={kitIsNarrated}
            spellCheck={false}
            onChange={(e) => {
              setKitDraft(e.target.value);
              setKitDirty(true);
            }}
            className="mt-1.5 h-40 w-full resize-y rounded-md border border-white/10 bg-slate-950 p-2 font-mono text-[10px] text-slate-300 read-only:opacity-60"
          />
          {kitDirty && (
            <button
              type="button"
              onClick={() => {
                setKitDraft('');
                setKitDirty(false);
              }}
              className="mt-1 text-[9px] text-slate-500 hover:text-slate-300"
            >
              {t('questGenLab.generate.kitReset')}
            </button>
          )}
        </details>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {fields.map((f) => (
            <label key={f.key} className="block text-[10px] text-slate-500">
              {t(`questGenLab.generate.tuning.${f.labelKey}`)}
              <input
                type="number"
                min={f.min}
                max={f.max}
                step={f.step}
                value={tuning[f.key] ?? defaults[f.key] ?? f.min}
                onChange={(e) =>
                  setTuning((cur) => ({ ...cur, [f.key]: Number(e.target.value) }))
                }
                className="mt-0.5 w-full rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-xs text-slate-200"
              />
            </label>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={!kit || pending}
            onClick={() => void generate()}
            className="rounded-md border border-amber-500/50 bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-500/25 disabled:opacity-40"
          >
            {pending ? t('questGenLab.generate.running') : t('questGenLab.generate.cta')}
          </button>
          {error && (
            <span className="text-[11px] text-red-300">
              {t(`questGenLab.generate.errors.${error.kind}`)}
              <span className="ml-1 font-mono text-[9px] text-slate-500">{error.detail}</span>
            </span>
          )}
        </div>
        {/* SP-6 — export the latest candidate / import an envelope */}
        <div className="flex items-start gap-3 border-t border-white/5 pt-2">
          <button
            type="button"
            disabled={api.candidates.length === 0}
            onClick={() => {
              const c = api.candidates[api.candidates.length - 1];
              if (!c) return;
              const env = buildExportEnvelope(c);
              const blob = new Blob([JSON.stringify(env, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${c.id}.export.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-slate-300 hover:border-amber-500/30 disabled:opacity-40"
          >
            {t('questGenLab.generate.export')}
          </button>
          <label className="text-[10px] text-slate-500">
            {t('questGenLab.generate.importLabel')}
            <input
              type="file"
              accept="application/json"
              className="mt-0.5 block text-[10px] text-slate-400 file:mr-2 file:rounded file:border-white/10 file:bg-white/5 file:px-2 file:py-0.5 file:text-[10px]"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                void file.text().then((text) => {
                  let raw: unknown;
                  try { raw = JSON.parse(text); } catch { raw = null; }
                  const env = parseExportEnvelope(raw);
                  if (!env) {
                    setError({ kind: 'kit-schema', detail: 'envelope-parse' });
                    return;
                  }
                  const provenance: CandidateProvenance = {
                    gimmickId: env.gimmickId as GenerationRequest['gimmickId'],
                    kitId: `import:${env.generationReceipt.provenance}`,
                    kitHash: env.generationReceipt.kitHash,
                    effectiveKit: env.kit as never,
                    effectiveTuning: env.tuning as never,
                  };
                  api.add({
                    id: `cand-${env.generationReceipt.scenarioHash.slice(7, 15)}-${api.nextSeq}`,
                    scenario: QuestScenarioSchema.parse(env.scenario) as never,
                    scenarioHash: env.generationReceipt.scenarioHash,
                    provenance,
                  });
                });
                e.target.value = '';
              }}
            />
          </label>
        </div>
      </div>
    </LabCard>
  );
};
