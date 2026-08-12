/**
 * QuestRewardPanel — the reward/victory surface of a finished quest.
 *
 * Written from scratch on the design-system vocabulary (desiderata v4): every
 * colour, font and radius comes from a `--skin-*` token via a role
 * (`data-skin="panel" | "section" | "badge"`, `<SkinTitle>`, `<SkinButton>`),
 * exactly as `/design-system` prescribes. Nothing here hardcodes a palette, so
 * changing the active skin preset restyles the whole screen.
 *
 * It replaces the splash that used to sit on top of the chronicle: this is a
 * surface of its own that reports the outcome, the trials the party faced, the
 * rewards earned and the party's fate — and is the only place rewards are
 * collected from.
 */

import type { JSX } from 'react';
import { useTranslation } from '@/localization/useTranslation';
import { SkinScope, SkinTitle, SkinButton } from '@/ui/idleVillage/skins/primitives';

/** One line of the trials recap. */
export interface QuestRewardPhaseLine {
  id: string;
  title: string;
  icon?: string;
  passed: boolean;
  /** Astrolabe verdict, shown as the flavour of the result. */
  verdictLabel?: string;
  wounded?: boolean;
  dead?: boolean;
}

/** One earned resource or item. */
export interface QuestRewardLine {
  id: string;
  label: string;
  amount: string;
  icon?: string;
}

/** Fate of one party member. */
export interface QuestRewardPartyLine {
  residentId: string;
  name: string;
  state: 'none' | 'injured' | 'dead';
}

export interface QuestRewardPanelProps {
  /** Quest name. */
  questTitle: string;
  /** Whether the expedition is judged a win. */
  isVictory: boolean;
  /** Headline outcome label, e.g. "Successo Parziale". */
  outcomeLabel: string;
  /** How many trials were passed out of how many. */
  phasesPassed: number;
  phasesTotal: number;
  /** Recap of every trial, in order. */
  phases: readonly QuestRewardPhaseLine[];
  /** Rewards earned, already multiplied by the outcome. */
  rewards: readonly QuestRewardLine[];
  /** Multiplier applied to the rewards, e.g. 1.25. */
  rewardMultiplier?: number;
  /** Fate of each party member. */
  party: readonly QuestRewardPartyLine[];
  /** Collects the rewards and dismisses the quest. */
  onCollect: () => void;
}

const PARTY_STATE_GLYPH: Record<QuestRewardPartyLine['state'], string> = {
  none: '✓',
  injured: '🩹',
  dead: '☠',
};

/**
 * QuestRewardPanel — see module docblock.
 * @param props - Component props
 * @returns The reward surface
 */
