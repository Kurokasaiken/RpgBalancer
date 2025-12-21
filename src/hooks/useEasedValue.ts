import { useEffect, useRef, useState } from 'react';

type EasingFn = (t: number) => number;

const easeOutCubic: EasingFn = t => 1 - (1 - t) * (1 - t) * (1 - t);

interface UseEasedValueOptions {
    durationMs?: number;
    easingFn?: EasingFn;
}

/**
 * Smoothly interpolates a numeric value whenever the target changes.
 * Uses rAF for consistent motion and cancels outstanding frames on unmount.
 */
export function useEasedValue(target: number, options: UseEasedValueOptions = {}): number {
    const { durationMs = 420, easingFn = easeOutCubic } = options;
    const [value, setValue] = useState(target);

    const frameRef = useRef<number | null>(null);
    const startValueRef = useRef(target);
    const targetRef = useRef(target);
    const startTimeRef = useRef<number | null>(null);

    useEffect(() => {
        if (target === targetRef.current) {
            return;
        }

        startValueRef.current = value;
        targetRef.current = target;
        startTimeRef.current = null;

        const tick = (timestamp: number) => {
            if (startTimeRef.current === null) {
                startTimeRef.current = timestamp;
            }

            const elapsed = timestamp - startTimeRef.current;
            const progress = Math.min(1, durationMs > 0 ? elapsed / durationMs : 1);
            const eased = easingFn(progress);
            const nextValue = startValueRef.current + (targetRef.current - startValueRef.current) * eased;
            setValue(progress >= 1 ? targetRef.current : nextValue);

            if (progress < 1) {
                frameRef.current = requestAnimationFrame(tick);
            }
        };

        if (frameRef.current) {
            cancelAnimationFrame(frameRef.current);
        }
        frameRef.current = requestAnimationFrame(tick);

        return () => {
            if (frameRef.current) {
                cancelAnimationFrame(frameRef.current);
                frameRef.current = null;
            }
        };
    }, [target, durationMs, easingFn, value]);

    return value;
}
