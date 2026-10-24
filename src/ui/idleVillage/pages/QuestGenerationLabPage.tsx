/**
 * QuestGenerationLabPage — the quest-generation test & inspection surface
 * (R-140, PLAN-026 observability).
 *
 * Route: /quest-generation-lab (dev only). Sections:
 * 1. Pipeline tree — how a quest gets created, step by step, with status;
 * 2. Ingredients — core gimmicks, domain kits (the «tag» axis), traits,
 *    twists and the mechanics glossary;
 * 3. Catalog — the GENERATED_CATALOG scenarios: metadata, the DFS node
 *    tree with a node inspector, and a text-mode playable run that drives
 *    the real engine (gen profile + frozen ScenarioInstance) ending in the
 *    real settlement plan and epilogue;
 * 4. Consequences — the aftermath matrix (party, village, factions, world,
 *    future quests) honest about what exists and what does not;
 * 5. Systems map + open issues — where everything lives and what the
 *    Director is still forgetting.
 *
 * i18n split (same rule as QuestS1LabPage): UI chrome under
 * `questGenLab.*`; authored content (kit copy, registry descriptions,
 * node text) stays Italian in the config modules — it is content data,
 * not chrome.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  bakedToExplorerEntry,
  candidateToExplorerEntry,
  labCatalogEntries,
  type LabExplorerEntry,
} from '@/ui/idleVillage/questGenLab/labModel';
import {
  buildSupersededIndex,
  computeStatus,
  type CandidateStatus,
  type LabCandidate,
} from '@/ui/idleVillage/questGenLab/candidate';
import { useCandidates, type CandidatesApi } from '@/ui/idleVillage/questGenLab/candidateStore';
import {
  loadCandidates,
  saveCandidates,
} from '@/ui/idleVillage/questGenLab/candidatePersistence';
import { GenerationPanel } from '@/ui/idleVillage/questGenLab/GenerationPanel';
import { LabSection } from '@/ui/idleVillage/questGenLab/labUi';
import { ScenarioExplorer } from '@/ui/idleVillage/questGenLab/ScenarioExplorer';
import {
  ConsequencesSection,
  IngredientsSection,
  PipelineSection,
  SystemsSection,
} from '@/ui/idleVillage/questGenLab/LabSections';

const QuestGenerationLabPage: React.FC = () => {
  const { t } = useTranslation('idleVillage');
  const api: CandidatesApi = useCandidates();
  /** Author mode — gates the generation panel (SP-2; SP-8 owns the full IA). */
  const [authorMode, setAuthorMode] = useState(false);
  /** Last picker inputs — the staleness reference for candidate badges. */
  const [currentInputs, setCurrentInputs] = useState<Parameters<
    typeof computeStatus
  >[1] | null>(null);

  const supersededBy = useMemo(() => buildSupersededIndex(api.candidates), [api.candidates]);

  /* SP-6: hydrate persisted candidates once, then autosave every change.
   * The hydrate guard prevents the autosave effect from wiping storage
   * before the initial load resolves. */
  const hydratedRef = useRef(false);
  const hydrateRef = useRef(api.hydrate);
  hydrateRef.current = api.hydrate;
  useEffect(() => {
    let alive = true;
    void loadCandidates().then((list) => {
      if (!alive || list.length === 0) {
        hydratedRef.current = true;
        return;
      }
      hydrateRef.current(list);
      hydratedRef.current = true;
    });
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    if (!hydratedRef.current) return;
    void saveCandidates(api.candidates);
  }, [api.candidates]);

  const statusOf = useCallback(
    (c: LabCandidate): CandidateStatus =>
      computeStatus(
        c,
        currentInputs ?? {
          gimmickId: c.provenance.gimmickId,
          kitId: c.provenance.kitId,
          kitHash: c.provenance.kitHash,
          effectiveTuning: c.provenance.effectiveTuning,
        },
        supersededBy.get(c.id),
      ),
    [currentInputs, supersededBy],
  );

  /** Candidates newest-first above baked; explorer fields come from one builder each. */
  const explorerEntries = useMemo<LabExplorerEntry[]>(
    () => [
      ...[...api.candidates].reverse().map(candidateToExplorerEntry),
      ...labCatalogEntries().map(bakedToExplorerEntry),
    ],
    [api.candidates],
  );

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-200">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4">
          <a
            href="/test-hub"
            className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-amber-500/50 hover:text-amber-200"
          >
            ← {t('questGenLab.backToHub')}
          </a>
        </div>
        <header className="mb-8">
          <h1 className="mb-1 text-2xl font-bold text-amber-200">{t('questGenLab.title')}</h1>
          <p className="max-w-3xl text-xs leading-relaxed text-slate-400">{t('questGenLab.subtitle')}</p>
        </header>

        <PipelineSection />
        <IngredientsSection entries={explorerEntries.map((e) => e.entry)} />
        <LabSection
          icon="🗝️"
          title={t('questGenLab.sections.catalog')}
          desc={t('questGenLab.sections.catalogDesc')}
        >
          <div className="mb-3 flex justify-end">
            <button
              type="button"
              onClick={() => setAuthorMode((v) => !v)}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                authorMode
                  ? 'border-amber-500/60 bg-amber-500/15 text-amber-200'
                  : 'border-white/10 bg-white/5 text-slate-400 hover:border-amber-500/30'
              }`}
            >
              {t('questGenLab.author.toggle')}
            </button>
          </div>
          {authorMode && <div className="mb-4"><GenerationPanel api={api} onInputsChange={setCurrentInputs} /></div>}
          <ScenarioExplorer entries={explorerEntries} statusOf={statusOf} sessionEpoch={api.sessionEpoch} />
        </LabSection>
        <ConsequencesSection />
        <SystemsSection />

        <footer className="mt-10 border-t border-white/10 pt-4 text-center text-[10px] text-slate-600">
          {t('questGenLab.footer')}
        </footer>
      </div>
    </div>
  );
};

export default QuestGenerationLabPage;
