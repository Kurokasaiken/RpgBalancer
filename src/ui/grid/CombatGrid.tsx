import React from 'react';
import { GridTile } from './GridTile';
import { GridEntity } from './GridEntity';
import type { CombatState } from '../../engine/grid/gridTypes';

interface CombatGridProps {
    state: CombatState;
    onTileClick: (x: number, y: number) => void;
    onEntityClick: (id: string) => void;
}

export const CombatGrid: React.FC<CombatGridProps> = ({ state, onTileClick, onEntityClick }) => {
    const gridSize = state.gridSize;
    const tiles = [];

    // Create grid tiles
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            // Find entity at this position
            const entity = state.entities.find(e => e.position.x === x && e.position.y === y);

            // Check if this tile is a valid move target (simplified: adjacent to selected)
            // In a real implementation, we'd pass a "validMoves" array
            const isSelected = state.selectedEntityId ?
                state.entities.find(e => e.id === state.selectedEntityId)?.position.x === x &&
                state.entities.find(e => e.id === state.selectedEntityId)?.position.y === y
                : false;

            tiles.push(
                <GridTile
                    key={`${x}-${y}`}
                    x={x}
                    y={y}
                    isSelected={isSelected}
                    isTarget={false}
                    onClick={onTileClick}
                >
                    {entity && (
                        <GridEntity
                            entity={entity}
                            isSelected={state.selectedEntityId === entity.id}
                            onClick={onEntityClick}
                        />
                    )}
                </GridTile>
            );
        }
    }

    return (
        <div
            className="grid bg-gray-900 p-2 md:p-4 rounded-xl shadow-2xl border border-gray-800"
            style={{
                gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                width: 'min(90vw, 600px)', // Fit screen but max 600px
                height: 'min(90vw, 600px)', // Square grid
            }}
        >
            {tiles}
        </div>
    );
};
