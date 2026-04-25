/**
 * Tutorial Skip Prompt Component - NP-219
 * 
 * Modal component for tutorial skip decision with progress preservation.
 * 
 * @since 2026-01-24
 */

import React, { useState, useEffect } from 'react';
import {
  DEFAULT_TUTORIAL_SKIP_CONFIG,
  type TutorialSkipConfig,
  type SkipDecision,
  type SkipReason,
  type ExperienceLevel,
  formatSessionCount,
  formatTime,
} from '../config/tutorialSkipConfig';

/**
 * Component props
 */
interface TutorialSkipPromptProps {
  tutorialId: string;
  experienceLevel: ExperienceLevel;
  sessionCount: number;
  completionCount: number;
  timeInSession: number;
  customTitle?: string;
  customMessage?: string;
  onDecision: (decision: SkipDecision, reason?: SkipReason) => void;
  onClose?: () => void;
  className?: string;
  config?: Partial<TutorialSkipConfig>;
}

/**
 * Skip reason options
 */
const SKIP_REASONS: { [key in SkipReason]: string } = {
  returning_user: "I've played this before",
  experienced_player: "I'm experienced with this game",
  already_completed: "I already completed this tutorial",
  time_pressure: "I want to skip for now",
  not_interested: "Not interested in this tutorial",
  technical_issue: "Technical issues with tutorial",
  other: "Other reason",
};

/**
 * Experience level descriptions
 */
const EXPERIENCE_DESCRIPTIONS: { [key in ExperienceLevel]: string } = {
  new: "New Player",
  returning: "Returning Player",
  experienced: "Experienced Player",
  expert: "Expert Player",
};

/**
 * Tutorial Skip Prompt Component
 */
