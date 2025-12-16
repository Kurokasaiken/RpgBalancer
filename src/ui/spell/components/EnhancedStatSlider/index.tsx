import type { FC } from 'react';
import { GlassCard } from '../../../atoms/GlassCard';
import { StatSliderHeader } from './StatSliderHeader';
import { StatSliderTick } from './StatSliderTick';
import { StatSliderTrack } from './StatSliderTrack';
import { useStatSlider } from './useStatSlider';
import type { EnhancedStatSliderProps } from './types';
import styles from './styles.module.css';

export const EnhancedStatSlider: FC<EnhancedStatSliderProps> = ({
  field,
  ticks,
  selectedTick,
  onSelectTick,
  description,
  isMalus,
  collapsed,
  onToggleCollapse,
  onStepChange,
  onAddStep,
  onRemoveStep,
  draggable = false,
  onDragStart,
  onDragOver,
  onDrop,
  label
}) => {
  const { handleRangeChange, canRemoveTick } = useStatSlider({
    ticks,
    onSelectTick
  });

  return (
    <div className={styles.sliderWrapper}>
      <GlassCard padding="none" className={styles.sliderCard}>
        <StatSliderHeader
          field={field}
          label={label}
          isMalus={isMalus}
          collapsed={collapsed}
          onToggleCollapse={onToggleCollapse}
          draggable={draggable}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDrop={onDrop}
        />

        {!collapsed && (
          <div className={styles.sliderContent}>
            <div className={styles.scrollArea}>
              <div className={`${styles.ticksRow} ${styles.tickRowValues}`}>
                {ticks.map((step, idx) => (
                  <StatSliderTick
                    key={`val-${field}-${idx}`}
                    variant="value"
                    value={step.value}
                    placeholder="Val"
                    isSelected={selectedTick === idx}
                    onChange={(value) => onStepChange(idx, { ...step, value })}
                    leadingAction={
                      <button
                        type="button"
                        onClick={() => onAddStep(idx - 1)}
                        className={styles.tickAddButton}
                        title="Add tick before"
                      >
                        +
                      </button>
                    }
                  />
                ))}

                <button
                  type="button"
                  onClick={() => onAddStep(ticks.length - 1)}
                  className={styles.addButtonEnd}
                  title="Add tick at end"
                >
                  +
                </button>
              </div>

              <StatSliderTrack
                ticks={ticks}
                selectedTick={selectedTick}
                onChange={handleRangeChange}
              />

              <div className={`${styles.ticksRow} ${styles.tickRowWeights}`}>
                {ticks.map((step, idx) => (
                  <StatSliderTick
                    key={`wgt-${field}-${idx}`}
                    variant="weight"
                    value={step.weight}
                    step={0.1}
                    placeholder="Wgt"
                    isSelected={selectedTick === idx}
                    onChange={(value) => onStepChange(idx, { ...step, weight: value })}
                    trailingAction={
                      canRemoveTick && (
                        <button
                          type="button"
                          onClick={() => onRemoveStep(idx)}
                          className={styles.tickRemoveButton}
                          title="Remove tick"
                        >
                          ×
                        </button>
                      )
                    }
                  />
                ))}
                <div className={styles.trackTailSpacer} />
              </div>
            </div>

            <div className={styles.description}>{description}</div>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
