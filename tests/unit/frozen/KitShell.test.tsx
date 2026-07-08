/**
 * KitShell.dom.test
 *
 * Verifies the smart auto-provider behavior:
 * 1. standalone — KitShell mounts every provider in its chain;
 * 2. nested — providers already mounted above are REUSED, not shadowed.
 */

import { describe, test, expect } from 'vitest';
import { useContext } from 'react';
import { render, screen } from '@testing-library/react';
import { KitShell, FULL_PROVIDER_CHAIN } from '@/ui/idleVillage/frozen/_infra/KitShell';
import { DragContext } from '@/ui/idleVillage/components/DragContextStore';
import { SandboxTimingContext, type SandboxTimingApi } from '@/ui/idleVillage/hooks/sandboxTimingContext';
import { useOptionalSkinSystemContext } from '@/ui/idleVillage/hooks/useSkinSystem';

function Probe({ onTiming }: { onTiming?: (api: SandboxTimingApi | null) => void }) {
  const skin = useOptionalSkinSystemContext();
  const drag = useContext(DragContext);
  const timing = useContext(SandboxTimingContext);
  onTiming?.(timing);
  return (
    <div data-testid="probe">
      <span data-testid="has-skin">{String(skin !== null)}</span>
      <span data-testid="has-drag">{String(drag !== undefined)}</span>
      <span data-testid="has-timing">{String(timing !== null)}</span>
    </div>
  );
}

describe('KitShell smart auto-provider', () => {
  test('standalone: mounts every provider in the chain', () => {
    render(
      <KitShell chain={FULL_PROVIDER_CHAIN}>
        <Probe />
      </KitShell>
    );
    expect(screen.getByTestId('has-skin').textContent).toBe('true');
    expect(screen.getByTestId('has-drag').textContent).toBe('true');
    expect(screen.getByTestId('has-timing').textContent).toBe('true');
  });

  test('nested: reuses an outer provider instead of shadowing it', () => {
    const outerApi: SandboxTimingApi = {
      scheduleTimeout: () => () => undefined,
    };
    let seen: SandboxTimingApi | null = null;
    render(
      <SandboxTimingContext.Provider value={outerApi}>
        <KitShell chain={FULL_PROVIDER_CHAIN}>
          <Probe onTiming={(api) => { seen = api; }} />
        </KitShell>
      </SandboxTimingContext.Provider>
    );
    // Identity check: the probe must see the OUTER api, not a fresh fallback.
    expect(seen).toBe(outerApi);
  });

  test('chain restriction: mounts only the listed providers', () => {
    render(
      <KitShell chain={['SkinSystemProvider']}>
        <Probe />
      </KitShell>
    );
    expect(screen.getByTestId('has-skin').textContent).toBe('true');
    expect(screen.getByTestId('has-drag').textContent).toBe('false');
    expect(screen.getByTestId('has-timing').textContent).toBe('false');
  });

  test('nested KitShells: inner shell does not duplicate DndContext (marker)', () => {
    // Two nested shells must not crash and must render children once.
    render(
      <KitShell chain={FULL_PROVIDER_CHAIN}>
        <KitShell chain={FULL_PROVIDER_CHAIN}>
          <Probe />
        </KitShell>
      </KitShell>
    );
    expect(screen.getAllByTestId('probe')).toHaveLength(1);
  });
});
