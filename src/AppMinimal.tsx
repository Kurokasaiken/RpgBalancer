import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { ErrorBoundary } from './ui/organisms/ErrorBoundary';
import MinimalGameplayPage from '@/ui/idleVillage/MinimalGameplayPage';
import TestRosterPage from '@/ui/idleVillage/TestRosterPage';
import { DensityProvider } from './contexts/DensityContext';
import { Toaster } from './shared/components/Toaster';

export type MinimalRoute = 'minimal-gameplay' | 'test';

const DEFAULT_ROUTE: MinimalRoute = 'test';

function resolveRoute(): MinimalRoute {
  if (typeof window === 'undefined') {
    return DEFAULT_ROUTE;
  }

  const { pathname, hash } = window.location;
  if (pathname.endsWith('/test') || hash.replace('#', '') === 'test') {
    return 'test';
  }
  if (pathname.endsWith('/minimal-gameplay') || hash.replace('#', '') === 'minimal-gameplay') {
    return 'minimal-gameplay';
  }
  return DEFAULT_ROUTE;
}

const routeMap: Record<MinimalRoute, { label: string; element: ReactNode }> = {
  'minimal-gameplay': {
    label: 'Minimal Gameplay',
    element: (
      <ErrorBoundary componentName="Minimal Gameplay Page">
        <MinimalGameplayPage />
      </ErrorBoundary>
    ),
  },
  test: {
    label: 'Test Roster',
    element: (
      <ErrorBoundary componentName="Test Roster Page">
        <TestRosterPage />
      </ErrorBoundary>
    ),
  },
};

export function AppMinimal(): JSX.Element {
  const [route, setRoute] = useState<MinimalRoute>(resolveRoute());

  useEffect(() => {
    const handleNavigation = () => setRoute(resolveRoute());
    window.addEventListener('hashchange', handleNavigation);
    window.addEventListener('popstate', handleNavigation);
    window.addEventListener('pushstate', handleNavigation as EventListener);
    return () => {
      window.removeEventListener('hashchange', handleNavigation);
      window.removeEventListener('popstate', handleNavigation);
      window.removeEventListener('pushstate', handleNavigation as EventListener);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const canonicalPath = `/${route}`;
    if (window.location.pathname !== canonicalPath) {
      window.history.replaceState({}, '', canonicalPath);
    }
  }, [route]);

  const current = useMemo(() => routeMap[route], [route]);

  return (
    <DensityProvider>
      <div className="min-h-screen bg-[#05060a] text-white">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 bg-black/20 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-amber-300/80">Wanderlust Triumph</p>
            <h1 className="text-lg font-semibold leading-tight">Idle Village Minimal Workspace</h1>
            <p className="text-sm text-white/70">Route attiva · {current.label}</p>
          </div>
          <nav className="flex gap-3 text-sm font-semibold uppercase tracking-[0.3em]">
            <NavLink target="minimal-gameplay" current={route}>
              Minimal
            </NavLink>
            <NavLink target="test" current={route}>
              Test
            </NavLink>
          </nav>
        </header>
        <main className="min-h-[calc(100vh-4.5rem)] bg-gradient-to-b from-[#05060a] to-[#0b111d]">
          {current.element}
        </main>
        <Toaster />
      </div>
    </DensityProvider>
  );
}

interface NavLinkProps {
  target: MinimalRoute;
  current: MinimalRoute;
  children: ReactNode;
}

function NavLink({ target, current, children }: NavLinkProps) {
  const isActive = target === current;
  const handleClick = () => {
    if (typeof window === 'undefined') {
      return;
    }
    if (window.location.pathname !== `/${target}`) {
      window.history.pushState({}, '', `/${target}`);
    }
    window.dispatchEvent(new Event('pushstate'));
  };

  return (
    <button
      type="button"
      data-active={isActive}
      onClick={handleClick}
      className="rounded-full border border-white/15 px-4 py-2 text-xs tracking-[0.25em] text-white/70 transition data-[active=true]:border-amber-300 data-[active=true]:text-amber-100"
    >
      {children}
    </button>
  );
}

export default AppMinimal;
