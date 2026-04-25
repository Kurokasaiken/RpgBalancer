import type { Position, GridState, AoEShape } from './combatTypes';

export const RangeCalculator = {
    /**
     * Calculates Euclidean distance between two positions.
     */
    getDistance(a: Position, b: Position): number {
        return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
    },

    /**
     * Checks if target is within range of source.
     */
    inRange(a: Position, b: Position, range: number): boolean {
        return this.getDistance(a, b) <= range;
    },

    /**
     * Checks Line of Sight using Bresenham's Line Algorithm.
     * Returns true if there are no blockers between start and end.
     * Does not check if end tile itself is blocked (allows targeting enemies).
     */
    hasLineOfSight(start: Position, end: Position, grid: GridState): boolean {
        let x0 = start.x;
        let y0 = start.y;
        const x1 = end.x;
        const y1 = end.y;

        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = (x0 < x1) ? 1 : -1;
        const sy = (y0 < y1) ? 1 : -1;
        let err = dx - dy;

        while (true) {
            // Reached target
            if (x0 === x1 && y0 === y1) break;

            // Check blocker (skip start tile)
            if (!(x0 === start.x && y0 === start.y)) {
                if (grid.tiles[y0] && grid.tiles[y0][x0] && grid.tiles[y0][x0].blocker) {
                    return false;
                }
            }

            const e2 = 2 * err;
            if (e2 > -dy) { err -= dy; x0 += sx; }
            if (e2 < dx) { err += dx; y0 += sy; }
        }
        return true;
    },

    /**
     * Returns all tile positions affected by an AoE shape centered at 'center'.
     */
    getTargetsInArea(center: Position, shape: AoEShape, grid: GridState): Position[] {
        const targets: Position[] = [];

        if (shape.type === 'circle') {
            const r = shape.radius;
            const rSq = r * r;

            // Bounding box optimization
            const minX = Math.max(0, Math.floor(center.x - r));
            const maxX = Math.min(grid.width - 1, Math.ceil(center.x + r));
            const minY = Math.max(0, Math.floor(center.y - r));
            const maxY = Math.min(grid.height - 1, Math.ceil(center.y + r));

            for (let y = minY; y <= maxY; y++) {
                for (let x = minX; x <= maxX; x++) {
                    const distSq = Math.pow(x - center.x, 2) + Math.pow(y - center.y, 2);
                    if (distSq <= rSq) {
                        targets.push({ x, y });
                    }
                }
            }
        } else if (shape.type === 'line') {
            // Simple horizontal/vertical line for now, or ray casting?
            // "Line" usually implies a ray from caster to target.
            // But here we just have a center?
            // Usually Line AoE is defined by Start and End points.
            // If shape is just "Line", it needs direction.
            // For now, let's assume it's not supported or returns center.
            targets.push(center);
        } else if (shape.type === 'cone') {
            // Cone needs direction.
            targets.push(center);
        }

        return targets;
    }
};
