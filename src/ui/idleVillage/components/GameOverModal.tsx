/**
 * Game Over Modal Component
 * 
 * Displays game over screen with statistics and restart option.
 * Uses blur backdrop and GPU-optimized animations.
 * 
 * @module GameOverModal
 */

import React from 'react';
import type { JSX } from 'react';
import type { GameOverState } from '../../../balancing/config/idleVillage/types/survivalTypes';

/**
 * Props for GameOverModal component
 */
export interface GameOverModalProps {
  /** Game over state */
  gameOverState: GameOverState;
  /** Callback when restart is clicked */
  onRestart?: () => void;
  /** Whether restart is allowed */
  allowRestart?: boolean;
  /** Whether to show statistics */
  showStatistics?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Game Over Modal Component
 * 
 * Displays:
 * - Game over message based on reason
 * - Final statistics (days survived, resources, etc.)
 * - Restart button
 * 
 * Uses GPU-optimized CSS with blur backdrop.
 */
export function GameOverModal({
  gameOverState,
  onRestart,
  allowRestart = true,
  showStatistics = true,
  className = '',
}: GameOverModalProps): JSX.Element | null {
  if (!gameOverState.isGameOver) {
    return null;
  }

  const getReasonMessage = (): { title: string; description: string; icon: string } => {
    switch (gameOverState.reason) {
      case 'starvation':
        return {
          title: 'Starvation',
          description: 'Your village ran out of food and could not survive.',
          icon: '💀',
        };
      case 'total_wipeout':
        return {
          title: 'Total Wipeout',
          description: 'All residents have perished. The village is no more.',
          icon: '⚰️',
        };
      case 'manual_quit':
        return {
          title: 'Game Ended',
          description: 'You chose to end the game.',
          icon: '🚪',
        };
      default:
        return {
          title: 'Game Over',
          description: 'The game has ended.',
          icon: '🏁',
        };
    }
  };

  const reasonInfo = getReasonMessage();

  return (
    <div
      className={`game-over-modal ${className}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        // Blur backdrop - GPU optimized
        backdropFilter: 'blur(12px)',
        backgroundColor: 'rgba(5, 5, 9, 0.85)',
        animation: 'game-over-fade-in 0.5s ease-out',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-over-title"
    >
      {/* Modal Content */}
      <div
        style={{
          backgroundColor: 'rgb(15, 26, 29)',
          border: '3px solid rgb(239, 68, 68)',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          animation: 'game-over-scale-in 0.5s ease-out',
        }}
      >
        {/* Icon */}
        <div
          style={{
            textAlign: 'center',
            fontSize: '64px',
            marginBottom: '16px',
            animation: 'game-over-icon-bounce 1s ease-out',
          }}
          role="img"
          aria-label={reasonInfo.title}
        >
          {reasonInfo.icon}
        </div>

        {/* Title */}
        <h2
          id="game-over-title"
          style={{
            margin: 0,
            marginBottom: '8px',
            fontSize: '32px',
            fontWeight: 700,
            color: 'rgb(239, 68, 68)',
            textAlign: 'center',
            textTransform: 'uppercase',
            letterSpacing: '2px',
          }}
        >
          Game Over
        </h2>

        {/* Reason */}
        <h3
          style={{
            margin: 0,
            marginBottom: '16px',
            fontSize: '20px',
            fontWeight: 600,
            color: 'rgb(240, 239, 228)',
            textAlign: 'center',
          }}
        >
          {reasonInfo.title}
        </h3>

        {/* Description */}
        <p
          style={{
            margin: 0,
            marginBottom: '24px',
            fontSize: '14px',
            color: 'rgba(240, 239, 228, 0.8)',
            textAlign: 'center',
            lineHeight: 1.5,
          }}
        >
          {reasonInfo.description}
        </p>

        {/* Statistics */}
        {showStatistics && gameOverState.finalStats && (
          <div
            style={{
              padding: '16px',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '8px',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                fontSize: '12px',
                color: 'rgba(240, 239, 228, 0.6)',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '12px',
                textAlign: 'center',
              }}
            >
              Final Statistics
            </div>

            {/* Stats Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
              }}
            >
              {/* Days Survived */}
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: 'rgb(141, 179, 165)',
                  }}
                >
                  {gameOverState.daysSurvived ?? 0}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: 'rgba(240, 239, 228, 0.7)',
                  }}
                >
                  Days Survived
                </div>
              </div>

              {/* Food Consumed */}
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: 'rgb(251, 191, 36)',
                  }}
                >
                  {Math.floor(gameOverState.finalStats.totalFoodConsumed)}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: 'rgba(240, 239, 228, 0.7)',
                  }}
                >
                  Food Consumed
                </div>
              </div>

              {/* Gold Earned */}
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: 'rgb(201, 162, 39)',
                  }}
                >
                  {gameOverState.finalStats.totalGoldEarned}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: 'rgba(240, 239, 228, 0.7)',
                  }}
                >
                  Gold Earned
                </div>
              </div>

              {/* Quests Completed */}
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: 'rgb(168, 85, 247)',
                  }}
                >
                  {gameOverState.finalStats.totalQuestsCompleted}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: 'rgba(240, 239, 228, 0.7)',
                  }}
                >
                  Quests Completed
                </div>
              </div>
            </div>

            {/* Residents Lost */}
            {gameOverState.finalStats.residentsLost > 0 && (
              <div
                style={{
                  marginTop: '12px',
                  padding: '8px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  borderRadius: '4px',
                  textAlign: 'center',
                }}
              >
                <span
                  style={{
                    fontSize: '14px',
                    color: 'rgb(239, 68, 68)',
                    fontWeight: 600,
                  }}
                >
                  💀 {gameOverState.finalStats.residentsLost} Residents Lost
                </span>
              </div>
            )}
          </div>
        )}

        {/* Restart Button */}
        {allowRestart && (
          <button
            onClick={onRestart}
            style={{
              width: '100%',
              padding: '14px 24px',
              backgroundColor: 'rgb(141, 179, 165)',
              color: '#050509',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 700,
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              transition: 'all 0.2s ease',
              transform: 'scale(1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.backgroundColor = 'rgb(161, 199, 185)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.backgroundColor = 'rgb(141, 179, 165)';
            }}
            aria-label="Restart game"
          >
            🔄 Restart Game
          </button>
        )}
      </div>

      {/* CSS Keyframes */}
      <style>{`
        @keyframes game-over-fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes game-over-scale-in {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes game-over-icon-bounce {
          0%, 100% {
            transform: translateY(0);
          }
          25% {
            transform: translateY(-20px);
          }
          50% {
            transform: translateY(-10px);
          }
          75% {
            transform: translateY(-5px);
          }
        }
      `}</style>
    </div>
  );
}

export default GameOverModal;
