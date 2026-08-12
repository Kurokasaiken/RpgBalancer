import { useMemo, useState } from 'react';
import { useTranslation } from '@/localization/useTranslation';
import { defaultQuestBlueprints } from '@/balancing/config/idleVillage/quests/questBlueprints';
import type { QuestPhase } from '@/balancing/config/idleVillage/quests/questBlueprints.schema';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '@/balancing/config/idleVillage/defaultConfig';
import { QuestChronicleStandalone } from '@/ui/idleVillage/frozen/kits/questPoiKit';
import { MagicCircleHaloStandalone } from '@/ui/idleVillage/frozen/kits/questPoiKit';
import { MilestoneCheckModalStandalone } from '@/ui/idleVillage/frozen/kits/questPoiKit';
import type { QuestChroniclePhase, PhaseVisualState } from '@/ui/idleVillage/frozen/kits/questPoiKit';
import { QuestCardStandalone } from '@/ui/idleVillage/frozen/kits/questCardKit';
import { QuestPOIStandalone } from '@/ui/idleVillage/frozen/kits/poiKit';
import { QuestDetail } from '@/ui/idleVillage/frozen/kits/questDetailKit';
import type { QuestItemMock } from '@/balancing/config/idleVillage/quests/questItemsMock';
import { MOCK_QUEST_ITEMS } from '@/balancing/config/idleVillage/quests/questItemsMock';
import type { AstrolabeSkill } from '@/ui/idleVillage/frozen/kits/destinyAstrolabeKit';

const BLUEPRINT = defaultQuestBlueprints.quest_city_rats;
const ACTIVITY = DEFAULT_IDLE_VILLAGE_CONFIG.activities.quest_city_rats;

const DEMO_QUEST = {
  id: 'quest_city_rats',
  label: ACTIVITY?.label ?? BLUEPRINT.name,
  icon: BLUEPRINT.icon,
  category: 'quest',
  minLevel: ACTIVITY?.level ?? 1,
  maxParticipants: 3,
  durationHours: 6,
  description: ACTIVITY?.description ?? BLUEPRINT.narrative,
  narrative: BLUEPRINT.narrative,
  skillChecks: [
    {
      label: 'Lantern Scout',
      stat: 'lantern',
      minValue: 1,
      icon: '🕯️',
    },
  ],
  rewards: [
    { resource: 'materials', amount: 2, icon: '📦' },
    { resource: 'renown', amount: 1, icon: '⭐' },
  ],
  risks: { injury: 0.15, death: 0.02 },
  difficulty: 'Medio',
  difficultyColor: '#f97316',
};

const PHASE_STATES: PhaseVisualState[] = ['success', 'active', 'locked'];

function CandidateSection({ title, children }: { title: string; children: React.ReactNode }): JSX.Element {
  return (
    <section className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-amber-200">{title}</h2>
      {children}
    </section>
  );
}

