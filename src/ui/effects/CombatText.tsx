import React, { useEffect, useState } from 'react';

export interface CombatTextInstance {
    id: string;
    text: string;
    x: number;
    y: number;
    color: string;
    type: 'damage' | 'heal' | 'crit' | 'info';
}

interface CombatTextOverlayProps {
    items: CombatTextInstance[];
    onComplete: (id: string) => void;
}

export const CombatTextOverlay: React.FC<CombatTextOverlayProps> = ({ items, onComplete }) => {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
            {items.map(item => (
                <FloatingText key={item.id} item={item} onComplete={onComplete} />
            ))}
        </div>
    );
};

const FloatingText: React.FC<{ item: CombatTextInstance; onComplete: (id: string) => void }> = ({ item, onComplete }) => {
    const [opacity, setOpacity] = useState(1);
    const [offsetY, setOffsetY] = useState(0);

    useEffect(() => {
        // Animate up and fade out
        const startTime = Date.now();
        const duration = 1000;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            setOffsetY(progress * -50); // Float up 50px

            if (progress > 0.7) {
                setOpacity(1 - (progress - 0.7) / 0.3); // Fade out in last 30%
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                onComplete(item.id);
            }
        };

        requestAnimationFrame(animate);
    }, [item.id, onComplete]);

    let fontSize = 'text-lg';
    let fontWeight = 'font-bold';

    if (item.type === 'crit') {
        fontSize = 'text-2xl';
        fontWeight = 'font-extrabold';
    }

    return (
        <div
            className={`absolute ${fontSize} ${fontWeight} transition-transform will-change-transform`}
            style={{
                left: `${item.x}px`,
                top: `${item.y}px`,
                color: item.color,
                transform: `translate(-50%, -50%) translateY(${offsetY}px)`,
                opacity: opacity,
                textShadow: '1px 1px 2px black'
            }}
        >
            {item.text}
        </div>
    );
};
