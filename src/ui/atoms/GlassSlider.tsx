import React, { useRef, useEffect, useState } from 'react';
import styles from './GlassSlider.module.css';

/**
 * Props for the GlassSlider component.
 */
interface GlassSliderProps {
    value: number;
    min?: number;
    max?: number;
    step?: number;
    onChange: (value: number) => void;
    showTicks?: boolean;
    className?: string;
}

export const GlassSlider: React.FC<GlassSliderProps> = ({
    value,
    min = 0,
    max = 100,
    step = 1,
    onChange,
    showTicks = false,
    className = ''
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const percentage = ((value - min) / (max - min)) * 100;

    const handleInteraction = (clientX: number) => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        const rawPercent = x / rect.width;

        let newValue = min + rawPercent * (max - min);

        // Snap to step
        if (step > 0) {
            const steps = Math.round((newValue - min) / step);
            newValue = min + steps * step;
        }

        // Clamp
        newValue = Math.max(min, Math.min(max, newValue));

        if (newValue !== value) {
            onChange(newValue);
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        handleInteraction(e.clientX);
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                handleInteraction(e.clientX);
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, min, max, step, value]);

    // Generate ticks if needed
    const ticks = [];
    if (showTicks && step > 0) {
        const count = Math.floor((max - min) / step);
        // Limit ticks to avoid rendering too many
        if (count < 20) {
            for (let i = 0; i <= count; i++) {
                ticks.push(min + i * step);
            }
        }
    }

    return (
        <div
            ref={containerRef}
            className={`${styles.sliderContainer} ${className}`}
            onMouseDown={handleMouseDown}
        >
            <div className={styles.track}>
                <div
                    className={styles.fill}
                    style={{ width: `${percentage}%` }}
                />
            </div>

            {showTicks && ticks.length > 0 && (
                <div className={styles.ticks}>
                    {ticks.map((tickVal) => (
                        <div
                            key={tickVal}
                            className={`${styles.tick} ${tickVal <= value ? styles.active : ''}`}
                        />
                    ))}
                </div>
            )}

            <div
                className={styles.thumbContainer}
                style={{ left: `${percentage}%` }}
            >
                <div className={styles.thumb} />
            </div>
        </div>
    );
};
