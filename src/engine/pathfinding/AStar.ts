import type { Position, GridState } from '../grid/combatTypes';

interface Node {
    x: number;
    y: number;
    g: number; // Cost from start
    h: number; // Heuristic to goal
    f: number; // Total cost
    parent?: Node;
}

/**
 * A* Pathfinding Algorithm
 * Finds the shortest path between start and goal on the grid.
 */
export function findPath(
    start: Position,
    goal: Position,
    grid: GridState,
    ignoreBlockersAtGoal: boolean = false
): Position[] | null {
    const openList: Node[] = [];
    const closedList: Set<string> = new Set();

    // Initialize start node
    const startNode: Node = {
        x: start.x,
        y: start.y,
        g: 0,
        h: heuristic(start, goal),
        f: 0
    };
    startNode.f = startNode.g + startNode.h;
    openList.push(startNode);

    while (openList.length > 0) {
        // Sort by lowest f (simple priority queue)
        openList.sort((a, b) => a.f - b.f);
        const currentNode = openList.shift()!;

        // Check if goal reached
        if (currentNode.x === goal.x && currentNode.y === goal.y) {
            return reconstructPath(currentNode);
        }

        closedList.add(`${currentNode.x},${currentNode.y}`);

        // Get neighbors
        const neighbors = getNeighbors(currentNode, grid);

        for (const neighborPos of neighbors) {
            if (closedList.has(`${neighborPos.x},${neighborPos.y}`)) continue;

            const tile = grid.tiles[neighborPos.y][neighborPos.x];

            // Check walkability
            // If it's the goal and we ignore blockers (e.g. moving to attack range), allow it?
            // No, usually we want to move adjacent.
            // But if ignoreBlockersAtGoal is true, we allow the goal tile to be blocked (e.g. occupied by enemy)
            // This is useful if we just want to get *near* it, but pathfinding usually targets a specific walkable tile.
            // Let's assume standard pathfinding: Goal must be walkable unless specified.

            let isWalkable = tile.walkable && !tile.blocker;

            // Special case: Goal tile might be occupied by target, but we want to path to it?
            // No, usually we path to an adjacent tile.
            // If we pass ignoreBlockersAtGoal, we treat goal as walkable.
            if (neighborPos.x === goal.x && neighborPos.y === goal.y && ignoreBlockersAtGoal) {
                isWalkable = true;
            }

            if (!isWalkable) continue;

            const gScore = currentNode.g + tile.terrainCost;

            // Check if neighbor is already in open list with lower g
            const existingNode = openList.find(n => n.x === neighborPos.x && n.y === neighborPos.y);
            if (existingNode && gScore >= existingNode.g) continue;

            const neighborNode: Node = {
                x: neighborPos.x,
                y: neighborPos.y,
                g: gScore,
                h: heuristic(neighborPos, goal),
                f: 0,
                parent: currentNode
            };
            neighborNode.f = neighborNode.g + neighborNode.h;

            if (existingNode) {
                // Update existing
                existingNode.g = gScore;
                existingNode.f = neighborNode.f;
                existingNode.parent = currentNode;
            } else {
                openList.push(neighborNode);
            }
        }
    }

    return null; // No path found
}

/**
 * Dijkstra's Algorithm for Reachable Tiles
 * Returns all tiles reachable within maxCost.
 */
export function getReachableTiles(
    start: Position,
    maxCost: number,
    grid: GridState
): Position[] {
    const reachable: Position[] = [];
    const openList: Node[] = [];
    const closedList: Map<string, number> = new Map(); // pos -> cost

    const startNode: Node = {
        x: start.x,
        y: start.y,
        g: 0,
        h: 0,
        f: 0
    };
    openList.push(startNode);
    closedList.set(`${start.x},${start.y}`, 0);

    while (openList.length > 0) {
        openList.sort((a, b) => a.g - b.g);
        const currentNode = openList.shift()!;

        if (currentNode.g > 0) { // Don't include start tile? Or do? Usually yes.
            reachable.push({ x: currentNode.x, y: currentNode.y });
        }

        const neighbors = getNeighbors(currentNode, grid);

        for (const neighborPos of neighbors) {
            const tile = grid.tiles[neighborPos.y][neighborPos.x];
            if (!tile.walkable || tile.blocker) continue;

            const newCost = currentNode.g + tile.terrainCost;
            if (newCost > maxCost) continue;

            const existingCost = closedList.get(`${neighborPos.x},${neighborPos.y}`);
            if (existingCost !== undefined && newCost >= existingCost) continue;

            closedList.set(`${neighborPos.x},${neighborPos.y}`, newCost);

            openList.push({
                x: neighborPos.x,
                y: neighborPos.y,
                g: newCost,
                h: 0,
                f: 0
            });
        }
    }

    return reachable;
}

function heuristic(a: Position, b: Position): number {
    // Euclidean distance
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

function getNeighbors(pos: Position, grid: GridState): Position[] {
    const neighbors: Position[] = [];
    const dirs = [
        { x: 0, y: -1 }, // Up
        { x: 1, y: 0 },  // Right
        { x: 0, y: 1 },  // Down
        { x: -1, y: 0 }  // Left
    ];

    for (const dir of dirs) {
        const nx = pos.x + dir.x;
        const ny = pos.y + dir.y;

        if (nx >= 0 && nx < grid.width && ny >= 0 && ny < grid.height) {
            neighbors.push({ x: nx, y: ny });
        }
    }

    return neighbors;
}

function reconstructPath(node: Node): Position[] {
    const path: Position[] = [];
    let current: Node | undefined = node;
    while (current) {
        path.unshift({ x: current.x, y: current.y });
        current = current.parent;
    }
    return path;
}
