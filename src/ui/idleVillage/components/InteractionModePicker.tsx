/**
 * Idle Village Interaction Mode Picker
 * 
 * Simple UI component for switching between desktop and mobile interaction modes.
 * Provides toggle buttons with visual feedback and integrates with the interaction mode store.
 * 
 * @since NP-062 – Idle Village Interaction Mode Picker
 * @since NP-082 – Idle Village Interaction Mode Accessibility Sweep
 */

import React, { useRef, useEffect, useState } from 'react';
import { useInteractionModeStoreWithUtils } from '../hooks/useInteractionModeStore';
import type { InteractionMode } from '../hooks/useSandboxInteractionMode';

/**
 * Interaction Mode Picker Props
 */
export interface InteractionModePickerProps {
  /** Additional CSS class names */
  className?: string;
  /** Whether to show the mode switcher */
  showModeSwitcher?: boolean;
  /** Callback when mode changes */
  onModeChange?: (mode: InteractionMode) => void;
  /** Compact display mode */
  compact?: boolean;
  /** ID for accessibility testing */
  testId?: string;
}

/**
 * Interaction Mode Picker Component
 */
export const InteractionModePicker: React.FC<InteractionModePickerProps> = ({
  className = '',
  showModeSwitcher = true,
  onModeChange,
  compact = false,
  testId = 'interaction-mode-picker',
}) => {
  const {
    preference,
    toggleMode,
    setAutoDetect,
  } = useInteractionModeStoreWithUtils();

  const modeToggleRef = useRef<HTMLButtonElement>(null);
  const autoDetectToggleRef = useRef<HTMLButtonElement>(null);
  const [announcementQueue, setAnnouncementQueue] = useState<string[]>([]);

  // Process announcement queue using requestAnimationFrame for better performance
  useEffect(() => {
    if (announcementQueue.length > 0) {
      const frame = requestAnimationFrame(() => {
        // Use a cleanup function with a simple counter approach
        const startTime = Date.now();
        const checkTime = () => {
          if (Date.now() - startTime >= 1000) {
            setAnnouncementQueue(prev => prev.slice(1));
          } else {
            requestAnimationFrame(checkTime);
          }
        };
        requestAnimationFrame(checkTime);
      });
      
      return () => cancelAnimationFrame(frame);
    }
  }, [announcementQueue]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab' && event.shiftKey) {
        // Handle backward tab navigation
        return;
      }
      if (event.key === 'Tab') {
        // Handle forward tab navigation
        return;
      }
      if (event.key === 'Enter' || event.key === ' ') {
        const activeElement = document.activeElement;
        if (activeElement === modeToggleRef.current || activeElement === autoDetectToggleRef.current) {
          event.preventDefault();
          (activeElement as HTMLButtonElement)?.click();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleModeToggle = () => {
    const newMode = preference.preferredMode === 'desktop' ? 'mobile' : 'desktop';
    toggleMode();
    onModeChange?.(newMode);
    
    // Announce to screen readers
    const announcement = `Switched to ${newMode} mode${preference.autoDetect ? ' with auto-detect enabled' : ''}`;
    setAnnouncementQueue(prev => [...prev, announcement]);
  };

  const handleAutoDetectToggle = () => {
    const newState = !preference.autoDetect;
    setAutoDetect(newState);
    
    // Announce to screen readers
    const announcement = `Auto-detect ${newState ? 'enabled' : 'disabled'}`;
    setAnnouncementQueue(prev => [...prev, announcement]);
  };

  if (!showModeSwitcher || !preference.uiPreferences.showModeSwitcher) {
    return null;
  }

  return (
    <div 
      className={`interaction-mode-picker ${className}`}
      role="group"
      aria-label="Interaction Mode Controls"
      data-testid={testId}
    >
      <div className="flex items-center gap-2 p-2 bg-slate-800 rounded-lg border border-slate-600">
        {/* Mode Toggle Button */}
        <button
          ref={modeToggleRef}
          onClick={handleModeToggle}
          className={`
            px-3 py-2 rounded-md font-medium text-sm transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800
            ${preference.preferredMode === 'desktop'
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-green-600 text-white hover:bg-green-700'
            }
          `}
          title={`Switch to ${preference.preferredMode === 'desktop' ? 'mobile' : 'desktop'} mode`}
          aria-label={`Current mode: ${preference.preferredMode}. Click to switch to ${preference.preferredMode === 'desktop' ? 'mobile' : 'desktop'} mode`}
          aria-pressed={preference.preferredMode === 'desktop'}
          aria-describedby="mode-description"
        >
          {compact ? (
            <span className="text-lg" aria-hidden="true">
              {preference.preferredMode === 'desktop' ? '🖥️' : '📱'}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <span className="text-lg" aria-hidden="true">
                {preference.preferredMode === 'desktop' ? '🖥️' : '📱'}
              </span>
              <span className="capitalize">
                {preference.preferredMode}
              </span>
            </span>
          )}
        </button>

        {/* Auto-Detect Toggle */}
        {!compact && (
          <div className="flex items-center gap-2">
            <label 
              htmlFor="auto-detect-toggle"
              className="text-xs text-slate-400"
              id="auto-detect-label"
            >
              Auto-detect
            </label>
            <button
              ref={autoDetectToggleRef}
              id="auto-detect-toggle"
              onClick={handleAutoDetectToggle}
              aria-labelledby="auto-detect-label"
              aria-checked={preference.autoDetect}
              role="switch"
              className={`
                w-8 h-4 rounded-full transition-colors duration-200 relative
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800
                ${preference.autoDetect ? 'bg-green-600' : 'bg-slate-600'}
              `}
              title={`Auto-detect is ${preference.autoDetect ? 'enabled' : 'disabled'}. Click to toggle auto-detection`}
            >
              <div
                className={`
                  absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform duration-200
                  ${preference.autoDetect ? 'translate-x-4' : 'translate-x-0.5'}
                `}
                aria-hidden="true"
              />
            </button>
          </div>
        )}

        {/* Session Stats Badge */}
        {!compact && preference.sessionStats.totalSessions > 0 && (
          <div 
            className="text-xs text-slate-500"
            aria-label={`Session statistics: ${preference.sessionStats.totalSessions} total sessions`}
          >
            {preference.sessionStats.totalSessions} sessions
          </div>
        )}
      </div>

      {/* Hidden description for screen readers */}
      <div id="mode-description" className="sr-only">
        Switch between desktop and mobile interaction modes. Desktop mode uses mouse and keyboard controls, while mobile mode uses touch gestures and simplified interface.
      </div>

      {/* Screen reader announcements */}
      {announcementQueue.map((announcement, index) => (
        <div
          key={index}
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {announcement}
        </div>
      ))}

      {/* Tooltip with stats */}
      {preference.sessionStats.totalSessions > 0 && (
        <div 
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-xs text-slate-300 rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap"
          role="tooltip"
          aria-hidden="true"
        >
          <div>Desktop: {preference.sessionStats.desktopSessions}</div>
          <div>Mobile: {preference.sessionStats.mobileSessions}</div>
          <div>Avg: {Math.round(preference.sessionStats.averageSessionDuration)}s</div>
        </div>
      )}
    </div>
  );
};

/**
 * Compact Interaction Mode Picker
 * Minimal version for tight spaces
 */
export const CompactInteractionModePicker: React.FC<Omit<InteractionModePickerProps, 'compact'>> = (props) => {
  return <InteractionModePicker {...props} compact={true} />;
};

/**
 * Interaction Mode Status Indicator
 * Shows current mode without controls
 */
export const InteractionModeStatus: React.FC<{
  className?: string;
  showStats?: boolean;
}> = ({ className = '', showStats = false }) => {
  const { preference, getModeSummary } = useInteractionModeStoreWithUtils();
  const summary = getModeSummary();

  return (
    <div className={`interaction-mode-status ${className}`}>
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <span className="text-lg">
          {preference.preferredMode === 'desktop' ? '🖥️' : '📱'}
        </span>
        <span className="capitalize">
          {preference.preferredMode}
        </span>
        {preference.autoDetect && (
          <span className="text-xs text-green-400">auto</span>
        )}
        {showStats && summary.totalSessions > 0 && (
          <span className="text-xs text-slate-500">
            ({summary.totalSessions})
          </span>
        )}
      </div>
    </div>
  );
};

export default InteractionModePicker;
