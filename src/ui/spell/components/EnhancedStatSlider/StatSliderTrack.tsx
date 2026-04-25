import type { ChangeEvent, FC } from 'react';
import type { StatTick } from './types';
import styles from './styles.module.css';

interface StatSliderTrackProps {
  ticks: StatTick[];
  selectedTick: number;
  onChange: (value: number) => void;
}

export const StatSliderTrack: FC<StatSliderTrackProps> = ({ ticks, selectedTick, onChange }) => {
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
        title="Drag to select tick"
      />
    </div>
  );
};
