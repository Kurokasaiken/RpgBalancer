import React from 'react';
import type {
    CombatStageConfig,
    CombatStageLayer,
    CombatStageSlot
} from '../../balancing/config/combatStage';

export interface CombatStageProps {
    config: CombatStageConfig;
    children?: React.ReactNode;
    renderSlot?: (slot: CombatStageSlot) => React.ReactNode;
    overlay?: React.ReactNode;
}

const VIEWBOX = { width: 1200, height: 700 };

export const CombatStage: React.FC<CombatStageProps> = ({ config, children, renderSlot, overlay }) => {
    const stageId = config.id;
    const renderSlotContent = renderSlot ?? defaultSlotRenderer;

    return (
        <div
            className="combat-stage relative w-full overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-950"
            style={{ background: config.palette.backdrop }}
        >
            <svg
                className="absolute inset-0 h-full w-full"
                viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
                preserveAspectRatio="none"
            >
                {config.layers.map(layer => (
                    <React.Fragment key={layer.id}>{renderLayer(layer, stageId)}</React.Fragment>
                ))}
            </svg>

            <div className="relative z-10 min-h-[420px]">
                <div className="absolute inset-0 pointer-events-none z-10">
                    {config.slots.map(slot => (
                        <div
                            key={slot.id}
                            className="absolute flex flex-col items-center gap-2 text-xs uppercase tracking-[0.2em]"
                            style={{
                                left: `${slot.position.xPercent}%`,
                                top: `${slot.position.yPercent}%`,
                                transform: `
                                    translate(-50%, -50%)
                                    scale(${slot.scale})
                                    rotate(${slot.rotation ?? 0}deg)
                                `,
                                zIndex: slot.zIndex ?? 1
                            }}
                        >
                            {renderSlotContent(slot)}
                        </div>
                    ))}
                </div>

                {overlay && (
                    <div className="absolute inset-0 z-20 pointer-events-none">
                        {overlay}
                    </div>
                )}

                <div className="relative z-30 flex min-h-[420px] items-center justify-center">
                    {children}
                </div>
            </div>
        </div>
    );
};

function renderLayer(layer: CombatStageLayer, stageId: string) {
    switch (layer.type) {
        case 'gradient':
            return (
                <>
                    <defs>
                        <linearGradient id={`grad-${stageId}-${layer.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            {layer.gradientStops?.map(stop => (
                                <stop
                                    key={stop.position}
                                    offset={`${stop.position}%`}
                                    stopColor={stop.color}
                                    stopOpacity={layer.opacity ?? 1}
                                />
                            ))}
                        </linearGradient>
                    </defs>
                    <rect
                        x="0"
                        y="0"
                        width={VIEWBOX.width}
                        height={VIEWBOX.height}
                        fill={`url(#grad-${stageId}-${layer.id})`}
                    />
                </>
            );
        case 'runeGrid':
            return (
                <g opacity={layer.opacity ?? 1} style={{ mixBlendMode: layer.blendMode }}>
                    <defs>
                        <pattern
                            id={`grid-${stageId}-${layer.id}`}
                            width={layer.grid?.cellSize}
                            height={layer.grid?.cellSize}
                            patternUnits="userSpaceOnUse"
                        >
                            <path
                                d={`M ${layer.grid?.cellSize} 0 L 0 0 0 ${layer.grid?.cellSize}`}
                                fill="none"
                                stroke={layer.grid?.stroke}
                                strokeWidth="1"
                                strokeOpacity={layer.grid?.strokeOpacity ?? 0.5}
                            />
                        </pattern>
                    </defs>
                    <rect
                        x="0"
                        y="0"
                        width={VIEWBOX.width}
                        height={VIEWBOX.height}
                        fill={`url(#grid-${stageId}-${layer.id})`}
                        transform={layer.grid?.tiltDeg ? `skewY(${layer.grid.tiltDeg})` : undefined}
                    />
                </g>
            );
        case 'spotlight':
            return (
                <g opacity={layer.opacity ?? 1} style={{ mixBlendMode: layer.blendMode }}>
                    <defs>
                        {layer.spotlights?.map((spot, index) => (
                            <radialGradient
                                key={`${layer.id}-grad-${index}`}
                                id={`spot-${stageId}-${layer.id}-${index}`}
                                cx="50%"
                                cy="50%"
                                r="50%"
                            >
                                <stop offset="0%" stopColor={spot.color} stopOpacity={spot.intensity} />
                                <stop offset="100%" stopColor={spot.color} stopOpacity={0} />
                            </radialGradient>
                        ))}
                    </defs>
                    {layer.spotlights?.map((spot, index) => (
                        <circle
                            key={`${layer.id}-circle-${index}`}
                            cx={(spot.position.xPercent / 100) * VIEWBOX.width}
                            cy={(spot.position.yPercent / 100) * VIEWBOX.height}
                            r={spot.radius}
                            fill={`url(#spot-${stageId}-${layer.id}-${index})`}
                        />
                    ))}
                </g>
            );
        case 'fog':
            return (
                <>
                    <defs>
                        <linearGradient id={`fog-${stageId}-${layer.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            {layer.gradientStops?.map(stop => (
                                <stop
                                    key={stop.position}
                                    offset={`${stop.position}%`}
                                    stopColor={stop.color}
                                    stopOpacity={layer.opacity ?? 1}
                                />
                            ))}
                        </linearGradient>
                    </defs>
                    <rect
                        x="0"
                        y="0"
                        width={VIEWBOX.width}
                        height={VIEWBOX.height}
                        fill={`url(#fog-${stageId}-${layer.id})`}
                    />
                </>
            );
        case 'noise':
            return null; // Placeholder for future texture overlay implementation
        default:
            return null;
    }
}

function defaultSlotRenderer(slot: CombatStageSlot) {
    const badgeClass =
        slot.team === 'A'
            ? 'bg-cyan-500/15 border border-cyan-400/60 text-cyan-200'
            : 'bg-rose-500/15 border border-rose-400/60 text-rose-200';

    return (
        <div className="pointer-events-auto flex flex-col items-center gap-2">
            <div className={`rounded-full px-3 py-1 text-[10px] font-semibold ${badgeClass}`}>Team {slot.team}</div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-center text-[11px] font-semibold tracking-wide text-slate-200 shadow-lg shadow-slate-900/60 backdrop-blur">
                {slot.label}
            </div>
        </div>
    );
}
