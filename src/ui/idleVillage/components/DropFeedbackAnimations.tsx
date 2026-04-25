/**
 * Drop Feedback Animations Component
 *
 * Provides CSS-in-JS animations for valid/invalid drop feedback.
 * Integrates with dropFeedbackConfig for bloom and shake effects.
 */

import type { CSSProperties } from 'react';
import { DEFAULT_DROP_FEEDBACK_CONFIG } from '@/ui/idleVillage/config/dropFeedbackConfig';

/**
 * Props for drop feedback animations.
 */
export interface DropFeedbackAnimationsProps {
  /** Current feedback type */
  feedbackType: 'valid' | 'invalid' | 'warning' | 'blocked' | null;
  /** Whether animations are enabled */
  enabled?: boolean;
  /** Custom CSS class name */
  className?: string;
  /** Children to wrap with animations */
  children: React.ReactNode;
}

/**
 * Generates animation styles based on feedback type.
 */
function getAnimationStyles(feedbackType: 'valid' | 'invalid' | 'warning' | 'blocked' | null): CSSProperties {
  if (!feedbackType) {
    return {};
  }

  const config = DEFAULT_DROP_FEEDBACK_CONFIG.visual[feedbackType];
  
  return {
    borderColor: config.borderColor,
    backgroundColor: config.backgroundColor,
    boxShadow: config.boxShadow,
    animation: config.animation,
    position: 'relative' as const,
    transition: 'all 0.2s ease-in-out',
  };
}

/**
 * Drop feedback animations component.
 */
export const DropFeedbackAnimations: React.FC<DropFeedbackAnimationsProps> = ({
  feedbackType,
  enabled = true,
  className,
  children,
}) => {
  if (!enabled || !feedbackType) {
    return <>{children}</>;
  }

  const animationStyles = getAnimationStyles(feedbackType);

  return (
    <div className={className} style={animationStyles}>
      {children}
    </div>
  );
};

/**
 * Global CSS animations for drop feedback.
 * These should be injected once at app startup.
 */
export const DROP_FEEDBACK_CSS = `
@keyframes drop-valid-pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.02);
    opacity: 0.9;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes drop-invalid-shake {
  0%, 100% {
    transform: translateX(0);
  }
  10%, 30%, 50%, 70%, 90% {
    transform: translateX(-2px);
  }
  20%, 40%, 60%, 80% {
    transform: translateX(2px);
  }
}

@keyframes drop-warning-pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.01);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes drop-blocked-fade {
  0% {
    opacity: 0.5;
  }
  100% {
    opacity: 0.5;
  }
}
`;

/**
 * Hook to inject drop feedback CSS animations.
 */
export function useDropFeedbackAnimations(): void {
  // In a real implementation, this would inject the CSS into the document head
  // For now, the CSS should be included in the global styles
}
