import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { SandboxTimingContext, type SandboxTimingApi } from './sandboxTimingContext';
import { useSandboxTiming } from './useSandboxTiming';

interface SandboxTimingProviderProps {
  value?: SandboxTimingApi;
  children: ReactNode;
}

function useFallbackTimingApi(): SandboxTimingApi {
  const timersRef = useRef<Set<number>>(new Set());

  useEffect(() => () => {
    if (typeof window === 'undefined') return;
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current.clear();
  }, []);

  const scheduleTimeout = useCallback((callback: () => void, delayMs: number) => {
    if (typeof window === 'undefined') {
      callback();
      return () => undefined;
    }
    const normalizedDelay = Number.isFinite(delayMs) && delayMs > 0 ? delayMs : 0;
    const timeoutId = window.setTimeout(() => {
      timersRef.current.delete(timeoutId);
      callback();
    }, normalizedDelay);
    timersRef.current.add(timeoutId);
    return () => {
      window.clearTimeout(timeoutId);
      timersRef.current.delete(timeoutId);
    };
  }, []);

  return useMemo(() => ({ scheduleTimeout }), [scheduleTimeout]);
}

export const SandboxTimingFallbackProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const fallbackValue = useFallbackTimingApi();
  return <SandboxTimingContext.Provider value={fallbackValue}>{children}</SandboxTimingContext.Provider>;
};

export const SandboxTimingProvider: React.FC<SandboxTimingProviderProps> = ({ value, children }) => {
  if (value) {
    return <SandboxTimingContext.Provider value={value}>{children}</SandboxTimingContext.Provider>;
  }
  return <SandboxTimingFallbackProvider>{children}</SandboxTimingFallbackProvider>;
};

// Re-export useSandboxTiming for convenience
export { useSandboxTiming };
