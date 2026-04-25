import { useMapContext } from './useMapContext';

/**
 * Backwards-compatible alias so existing Map components can keep using the
 * historical `useVillageSandbox` hook name while the logic now lives inside
 * `useMapContext`.
 */
export function useVillageSandbox() {
  return useMapContext();
}

export type UseVillageSandboxReturn = ReturnType<typeof useVillageSandbox>;
