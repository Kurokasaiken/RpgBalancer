import clsx from 'clsx';
import type { PropsWithChildren, ReactElement } from 'react';

const toneClasses = {
    info: 'border-cyan-400/30 text-cyan-100 bg-cyan-400/10',
    warning: 'border-amber-400/30 text-amber-100 bg-amber-400/10',
    danger: 'border-red-400/40 text-red-100 bg-red-400/10',
    success: 'border-emerald-400/30 text-emerald-100 bg-emerald-400/10'
} as const;

export interface GlassBadgeProps {
    tone?: keyof typeof toneClasses;
    className?: string;
}

/**
 * Glassy badge used to highlight compact stats or status indicators.
 */
export function GlassBadge({ tone = 'info', className, children }: PropsWithChildren<GlassBadgeProps>): ReactElement {
    return (
        <span
            className={clsx(
                'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-widest backdrop-blur',
                toneClasses[tone],
                className
            )}
        >
            {children}
        </span>
    );
}
