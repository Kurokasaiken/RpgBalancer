import React, { useEffect, useMemo, useState } from 'react';
import { getCombatSpriteById, type CombatSpriteState, type SpriteFrame } from '../../balancing/config/combatSprites';
import type { ActorAnimatorState, ActorPose } from '../../balancing/hooks/useCombatAnimator';
import type { SpritePalette } from '../../shared/types/visual';

interface CombatAvatarProps {
    spriteId?: string;
    paletteOverride?: SpritePalette;
    state?: CombatSpriteState;
    actorState?: ActorAnimatorState;
    size?: number;
    className?: string;
    facing?: 'left' | 'right';
}

const poseToSpriteState = (pose: ActorPose): CombatSpriteState => {
    switch (pose) {
        case 'windup':
            return 'windup';
        case 'attack':
            return 'attack';
        case 'hit':
            return 'hit';
        case 'status':
            return 'statusFx';
        case 'defeated':
            return 'defeated';
        case 'idle':
        default:
            return 'idle';
    }
};

export const CombatAvatar: React.FC<CombatAvatarProps> = ({
    spriteId,
    paletteOverride,
    state = 'idle',
    actorState,
    size = 160,
    className,
    facing = 'right'
}) => {
    const sprite = spriteId ? getCombatSpriteById(spriteId) : undefined;
    const palette = paletteOverride ?? sprite?.palette;
    const spriteState: CombatSpriteState = actorState ? poseToSpriteState(actorState.pose) : state;
    const asset = sprite?.states[spriteState] ?? sprite?.states.idle;
    const fallbackStyle: React.CSSProperties = {
        width: size,
        height: size
    };

    const frames: SpriteFrame[] = useMemo(() => {
        if (!asset) return [];
        if (asset.frames?.length) return asset.frames;
        return [{ assetId: asset.assetId, durationMs: asset.durationMs }];
    }, [asset]);

    const [frameIndex, setFrameIndex] = useState(0);
    const shouldLoop = useMemo(() => {
        if (!asset) return false;
        if (typeof asset.loop === 'boolean') return asset.loop;
        return spriteState === 'idle' || spriteState === 'statusFx';
    }, [asset, spriteState]);

    useEffect(() => {
        setFrameIndex(0);
    }, [asset, actorState?.pose, actorState?.updatedAt]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (frames.length <= 1) return;
        const duration = frames[frameIndex]?.durationMs ?? asset?.durationMs ?? 200;
        const timeout = window.setTimeout(() => {
            setFrameIndex(prev => {
                if (!shouldLoop && prev >= frames.length - 1) {
                    return prev;
                }
                const next = prev + 1;
                if (next >= frames.length) {
                    return shouldLoop ? 0 : frames.length - 1;
                }
                return next;
            });
        }, duration);
        return () => window.clearTimeout(timeout);
    }, [frames, frameIndex, asset, shouldLoop]);

    if (!sprite || !asset || frames.length === 0) {
        return (
            <div
                className={`flex items-center justify-center rounded-2xl border border-dashed border-slate-700 text-[10px] uppercase tracking-[0.3em] text-slate-600 ${className ?? ''}`}
                style={fallbackStyle}
            >
                No Sprite
            </div>
        );
    }

    const currentFrame = frames[frameIndex] ?? frames[0];
    const aspectRatio = asset.size.width / asset.size.height;
    const width = size;
    const height = size / aspectRatio;
    const offset = asset.offset ?? { x: 0, y: 0 };
    const adjustedOffset = {
        x: facing === 'left' ? -offset.x : offset.x,
        y: offset.y
    };
    const auraShadow = palette?.accent ?? 'rgba(201,162,39,0.35)';
    const shouldMirror = facing === 'left';

    return (
        <div
            className={className}
            style={{
                width,
                height,
                filter: actorState?.pose === 'hit' ? 'brightness(1.05)' : undefined
            }}
        >
            <div className="h-full w-full origin-center transition-all duration-150 flex items-center justify-center">
                <div
                    className="h-full w-full"
                    style={{
                        transform: shouldMirror ? 'scaleX(-1)' : undefined
                    }}
                >
                    <div
                        className="h-full w-full origin-center transition-all duration-150"
                        style={{
                            transform: `translate(${adjustedOffset.x}px, ${adjustedOffset.y}px)`,
                            boxShadow: `0 18px 38px ${auraShadow}`,
                            background: palette
                                ? `radial-gradient(circle at 30% 20%, ${palette.accent}33, transparent 55%)`
                                : undefined
                        }}
                    >
                        <img
                            src={currentFrame.assetId}
                            alt={sprite.label}
                            className="h-full w-full object-contain drop-shadow-[0_14px_30px_rgba(0,0,0,0.65)]"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
