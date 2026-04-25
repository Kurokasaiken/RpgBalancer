import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { FocusEvent, JSX, ReactNode } from 'react';

const BREAKPOINTS = Object.freeze({
  mobile: 640,
  desktop: 1024,
});

const layoutTokens = {
  background: 'var(--surface-base, #050509)',
  panel: 'var(--surface-panel, rgba(8, 10, 15, 0.95))',
  border: 'var(--panel-border, rgba(255, 255, 255, 0.08))',
  text: 'var(--text-primary, #f0efe4)',
  overlay: 'var(--color-obsidian-alpha, rgba(5, 5, 9, 0.78))',
  halo: 'var(--halo-color, rgba(201, 162, 39, 0.55))',
};

/**
 * Props for GameplayLayout
 */
export interface GameplayLayoutProps {
  header: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
  footer: ReactNode;
  sidebarOpenDefault?: boolean;
  className?: string;
}

function useMediaQuery(query: string): boolean {
  const getMatches = () =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(query).matches
      : false;

  const [matches, setMatches] = useState(getMatches);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const mediaQueryList = window.matchMedia(query);
    const handleChange = (event: MediaQueryListEvent) => setMatches(event.matches);

    setMatches(mediaQueryList.matches);

    if (typeof mediaQueryList.addEventListener === 'function') {
      mediaQueryList.addEventListener('change', handleChange);
      return () => mediaQueryList.removeEventListener('change', handleChange);
    }

    mediaQueryList.addListener(handleChange);
    return () => mediaQueryList.removeListener(handleChange);
  }, [query]);

  return matches;
}

/**
 * Gameplay Layout Component
 * 
 * Responsive layout with:
 * - Mobile: vertical stack
 * - Desktop: sidebar + main area
 * - GPU-optimized transitions
 * - Collapsible sidebar on mobile
 */
