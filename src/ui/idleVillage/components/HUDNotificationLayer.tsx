/**
 * Active HUD Notification Layer Component
 *
 * Displays notifications in the HUD with config-driven styling and animations.
 * Part of Phase 12 Active HUD system.
 */

import { useMemo } from 'react';
import { useHUDNotifications } from '@/ui/idleVillage/hooks/useHUDNotifications';
import type { HUDNotification } from '@/ui/idleVillage/hooks/useHUDNotifications';
import type { HUDNotificationConfig, HUDNotificationTypeConfig } from '@/balancing/config/idleVillage/hudNotificationConfig';

interface HUDNotificationLayerProps {
  /** Notification config */
  config: HUDNotificationConfig;
  /** Test mode flag */
  testMode?: boolean;
}

/**
 * Individual notification item component
 */
function HUDNotificationItem({
  notification,
  config,
  typeConfig,
  onDismiss,
  index,
}: {
  notification: HUDNotification;
  config: HUDNotificationConfig;
  typeConfig: HUDNotificationTypeConfig;
  onDismiss: (id: string) => void;
  index: number;
}) {
  const animationDelay = config.animation.staggerDelayMs * index;

  return (
    <div
      className={`relative overflow-hidden rounded-lg border-2 shadow-lg transition-all duration-300 ease-out ${
        notification.isDismissing
          ? 'transform translate-x-full opacity-0'
          : 'transform translate-x-0 opacity-100'
      }`}
      style={{
        backgroundColor: typeConfig.style.backgroundColor,
        borderColor: typeConfig.style.borderColor,
        color: typeConfig.style.textColor,
        borderRadius: typeConfig.style.borderRadius,
        boxShadow: typeConfig.style.boxShadow,
        maxWidth: `${config.layout.maxWidthPx}px`,
        animationDelay: `${animationDelay}ms`,
        transition: `all ${config.animation.exitDurationMs}ms ${config.animation.easing}`,
      }}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-3 p-3">
        {typeConfig.feedback.showIcon && (
          <div className="shrink-0 text-lg" aria-hidden="true">
            {typeConfig.style.icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-tight wrap-break-word">
            {notification.message}
          </p>
          {notification.metadata?.details && (
            <p className="mt-1 text-xs opacity-80 leading-tight wrap-break-word">
              {notification.metadata.details}
            </p>
          )}
        </div>
        {typeConfig.dismiss.clickToDismiss && (
          <button
            type="button"
            className="shrink-0 p-1 rounded-full hover:bg-black/20 transition-colors"
            onClick={() => onDismiss(notification.id)}
            aria-label="Dismiss notification"
          >
            <span className="text-sm" aria-hidden="true">
              ✕
            </span>
          </button>
        )}
      </div>

      {/* Progress bar for auto-dismissing notifications */}
      {!notification.isDismissing && typeConfig.dismiss.autoDismiss && typeConfig.durationMs && (
        <div
          className="absolute bottom-0 left-0 h-1 bg-white/30 transition-all duration-100 ease-linear"
          style={{
            width: '100%',
            transformOrigin: 'left',
            animation: `notification-progress ${typeConfig.durationMs}ms linear forwards`,
          }}
        />
      )}
    </div>
  );
}

/**
 * Main HUD Notification Layer component
 */
export function HUDNotificationLayer({ config, testMode: _testMode = false }: HUDNotificationLayerProps) {
  const { notifications, dismissNotification } = useHUDNotifications(config);

  // Get position styles
  const positionStyles = useMemo(() => {
    const { position, marginPx } = config.layout;
    const baseStyles = {
      position: 'fixed' as const,
      zIndex: 1000,
    };

    switch (position) {
      case 'top-right':
        return {
          ...baseStyles,
          top: `${marginPx}px`,
          right: `${marginPx}px`,
        };
      case 'bottom-right':
        return {
          ...baseStyles,
          bottom: `${marginPx}px`,
          right: `${marginPx}px`,
        };
      case 'top-left':
        return {
          ...baseStyles,
          top: `${marginPx}px`,
          left: `${marginPx}px`,
        };
      case 'bottom-left':
        return {
          ...baseStyles,
          bottom: `${marginPx}px`,
          left: `${marginPx}px`,
        };
      default:
        return {
          ...baseStyles,
          top: `${marginPx}px`,
          right: `${marginPx}px`,
        };
    }
  }, [config.layout]);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div
      className="pointer-events-none"
      style={positionStyles}
      data-testid="hud-notification-layer"
    >
      <div
        className="flex flex-col gap-2"
        style={{
          gap: `${config.layout.gapPx}px`,
        }}
      >
        {notifications.map((notification, index) => {
          const typeConfig = config.types[notification.type];
          if (!typeConfig) {
            console.warn(`Unknown notification type: ${notification.type}`);
            return null;
          }

          return (
            <div key={notification.id} className="pointer-events-auto">
              <HUDNotificationItem
                notification={notification}
                config={config}
                typeConfig={typeConfig}
                onDismiss={dismissNotification}
                index={index}
              />
            </div>
          );
        })}
      </div>

      {/* CSS for progress bar animation */}
      <style jsx>{`
        @keyframes notification-progress {
          from {
            transform: scaleX(1);
          }
          to {
            transform: scaleX(0);
          }
        }
      `}</style>
    </div>
  );
}
