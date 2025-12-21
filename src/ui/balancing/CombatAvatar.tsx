import React, { useEffect, useMemo, useState } from 'react';
import { getCombatSpriteById, type CombatSpriteState, type SpriteFrame } from '../../balancing/config/combatSprites';
import type { ActorAnimatorState, ActorPose } from '../../balancing/hooks/useCombatAnimator';

interface CombatAvatarProps {
    spriteId?: string;
    state?: CombatSpriteState;
    actorState?: ActorAnimatorState;
    size?: number;
    className?: string;
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
    state = 'idle',
    actorState,
    size = 160,
    className
}) => {
    const resolvedSpriteId = actorState?.lastEvent?.actorId ? actorState?.actorId : spriteId;
    const sprite = resolvedSpriteId ? getCombatSpriteById(resolvedSpriteId) : undefined;
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

    useEffect(() => {
        setFrameIndex(0);
    }, [asset, actorState?.pose, actorState?.updatedAt]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (frames.length <= 1) return;
        const duration = frames[frameIndex]?.durationMs ?? asset?.durationMs ?? 200;
        const timeout = window.setTimeout(() => {
            setFrameIndex(prev => (prev + 1) % frames.length);
        }, duration);
        return () => window.clearTimeout(timeout);
    }, [frames, frameIndex, asset]);

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

    return (
        <div className={className} style={{ width, height }}>
            <img
                src={currentFrame.assetId}
                alt={sprite.label}
                className="h-full w-full object-contain drop-shadow-[0_14px_30px_rgba(0,0,0,0.75)] transition-all duration-150"
                style={{
                    filter: actorState?.pose === 'hit' ? 'brightness(1.2)' : undefined
                }}
            />
        </div>
    );
};
