/**
 * LabSections — the registry-driven sections of the Quest Generation Lab
 * (R-140): pipeline tree, ingredient inventories, consequence matrix,
 * implementation map and open issues.
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  QUEST_LAB_CONSEQUENCES,
  QUEST_LAB_GIMMICKS,
  QUEST_LAB_MECHANICS,
  QUEST_LAB_OPEN,
  QUEST_LAB_PIPELINE,
  QUEST_LAB_SUBSYSTEMS,
} from '@/balancing/config/idleVillage/quests/generation/labRegistry';
import { QUEST_TRAITS } from '@/balancing/config/idleVillage/quests/questTraits';
import type { LabCatalogEntry } from './labModel';
import { labKits, type LabKitInfo } from './labModel';
import { Chip, ChipRow, FileRef, LabCard, LabSection, StatusBadge } from './labUi';

/* ------------------------------------------------------------------ */
/* Pipeline tree — «albero specifico di come verrà creata la quest»    */
/* ------------------------------------------------------------------ */

export const PipelineSection: React.FC = () => {
  const { t } = useTranslation('idleVillage');
  const [open, setOpen] = useState<string | null>(null);
  return (
    <LabSection
      icon="🌳"
      title={t('questGenLab.sections.pipeline')}
      desc={t('questGenLab.sections.pipelineDesc')}
    >
      <ol className="relative ml-3 space-y-0 border-l border-white/15">
        {QUEST_LAB_PIPELINE.map((step) => (
          <li key={step.id} className="relative pb-2 pl-5">
            <span className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full border border-amber-500/60 bg-slate-900" />
            <button
              type="button"
              onClick={() => setOpen(open === step.id ? null : step.id)}
              className="flex w-full items-center gap-2 rounded px-1 py-1 text-left hover:bg-white/5"
            >
              <span className="text-xs font-semibold text-white">{step.title}</span>
              <StatusBadge status={step.status} />
              <span className="ml-auto text-[10px] text-slate-500">{open === step.id ? '▾' : '▸'}</span>
            </button>
            {open === step.id && (
              <div className="ml-1 mt-1 rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <p className="text-[11px] leading-relaxed text-slate-300">{step.desc}</p>
                <div className="mt-2 grid gap-1 text-[10px] sm:grid-cols-2">
                  <div>
                    <span className="uppercase tracking-wider text-slate-500">{t('questGenLab.labels.reads')}: </span>
                    <span className="text-slate-300">{step.reads}</span>
                  </div>
                  <div>
                    <span className="uppercase tracking-wider text-slate-500">{t('questGenLab.labels.writes')}: </span>
                    <span className="text-slate-300">{step.writes}</span>
                  </div>
                </div>
                <div className="mt-2">{step.files.map((f) => <FileRef key={f} path={f} />)}</div>
              </div>
            )}
          </li>
        ))}
      </ol>
    </LabSection>
  );
};

/* ------------------------------------------------------------------ */
/* Ingredients — gimmicks, kits/tags, traits, twists, mechanics        */
/* ------------------------------------------------------------------ */

const GimmickCard: React.FC<{ g: (typeof QUEST_LAB_GIMMICKS)[string] }> = ({ g }) => {
  const { t } = useTranslation('idleVillage');
  return (
    <LabCard title={g.label} aside={<StatusBadge status={g.status} />}>
      <p className="text-[11px] italic text-amber-100/80">{g.dilemma}</p>
      <div className="mt-2 space-y-1">
        <ChipRow label="vars">
          {g.vars.map((v) => (
            <Chip key={v.key} tone="mono" >{v.key}</Chip>
          ))}
        </ChipRow>
        {g.vars.map((v) => (
          <div key={v.key} className="text-[10px] text-slate-400">
            <span className="font-mono text-slate-300">{v.key}</span> — {v.label}. {v.movesWith}
          </div>
        ))}
        <div className="text-[10px] text-slate-400">
          <span className="uppercase tracking-wider text-slate-500">{t('questGenLab.labels.resolution')}: </span>
          {g.resolution}
        </div>
        <ChipRow label={t('questGenLab.labels.twists')}>
          {g.twists.map((tw) => (
            <Chip key={tw.flag} tone="warn">{tw.label}</Chip>
          ))}
        </ChipRow>
        <ChipRow label={t('questGenLab.labels.scenes')}>
          {g.sceneKeys.map((k) => <Chip key={k} tone="mono">{k}</Chip>)}
        </ChipRow>
        <div className="pt-1 font-mono text-[9px] text-slate-500">
          {g.generator.fn} · tuning: {g.generator.tuning}
        </div>
        <FileRef path={g.generator.file} />
      </div>
    </LabCard>
  );
};

