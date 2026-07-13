import { useMemo, useState } from 'react';
import { LQAContext } from './LQAContext';
import { LQAOverlay } from '@/ui/components/LQAOverlay';

function isLQAEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const param = new URLSearchParams(window.location.search).get('lqa');
  return param === 'true' || param === '1';
}

interface LQAProviderProps {
  children: React.ReactNode;
}

/**
 * Provides LQA context and renders the LQA overlay when activated.
 *
 * LQA mode is only available in development and is enabled via the `?lqa=true`
 * query parameter. It is never included in production builds.
 */
export function LQAProvider({ children }: LQAProviderProps) {
  const [enabled] = useState(() => import.meta.env.DEV && isLQAEnabled());

  const value = useMemo(
    () => ({
      enabled,
    }),
    [enabled],
  );

  return (
    <LQAContext.Provider value={value}>
      {children}
      <LQAOverlay />
    </LQAContext.Provider>
  );
}
