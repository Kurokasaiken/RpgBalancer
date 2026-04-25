import React from 'react';
import type { GridEntity as GridEntityType } from '../../engine/grid/gridTypes';

interface GridEntityProps {
    entity: GridEntityType;
    isSelected: boolean;
    onClick: (id: string) => void;
}

const ENTITY_SPRITES: Record<string, string> = {
    'hero-1': '/assets/characters/warrior.png',
    'enemy-1': '/assets/characters/orc.png',
    'archer-1': '/assets/characters/archer.png',
    'mage-1': '/assets/characters/mage.png',
};

export const GridEntity: React.FC<GridEntityProps> = ({ entity, isSelected, onClick }) => {
    const spriteUrl = ENTITY_SPRITES[entity.id] || '/assets/characters/warrior.svg';

    // Health bar percentage
    const hpPercent = (entity.currentHp / entity.maxHp) * 100;

    return (
        <div
            onClick={(e) => {
                e.stopPropagation();
                onClick(entity.id);
            }}
            className={`
                absolute inset-0 flex flex-col items-center justify-center cursor-pointer
                transition-transform hover:scale-110
                ${isSelected ? 'scale-110 z-10' : 'z-5'}
                ${entity.state === 'attacking' ? 'animate-pulse' : ''}
                ${entity.state === 'hit' ? 'animate-bounce' : ''}
            `}
        >
            {/* Character Sprite */}
            <div className="relative w-full h-full p-0.5 md:p-1">
                <img
                    src={spriteUrl}
                    alt={entity.name}
                    className={`
                        w-full h-full object-contain
                        ${isSelected ? 'drop-shadow-lg' : ''}
                    `}
                    style={{
                        filter: isSelected ? 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.8))' : 'none'
                    }}
                />

                {/* Selection Ring */}
                {isSelected && (
                    <div className="absolute inset-0 border-2 border-blue-400 rounded-full animate-ping opacity-75"></div>
                )}
            </div>

            {/* HP Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 md:h-1.5 bg-gray-900/80">
                <div
                    className={`h-full transition-all duration-300 ${hpPercent > 66 ? 'bg-green-500' :
                        hpPercent > 33 ? 'bg-yellow-500' :
                            'bg-red-500'
                        }`}
                    style={{ width: `${hpPercent}%` }}
                />
            </div>

            {/* Name Label (on hover) */}
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 
                            bg-gray-900/90 text-white text-[8px] md:text-xs px-1.5 py-0.5 rounded
                            opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {entity.name}
                <div className="text-[7px] md:text-[10px] text-gray-400">
                    {entity.currentHp}/{entity.maxHp} HP
                </div>
            </div>
        </div>
    );
};