export function TutorialSkipPrompt({
  tutorialId,
  experienceLevel,
  sessionCount,
  completionCount,
  timeInSession,
  customTitle,
  customMessage,
  onDecision,
  onClose,
  className = '',
  config = {},
}: TutorialSkipPromptProps) {
  const fullConfig = { ...DEFAULT_TUTORIAL_SKIP_CONFIG, ...config };
  const [selectedReason, setSelectedReason] = useState<SkipReason | null>(null);
  const [showCustomReason, setShowCustomReason] = useState(false);
  const [customReasonText, setCustomReasonText] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  // Handle animation on mount/config changes without synchronous state updates inside effect
  useEffect(() => {
    const animationFrame = requestAnimationFrame(() => setIsAnimating(true));
    const timer = setTimeout(() => setIsAnimating(false), fullConfig.ui.animationDuration);

    return () => {
      cancelAnimationFrame(animationFrame);
      clearTimeout(timer);
      setIsAnimating(false);
    };
  }, [fullConfig.ui.animationDuration]);

  const handleSkip = () => {
    const reason = selectedReason || (showCustomReason ? 'other' as SkipReason : 'returning_user');
    onDecision('skip', reason);
  };

  const handlePlay = () => {
    onDecision('play');
  };

  const handleDefer = () => {
    onDecision('defer');
  };

  const handleReasonSelect = (reason: SkipReason) => {
    if (reason === 'other') {
      setShowCustomReason(true);
    } else {
      setSelectedReason(reason);
      setShowCustomReason(false);
    }
  };

  const handleCustomReasonSubmit = () => {
    if (customReasonText.trim()) {
      setSelectedReason('other');
      setShowCustomReason(false);
    }
  };

  const handleCustomReasonCancel = () => {
    setShowCustomReason(false);
    setCustomReasonText('');
    setSelectedReason(null);
  };

  const handleClose = () => {
    if (isAnimating) return; // Prevent closing during animation
    onClose?.();
  };

  const title = customTitle || `Skip Tutorial?`;
  const message = customMessage || `Based on your experience (${formatSessionCount(sessionCount)}), would you like to skip this tutorial?`;

  const modalStyle = fullConfig.ui.modalStyle;

  return (
    <div
      className={`tutorial-skip-prompt ${modalStyle} ${className} ${isAnimating ? 'animating' : ''}`}
      data-tutorial-id={tutorialId}
    >
      <div className="skip-prompt-overlay" onClick={handleClose}>
        <div className="skip-prompt-modal" onClick={(e) => e.stopPropagation()}>
          <div className="skip-prompt-header">
            <h2 className="skip-prompt-title">{title}</h2>
            <button
              className="skip-prompt-close"
              onClick={handleClose}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="skip-prompt-content">
            <div className="skip-prompt-message">
              {message}
            </div>

            {fullConfig.ui.showExperienceLevel && (
              <div className="skip-prompt-experience">
                <span className="experience-badge">
                  {EXPERIENCE_DESCRIPTIONS[experienceLevel]}
                </span>
              </div>
            )}

            {fullConfig.ui.showSessionCount && (
              <div className="skip-prompt-stats">
                <div className="stat-item">
                  <span className="stat-label">Sessions:</span>
                  <span className="stat-value">{sessionCount}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Completions:</span>
                  <span className="stat-value">{completionCount}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Time:</span>
                  <span className="stat-value">{formatTime(timeInSession)}</span>
                </div>
              </div>
            )}

            {fullConfig.ui.showProgressBar && (
              <div className="skip-prompt-progress">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.min((completionCount / Math.max(sessionCount, 1)) * 100, 100)}%`,
                    }}
                  />
                </div>
                <div className="progress-text">
                  {completionCount} / {Math.max(sessionCount, 1)} completed
                </div>
              </div>
            )}
          </div>

          <div className="skip-prompt-reason">
            <h3>Why skip this tutorial?</h3>
            <div className="reason-options">
              {Object.entries(SKIP_REASONS).map(([key, label]) => (
                <button
                  key={key}
                  className={`reason-option ${selectedReason === key ? 'selected' : ''}`}
                  onClick={() => handleReasonSelect(key as SkipReason)}
                >
                  <span className="reason-icon">
                    {key === 'returning_user' && '🔄'}
                    {key === 'experienced_player' && '🎮'}
                    {key === 'already_completed' && '✅'}
                    {key === 'time_pressure' && '⏱️'}
                    {key === 'not_interested' && '🚫'}
                    {key === 'technical_issue' && '⚠️'}
                    {key === 'other' && '📝'}
                  </span>
                  <span className="reason-text">{label}</span>
                </button>
              ))}
            </div>

            {showCustomReason && (
              <div className="custom-reason">
                <textarea
                  className="custom-reason-input"
                  placeholder="Please explain why you want to skip..."
                  value={customReasonText}
                  onChange={(e) => setCustomReasonText(e.target.value)}
                  rows={3}
                />
                <div className="custom-reason-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={handleCustomReasonCancel}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleCustomReasonSubmit}
                    disabled={!customReasonText.trim()}
                  >
                    Submit
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="skip-prompt-actions">
            <div className="action-buttons">
              <button
                className="btn btn-secondary"
                onClick={handleSkip}
                disabled={!selectedReason && !showCustomReason}
              >
                Skip Tutorial
              </button>
              <button
                className="btn btn-primary"
                onClick={handlePlay}
              >
                Play Tutorial
              </button>
            </div>

            {fullConfig.prompt.allowDefer && (
              <div className="defer-option">
                <button
                  className="btn btn-outline"
                  onClick={handleDefer}
                >
                  Ask Me Later
                </button>
              </div>
            )}

            {fullConfig.prompt.allowForcePlay && (
              <div className="force-play-option">
                <button
                  className="btn btn-outline"
                  onClick={handlePlay}
                >
                  Force Play
                </button>
              </div>
            )}
          </div>

          {fullConfig.replay.showReplayOption && (
            <div className="replay-option">
              <p className="replay-text">
                You can replay this tutorial anytime from the settings menu.
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .tutorial-skip-prompt {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(4px);
          animation: fadeIn 0.3s ease-out;
        }

        .tutorial-skip-prompt.animating {
          animation: slideUp 0.3s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .skip-prompt-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: transparent;
        }

        .skip-prompt-modal {
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          animation: slideUp 0.3s ease-out;
        }

        .skip-prompt-modal.modal {
          margin: auto;
        }

        .skip-prompt-modal.overlay {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(8px);
        }

        .skip-prompt-modal.sidebar {
          height: 100vh;
          max-width: 400px;
          border-radius: 0;
        }

        .skip-prompt-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e5e7eb;
        }

        .skip-prompt-title {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937b;
        }

        .skip-prompt-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          color: #6b7280;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: background-color 0.2s;
        }

        .skip-prompt-close:hover {
          background-color: #f3f4f6;
        }

        .skip-prompt-content {
          padding: 24px;
        }

        .skip-prompt-message {
          font-size: 1rem;
          color: #4b5563;
          line-height: 1.5;
          margin-bottom: 16px;
        }

        .skip-prompt-experience {
          margin-bottom: 16px;
        }

        .experience-badge {
          display: inline-block;
          padding: 4px 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .skip-prompt-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 12px;
          margin-bottom: 16px;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .stat-label {
          font-size: 0.75rem;
          color: #6b7280;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .stat-value {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1f2937b;
        }

        .skip-prompt-progress {
          margin-bottom: 16px;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background-color: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #10b981 0%, #059669 100%);
          border-radius: 4px;
          transition: width 0.3s ease-out;
        }

        .progress-text {
          font-size: 0.875rem;
          color: #6b7280;
          text-align: center;
        }

        .skip-prompt-reason {
          margin-bottom: 20px;
        }

        .skip-prompt-reason h3 {
          margin: 0 0 12px 0;
          font-size: 1rem;
          font-weight: 600;
          color: #374151;
        }

        .reason-options {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 8px;
        }

        .reason-option {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .reason-option:hover {
          border-color: #3b82f6;
          background-color: #f8fafc;
        }

        .reason-option.selected {
          border-color: #3b82f6;
          background-color: #dbeafe;
        }

        .reason-icon {
          font-size: 1.25rem;
        }

        .reason-text {
          font-size: 0.875rem;
          color: #374151;
          text-align: left;
        }

        .custom-reason {
          margin-top: 16px;
        }

        .custom-reason-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-family: inherit;
          font-size: 0.875rem;
          resize: vertical;
          min-height: 80px;
        }

        .custom-reason-actions {
          display: flex;
          gap: 8px;
          margin-top: 8px;
          justify-content: flex-end;
        }

        .skip-prompt-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #2563eb;
        }

        .btn-secondary {
          background: #6b7280;
          color: white;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #4b5563;
        }

        .btn-outline {
          background: transparent;
          color: #3b82f6;
          border: 2px solid #3b82f6;
        }

        .btn-outline:hover:not(:disabled) {
          background: #3b82f6;
          color: white;
        }

        .defer-option {
          text-align: center;
        }

        .force-play-option {
          text-align: center;
        }

        .replay-option {
          text-align: center;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
        }

        .replay-text {
          font-size: 0.875rem;
          color: #6b7280;
          font-style: italic;
        }

        @media (max-width: 640px) {
          .skip-prompt-modal {
            width: 95%;
            margin: 20px;
          }
          
          .reason-options {
            grid-template-columns: 1fr;
          }
          
          .action-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
