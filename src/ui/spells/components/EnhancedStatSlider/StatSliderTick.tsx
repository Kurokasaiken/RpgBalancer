import type { FC, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './styles.module.css';

type StatSliderTickVariant = 'value' | 'weight';

/**
 * Props for StatSliderTick component
 */
interface StatSliderTickProps {
  variant: StatSliderTickVariant;
  value: number;
  placeholder: string;
  isSelected: boolean;
  onChange: (value: number) => void;
  step?: number;
  leadingAction?: ReactNode;
  trailingAction?: ReactNode;
}

/**
 * CSS classes for different tick variants
 */
const variantClasses: Record<
  StatSliderTickVariant,
  { input: string; selected: string }
> = {
  value: {
    input: styles.valueInput,
    selected: styles.valueSelected
  },
  weight: {
    input: styles.weightInput,
    selected: styles.weightSelected
  }
};

/**
 * StatSliderTick component
 * 
 * Displays a single tick input for value or weight.
 * Can have leading/trailing action buttons (add/remove).
 * 
 * @param props - Component props
 * @returns React component
 */
export const StatSliderTick: FC<StatSliderTickProps> = ({
  variant,
  value,
  placeholder,
  isSelected,
  onChange,
  step = 1,
  leadingAction,
  trailingAction
}) => {
  const { t } = useTranslation('spell');
  const { input, selected } = variantClasses[variant];

  return (
    <div className={styles.tick}>
      {leadingAction && <div className={styles.leadingAction}>{leadingAction}</div>}

      <input
        type="number"
        value={value}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
        className={`${styles.tickInput} ${input} ${isSelected ? selected : ''}`}
        placeholder={placeholder}
        title={t('tickValue', 'Tick value')}
      />

      {trailingAction && <div className={styles.trailingAction}>{trailingAction}</div>}
    </div>
  );
};