export function QuestRewardPanel({
  questTitle,
  isVictory,
  outcomeLabel,
  phasesPassed,
  phasesTotal,
  phases,
  rewards,
  rewardMultiplier,
  party,
  onCollect,
}: QuestRewardPanelProps): JSX.Element {
  const { t } = useTranslation('idleVillage');

  return (
    <SkinScope data-testid="quest-reward-panel">
      <div data-skin="panel" className="p-6">
        {/* Verdict */}
        <header className="text-center">
          <p data-skin="subtitle">
            {isVictory
              ? t('idleVillage:questReward.eyebrowVictory', { defaultValue: 'Expedition returned' })
              : t('idleVillage:questReward.eyebrowDefeat', { defaultValue: 'Expedition broken' })}
          </p>
          <SkinTitle>{outcomeLabel}</SkinTitle>
          <div data-skin="titlesep" />
          <p data-skin="subtitle" data-testid="quest-reward-summary">
            {questTitle}
            {' · '}
            {t('idleVillage:questReward.trialsPassed', {
              passed: phasesPassed,
              total: phasesTotal,
              defaultValue: '{passed} of {total} trials passed',
            })}
          </p>
        </header>

        {/* Trials */}
        <section data-skin="section" className="mt-6">
          <h2 data-skin="section">
            {t('idleVillage:questReward.trials', { defaultValue: 'Trials' })}
          </h2>
          <ul className="mt-2 space-y-1.5" data-testid="quest-reward-phases">
            {phases.map((phase) => (
              <li
                key={phase.id}
                data-skin="panel"
                data-passed={phase.passed ? 'true' : 'false'}
                className="flex items-center gap-3 px-3 py-2"
                style={{ opacity: phase.passed ? 1 : 0.72 }}
              >
                {phase.icon && <span aria-hidden>{phase.icon}</span>}
                <span className="truncate">{phase.title}</span>
                <span className="ml-auto flex items-center gap-2">
                  {(phase.wounded || phase.dead) && (
                    <span data-skin="badge" aria-hidden>
                      {phase.dead ? PARTY_STATE_GLYPH.dead : PARTY_STATE_GLYPH.injured}
                    </span>
                  )}
                  {phase.verdictLabel && <span data-skin="badge">{phase.verdictLabel}</span>}
                  <span
                    style={{
                      color: phase.passed
                        ? 'var(--skin-status-met)'
                        : 'var(--skin-status-unmet)',
                    }}
                  >
                    {phase.passed
                      ? t('idleVillage:questReward.passed', { defaultValue: 'Passed' })
                      : t('idleVillage:questReward.failed', { defaultValue: 'Failed' })}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Rewards */}
        <section data-skin="section" className="mt-5">
          <h2 data-skin="section">
            {t('idleVillage:questReward.rewards', { defaultValue: 'Rewards' })}
            {rewardMultiplier !== undefined && (
              <span data-skin="badge" className="ml-2">
                ×{rewardMultiplier.toFixed(2)}
              </span>
            )}
          </h2>
          {rewards.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-2" data-testid="quest-reward-rewards">
              {rewards.map((reward) => (
                <li key={reward.id} data-skin="badge" className="flex items-center gap-2">
                  {reward.icon && <span aria-hidden>{reward.icon}</span>}
                  <span>{reward.label}</span>
                  <strong>{reward.amount}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p data-skin="subtitle" className="mt-2">
              {t('idleVillage:questReward.noRewards', {
                defaultValue: 'The expedition brought nothing home',
              })}
            </p>
          )}
        </section>

        {/* Party */}
        {party.length > 0 && (
          <section data-skin="section" className="mt-5">
            <h2 data-skin="section">
              {t('idleVillage:questReward.party', { defaultValue: 'Party' })}
            </h2>
            <ul className="mt-2 space-y-1.5" data-testid="quest-reward-party">
              {party.map((member) => (
                <li
                  key={member.residentId}
                  data-skin="panel"
                  className="flex items-center gap-3 px-3 py-2"
                >
                  <span aria-hidden>{PARTY_STATE_GLYPH[member.state]}</span>
                  <span className="truncate">{member.name}</span>
                  <span
                    className="ml-auto"
                    style={{
                      color:
                        member.state === 'none'
                          ? 'var(--skin-status-met)'
                          : 'var(--skin-status-unmet)',
                    }}
                  >
                    {member.state === 'dead'
                      ? t('idleVillage:questReward.stateDead', { defaultValue: 'Fallen' })
                      : member.state === 'injured'
                        ? t('idleVillage:questReward.stateInjured', { defaultValue: 'Wounded' })
                        : t('idleVillage:questReward.stateNone', { defaultValue: 'Unharmed' })}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Collect gate: nothing is applied until the player asks for it. */}
        <footer className="mt-6 flex justify-center">
          <SkinButton variant="cta" data-testid="quest-reward-collect" onClick={onCollect}>
            {t('idleVillage:questReward.collect', { defaultValue: 'Collect rewards' })}
          </SkinButton>
        </footer>
      </div>
    </SkinScope>
  );
}

export default QuestRewardPanel;
