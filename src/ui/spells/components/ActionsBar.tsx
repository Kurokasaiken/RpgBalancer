import React from 'react';
import { useTranslation } from 'react-i18next';
import { GlassCard } from '../../atoms/GlassCard';
import { GlassButton } from '../../atoms/GlassButton';

/**
 * Props for ActionsBar component
 */
interface ActionsBarProps {
  onReset: () => void;
  onSave: () => void;
  onSaveDefault: () => void;
  balance: number;
}

/**
 * ActionsBar component
 * 
 * Displays action buttons for spell creator:
 * - Reset button
 * - Save Default button
 * - Save Spell button (disabled if not balanced)
 * 
 * @param props - Component props
 * @returns React component
 */
export const ActionsBar: React.FC<ActionsBarProps> = ({ onReset, onSave, onSaveDefault, balance }) => {
  const { t } = useTranslation('spell');
  const isBalanced = Math.abs(balance) <= 1;

  return (
    <GlassCard className="flex justify-between items-center">
      <div className="flex gap-4">
        <GlassButton
          variant="ghost"
          onClick={onReset}
        >
          {t('reset', 'Reset')}
        </GlassButton>
        <GlassButton
          variant="secondary"
          onClick={onSaveDefault}
          title={t('saveDefaultTitle', 'Save current configuration as default for new spells')}
        >
          {t('saveDefault', 'Save Default')}
        </GlassButton>
      </div>

      <GlassButton
        variant={isBalanced ? 'primary' : 'danger'}
        onClick={onSave}
        disabled={!isBalanced}
        size="lg"
        style={isBalanced ? {
          backgroundColor: 'var(--skin-glow-accent)',
        } : undefined}
      >
        {isBalanced ? t('saveSpell', 'Save Spell') : `${t('balanceRequired', 'Balance Required')} (${balance.toFixed(2)})`}
      </GlassButton>
    </GlassCard>
  );
};