const KitCard: React.FC<{ kit: LabKitInfo }> = ({ kit }) => {
  const { t } = useTranslation('idleVillage');
  return (
    <LabCard
      title={kit.title}
      aside={
        <span className="flex gap-1">
          <Chip tone={kit.origin === 'narrated' ? 'good' : 'default'}>
            {t(`questGenLab.labels.${kit.origin}`)}
          </Chip>
          <Chip>{kit.gimmick}</Chip>
        </span>
      }
    >
      <p className="text-[11px] italic text-slate-400">{kit.flavour}</p>
      <div className="mt-2 space-y-1">
        {kit.names.map((n) => (
          <div key={n.label} className="text-[10px] text-slate-400">
            <span className="text-slate-500">{n.label}: </span>
            <span className="text-slate-200">{n.value}</span>
          </div>
        ))}
        <div className="text-[10px] text-slate-400">
          <span className="text-slate-500">intel: </span>
          <span className="font-mono text-slate-300">{kit.intelId}</span>
          {kit.vocabId && (
            <span className="text-slate-500"> · vocab {kit.vocabId}</span>
          )}
        </div>
        {kit.scenarioIds.length > 0 && (
          <ChipRow label={t('questGenLab.labels.scenarios')}>
            {kit.scenarioIds.map((id) => <Chip key={id} tone="mono">{id}</Chip>)}
          </ChipRow>
        )}
      </div>
    </LabCard>
  );
};

