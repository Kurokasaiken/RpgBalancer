/**
 * IsolatedShowcase
 *
 * Provides a clean, centered viewport for `minimal-*` pages that render a single
 * canonical component in isolation.
 *
 * Design contract:
 * - The frame adds NO visible chrome by default. The component receives a
 *   centered area with neutral background.
 * - Optional debug overlay (small badge in top-right) shown only when the URL
 *   includes `?debug=1`. The badge displays `componentName` and `specPath` so
 *   QA can identify the test page without polluting the canonical render area.
 * - Accepts a `align` prop ("center" | "top") for components whose natural
 *   layout fits poorly inside a centered flex container (e.g. very tall lists).
 *
 * Usage:
 * ```tsx
 * <IsolatedShowcase componentName="VillageRosterSection" specPath="src/docs/docs/minimal_slice/03_roster.md">
 *   <VillageRosterSection {...canonicalProps} />
 * </IsolatedShowcase>
 * ```
 *
 * Part of the Component Freezing & Certification system (see
 * src/docs/docs/plans/component_freezing_certification_plan_v2.md).
 */
import { useEffect, useState, type ReactNode, type CSSProperties } from 'react';

export interface IsolatedShowcaseProps {
  /** Children to render at center of the isolated viewport. */
  children: ReactNode;
  /** Canonical component name surfaced in the debug overlay. */
  componentName: string;
  /** Path to the spec document, surfaced in the debug overlay. */
  specPath?: string;
  /** Vertical alignment of the showcase content. Defaults to "center". */
  align?: 'center' | 'top';
  /** Optional max width of the centered area. Defaults to "100%". */
  maxWidth?: string;
  /** Optional padding around the centered area. Defaults to "1rem". */
  padding?: string;
}

const containerBase: CSSProperties = {
  minHeight: '100vh',
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
  boxSizing: 'border-box',
};

const debugBadgeStyle: CSSProperties = {
  position: 'fixed',
  top: '8px',
  right: '8px',
  background: 'rgba(0, 0, 0, 0.65)',
  color: '#fff',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: '11px',
  padding: '6px 10px',
  borderRadius: '6px',
  pointerEvents: 'none',
  zIndex: 9999,
  maxWidth: '40vw',
};

/**
 * Reads `?debug=1` from the current URL. Returns false during SSR.
 */
function useDebugQueryFlag(): boolean {
  const [debug, setDebug] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setDebug(params.get('debug') === '1');
  }, []);
  return debug;
}

export function IsolatedShowcase({
  children,
  componentName,
  specPath,
  align = 'center',
  maxWidth = '100%',
  padding = '1rem',
}: IsolatedShowcaseProps): JSX.Element {
  const debug = useDebugQueryFlag();

  const containerStyle: CSSProperties = {
    ...containerBase,
    alignItems: align === 'center' ? 'center' : 'flex-start',
    padding,
  };

  const contentStyle: CSSProperties = {
    width: '100%',
    maxWidth,
  };

  return (
    <div
      data-testid="isolated-showcase"
      data-component-name={componentName}
      data-spec-path={specPath ?? ''}
      style={containerStyle}
    >
      <div data-testid="isolated-showcase-content" style={contentStyle}>
        {children}
      </div>
      {debug && (
        <div
          data-testid="isolated-showcase-debug-badge"
          // Suffix `-debug` is mandated by the contract test normalization rule
          // (Audit doc, §4): debug nodes are stripped from contract subtree diffs.
          style={debugBadgeStyle}
        >
          <div style={{ fontWeight: 700 }}>{componentName}</div>
          {specPath && <div style={{ opacity: 0.75 }}>{specPath}</div>}
        </div>
      )}
    </div>
  );
}

export default IsolatedShowcase;
