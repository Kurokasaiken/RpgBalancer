import type { ChangeEvent, FC } from 'react';
import { useTranslation } from 'react-i18next';
import type { StatTick } from './types';
import styles from './styles.module.css';

/**
 * Props for StatSliderTrack component
 */
interface StatSliderTrackProps {
  ticks: StatTick[];
  selectedTick: number;
  onChange: (value: number) => void;
}

/**
 * StatSliderTrack component
 * 
 * Displays the visual track for the stat slider with:
 * - Tick markers
 * - Background gradient
 * - Range input for drag selection
 * 
 * @param props - Component props
 * @returns React component
 */
export const StatSliderTrack: FC<StatSliderTrackProps> = ({ ticks, selectedTick, onChange }) => {
  const { t } = useTranslation('spell');

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(Number(event.target.value));
  };

  return (
    <div className={styles.trackWrapper}>
      {ticks.map((_, idx) => (
        <div key={`track-spacer-${idx}`} className={styles.trackSpacer}>
          {idx === selectedTick && <div className={styles.trackMarker} />}
        </div>
      ))}

      <div className={styles.trackTailSpacer} />

      <div className={styles.trackBackground} />

      <input
        type="range"
        min={0}
        max={ticks.length - 1}
        value={selectedTick}
        onChange={handleChange}
        className={styles.rangeInput}
        title={t('dragToSelect', 'Drag to select tick')}
      />
    </div>
  );
};
