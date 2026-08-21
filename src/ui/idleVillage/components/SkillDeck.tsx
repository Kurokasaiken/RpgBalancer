import { useCallback } from 'react';
import { Slot } from '@/ui/idleVillage/components/Slot';
import {
  MatericSurface,
  MatericPlaque,
  MatericBadge,
} from '@/ui/designSystem/primitives';
import type { Skill } from '@/ui/idleVillage/types/heroComponentItems';

export interface SkillDeckProps {
  /** All available skills. */
  skills: Skill[];
  /** Currently equipped skill ids. */
  loadout: string[];
  /** Localized labels. */
  labels: {
    available: string;
    equipped: string;
    empty: string;
  };
  /** Called when a skill is clicked (equip if available, unequip if in loadout). */
  onToggle: (skillId: string) => void;
  /** Visual variant. `flat` removes the surface border. */
  variant?: 'default' | 'flat';
}

/**
 * SkillDeck — placeholder deck for equippable skills.
 *
 * Shows the available skill pool and the currently equipped slots. The parent
 * owns the loadout state (e.g. `useSkillLoadout`).
 */
export function SkillDeck({ skills, loadout, labels, onToggle, variant = 'default' }: SkillDeckProps): JSX.Element {
  const handleSkillClick = useCallback(
    (skillId: string) => () => onToggle(skillId),
    [onToggle],
  );

  const equippedSkills = skills.filter((skill) => loadout.includes(skill.id));
  const availableSkills = skills.filter((skill) => !loadout.includes(skill.id));

  const content = (
    <>
      <div style={{ marginBottom: 12 }}>
        <MatericPlaque>{labels.available}</MatericPlaque>
        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          {availableSkills.map((skill) => (
            <div
              key={skill.id}
              onClick={handleSkillClick(skill.id)}
              style={{ cursor: 'pointer' }}
              title={skill.effect}
            >
              <MatericBadge>{skill.name}</MatericBadge>
            </div>
          ))}
        </div>
      </div>

      <div>
        <MatericPlaque>{labels.equipped}</MatericPlaque>
        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          {loadout.length === 0 && (
            <MatericBadge>{labels.empty}</MatericBadge>
          )}
          {equippedSkills.map((skill) => (
            <div
              key={skill.id}
              onClick={handleSkillClick(skill.id)}
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              title={skill.effect}
            >
              <Slot slotProps={{ letter: skill.initial, state: 'occupied', sizePx: 36 }} />
              <span style={{ fontSize: 9, color: 'var(--skin-label-primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>{skill.name}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  if (variant === 'flat') {
    return (
      <div style={{ padding: 12, background: 'var(--skin-surface-bg)', borderRadius: 8 }}>
        {content}
      </div>
    );
  }

  return (
    <MatericSurface shape="card" material="jade" style={{ padding: 12 }}>
      {content}
    </MatericSurface>
  );
}
