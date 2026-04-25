/**
 * Quest Card Component
 * 
 * Displays quest with skill requirements, rewards, and risk indicators.
 * Integrates with drag & drop for resident assignment.
 * 
 * @module QuestCard
 */

import React, { useMemo } from 'react';
import type { JSX } from 'react';
import type { QuestConfig, SkillCheck } from '../../../balancing/config/idleVillage/types/questTypes';
import { validateSkillCheck } from '../../../engine/game/idleVillage/QuestEngine';
import type { ResidentStats } from '../../../engine/game/idleVillage/QuestEngine';

/**
 * Props for QuestCard component
 */
export interface QuestCardProps {
  /** Quest configuration */
  config: QuestConfig;
  /** Currently assigned residents */
  assignedResidents: ResidentStats[];
  /** Quest progress (0-1) */
  progress?: number;
  /** Whether quest is on cooldown */
  onCooldown?: boolean;
  /** Cooldown remaining in hours */
  cooldownHours?: number;
  /** Callback when quest is started */
  onStart?: () => void;
  /** Whether the card is in compact mode */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Skill Check Display Component
 */
interface SkillCheckDisplayProps {
  skillCheck: SkillCheck;
  residents: ResidentStats[];
  compact: boolean;
}

function SkillCheckDisplay({ skillCheck, residents, compact }: SkillCheckDisplayProps): JSX.Element {
  const passed = residents.some((r) => validateSkillCheck(r, skillCheck.requirements));
  
  return (
    <div
      style={{
        padding: compact ? '6px' : '8px',
        backgroundColor: passed ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
        borderLeft: `3px solid ${passed ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'}`,
        borderRadius: '4px',
        marginBottom: '6px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '4px',
        }}
      >
        <span style={{ fontSize: compact ? '14px' : '16px' }}>
          {passed ? '✓' : '✗'}
        </span>
        <span
          style={{
            fontSize: compact ? '12px' : '13px',
            fontWeight: 600,
            color: passed ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
          }}
        >
          {skillCheck.name}
        </span>
      </div>
      <div
        style={{
          fontSize: compact ? '10px' : '11px',
          color: 'rgba(240, 239, 228, 0.7)',
          marginLeft: compact ? '20px' : '22px',
        }}
      >
        {skillCheck.requirements.map((req, idx) => (
          <div key={idx}>
            {req.statId}: {req.minValue}+
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Quest Card Component
 * 
 * Displays quest with:
 * - Skill requirement checks with pass/fail indicators
 * - Reward preview
 * - Risk indicators (injury/death %)
 * - Progress bar for active quests
 * - Start button with validation
 * 
 * Uses config-first design with no hardcoded values.
 */
export function QuestCard({
  config,
  assignedResidents,
  progress = 0,
  onCooldown = false,
  cooldownHours = 0,
  onStart,
  compact = false,
  className = '',
}: QuestCardProps): JSX.Element {
  // Check if all skill checks pass
  const allChecksPassed = useMemo(() => {
    return config.skillChecks.every((check) =>
      assignedResidents.some((r) => validateSkillCheck(r, check.requirements))
    );
  }, [config.skillChecks, assignedResidents]);

  const canStart = assignedResidents.length > 0 && 
                   assignedResidents.length <= config.maxParticipants &&
                   allChecksPassed &&
                   !onCooldown;

  return (
    <div
      className={`quest-card ${className}`}
      style={{
        backgroundColor: config.visual.backgroundColor,
        borderColor: config.visual.color,
        borderWidth: '2px',
        borderStyle: 'solid',
        borderRadius: '8px',
        padding: compact ? '12px' : '16px',
        minWidth: compact ? '280px' : '360px',
        maxWidth: '480px',
        opacity: onCooldown ? 0.6 : 1,
      }}
      role="region"
      aria-label={`${config.name} quest`}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px',
        }}
      >
        <span
          style={{
            fontSize: compact ? '24px' : '32px',
          }}
          role="img"
          aria-label={`${config.category} quest`}
        >
          {config.visual.icon}
        </span>
        <div style={{ flex: 1 }}>
          <h3
            style={{
              margin: 0,
              fontSize: compact ? '14px' : '16px',
              fontWeight: 600,
              color: config.visual.color,
            }}
          >
            {config.name}
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: compact ? '10px' : '11px',
              color: 'rgba(240, 239, 228, 0.7)',
            }}
          >
            {config.category} • {config.durationHours}h
          </p>
        </div>
      </div>

      {/* Description */}
      <p
        style={{
          fontSize: compact ? '11px' : '12px',
          color: 'rgba(240, 239, 228, 0.8)',
          marginBottom: '12px',
          lineHeight: 1.4,
        }}
      >
        {config.description}
      </p>

      {/* Skill Checks */}
      <div style={{ marginBottom: '12px' }}>
        <div
          style={{
            fontSize: '10px',
            color: 'rgba(240, 239, 228, 0.6)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '6px',
          }}
        >
          Skill Requirements
        </div>
        {config.skillChecks.map((check) => (
          <SkillCheckDisplay
            key={check.id}
            skillCheck={check}
            residents={assignedResidents}
            compact={compact}
          />
        ))}
      </div>

      {/* Rewards */}
      <div
        style={{
          padding: '8px',
          backgroundColor: 'rgba(201, 162, 39, 0.1)',
          borderRadius: '4px',
          marginBottom: '12px',
        }}
      >
        <div
          style={{
            fontSize: '10px',
            color: 'rgba(240, 239, 228, 0.6)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '4px',
          }}
        >
          Rewards
        </div>
        <div
          style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            fontSize: compact ? '11px' : '12px',
          }}
        >
          {config.rewards.gold && (
            <span style={{ color: 'rgb(201, 162, 39)' }}>
              💰 {config.rewards.gold}g
            </span>
          )}
          {config.rewards.experience && (
            <span style={{ color: 'rgb(141, 179, 165)' }}>
              ⭐ {config.rewards.experience} XP
            </span>
          )}
          {config.rewards.items && Object.keys(config.rewards.items).length > 0 && (
            <span style={{ color: 'rgb(168, 85, 247)' }}>
              📦 {Object.keys(config.rewards.items).length} items
            </span>
          )}
        </div>
      </div>

      {/* Risks */}
      <div
        style={{
          padding: '8px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderRadius: '4px',
          marginBottom: '12px',
        }}
      >
        <div
          style={{
            fontSize: '10px',
            color: 'rgba(240, 239, 228, 0.6)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '4px',
          }}
        >
          Risks
        </div>
        <div
          style={{
            display: 'flex',
            gap: '12px',
            fontSize: compact ? '11px' : '12px',
          }}
        >
          <span style={{ color: 'rgb(251, 191, 36)' }}>
            ⚠️ Injury: {Math.floor(config.risks.injuryChance * 100)}%
          </span>
          <span style={{ color: 'rgb(239, 68, 68)' }}>
            💀 Death: {Math.floor(config.risks.deathChance * 100)}%
          </span>
          <span style={{ color: 'rgba(240, 239, 228, 0.7)' }}>
            😴 Fatigue: {config.risks.fatigueCost}
          </span>
        </div>
      </div>

      {/* Progress Bar (if in progress) */}
      {progress > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div
            style={{
              fontSize: '10px',
              color: 'rgba(240, 239, 228, 0.6)',
              marginBottom: '4px',
            }}
          >
            Progress: {Math.floor(progress * 100)}%
          </div>
          <div
            style={{
              height: '8px',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progress * 100}%`,
                backgroundColor: config.visual.color,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      )}

      {/* Cooldown Display */}
      {onCooldown && (
        <div
          style={{
            padding: '6px 8px',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '4px',
            marginBottom: '12px',
            fontSize: compact ? '11px' : '12px',
            color: 'rgba(240, 239, 228, 0.7)',
            textAlign: 'center',
          }}
        >
          ⏳ Cooldown: {Math.ceil(cooldownHours)}h remaining
        </div>
      )}

      {/* Participants Display */}
      <div
        style={{
          marginBottom: '12px',
          fontSize: compact ? '11px' : '12px',
          color: 'rgba(240, 239, 228, 0.7)',
        }}
      >
        Participants: {assignedResidents.length}/{config.maxParticipants}
      </div>

      {/* Start Button */}
      <button
        onClick={onStart}
        disabled={!canStart}
        style={{
          width: '100%',
          padding: compact ? '8px 16px' : '10px 20px',
          backgroundColor: canStart ? config.visual.color : 'rgba(240, 239, 228, 0.1)',
          color: canStart ? '#050509' : 'rgba(240, 239, 228, 0.3)',
          border: 'none',
          borderRadius: '4px',
          fontSize: compact ? '13px' : '14px',
          fontWeight: 600,
          cursor: canStart ? 'pointer' : 'not-allowed',
          opacity: canStart ? 1 : 0.5,
          transition: 'all 0.2s ease',
        }}
        aria-label={`Start ${config.name} quest`}
      >
        {onCooldown ? 'On Cooldown' : canStart ? 'Start Quest' : 'Requirements Not Met'}
      </button>

      {/* Validation Messages */}
      {!allChecksPassed && assignedResidents.length > 0 && (
        <div
          style={{
            marginTop: '8px',
            fontSize: '10px',
            color: 'rgb(239, 68, 68)',
            textAlign: 'center',
          }}
        >
          ⚠️ Some skill requirements not met
        </div>
      )}
    </div>
  );
}

export default QuestCard;