export const IngredientsSection: React.FC<{ entries: LabCatalogEntry[] }> = ({ entries }) => {
  const { t } = useTranslation('idleVillage');
  const [tab, setTab] = useState<'gimmicks' | 'kits' | 'traits' | 'twists' | 'mechanics'>('gimmicks');
  const kits = labKits();
  const twists = entries.flatMap((e) =>
    e.twists.map((tw) => ({ ...tw, scenarioId: e.scenario.id })),
  );
  const TABS = [
    ['gimmicks', Object.keys(QUEST_LAB_GIMMICKS).length],
    ['kits', kits.length],
    ['traits', Object.keys(QUEST_TRAITS).length],
    ['twists', twists.length],
    ['mechanics', QUEST_LAB_MECHANICS.length],
  ] as const;

  return (
    <LabSection
      icon="🧪"
      title={t('questGenLab.sections.ingredients')}
      desc={t('questGenLab.sections.ingredientsDesc')}
    >
      <div className="mb-3 flex flex-wrap gap-1" role="tablist">
        {TABS.map(([id, count]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`rounded-md border px-3 py-1 text-xs ${
              tab === id
                ? 'border-amber-500/60 bg-amber-500/15 text-amber-200'
                : 'border-white/10 bg-white/5 text-slate-300 hover:border-amber-500/30'
            }`}
          >
            {t(`questGenLab.tabs.${id}`)} <span className="text-slate-500">({count})</span>
          </button>
        ))}
      </div>

      {tab === 'gimmicks' && (
        <div className="grid gap-3 md:grid-cols-2">
          {Object.values(QUEST_LAB_GIMMICKS).map((g) => <GimmickCard key={g.id} g={g} />)}
        </div>
      )}

      {tab === 'kits' && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {kits.map((k) => <KitCard key={k.key} kit={k} />)}
        </div>
      )}

      {tab === 'traits' && (
        <div className="grid gap-3 md:grid-cols-3">
          {Object.values(QUEST_TRAITS).map((tr) => (
            <LabCard key={tr.id} title={tr.label} aside={<Chip tone="warn">{tr.id}</Chip>}>
              <p className="text-[11px] italic text-slate-300">{tr.description}</p>
              <p className="mt-2 text-[10px] text-slate-400">{tr.mechanicalNote}</p>
            </LabCard>
          ))}
        </div>
      )}

      {tab === 'twists' && (
        <div className="space-y-2">
          {twists.map((tw, i) => (
            <div
              key={`${tw.flag}-${i}`}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px]"
            >
              <span className="font-mono font-semibold text-amber-200">{tw.flag}</span>
              <Chip>{tw.kind === 'runstart' ? t('questGenLab.labels.runstart') : t('questGenLab.labels.inRun')}</Chip>
              <Chip tone="mono">{tw.chance}%</Chip>
              {tw.requiresTrait && <Chip tone="warn">trait:{tw.requiresTrait}</Chip>}
              <span className="font-mono text-[9px] text-slate-500">{tw.scenarioId} · {tw.source}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'mechanics' && (
        <div className="grid gap-3 md:grid-cols-2">
          {QUEST_LAB_MECHANICS.map((m) => (
            <LabCard key={m.id} title={m.label} aside={<StatusBadge status={m.status} />}>
              <p className="text-[11px] text-slate-300">{m.desc}</p>
              <p className="mt-1 font-mono text-[10px] text-slate-500">{m.surface}</p>
              <div className="mt-1">{m.files.map((f) => <FileRef key={f} path={f} />)}</div>
            </LabCard>
          ))}
        </div>
      )}
    </LabSection>
  );
};

/* ------------------------------------------------------------------ */
/* Consequences — «come i pg, le fazioni, il mondo cambieranno»        */
/* ------------------------------------------------------------------ */

export const ConsequencesSection: React.FC = () => {
  const { t } = useTranslation('idleVillage');
  return (
    <LabSection
      icon="⚖️"
      title={t('questGenLab.sections.consequences')}
      desc={t('questGenLab.sections.consequencesDesc')}
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {QUEST_LAB_CONSEQUENCES.map((c) => (
          <LabCard key={c.id} title={c.domain} aside={<StatusBadge status={c.status} />}>
            <p className="text-[11px] text-slate-300">{c.desc}</p>
            <p className="mt-1 font-mono text-[10px] text-slate-500">{c.mechanism}</p>
            {c.files.length > 0 && <div className="mt-1">{c.files.map((f) => <FileRef key={f} path={f} />)}</div>}
          </LabCard>
        ))}
      </div>
    </LabSection>
  );
};

/* ------------------------------------------------------------------ */
/* Systems map + open issues                                            */
/* ------------------------------------------------------------------ */

export const SystemsSection: React.FC = () => {
  const { t } = useTranslation('idleVillage');
  return (
    <>
      <LabSection
        icon="🗺️"
        title={t('questGenLab.sections.systems')}
        desc={t('questGenLab.sections.systemsDesc')}
      >
        <div className="grid gap-3 md:grid-cols-2">
          {QUEST_LAB_SUBSYSTEMS.map((s) => (
            <LabCard
              key={s.id}
              title={s.label}
              aside={
                <span className="flex items-center gap-1">
                  <Chip>{s.kind}</Chip>
                  <StatusBadge status={s.status} />
                </span>
              }
            >
              <p className="text-[11px] text-slate-300">{s.impact}</p>
              {s.limitation && (
                <p className="mt-1 text-[10px] italic text-amber-300/80">⚠ {s.limitation}</p>
              )}
              <div className="mt-2">{s.files.map((f) => <FileRef key={f} path={f} />)}</div>
              {s.tests.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {s.tests.map((tst) => (
                    <span key={tst} className="font-mono text-[9px] text-emerald-300/70">✓ {tst}</span>
                  ))}
                </div>
              )}
            </LabCard>
          ))}
        </div>
      </LabSection>

      <LabSection
        icon="🕳️"
        title={t('questGenLab.sections.open')}
        desc={t('questGenLab.sections.openDesc')}
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {QUEST_LAB_OPEN.map((o) => (
            <LabCard key={o.id} title={o.label} aside={<StatusBadge status="missing" />}>
              <p className="text-[11px] text-slate-300">{o.desc}</p>
              <p className="mt-1 font-mono text-[10px] text-slate-500">{o.source}</p>
            </LabCard>
          ))}
        </div>
      </LabSection>
    </>
  );
};
