/**
 * KitShell — smart auto-provider shell for frozen kits.
 *
 * Mounts ONLY the providers that are not already present above in the tree,
 * so a kit component can be dropped into any page with a single import:
 * standalone pages get the full canonical chain for free, while pages that
 * already mount (part of) the chain keep their own providers.
 *
 * Detection strategy per provider:
 * - SkinSystemProvider   → `useOptionalSkinSystemContext()` (null when absent)
 * - SandboxTimingProvider→ `SandboxTimingContext` (null when absent)
 * - DragProvider         → `DragContext` (undefined when absent)
 * - DndContext           → dnd-kit exposes no "am I inside?" flag, so we track
 *   it with a marker context set by KitShell itself. Pages that mount their
 *   own DndContext directly (outside any KitShell) should pass
 *   `override={{ DndContext: false }}` — nested DndContexts are not fatal but
 *   drags cannot cross their boundary.
 *
 * Part of the Component Freezing & Certification system (see
 * src/docs/docs/plans/component_freezing_certification_plan_v2.md).
 */

import {
  createContext,
  forwardRef,
  useContext,
  type ComponentType,
  type ForwardedRef,
  type ReactNode,
} from 'react';
import { DndContext } from '@dnd-kit/core';
import { DragProvider } from '@/ui/idleVillage/components/DragContext';
import { DragContext } from '@/ui/idleVillage/components/DragContextStore';
import { SandboxTimingProvider } from '@/ui/idleVillage/hooks/useSandboxTimingBridge';
import { SandboxTimingContext } from '@/ui/idleVillage/hooks/sandboxTimingContext';
import { SkinSystemProvider, useOptionalSkinSystemContext } from '@/ui/idleVillage/hooks/useSkinSystem';

/** Names match the `providerChain` strings used in the kit registry. */
export type KitProviderName =
  | 'SkinSystemProvider'
  | 'SandboxTimingProvider'
  | 'DragProvider'
  | 'DndContext';

export const FULL_PROVIDER_CHAIN: KitProviderName[] = [
  'SkinSystemProvider',
  'SandboxTimingProvider',
  'DragProvider',
  'DndContext',
];

/** True when a KitShell above already mounted a DndContext. */
const KitDndMarkerContext = createContext(false);

export interface KitShellProps {
  children: ReactNode;
  /**
   * Providers this shell is allowed to mount. Defaults to the full canonical
   * chain; kits narrow it to what their component actually needs.
   */
  chain?: KitProviderName[];
  /**
   * Per-provider escape hatch: `true` forces the mount, `false` skips it,
   * regardless of what detection says.
   */
  override?: Partial<Record<KitProviderName, boolean>>;
}

export function KitShell({ children, chain = FULL_PROVIDER_CHAIN, override = {} }: KitShellProps): JSX.Element {
  const hasSkin = useOptionalSkinSystemContext() !== null;
  const hasTiming = useContext(SandboxTimingContext) !== null;
  const hasDrag = useContext(DragContext) !== undefined;
  const hasDnd = useContext(KitDndMarkerContext);

  const shouldMount = (name: KitProviderName, detected: boolean): boolean =>
    chain.includes(name) && (override[name] ?? !detected);

  // Compose inside-out so the resulting order always matches the canonical
  // chain: Skin → Timing → Drag → Dnd → children.
  let tree = children;
  if (shouldMount('DndContext', hasDnd)) {
    tree = (
      <KitDndMarkerContext.Provider value={true}>
        <DndContext>{tree}</DndContext>
      </KitDndMarkerContext.Provider>
    );
  }
  if (shouldMount('DragProvider', hasDrag)) {
    tree = <DragProvider>{tree}</DragProvider>;
  }
  if (shouldMount('SandboxTimingProvider', hasTiming)) {
    tree = <SandboxTimingProvider>{tree}</SandboxTimingProvider>;
  }
  if (shouldMount('SkinSystemProvider', hasSkin)) {
    tree = <SkinSystemProvider>{tree}</SkinSystemProvider>;
  }
  return <>{tree}</>;
}

/**
 * Factory for a kit-specific Shell with a fixed provider chain.
 * Existing `XxxKitShell` exports are reimplemented with this so they become
 * smart (no double-mount) without breaking their call sites.
 */
export function createKitShell(
  chain: KitProviderName[],
  displayName: string
): ComponentType<{ children: ReactNode; override?: KitShellProps['override'] }> {
  function Shell({ children, override }: { children: ReactNode; override?: KitShellProps['override'] }) {
    return (
      <KitShell chain={chain} override={override}>
        {children}
      </KitShell>
    );
  }
  Shell.displayName = displayName;
  return Shell;
}

/**
 * HOC producing the one-line drop-in variant of a canonical component:
 * the component pre-wrapped in its smart shell. Refs are forwarded so
 * imperative handles (e.g. DestinyAstrolabeHandle) keep working.
 */
export function withKitShell<P extends object, R = unknown>(
  Component: ComponentType<P>,
  chain: KitProviderName[],
  displayName?: string
) {
  const Wrapped = forwardRef<R, P>(function KitShellWrapped(props: P, ref: ForwardedRef<R>) {
    const ComponentWithRef = Component as ComponentType<P & { ref?: ForwardedRef<R> }>;
    return (
      <KitShell chain={chain}>
        <ComponentWithRef {...props} ref={ref} />
      </KitShell>
    );
  });
  Wrapped.displayName = displayName ?? `KitShell(${Component.displayName ?? Component.name ?? 'Component'})`;
  return Wrapped;
}
