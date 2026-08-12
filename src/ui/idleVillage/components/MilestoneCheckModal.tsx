/**
 * MilestoneCheckModal — the skill check a quest milestone opens.
 *
 * Two beats, per desiderata v3: the player first gets a chance to spend
 * consumables against the phase's risk, then the Destiny Astrolabe animation
 * plays and its verdict is read back.
 *
 * It renders content only — no overlay, no backdrop, no dialog chrome. The
 * caller hosts it in a `FloatingPanel`, so the check can be moved, minimised
 * and left open while the player keeps using the rest of the surface
 * (desiderata v4).
 *
 * Presentation only: difficulty, stats and risk all arrive as props, resolved
 * from config by the caller.
 */

import { useCallback, useMemo, useState } from 'react';
import type { JSX } from 'react';
import { useTranslation } from '@/localization/useTranslation';
import { SkinButton } from '@/ui/idleVillage/skins/primitives';
import { DestinyAstrolabeStandalone } from '@/ui/idleVillage/frozen/kits/destinyAstrolabeKit';
import type {
  AstrolabeResult,
  AstrolabeSkill,
} from '@/ui/idleVillage/frozen/kits/destinyAstrolabeKit';
import type { QuestItemMock } from '@/balancing/config/idleVillage/quests/questItemsMock';
import {
  applyConsumableRiskEffects,
  isPassingVerdict,
} from '@/engine/game/idleVillage/questMilestones';

export interface MilestoneCheckModalProps {
  /** Title of the phase being resolved. */
  phaseTitle: string;
  /** Emoji or short glyph for the phase. */
  phaseIcon?: string;
  /** One-line summary shown above the roll. */
  phaseSummary?: string;
  /** Position of this milestone, e.g. "2 / 3". */
  milestoneLabel: string;
  /** Skills the astrolabe will test, already resolved from config. */
  skills: AstrolabeSkill[];
  /** Authored injury chance of the phase, in percentage points. */
  injuryChance: number;
  /** Authored death chance of the phase, in percentage points. */
  deathChance: number;
  /** Critical failure chance passed through to the astrolabe. */
  criticalFailChance?: number;
  /** Consumables available to spend on this check. */
  consumables: readonly QuestItemMock[];
  /** Ids of consumables the player has selected. */
  spentConsumableIds: readonly string[];
  /** Toggles a consumable; the caller owns the selection state. */
  onToggleConsumable: (itemId: string) => void;
  /** Called once the astrolabe has resolved. */
  onResolved: (result: AstrolabeResult) => void;
  /** Called when the player dismisses the resolved check. */
  onDismiss: () => void;
}

type ModalStep = 'prepare' | 'roll';

/**
 * MilestoneCheckModal — see module docblock.
 * @param props - Component props
 * @returns The skill check content, to be hosted in a FloatingPanel
 */
