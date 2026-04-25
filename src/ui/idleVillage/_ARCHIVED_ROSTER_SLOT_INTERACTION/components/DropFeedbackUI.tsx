/**
 * Drop Feedback UI Components for Idle Village Phase E
 * 
 * Modular UI components for visual feedback during drag-and-drop operations.
 * Provides styled components for different feedback states with animations
 * and accessibility features.
 * 
 * @since IV-PhaseE-drop-feedback
 */

import React from 'react';
import clsx from 'clsx';
import type { DropFeedbackVisuals } from '@/ui/idleVillage/hooks/useDropFeedback';
import type { DropValidationResult } from '@/ui/idleVillage/config/residentDropRules';

/**
 * Visual feedback types for drop operations.
 */
export type DropFeedbackType = 
  | 'valid'
  | 'invalid'
  | 'warning'
  | 'blocked';

/**
 * Props for the DropFeedbackOverlay component.
 */
export interface DropFeedbackOverlayProps {
  /** Visual styling for the feedback */
  visuals: DropFeedbackVisuals;
  /** Whether the feedback is currently visible */
  visible?: boolean;
  /** Optional className for styling overrides */
  className?: string;
  /** Optional test ID for testing */
  testId?: string;
  /** Children to render inside the overlay */
  children?: React.ReactNode;
}

/**
 * Overlay component that provides visual feedback for drop operations.
 * 
 * Renders a styled overlay with borders, background colors, and animations
 * based on the feedback type. Used to highlight slots during drag operations.
 * 
 * @param props - Component props
 * @returns React component
 */
export const DropFeedbackOverlay: React.FC<DropFeedbackOverlayProps> = ({
  visuals,
  visible = true,
  className,
  testId,
  children,
}) => {
  if (!visible) {
    return <>{children}</>;
  }

  return (
    <div
      className={clsx(
        'absolute inset-0 pointer-events-none border-2 rounded-md transition-all duration-300',
        className
      )}
      style={{
        // TODO(style-lab-flexibility): swap these static values with interactionPhysics tokens
        // (shadowDepth, bloomIntensity) plus a Framer Motion spring overshoot once presets exist.
        borderColor: visuals.borderColor,
        backgroundColor: visuals.backgroundColor,
        boxShadow: visuals.boxShadow,
        animation: visuals.animation,
      }}
      data-testid={testId}
      role="presentation"
      aria-label="Drop feedback indicator"
    >
      {children}
    </div>
  );
};

/**
 * Props for the DropFeedbackTooltip component.
 */
export interface DropFeedbackTooltipProps {
  /** Message to display in the tooltip */
  message: string;
  /** Type of feedback affecting tooltip styling */
  feedbackType: DropFeedbackType;
  /** Whether the tooltip is visible */
  visible?: boolean;
  /** Optional className for styling overrides */
  className?: string;
  /** Optional test ID for testing */
  testId?: string;
}

/**
 * Tooltip component that displays feedback messages during drop operations.
 * 
 * Shows contextual messages with icons and styling based on feedback type.
 * Automatically positions itself to avoid screen edges.
 * 
 * @param props - Component props
 * @returns React component
 */
export const DropFeedbackTooltip: React.FC<DropFeedbackTooltipProps> = ({
  message,
  feedbackType,
  visible = true,
  className,
  testId,
}) => {
  if (!visible || !message) {
    return null;
  }

  const getIcon = () => {
    switch (feedbackType) {
      case 'valid':
        return '✓';
      case 'invalid':
        return '✗';
      case 'warning':
        return '⚠';
      case 'blocked':
        return '🔒';
      default:
        return '';
    }
  };

  const getTooltipStyles = () => {
    switch (feedbackType) {
      case 'valid':
        return 'bg-green-600 text-white border-green-700';
      case 'invalid':
        return 'bg-red-600 text-white border-red-700';
      case 'warning':
        return 'bg-amber-500 text-white border-amber-600';
      case 'blocked':
        return 'bg-gray-600 text-white border-gray-700';
      default:
        return 'bg-gray-600 text-white border-gray-700';
    }
  };

  return (
    <div
      className={clsx(
        'absolute z-50 px-2 py-1 rounded text-xs font-medium border shadow-lg pointer-events-none',
        getTooltipStyles(),
        'animate-fade-in',
        className
      )}
      data-testid={testId}
      role="tooltip"
    >
      <span className="mr-1">{getIcon()}</span>
      <span className="truncate max-w-32">{message}</span>
    </div>
  );
};

