import React from 'react';
import { getCombatSpriteById, type CombatSpriteState } from '../../balancing/config/combatSprites';

interface CombatAvatarProps {
    spriteId?: string;
    state?: CombatSpriteState;
    size?: number;
    className?: string;
}

export const CombatAvatar: React.FC<CombatAvatarProps> = ({ spriteId, state = 'idle', size = 160, className }) => {
    const sprite = spriteId ? getCombatSpriteById(spriteId) : undefined;
    const asset = sprite?.states[state] ?? sprite?.states.idle;
    const fallbackStyle: React.CSSProperties = {
        width: size,
        height: size
    };

    if (!sprite || !asset) {
        return (
            <div
                className={`flex items-center justify-center rounded-2xl border border-dashed border-slate-700 text-[10px] uppercase tracking-[0.3em] text-slate-600 ${className ?? ''}`}
                style={fallbackStyle}
            >
                No Sprite
            </div>
        );
    }

    const aspectRatio = asset.size.width / asset.size.height;
    const width = size;
    const height = size / aspectRatio;

    return (
        <div className={className} style={{ width, height }}>
            <img
                src={asset.assetId}
                alt={sprite.label}
                className="h-full w-full object-contain drop-shadow-[0_14px_30px_rgba(0,0,0,0.75)]"
                style={{
                    animationDuration: asset.durationMs ? `${asset.durationMs}ms` : undefined
                }}
            />
        </div>
    );
};
