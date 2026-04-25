import React from 'react';

interface GridTileProps {
    x: number;
    y: number;
    isSelected: boolean;
    isTarget: boolean; // For movement or attack range
    onClick: (x: number, y: number) => void;
    children?: React.ReactNode;
}

export const GridTile: React.FC<GridTileProps> = ({ x, y, isSelected, isTarget, onClick, children }) => {
    return (
        <div
            onClick={() => onClick(x, y)}
            className="aspect-square w-full relative flex items-center justify-center cursor-pointer active:scale-95 group border border-gray-900/20"
            style={{
                background: 'linear-gradient(to bottom right, #14532d, #166534)', // Deep green gradient
            }}
        >
            {/* Overlay for hover/selection */}
            <div className={`
                absolute inset-0 transition-all duration-200
                ${isSelected ? 'bg-blue-500/30 border-2 border-blue-400 shadow-[inset_0_0_10px_rgba(59,130,246,0.5)]' : 'hover:bg-white/10 border border-transparent hover:border-white/20'}
                ${isTarget ? 'bg-green-500/30 border-2 border-green-400 shadow-[inset_0_0_10px_rgba(34,197,94,0.5)]' : ''}
            `} />

            {/* Coordinate label (only on hover) */}
            <span className="absolute top-0.5 left-0.5 text-[7px] md:text-[8px] text-white/70 bg-black/20 px-0.5 rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                {x},{y}
            </span>

            {/* Entity Content */}
            <div className="relative z-10 w-full h-full p-0.5">
                {children}
            </div>
        </div>
    );
};