/**
 * Props for the DropFeedbackIndicator component.
 */
export interface DropFeedbackIndicatorProps {
  /** Type of feedback to display */
  feedbackType: DropFeedbackType;
  /** Whether the indicator is pulsing */
  pulsing?: boolean;
  /** Size of the indicator */
  size?: 'sm' | 'md' | 'lg';
  /** Optional className for styling overrides */
  className?: string;
  /** Optional test ID for testing */
  testId?: string;
}

/**
 * Small indicator component that shows feedback state with colors and animations.
 * 
 * Renders a small dot or circle that changes color and animation based on
 * the feedback type. Useful for compact UI elements where full overlays
 * would be too intrusive.
 * 
 * @param props - Component props
 * @returns React component
 */
export const DropFeedbackIndicator: React.FC<DropFeedbackIndicatorProps> = ({
  feedbackType,
  pulsing = false,
  size = 'md',
  className,
  testId,
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'w-2 h-2';
      case 'md':
        return 'w-3 h-3';
      case 'lg':
        return 'w-4 h-4';
      default:
        return 'w-3 h-3';
    }
  };

  const getColorStyles = () => {
    switch (feedbackType) {
      case 'valid':
        return 'bg-green-500';
      case 'invalid':
        return 'bg-red-500';
      case 'warning':
        return 'bg-amber-500';
      case 'blocked':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div
      className={clsx(
        'rounded-full border-2 border-white shadow-sm',
        getSizeStyles(),
        getColorStyles(),
        pulsing && 'animate-pulse',
        className
      )}
      data-testid={testId}
      role="presentation"
      aria-label={`Drop feedback: ${feedbackType}`}
    />
  );
};

/**
 * Props for the DropFeedbackContainer component.
 */
export interface DropFeedbackContainerProps {
  /** Whether drag is currently active */
  isDragActive?: boolean;
  /** Current feedback type */
  feedbackType?: DropFeedbackType;
  /** Feedback message to display */
  message?: string;
  /** Whether to show tooltip */
  showTooltip?: boolean;
  /** Whether to show indicator */
  showIndicator?: boolean;
  /** Visual styling for the feedback */
  visuals?: DropFeedbackVisuals;
  /** Children to render inside the container */
  children: React.ReactNode;
  /** Optional className for styling overrides */
  className?: string;
  /** Optional test ID for testing */
  testId?: string;
}

/**
 * Container component that combines all feedback elements.
 * 
 * Provides a complete feedback solution with overlay, tooltip, and indicator
 * components. Automatically handles visibility and positioning based on the
 * drag state and feedback type.
 * 
 * @param props - Component props
 * @returns React component
 */
export const DropFeedbackContainer: React.FC<DropFeedbackContainerProps> = ({
  isDragActive = false,
  feedbackType = 'valid',
  message,
  showTooltip = true,
  showIndicator = true,
  visuals,
  children,
  className,
  testId,
}) => {
  const shouldShowFeedback = isDragActive && feedbackType !== 'valid';

  return (
    <div
      className={clsx('relative', className)}
      data-testid={testId}
    >
      {/* Main content */}
      {children}

      {/* Visual overlay */}
      {visuals && (
        <DropFeedbackOverlay
          visuals={visuals}
          visible={shouldShowFeedback}
          testId={`${testId}-overlay`}
        />
      )}

      {/* Tooltip */}
      {showTooltip && message && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
          <DropFeedbackTooltip
            message={message}
            feedbackType={feedbackType}
            visible={shouldShowFeedback}
            testId={`${testId}-tooltip`}
          />
        </div>
      )}

      {/* Indicator */}
      {showIndicator && (
        <div className="absolute -top-2 -right-2">
          <DropFeedbackIndicator
            feedbackType={feedbackType}
            pulsing={shouldShowFeedback}
            size="sm"
            testId={`${testId}-indicator`}
          />
        </div>
      )}
    </div>
  );
};

