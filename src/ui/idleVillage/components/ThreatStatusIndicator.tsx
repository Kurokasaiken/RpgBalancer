/**
 * ThreatStatusIndicator
 *
 * A client-only status card for world/presentation threats. Renders an
 * urgency-colored ring, threat icon, type label, countdown and a subtle
 * critical pulse. Styled to match the Wanderlust bronze/obsidian visual
 * grammar used in trailer scenes.
 */

'use client';

import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import {
  DEFAULT_THREAT_STATUS_CONFIG,
  type ThreatStatusConfig,
  type UrgencyLevel,
} from '@/balancing/config/idleVillage/threatStatusConfig';

const RING_RADIUS = 48;
const RING_STROKE = 12;
const RING_CIRCUMFERENCE = Math.PI * 2 * RING_RADIUS;

/**
 * Threat data consumed by {@link ThreatStatusIndicator}.
 */
export interface Threat {
  id: string;
  /** Threat type identifier, e.g. `GOBLIN_RAID`. */
  type: string;
  /** Urgency level that drives color and animation. */
  urgency: UrgencyLevel;
  /** Human-readable remaining time, e.g. `45m`. */
  timeLeft: string;
  /** Optional icon URL; falls back to {@link ThreatStatusConfig.defaultIcon}. */
  icon?: string;
  /** Optional progress percentage (0-100); falls back to the config default. */
  progress?: number;
}

/**
 * Props for {@link ThreatStatusIndicator}.
 */
export interface ThreatStatusIndicatorProps {
  threat: Threat;
  onClick?: () => void;
  className?: string;
  config?: ThreatStatusConfig;
}

/**
 * Renders a threat urgency card with animated progress ring.
 *
 * @param props - Threat indicator props.
 * @returns The rendered card, or `null` when no threat is provided.
 */
export default function ThreatStatusIndicator({
  threat,
  onClick,
  className = '',
  config = DEFAULT_THREAT_STATUS_CONFIG,
}: ThreatStatusIndicatorProps) {
  const { t } = useTranslation('idleVillage');

  if (!threat) {
    return null;
  }

  const urgencyConfig = config.urgencies[threat.urgency];
  const isCritical = threat.urgency === 'CRITICAL';
  const progress = threat.progress ?? config.defaultProgress;
  const iconSrc = threat.icon || config.defaultIcon;
  const label = t(urgencyConfig.labelKey, { defaultValue: threat.urgency });
  const typeLabel = t(`${config.typeLabelPrefix}.${threat.type}`, {
    defaultValue: threat.type.replace(/_/g, ' '),
  });

  const handleClick = () => {
    trackTelemetryEvent('threat_status_click', {
      threatId: threat.id,
      threatType: threat.type,
      urgency: threat.urgency,
      context: 'ThreatStatusIndicator',
    });
    onClick?.();
  };

  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className={`wanderlust-surface relative w-105 cursor-pointer overflow-hidden rounded-2xl border-4 border-[#8b5a2b] bg-[#08121f] shadow-2xl ${className}`}
    >
      {/* Bronze ornate frame simulation */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl border-[6px] border-[#d4af37]" />

      {/* Cracked glass / crystal effect (pure CSS + SVG) */}
      <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-white/10 via-transparent to-transparent opacity-30" />
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 400 140">
        <path
          d="M20 20 Q80 5 120 35 Q180 10 250 40 Q320 15 380 30"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="1.5"
          strokeOpacity="0.15"
        />
        <path
          d="M30 110 Q90 125 150 95 Q220 130 280 105 Q350 120 370 90"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="1"
          strokeOpacity="0.1"
        />
      </svg>

      <div className="relative flex items-center gap-6 p-4">
        {/* POI Ring + Icon */}
        <div className="relative shrink-0">
          <svg width="110" height="110" className="-rotate-90 transform">
            {/* Background ring */}
            <circle
              cx="55"
              cy="55"
              r={RING_RADIUS}
              fill="none"
              stroke="#1f2937"
              strokeWidth={RING_STROKE}
            />
            {/* Progress ring */}
            <motion.circle
              cx="55"
              cy="55"
              r={RING_RADIUS}
              fill="none"
              stroke={urgencyConfig.ringColor}
              strokeWidth={RING_STROKE}
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={RING_CIRCUMFERENCE * (1 - progress / 100)}
              strokeLinecap="round"
              initial={{ strokeDashoffset: RING_CIRCUMFERENCE }}
              animate={{ strokeDashoffset: RING_CIRCUMFERENCE * (1 - progress / 100) }}
              transition={{ duration: 0.8 }}
            />
          </svg>

          {/* Threat icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              src={iconSrc}
              alt={typeLabel}
              className="h-16 w-16 object-contain drop-shadow-xl"
            />
          </div>

          {/* Subtle inner glow */}
          <div className="absolute inset-0 rounded-full border-2 border-white/30" />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="mb-1 font-serif text-xs uppercase tracking-[2px] text-[#d4af37]">
            {t('threatStatus.title', { defaultValue: 'THREAT STATUS' })}
          </div>

          <div className="font-serif text-3xl font-bold tracking-wide text-white drop-shadow-md">
            {typeLabel}
          </div>

          <div className="mt-2 flex items-center gap-3">
            <span
              className="rounded-full border px-4 py-1 text-lg font-bold"
              style={{
                color: urgencyConfig.color,
                borderColor: `${urgencyConfig.color}80`,
                background: `${urgencyConfig.color}15`,
              }}
            >
              {label} &bull; {threat.timeLeft}
            </span>
          </div>
        </div>
      </div>

      {/* Critical pulse overlay */}
      {isCritical && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-red-500"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}