export function GameplayLayout({
  header,
  sidebar,
  children,
  footer,
  sidebarOpenDefault = false,
  className = '',
}: GameplayLayoutProps): JSX.Element {
  const isDesktop = useMediaQuery(`(min-width: ${BREAKPOINTS.desktop}px)`);
  const isMobile = useMediaQuery(`(max-width: ${BREAKPOINTS.mobile - 1}px)`);
  const [sidebarOpen, setSidebarOpen] = useState(sidebarOpenDefault);
  const sidebarId = useId();
  const sidebarRef = useRef<HTMLElement | null>(null);
  const previousFocusRef = useRef<Element | null>(null);

  useEffect(() => {
    if (isDesktop) {
      setSidebarOpen(true);
    } else {
      setSidebarOpen(sidebarOpenDefault);
    }
  }, [isDesktop, sidebarOpenDefault]);

  const sidebarVisible = isDesktop || sidebarOpen;

  const getFocusableElements = useCallback((): HTMLElement[] => {
    const container = sidebarRef.current;
    if (!container) return [];
    const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors)).filter(
      (element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true'
    );
  }, []);

  const trapFocusToSidebar = useCallback(() => {
    const target = getFocusableElements()[0] ?? sidebarRef.current;
    target?.focus({ preventScroll: true });
  }, [getFocusableElements]);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      return undefined;
    }

    if (sidebarOpen) {
      previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      trapFocusToSidebar();
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          setSidebarOpen(false);
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }

    if (previousFocusRef.current instanceof HTMLElement) {
      previousFocusRef.current.focus({ preventScroll: true });
    }
    previousFocusRef.current = null;
    return undefined;
  }, [isMobile, sidebarOpen, trapFocusToSidebar]);

  const handleFocusLoopStart = useCallback(
    (event: FocusEvent<HTMLDivElement>) => {
      if (!isMobile || !sidebarOpen) {
        return;
      }
      event.preventDefault();
      const focusable = getFocusableElements();
      (focusable[focusable.length - 1] ?? sidebarRef.current)?.focus({ preventScroll: true });
    },
    [getFocusableElements, isMobile, sidebarOpen]
  );

  const handleFocusLoopEnd = useCallback(
    (event: FocusEvent<HTMLDivElement>) => {
      if (!isMobile || !sidebarOpen) {
        return;
      }
      event.preventDefault();
      const focusable = getFocusableElements();
      (focusable[0] ?? sidebarRef.current)?.focus({ preventScroll: true });
    },
    [getFocusableElements, isMobile, sidebarOpen]
  );

  const focusRingStyles: React.CSSProperties = {
    outline: '2px solid var(--accent-color, #d4af37)',
    outlineOffset: '2px',
  };

  return (
    <div
      className={`gameplay-layout ${className}`}
      style={{
        display: 'grid',
        gridTemplateRows: 'auto 1fr auto',
        minHeight: '100vh',
        width: '100%',
        backgroundColor: layoutTokens.background,
        color: layoutTokens.text,
        overflow: 'hidden',
      }}
    >
      <header
        role="banner"
        style={{
          borderBottom: `1px solid ${layoutTokens.border}`,
          background: layoutTokens.panel,
          boxShadow: `0 18px 35px ${layoutTokens.overlay}`,
          zIndex: 2,
        }}
      >
        {header}
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isDesktop ? 'minmax(260px, 320px) 1fr' : '1fr',
          position: 'relative',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        {sidebarVisible && (
          <>
            {isMobile && sidebarOpen && (
              <button
                type="button"
                aria-label="Chiudi il pannello laterale"
                onClick={toggleSidebar}
                style={{
                  position: 'fixed',
                  inset: 0,
                  backgroundColor: layoutTokens.overlay,
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  zIndex: 2,
                }}
              />
            )}

            {isMobile && sidebarOpen && (
              <div tabIndex={0} aria-hidden="true" onFocus={handleFocusLoopStart} />
            )}

            <aside
              id={sidebarId}
              role="complementary"
              aria-label="Riepilogo residenti e registro eventi"
              ref={sidebarRef}
              tabIndex={-1}
              style={{
                background: layoutTokens.panel,
                borderRight: isDesktop ? `1px solid ${layoutTokens.border}` : 'none',
                height: '100%',
                overflowY: 'auto',
                position: isMobile ? 'fixed' : 'relative',
                inset: isMobile ? '0 auto 0 0' : 'auto',
                zIndex: isMobile ? 3 : 1,
                transform: isMobile && !sidebarOpen ? 'translateX(-100%)' : 'translateX(0)',
                transition: 'transform 240ms ease',
                width: isDesktop ? '100%' : '80%',
                maxWidth: 320,
                boxShadow: isMobile ? `25px 0 45px ${layoutTokens.overlay}` : 'none',
              }}
            >
              {sidebar}
            </aside>

            {isMobile && sidebarOpen && (
              <div tabIndex={0} aria-hidden="true" onFocus={handleFocusLoopEnd} />
            )}
          </>
        )}

        <main
          role="main"
          aria-hidden={isMobile && sidebarOpen ? 'true' : undefined}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: isMobile ? '16px' : '24px',
            background: 'var(--body-bg-overlay, transparent)',
          }}
        >
          {children}
        </main>

        {isMobile && (
          <button
            type="button"
            aria-controls={sidebarId}
            aria-expanded={sidebarOpen}
            onClick={toggleSidebar}
            style={{
              position: 'fixed',
              top: 24,
              left: 16,
              width: 48,
              height: 48,
              borderRadius: '999px',
              border: `1px solid ${layoutTokens.border}`,
              background: 'var(--button-bg, rgba(8, 10, 15, 0.9))',
              color: layoutTokens.text,
              fontSize: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 4,
              transition: 'transform 160ms ease',
            }}
            onFocus={(event) => {
              Object.assign(event.currentTarget.style, focusRingStyles);
            }}
            onBlur={(event) => {
              event.currentTarget.style.outline = 'none';
              event.currentTarget.style.outlineOffset = '0px';
            }}
          >
            {sidebarOpen ? '✕' : '☰'}
            <span className="sr-only">Toggle sidebar</span>
          </button>
        )}
      </div>

      <footer
        role="contentinfo"
        aria-hidden={isMobile && sidebarOpen ? 'true' : undefined}
        style={{
          borderTop: `1px solid ${layoutTokens.border}`,
          background: layoutTokens.panel,
          boxShadow: `0 -18px 25px ${layoutTokens.overlay}`,
          zIndex: 2,
        }}
      >
        {footer}
      </footer>

      <style>{`
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          border: 0;
        }
      `}</style>
    </div>
  );
}

export default GameplayLayout;