export default function QuestDetailCandidatesPage(): JSX.Element {
  const { t } = useTranslation('idleVillage');
  const [haloProgress, setHaloProgress] = useState(0.55);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showMilestone, setShowMilestone] = useState(false);

  const phases: QuestChroniclePhase[] = useMemo(
    () =>
      (BLUEPRINT?.phases ?? []).map((phase: QuestPhase, index: number) => ({
        phase,
        state: PHASE_STATES[index] ?? 'locked',
        result:
          index === 0
            ? {
                phaseId: phase.id,
                result: 'success' as const,
                timestamp: 0,
                notes: '',
              }
            : undefined,
      })),
    [],
  );

  const phase: QuestPhase | undefined = BLUEPRINT?.phases[1];
  const skills: AstrolabeSkill[] = useMemo(
    () => [
      {
        name: phase?.title ?? 'Skill Check',
        stat: 8,
        difficulty: phase?.requirements?.difficultyLabel ?? 10,
      },
    ],
    [phase],
  );

  const questPoiPhases = useMemo(
    () =>
      (BLUEPRINT?.phases ?? []).map((phase: QuestPhase, index: number) => ({
        id: phase.id,
        state: PHASE_STATES[index] ?? 'locked',
      })),
    [],
  );

  return (
    <div className="min-h-screen bg-slate-950 p-4 text-ivory sm:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <p className="text-[10px] uppercase tracking-[0.45em] text-amber-200/70">Test Hub</p>
          <h1 className="text-2xl font-semibold tracking-[0.2em] text-amber-100">
            {t('idleVillage:questDetailCandidates.title', {
              defaultValue: 'QUEST DETAIL CANDIDATES',
            })}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {t('idleVillage:questDetailCandidates.subtitle', {
              defaultValue:
                'All available Quest/QuestDetail/QuestChronicle components for opening a quest POI.',
            })}
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <CandidateSection title="QuestChronicle — phased outcome card">
            <QuestChronicleStandalone
              title={BLUEPRINT.name}
              questId={BLUEPRINT.id}
              questTags={BLUEPRINT.tags}
              phases={phases}
              currentPhaseIndex={1}
              activePhaseProgress={0.6}
              questProgress={0.55}
            />
          </CandidateSection>

          <CandidateSection title="QuestDetail — pre-departure offer card">
            <QuestDetail quest={DEMO_QUEST} onAccept={() => undefined} onClose={() => undefined} />
          </CandidateSection>

          <CandidateSection title="QuestCard — map capsule">
            <QuestCardStandalone
              label={DEMO_QUEST.label}
              icon={DEMO_QUEST.icon}
              subtitle={DEMO_QUEST.category}
              helperText={DEMO_QUEST.description}
              progressFraction={0.45}
              elapsedSeconds={90}
              totalDurationSeconds={200}
              isPlaying
              variant="amethyst"
              injuryPercentage={15}
              deathPercentage={2}
              onToggle={() => undefined}
            />
          </CandidateSection>

          <CandidateSection title="QuestPOI + MagicCircleHalo — medallion and timer">
            <div className="flex flex-col items-center gap-6 py-4">
              <QuestPOIStandalone
                questId={BLUEPRINT.id}
                label={BLUEPRINT.name}
                icon={BLUEPRINT.icon}
                status="in_progress"
                phases={questPoiPhases}
                currentPhaseIndex={1}
                progress={haloProgress}
                showRiskBadges
                injuryRisk={15}
                deathRisk={2}
                medallionOverlay={
                  <MagicCircleHaloStandalone progress={haloProgress} isComplete={haloProgress >= 1} size={200} />
                }
                onClick={() => undefined}
              />
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={haloProgress}
                onChange={(e) => setHaloProgress(Number.parseFloat(e.target.value))}
                className="w-48"
                aria-label={t('idleVillage:questDetailCandidates.haloProgress', {
                  defaultValue: 'Magic circle progress',
                })}
              />
            </div>
          </CandidateSection>

          <CandidateSection title="MilestoneCheckModal — phase skill check (mock preview)">
            {!showMilestone ? (
              <div className="space-y-3 text-sm">
                <p className="text-slate-300">
                  <span className="text-amber-200/80">Fase:</span> {phase?.title ?? '—'}
                </p>
                <p className="text-slate-300">
                  <span className="text-amber-200/80">Skill:</span> {skills[0]?.name ?? '—'} (stat {skills[0]?.stat}, diff {skills[0]?.difficulty})
                </p>
                <p className="text-slate-300">
                  <span className="text-amber-200/80">Rischi:</span> ferita {phase?.riskProfile?.injuryChance ?? 0}% · morte {phase?.riskProfile?.deathChance ?? 0}%
                </p>
                <button
                  type="button"
                  onClick={() => setShowMilestone(true)}
                  className="rounded border border-amber-500/50 bg-amber-500/10 px-3 py-1.5 text-xs uppercase tracking-widest text-amber-200 hover:bg-amber-500/20"
                >
                  Apri skill check
                </button>
              </div>
            ) : (
              <MilestoneCheckModalStandalone
                phaseTitle={phase?.title ?? 'Fase'}
                phaseIcon={phase?.icon}
                phaseSummary={phase?.copy?.summary}
                milestoneLabel="2 / 3"
                skills={skills}
                injuryChance={phase?.riskProfile?.injuryChance ?? 5}
                deathChance={phase?.riskProfile?.deathChance ?? 0}
                consumables={MOCK_QUEST_ITEMS as QuestItemMock[]}
                spentConsumableIds={selectedItems}
                onToggleConsumable={(itemId) =>
                  setSelectedItems((prev) =>
                    prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId],
                  )
                }
                onResolved={() => setShowMilestone(false)}
                onDismiss={() => setShowMilestone(false)}
              />
            )}
          </CandidateSection>

          <CandidateSection title="MagicCircleHalo — isolated timer">
            <div className="flex items-center justify-center py-6">
              <MagicCircleHaloStandalone progress={haloProgress} isComplete={haloProgress >= 1} size={180} />
            </div>
          </CandidateSection>
        </div>
      </div>
    </div>
  );
}