export function MilestoneCheckModal({
  phaseTitle,
  phaseIcon,
  phaseSummary,
  milestoneLabel,
  skills,
  injuryChance,
  deathChance,
  criticalFailChance = 5,
  consumables,
  spentConsumableIds,
  onToggleConsumable,
  onResolved,
  onDismiss,
}: MilestoneCheckModalProps): JSX.Element {
  const { t } = useTranslation('idleVillage');
  const [step, setStep] = useState<ModalStep>('prepare');
  const [result, setResult] = useState<AstrolabeResult | null>(null);

  const spentItems = useMemo(
    () => consumables.filter((item) => spentConsumableIds.includes(item.id)),
    [consumables, spentConsumableIds],
  );

  const effectiveRisk = useMemo(
    () => applyConsumableRiskEffects({ injuryChance, deathChance }, spentItems),
    [injuryChance, deathChance, spentItems],
  );

  const handleResolve = useCallback(
    (astrolabeResult: AstrolabeResult) => {
      setResult(astrolabeResult);
      onResolved(astrolabeResult);
    },
    [onResolved],
  );

  return (
    <div data-testid="milestone-check-modal" className="w-full">
      <div>
        {step === 'prepare' ? (
          <div className="space-y-5 p-5">
            <header className="space-y-1 text-center">
              <p className="text-[10px] uppercase tracking-[0.4em] text-amber-200/60">
                {t('idleVillage:milestoneCheck.eyebrow', { defaultValue: 'Milestone' })}
                {' · '}
                {milestoneLabel}
              </p>
              <p className="text-lg tracking-[0.14em] text-amber-100">
                {phaseIcon ? `${phaseIcon} ` : ''}
                {phaseTitle}
              </p>
              {phaseSummary && (
                <p className="mx-auto max-w-xl text-sm italic text-slate-400">{phaseSummary}</p>
              )}
            </header>

            <section className="space-y-2">
              <h3 className="text-[10px] uppercase tracking-[0.3em] text-amber-200/60">
                {t('idleVillage:milestoneCheck.skills', { defaultValue: 'Checks to face' })}
              </h3>
              <ul className="space-y-1.5">
                {skills.map((skill) => (
                  <li
                    key={skill.name}
                    className="flex items-center gap-3 rounded border border-slate-700/60 bg-slate-900/50 px-3 py-2 text-xs"
                  >
                    <span className="uppercase tracking-wider text-slate-300">{skill.name}</span>
                    <span className="ml-auto text-slate-400">
                      {t('idleVillage:milestoneCheck.partyStat', {
                        value: skill.stat,
                        defaultValue: 'Party {value}',
                      })}
                    </span>
                    <span className="text-amber-200">
                      {t('idleVillage:milestoneCheck.difficulty', {
                        value: skill.difficulty,
                        defaultValue: 'Difficulty {value}',
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="text-[10px] uppercase tracking-[0.3em] text-amber-200/60">
                {t('idleVillage:milestoneCheck.consumables', {
                  defaultValue: 'Spend consumables',
                })}
              </h3>
              <div className="flex flex-wrap gap-2">
                {consumables.map((item) => {
                  const isSpent = spentConsumableIds.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-testid={`milestone-consumable-${item.id}`}
                      aria-pressed={isSpent}
                      onClick={() => onToggleConsumable(item.id)}
                      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                        isSpent
                          ? 'border-amber-400 bg-amber-400/10 text-amber-200'
                          : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      <span aria-hidden>{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-slate-400">
                {t('idleVillage:milestoneCheck.riskLine', {
                  injury: effectiveRisk.injuryChance,
                  death: effectiveRisk.deathChance,
                  defaultValue: 'Injury {injury}% · Death {death}%',
                })}
              </p>
            </section>

            <footer className="flex justify-center pt-1">
              <SkinButton
                variant="cta"
                data-testid="milestone-roll-button"
                onClick={() => setStep('roll')}
              >
                {t('idleVillage:milestoneCheck.roll', { defaultValue: 'Consult destiny' })}
              </SkinButton>
            </footer>
          </div>
        ) : (
          <div className="space-y-4">
            <DestinyAstrolabeStandalone
              skills={skills}
              config={{
                crit: criticalFailChance,
                wound: effectiveRisk.injuryChance,
                dead: effectiveRisk.deathChance,
              }}
              onResolve={handleResolve}
              autoStart
            />

            {result && (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-amber-700/40 bg-slate-950/95 p-5">
                <p
                  data-testid="milestone-result-label"
                  className={`text-sm uppercase tracking-[0.3em] ${
                    isPassingVerdict(result.verdict) ? 'text-emerald-300' : 'text-rose-300'
                  }`}
                >
                  {isPassingVerdict(result.verdict)
                    ? t('idleVillage:milestoneCheck.passed', { defaultValue: 'Phase passed' })
                    : t('idleVillage:milestoneCheck.failed', { defaultValue: 'Phase failed' })}
                </p>
                {(result.wounded || result.dead) && (
                  <p className="text-xs text-amber-200">
                    {result.dead
                      ? t('idleVillage:milestoneCheck.casualty', {
                          defaultValue: 'A hero fell during this phase',
                        })
                      : t('idleVillage:milestoneCheck.wounded', {
                          defaultValue: 'A hero was wounded during this phase',
                        })}
                  </p>
                )}
                <SkinButton
                  variant="utility"
                  data-testid="milestone-dismiss-button"
                  onClick={onDismiss}
                >
                  {t('idleVillage:milestoneCheck.dismiss', { defaultValue: 'Continue' })}
                </SkinButton>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MilestoneCheckModal;
