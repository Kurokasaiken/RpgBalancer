/**
 * rosterBugCertification.test.ts
 *
 * Certification tests for the 6 bugs identified in the roster_slot_integration_spec.md.
 * Each test is designed to FAIL before the fix and PASS after.
 *
 * BUG-1: Global 160ms cooldown blocks unrelated clicks
 * BUG-2: recentlyDraggedResidentId guard never activates (G2 dead)
 * BUG-3: dragInterruptionFlag dead prop
 * BUG-4: Console debug logs in production
 * BUG-5: Font regression in PgCard (no explicit font-family)
 * BUG-6: Missing activeId in handleRosterSelect dependency array
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const SRC_ROOT = path.resolve(__dirname, '../../../src/ui/idleVillage');
const COMPONENTS = path.join(SRC_ROOT, 'components');

// Helper: read file contents
function readSrc(relativePath: string): string {
  return fs.readFileSync(path.join(SRC_ROOT, relativePath), 'utf-8');
}

function readComponent(filename: string): string {
  return fs.readFileSync(path.join(COMPONENTS, filename), 'utf-8');
}

// ──────────────────────────────────────────────────────────────
// BUG-1: Global 160ms cooldown blocks unrelated residents' clicks
// The guard `timeSinceDragEnd < 160` uses a GLOBAL timestamp, so
// clicking resident B within 160ms of dragging resident A is blocked.
// FIX: the cooldown must be scoped to the dragged resident only,
//       or the guard must also compare residentId to the last-dragged id.
// ──────────────────────────────────────────────────────────────
describe('BUG-1: Global 160ms cooldown', () => {
  it('handleRosterSelect cooldown must be scoped to the dragged resident, not global', () => {
    const source = readSrc('TestRosterPage.tsx');

    // Find the timeSinceDragEnd guard block
    const cooldownGuard = source.match(/timeSinceDragEnd\s*<\s*\d+/);
    expect(cooldownGuard).not.toBeNull();

    // After the cooldown check, the code must also verify the residentId matches
    // the last-dragged resident. A purely global check (no resident comparison)
    // is the bug. We look for evidence that the guard is resident-scoped:
    // e.g. comparing against lastDraggedResidentIdRef or similar.
    const cooldownSection = source.substring(
      source.indexOf('timeSinceDragEnd < '),
      source.indexOf('timeSinceDragEnd < ') + 400,
    );

    // The guard should be resident-specific: either check lastDraggedResidentId
    // or be wrapped in a condition that compares the residentId.
    const isResidentScoped =
      cooldownSection.includes('lastDraggedResidentIdRef') ||
      cooldownSection.includes('lastDraggedResident') ||
      // Alternative: the guard only fires for the same resident that was dragged
      cooldownSection.includes('=== residentId');

    expect(isResidentScoped).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────
// BUG-2: recentlyDraggedResidentId guard (G2) is dead code
// DragTestContainer._handleDragEnd sets recentlyDraggedResidentId,
// but DndContext-managed drags never call _handleDragEnd. So the
// handleResidentSelectSafe guard that checks recentlyDraggedResidentId
// never fires. Either remove it or wire it correctly.
// ──────────────────────────────────────────────────────────────
describe('BUG-2: recentlyDraggedResidentId guard dead code', () => {
  it('DragTestContainer should not have a guard on recentlyDraggedResidentId if it is never set during DndContext drags, OR it must be properly wired', () => {
    const source = readComponent('DragTestContainer.tsx');

    const hasRecentlyDraggedGuard = source.includes('recentlyDraggedResidentId');
    const hasInternalHandleDragEnd = source.includes('_handleDragEnd');

    if (hasRecentlyDraggedGuard) {
      // If the guard exists, there must be an external way to set it
      // (e.g. via a prop or a callback from the parent), not just via _handleDragEnd
      // which is only called internally.
      // Check if recentlyDraggedResidentId is set from a prop or external source
      const isSetFromProp =
        source.includes('recentlyDraggedResidentId: ') || // destructured from props
        source.includes('props.recentlyDraggedResidentId') ||
        source.includes('onDragEndExternal'); // some external wiring

      // Or alternatively, _handleDragEnd is wired to the parent's onDragEnd
      // which IS called by DndContext. Let's check if the internal handler
      // is triggered from the render path
      const internalEndCalledByParent = !hasInternalHandleDragEnd;

      // The guard is dead code if it relies on internal state that is never set.
      // This test passes when either:
      // 1) recentlyDraggedResidentId is removed entirely, OR
      // 2) it is set from an external source (prop/callback)
      expect(isSetFromProp || internalEndCalledByParent || !hasRecentlyDraggedGuard).toBe(true);
    }
    // If the guard was removed entirely, the test passes
  });
});

// ──────────────────────────────────────────────────────────────
// BUG-3: dragInterruptionFlag is dead code
// The prop exists in VillageRosterSection, ResidentRosterPanel,
// and DragTestContainer, but is never passed by TestRosterPage
// and never consumed by DragTestContainer's logic.
// ──────────────────────────────────────────────────────────────
describe('BUG-3: dragInterruptionFlag dead prop', () => {
  it('VillageRosterSection should not declare dragInterruptionFlag prop', () => {
    const source = readComponent('VillageRosterSection.tsx');
    expect(source.includes('dragInterruptionFlag')).toBe(false);
  });

  it('ResidentRosterPanel should not declare dragInterruptionFlag prop', () => {
    const source = readComponent('ResidentRosterPanel.tsx');
    expect(source.includes('dragInterruptionFlag')).toBe(false);
  });

  it('DragTestContainer should not declare dragInterruptionFlag prop', () => {
    const source = readComponent('DragTestContainer.tsx');
    // Check that it's not in the props interface
    const propsSection = source.substring(
      source.indexOf('DragTestContainerProps'),
      source.indexOf('}', source.indexOf('DragTestContainerProps')) + 1,
    );
    expect(propsSection.includes('dragInterruptionFlag')).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────────
// BUG-4: Console debug logs in production code
// Multiple console.log('🔍 ...') calls exist in production components.
// These should be removed or gated behind NODE_ENV === 'development'.
// ──────────────────────────────────────────────────────────────
describe('BUG-4: Console debug logs in production', () => {
  const debugPattern = /console\.log\(\s*['"`]🔍/;

  it('PgCard.tsx should not have debug console.log statements', () => {
    const source = readComponent('PgCard.tsx');
    expect(debugPattern.test(source)).toBe(false);
  });

  it('DragTestContainer.tsx should not have debug console.log statements', () => {
    const source = readComponent('DragTestContainer.tsx');
    expect(debugPattern.test(source)).toBe(false);
  });

  it('ResidentSlotRack.tsx should not have debug console.log statements', () => {
    const source = readComponent('ResidentSlotRack.tsx');
    expect(debugPattern.test(source)).toBe(false);
  });

  it('ActivitySlot.tsx should not have debug console.log statements', () => {
    const source = readComponent('ActivitySlot.tsx');
    expect(debugPattern.test(source)).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────────
// BUG-5: Font regression in PgCard
// The PgCard uses Tailwind utility classes (text-xs, text-sm) which
// inherit the browser default sans-serif. The expected font for Idle
// Village is defined via Style Lab tokens. PgCard's baseTokenClasses
// must include an explicit font-family class or CSS variable.
// ──────────────────────────────────────────────────────────────
describe('BUG-5: Font regression in PgCard', () => {
  it('PgCard baseTokenClasses must include an explicit font-family declaration', () => {
    const source = readComponent('PgCard.tsx');

    // Find the baseTokenClasses definition
    const baseTokenMatch = source.match(/baseTokenClasses\s*=[\s\S]*?;/);
    expect(baseTokenMatch).not.toBeNull();

    const baseToken = baseTokenMatch![0];

    // The token classes must include a font-family specification:
    // either a Tailwind font class (font-sans, font-mono, font-serif, font-[...])
    // or a CSS variable reference (var(--minimal-font-family))
    const hasFontClass =
      /font-(sans|mono|serif|body|display|ui)/.test(baseToken) ||
      /font-\[/.test(baseToken) ||
      /var\(--minimal-font/.test(baseToken) ||
      /fontFamily/.test(baseToken) ||
      /font-family/.test(baseToken);

    expect(hasFontClass).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────
// BUG-6: Missing activeId in handleRosterSelect dependency array
// handleRosterSelect references `activeId` in its body but does not
// include it in useCallback's dependency array, causing stale closures.
// ──────────────────────────────────────────────────────────────
describe('BUG-6: Missing activeId in handleRosterSelect deps', () => {
  it('handleRosterSelect useCallback must include activeId in its dependency array', () => {
    const source = readSrc('TestRosterPage.tsx');

    // Find the handleRosterSelect definition and its dependency array
    const handleRosterSelectStart = source.indexOf('const handleRosterSelect = useCallback(');
    expect(handleRosterSelectStart).toBeGreaterThan(-1);

    // Find the closing of the useCallback — look for the dependency array
    // Pattern: }, [dep1, dep2, ...]);
    const afterStart = source.substring(handleRosterSelectStart);
    // Find the last ], before the next const/function declaration
    const depArrayMatch = afterStart.match(/\],\s*\n\s*\);/);
    expect(depArrayMatch).not.toBeNull();

    // Extract the dependency array content
    const depArrayEnd = afterStart.indexOf(depArrayMatch![0]);
    const depArraySection = afterStart.substring(0, depArrayEnd + depArrayMatch![0].length);

    // Find the actual dependency array — last occurrence of [...] before );
    const allBrackets = [...depArraySection.matchAll(/\[([^\]]*)\]/g)];
    const lastBracket = allBrackets[allBrackets.length - 1];
    expect(lastBracket).toBeDefined();

    const deps = lastBracket![1];
    expect(deps).toContain('activeId');
  });
});

// ──────────────────────────────────────────────────────────────
// BUG-7: Invalid drop auto-assignment guard missing
// Drops rejected by validators or blocked slots were still followed
// by an auto-assignment via roster click. We must ensure the code
// explicitly flags the resident after every rejection reason.
// ──────────────────────────────────────────────────────────────
describe('BUG-7: Invalid drop auto-assign guard missing', () => {
  it('TestRosterPage must flag the resident after every rejection scenario to block ghost auto-assign', () => {
    const source = readSrc('TestRosterPage.tsx');

    // Helper must exist so we can guard roster clicks
    expect(source.includes('const flagResidentAfterRejectedInteraction = useCallback')).toBe(true);

    const requiredReasons = [
      "flagResidentAfterRejectedInteraction(residentId, 'drag_drop_outside')",
      "flagResidentAfterRejectedInteraction(residentId, 'drag_drop_blocked_slot')",
      "flagResidentAfterRejectedInteraction(residentId, 'scenario_validator_failed')",
      "flagResidentAfterRejectedInteraction(residentId, 'drop_validation_failed')",
      "flagResidentAfterRejectedInteraction(residentId, normalizedResult.reason ?? 'assignment_failed')",
    ];

    requiredReasons.forEach((snippet) => {
      expect(source.includes(snippet)).toBe(true);
    });
  });
});
