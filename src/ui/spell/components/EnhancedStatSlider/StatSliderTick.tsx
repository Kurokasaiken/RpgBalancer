import type { FC, ReactNode } from 'react';
import styles from './styles.module.css';

type StatSliderTickVariant = 'value' | 'weight';

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
      />

      {trailingAction && <div className={styles.trailingAction}>{trailingAction}</div>}
    </div>
  );
};
