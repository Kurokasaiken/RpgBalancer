/**
 * QuestEpilogue — the expedition's return report inside `QuestRunWindow`
 * (PLAN-019-S4 T-2).
 *
 * Renders `buildQuestEpilogue` — the settlement's own numbers — as a list
 * of labelled sections (the cost first, then what came home). Sections
 * appear only when they carry lines; authored seam categories (titles,
 * diseases, lore) show only what the scenario grants. All copy via i18n,
 * all styling on `--skin-*`/TONE tokens; no new persistence channel.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  Cross,
  Gem,
  Info,
  PackageOpen,
  ScrollText,
  Skull,
  Sparkles,
  Thermometer,
  Trophy,
  type LucideIcon,
} from 'lucide-react';
import type { QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';
import type { QuestScenario } from '@/balancing/config/idleVillage/quests/questScenario.schema';
import type { EpilogueSectionId } from '@/balancing/config/idleVillage/quests/questEpilogue';
import { buildQuestEpilogue, type EpilogueLine } from '@/ui/idleVillage/quests/questEpilogue';
import { useMinimalGameplayStore } from '@/store/useMinimalGameplay';
import { TONE } from '@/ui/idleVillage/questS1Lab/hud/atoms';

const FONT = {
  display: 'var(--skin-font-display)',
  serif: 'var(--skin-font-serif)',
} as const;

/** One glyph per report section — the line reads at a glance. */
const SECTION_ICON: Record<EpilogueSectionId, LucideIcon> = {
  dead: Skull,
  wounded: Cross,
  consumed: PackageOpen,
  reward: Trophy,
  loot: Gem,
  xp: Sparkles,
  info: Info,
  titles: BookOpen,
  diseases: Thermometer,
  lore: ScrollText,
};

/** Section tone: the price reads differently from the yield. */
const SECTION_TONE: Partial<Record<EpilogueSectionId, keyof typeof TONE>> = {
  dead: 'death',
  wounded: 'warn',
  diseases: 'warn',
};

export interface QuestEpilogueProps {
  run: QuestRunState;
  /** The authored scenario — feeds intel labels and the epilogue seam
   *  (titles/diseases/lore). Optional: lab paths may omit it. */
  scenario?: QuestScenario;
}

/** One report line — i18n key wins over baked text; wounded lines carry
 *  the resident's recovery countdown when the roster knows it. */
const EpilogueRow: React.FC<{ line: EpilogueLine }> = ({ line }) => {
  const { t } = useTranslation('idleVillage');
  const recoveryDays = useMinimalGameplayStore((s) => {
    if (!line.memberId) return undefined;
    const resident = s.state.residents.find((r) => r.id === line.memberId);
    if (!resident?.injuredUntilTick) return undefined;
    const ticksPerDay = Math.max(1, s.config.globalRules.dayLengthInTimeUnits ?? 60);
    const left = resident.injuredUntilTick - s.state.currentTick;
    return left > 0 ? Math.ceil(left / ticksPerDay) : undefined;
  });
  return (
    <span style={{ fontFamily: FONT.serif, fontSize: 13, lineHeight: 1.4, color: 'var(--skin-text-primary)' }}>
      {line.key ? t(line.key, line.params) : line.text}
      {recoveryDays !== undefined && (
        <span style={{ color: TONE.secondary }}>
          {' — '}
          {t('gameFrame.questEpilogue.recovery', { days: recoveryDays })}
        </span>
      )}
    </span>
  );
};

export const QuestEpilogue: React.FC<QuestEpilogueProps> = ({ run, scenario }) => {
  const { t } = useTranslation('idleVillage');
  const sections = buildQuestEpilogue(run, scenario);
  if (sections.length === 0) return null;
  return (
    <div
      data-testid="quest-epilogue"
      role="region"
      aria-label={t('gameFrame.questEpilogue.title')}
      style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '4px 0' }}
    >
      <div
        style={{
          fontFamily: FONT.display,
          fontSize: 12,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: TONE.label,
        }}
      >
        {t('gameFrame.questEpilogue.title')}
      </div>
      {sections.map((section) => {
        const Icon = SECTION_ICON[section.id];
        const tone = TONE[SECTION_TONE[section.id] ?? 'label'];
        return (
          <div key={section.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <Icon aria-hidden style={{ width: 14, height: 14, marginTop: 2, flexShrink: 0, color: tone }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
              <span
                style={{
                  fontFamily: FONT.display,
                  fontSize: 12,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: tone,
                }}
              >
                {t(`gameFrame.questEpilogue.${section.id}`)}
              </span>
              {section.lines.map((line, i) => (
                <EpilogueRow key={i} line={line} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
