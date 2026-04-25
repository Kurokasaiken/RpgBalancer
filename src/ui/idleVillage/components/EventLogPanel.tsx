import { useEffect, useMemo, useRef } from 'react';
import type { CSSProperties, JSX } from 'react';

export type EventLogSeverity = 'info' | 'warn' | 'error';

export interface EventLogEntry {
  id: string;
  timestampLabel: string;
  title: string;
  description?: string;
  badge?: string;
  severity?: EventLogSeverity;
}

export interface EventLogPanelProps {
  entries: EventLogEntry[];
  maxVisible?: number;
  ariaLabel?: string;
}

const severityTokens: Record<EventLogSeverity, { color: string; border: string; background: string }> = {
  info: {
    color: 'var(--text-muted, rgba(226,232,240,0.85))',
    border: 'rgba(148, 163, 184, 0.35)',
    background: 'rgba(15, 23, 42, 0.35)',
  },
  warn: {
    color: 'var(--accent-color, #f59e0b)',
    border: 'rgba(245, 158, 11, 0.3)',
    background: 'rgba(245, 158, 11, 0.12)',
  },
  error: {
    color: 'var(--color-crimson, #ef4444)',
    border: 'rgba(239, 68, 68, 0.35)',
    background: 'rgba(239, 68, 68, 0.12)',
  },
};

const srOnlyStyles: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

export function EventLogPanel({
  entries,
  maxVisible = 5,
  ariaLabel = 'Registro eventi',
}: EventLogPanelProps): JSX.Element {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const liveRegionRef = useRef<HTMLDivElement | null>(null);

  const visibleEntries = useMemo(() => {
    if (!Array.isArray(entries)) {
      return [];
    }
    return entries.slice(-maxVisible);
  }, [entries, maxVisible]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
    if (liveRegionRef.current) {
      if (visibleEntries.length === 0) {
        liveRegionRef.current.textContent = 'Nessun evento registrato';
      } else {
        const latest = visibleEntries[visibleEntries.length - 1];
        liveRegionRef.current.textContent = `${latest.timestampLabel} — ${latest.title}`;
      }
    }
  }, [visibleEntries]);

  return (
    <section
      aria-label={ariaLabel}
      style={{
        borderRadius: 24,
        border: '1px solid var(--panel-border, rgba(255,255,255,0.14))',
        background: 'rgba(5,6,9,0.85)',
        padding: '20px',
        boxShadow: '0 30px 70px rgba(0,0,0,0.45)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <header style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
              color: 'var(--slot-helper-color, rgba(255,255,255,0.55))',
            }}
          >
            Event Log
          </p>
          <h2 style={{ margin: '6px 0 0 0', fontSize: 18, color: 'var(--text-primary, #f7f2d8)' }}>Ultimi eventi</h2>
        </div>
        <span
          style={{
            fontSize: 11,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: 'var(--text-muted, rgba(226,232,240,0.65))',
          }}
        >
          {visibleEntries.length}/{Math.max(entries.length, visibleEntries.length)}
        </span>
      </header>

      <div
        style={{
          borderRadius: 20,
          border: '1px solid var(--panel-border, rgba(255,255,255,0.08))',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(10,12,20,0.9))',
          padding: '12px 4px 12px 12px',
          position: 'relative',
        }}
      >
        <div
          ref={viewportRef}
          role="log"
          aria-live="polite"
          style={{
            maxHeight: 220,
            overflowY: 'auto',
            paddingRight: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {visibleEntries.length === 0 ? (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted, rgba(226,232,240,0.6))' }}>
              Non ci sono ancora eventi registrati.
            </p>
          ) : (
            visibleEntries.map((entry) => {
              const severity = entry.severity ?? 'info';
              const palette = severityTokens[severity];
              return (
                <article
                  key={entry.id}
                  style={{
                    borderRadius: 18,
                    border: `1px solid ${palette.border}`,
                    background: palette.background,
                    padding: '12px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                    <span
                      style={{
                        fontSize: 11,
                        letterSpacing: '0.25em',
                        textTransform: 'uppercase',
                        color: 'var(--text-muted, rgba(226,232,240,0.65))',
                      }}
                    >
                      {entry.timestampLabel}
                    </span>
                    {entry.badge && (
                      <span
                        style={{
                          fontSize: 10,
                          letterSpacing: '0.3em',
                          textTransform: 'uppercase',
                          border: `1px solid ${palette.border}`,
                          color: palette.color,
                          borderRadius: 999,
                          padding: '2px 10px',
                        }}
                      >
                        {entry.badge}
                      </span>
                    )}
                  </div>
                  <strong style={{ fontSize: 14, color: palette.color }}>{entry.title}</strong>
                  {entry.description && (
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-primary, #f7f2d8)', opacity: 0.8 }}>
                      {entry.description}
                    </p>
                  )}
                </article>
              );
            })
          )}
        </div>
        <div ref={liveRegionRef} style={srOnlyStyles} aria-live="polite" />
      </div>
    </section>
  );
}

export default EventLogPanel;
