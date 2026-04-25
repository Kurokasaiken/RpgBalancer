import type { CSSProperties } from 'react';

interface RiskSource {
    injuryPercentage?: number | null;
    deathPercentage?: number | null;
}

export interface TheaterRiskStripeMetrics {
    injuryPercent: number;
    deathPercent: number;
    injuryOnlyHeight: number;
    safeHeight: number;
    hasRisk: boolean;
    style: Pick<CSSProperties, 'background' | 'boxShadow'>;
    segments: {
        deathHeightPercent: number;
        injuryHeightPercent: number;
        safeHeightPercent: number;
    };
}

const SAFE_BACKGROUND = 'linear-gradient(to top, rgba(148,163,184,0.2), rgba(15,23,42,0.05))';

const clampPercent = (value: number): number => {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(100, value));
};

/**
 * Normalizes injury/death risk values into proportional stripe metrics shared across
 * TheaterOverlay and LocationDetail so percentages remain config-first.
 *
 * @param source - Risk values (usually derived from config metadata).
 * @returns normalized stripe metadata and CSS style tokens.
 */
export function deriveTheaterRiskStripes(source: RiskSource): TheaterRiskStripeMetrics {
    const injuryPercent = clampPercent(source.injuryPercentage ?? 0);
    const resolvedDeathPercent = clampPercent(source.deathPercentage ?? 0);
    const deathPercent = Math.min(injuryPercent, resolvedDeathPercent);
    const injuryOnlyHeight = Math.max(0, injuryPercent - deathPercent);
    const safeHeight = 100 - injuryPercent;
    const hasRisk = injuryPercent > 0 || deathPercent > 0;

    const background = hasRisk
        ? `linear-gradient(
            to top,
            rgba(239,68,68,0.95) 0% ${deathPercent}%,
            rgba(252,211,77,0.95) ${deathPercent}% ${deathPercent + injuryOnlyHeight}%,
            rgba(148,163,184,0.18) ${deathPercent + injuryOnlyHeight}% 100%
        )`
        : SAFE_BACKGROUND;

    const boxShadow = hasRisk ? '0 0 12px rgba(251,191,36,0.35)' : '0 0 0 rgba(0,0,0,0)';

    return {
        injuryPercent,
        deathPercent,
        injuryOnlyHeight,
        safeHeight,
        hasRisk,
        style: {
            background,
            boxShadow,
        },
        segments: {
            deathHeightPercent: deathPercent,
            injuryHeightPercent: injuryOnlyHeight,
            safeHeightPercent: Math.max(0, safeHeight),
        },
    };
}