/**
 * CSS animation keyframes for drop feedback.
 * 
 * These should be included in your global CSS or Tailwind config
 * to enable the animations used by the feedback components.
 */
export const dropFeedbackAnimations = `
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes drop-valid-pulse {
  0%, 100% {
    opacity: 0.8;
  }
  50% {
    opacity: 1;
  }
}

@keyframes drop-invalid-shake {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-2px);
  }
  75% {
    transform: translateX(2px);
  }
}

@keyframes drop-warning-pulse {
  0%, 100% {
    opacity: 0.7;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
}

@keyframes drop-blocked-fade {
  from {
    opacity: 0.6;
  }
  to {
    opacity: 0.3;
  }
}

.animate-fade-in {
  animation: fade-in 0.2s ease-out;
}

.animate-drop-valid-pulse {
  animation: drop-valid-pulse 1s ease-in-out infinite;
}

.animate-drop-invalid-shake {
  animation: drop-invalid-shake 0.3s ease-in-out;
}

.animate-drop-warning-pulse {
  animation: drop-warning-pulse 1.5s ease-in-out infinite;
}

.animate-drop-blocked-fade {
  animation: drop-blocked-fade 0.2s ease-in-out;
}
`;

/**
 * Props for the HUDSignal component.
 */
export interface HUDSignalProps {
  /** Signal type */
  type: 'success' | 'warning' | 'error' | 'info';
  /** Message to display */
  message: string;
  /** Whether to show the signal */
  show: boolean;
  /** Custom CSS classes */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

/**
 * HUD signal for map-wide notifications.
 */
export function HUDSignal({
  type,
  message,
  show,
  className,
  testId,
}: HUDSignalProps) {
  if (!show) {
    return null;
  }

  const typeConfig = {
    success: 'bg-green-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500',
    info: 'bg-gray-500',
  }[type];

  return (
    <div
      data-testid={testId || 'hud-signal'}
      className={clsx(
        'fixed z-50 top-4 right-4 px-4 py-3 rounded-lg shadow-lg',
        'transition-all duration-300 ease-out',
        'animate-pulse',
        typeConfig[type],
        className
      )}
    >
      <div className="flex items-center gap-3">
        <span className="text-lg" aria-hidden>
          {type === 'success' && '✓'}
          {type === 'warning' && '⚠'}
          {type === 'error' && '✗'}
          {type === 'info' && 'ℹ'}
        </span>
        <span className="font-medium">
          {message}
        </span>
      </div>
    </div>
  );
}

/**
 * Props for the DropFeedbackHUD component.
 */
export interface DropFeedbackHUDProps {
  /** Validation results to display */
  validationResults: DropValidationResult[];
  /** Whether to show HUD signals */
  showSignals: boolean;
  /** Custom CSS classes */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

/**
 * HUD component that manages multiple drop feedback signals.
 */
export function DropFeedbackHUD({
  validationResults,
  showSignals,
  className,
  testId,
}: DropFeedbackHUDProps) {
  if (!showSignals) {
    return null;
  }

  // Show only the most recent failed validation
  const latestFailed = validationResults
    .filter(result => !result.isValid)
    .slice(-1)[0];

  if (!latestFailed) {
    return null;
  }

  return (
    <div data-testid={testId || 'drop-feedback-hud'} className={className}>
      <HUDSignal
        type={latestFailed.failedRule === 'fatigue_threshold' ? 'warning' : 'error'}
        message={latestFailed.message || 'Drop validation failed'}
        show={true}
      />
    </div>
  );
}

export default {
  DropFeedbackOverlay,
  DropFeedbackTooltip,
  DropFeedbackIndicator,
  DropFeedbackContainer,
  DropFeedbackHUD,
};
