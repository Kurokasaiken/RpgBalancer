// INV:drag-config.INV-2
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { CollisionDetection, DroppableContainer } from '@dnd-kit/core';
import { describe, expect, it } from 'vitest';
import { getCurrentDragConfig } from '@/ui/idleVillage/config/dragConfig';
import { createMagneticSlotCollision } from '@/ui/idleVillage/interaction/magneticCollision';

describe('R-359 — /game slot magnet uses the configured numeric radius', () => {
  it('passes the slot radius, not the entire drag config, at the game call site', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/pages/game-mappa2.tsx'), 'utf8');

    expect(source).toMatch(
      /createMagneticSlotCollision\s*\(\s*getCurrentDragConfig\s*\(\s*\)\s*\.\s*magnetism\s*\.\s*slotRadiusPx\s*\)/,
    );
  });

  it('rejects a far-away pointer while still accepting a nearby slot', () => {
    const radius = getCurrentDragConfig().magnetism.slotRadiusPx;
    const collision = createMagneticSlotCollision(radius);
    const rect = { left: 100, top: 100, right: 156, bottom: 156, width: 56, height: 56 };
    const node = document.createElement('div');
    node.setAttribute('data-drop-slot', 'goblin-slot-leader');
    const slot: DroppableContainer = {
      id: 'goblin-slot-leader',
      key: 'goblin-slot-leader',
      disabled: false,
      data: { current: { type: 'slot' } },
      node: { current: node },
      rect: { current: rect },
    };
    const args: Parameters<CollisionDetection>[0] = {
      active: {
        id: 'giggiolillo',
        data: { current: { type: 'resident' } },
        rect: { current: { initial: rect, translated: rect } },
      },
      collisionRect: rect,
      droppableContainers: [slot],
      droppableRects: new Map([[slot.id, rect]]),
      pointerCoordinates: { x: rect.right + radius * 10, y: 128 },
    };

    expect(Number.isFinite(radius)).toBe(true);
    expect(radius).toBeGreaterThan(0);
    expect(collision(args)).toEqual([]);
    // This control rules out a vacuous pass caused by an unregistered/non-slot fixture.
    expect(collision({ ...args, pointerCoordinates: { x: rect.right + radius / 2, y: 128 } }))
      .toEqual([expect.objectContaining({ id: slot.id })]);
  });
});
