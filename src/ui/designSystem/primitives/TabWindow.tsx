import React from 'react';

export interface TabItem {
  /** Stable tab id. */
  id: string;
  /** Tab label (i18n key already resolved by the caller). */
  label: string;
  /** Tab panel content. */
  content: React.ReactNode;
}

export interface TabWindowProps {
  /** Tabs to display. */
  tabs: TabItem[];
  /** Controlled active tab id. */
  activeTab?: string;
  /** Default active tab id when uncontrolled. */
  defaultTab?: string;
  /** Called when the active tab changes. */
  onChange?: (id: string) => void;
  /** Accessible name for the tablist; pass an i18n string. */
  ariaLabel?: string;
  /** Additional CSS class. */
  className?: string;
}

/**
 * `TabWindow` — a fantasy-styled tabbed panel primitive.
 *
 * Supports controlled and uncontrolled modes, full ARIA roles, and reads all
 * colors/sizing from the active skin tokens.
 */
export const TabWindow: React.FC<TabWindowProps> = ({
  tabs,
  activeTab: controlledActive,
  defaultTab,
  onChange,
  ariaLabel,
  className,
}) => {
  const [internalActive, setInternalActive] = React.useState(defaultTab ?? tabs[0]?.id);
  const activeId = controlledActive ?? internalActive ?? '';

  const handleClick = (id: string) => {
    if (controlledActive === undefined) {
      setInternalActive(id);
    }
    onChange?.(id);
  };

  const activeTab = tabs.find((t) => t.id === activeId) ?? tabs[0];

  if (tabs.length === 0) return null;

  return (
    <div
      className={className}
      style={{
        borderRadius: 'var(--skin-surface-radius)',
        border: '1px solid var(--skin-tab-border)',
        background: 'var(--skin-surface-bg)',
        boxShadow: 'var(--skin-btn-shadow)',
        overflow: 'hidden',
      }}
      role="tablist"
      aria-label={ariaLabel}
    >
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--skin-tab-border)',
          background: 'var(--skin-surface-base)',
        }}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeId;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              id={`tab-${tab.id}`}
              onClick={() => handleClick(tab.id)}
              style={{
                WebkitAppearance: 'none',
                appearance: 'none',
                border: 'none',
                background: isActive ? 'var(--skin-tab-active-bg)' : 'var(--skin-tab-inactive-bg)',
                color: isActive ? 'var(--skin-tab-active-color)' : 'var(--skin-tab-inactive-color)',
                padding: '10px 18px',
                fontFamily: 'var(--skin-font-display)',
                fontSize: 'var(--skin-body-size)',
                cursor: 'pointer',
                borderBottom: isActive ? '2px solid var(--skin-tab-active-border)' : '2px solid transparent',
                transition: 'color 0.15s ease, background 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div
        id={`tabpanel-${activeTab?.id}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab?.id}`}
        style={{
          padding: '18px',
          background: 'var(--skin-inset-bg)',
          minHeight: 120,
        }}
      >
        {activeTab?.content}
      </div>
    </div>
  );
};

export default TabWindow;
