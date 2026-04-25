/**
 * AI Tutor Mode UI Components
 *
 * React components for displaying step-by-step AI tutor explanations
 * of drop suggestions in Idle Village Phase E.
 *
 * @module aiTutorUI
 * @since 2026-01-13
 * @author Cascade
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AITutorEngine, createTutorEngine } from '../ai/aiTutorMode';
import type { TutorExplanation, TutorStep } from '../ai/aiTutorMode';
import type { DropSuggestion } from '../ai/dropSuggestionEngine';

export interface AITutorPanelProps {
  /** The suggestion to explain */
  suggestion: DropSuggestion;
  /** Whether the tutor is currently active */
  isActive: boolean;
  /** Callback when tutor is closed */
  onClose?: () => void;
  /** Callback when user accepts suggestion */
  onAccept?: () => void;
  /** Callback when user rejects suggestion */
  onReject?: () => void;
  /** Tutor configuration */
  tutorConfig?: any;
  /** CSS class name */
  className?: string;
}

/**
 * Main AI Tutor Panel Component
 */
export const AITutorPanel: React.FC<AITutorPanelProps> = ({
  suggestion,
  isActive,
  onClose,
  onAccept,
  onReject,
  tutorConfig = {},
  className = '',
}) => {
  const [explanation, setExplanation] = useState<TutorExplanation | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [showTips, setShowTips] = useState(false);

  // Initialize tutor engine
  const tutorEngine = React.useMemo(() => createTutorEngine(tutorConfig), [tutorConfig]);

  // Generate explanation when suggestion changes
  useEffect(() => {
    if (isActive && suggestion) {
      setIsLoading(true);
      // Simulate async processing (in real implementation would be sync)
      setTimeout(() => {
        const newExplanation = tutorEngine.explainSuggestion(suggestion);
        setExplanation(newExplanation);
        setCurrentStep(0);
        setIsLoading(false);
      }, 500);
    }
  }, [suggestion, isActive, tutorEngine]);

  const handleNext = useCallback(() => {
    if (explanation && currentStep < explanation.reasoningSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [explanation, currentStep]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleStepClick = useCallback((stepIndex: number) => {
    setCurrentStep(stepIndex);
  }, []);

  if (!isActive) return null;

  if (isLoading) {
    return (
      <div className={`ai-tutor-loading ${className}`}>
        <div className="loading-indicator">
          <div className="spinner" />
          <p>Analyzing suggestion...</p>
        </div>
      </div>
    );
  }

  if (!explanation) return null;

  const currentStepData = explanation.reasoningSteps[currentStep];

  return (
    <div className={`ai-tutor-panel ${className}`}>
      {/* Header */}
      <div className="tutor-header">
        <h3>🤖 AI Tutor Mode</h3>
        <div className="tutor-controls">
          <button className="close-button" onClick={onClose}>×</button>
        </div>
      </div>

      {/* Suggestion Summary */}
      <div className="suggestion-summary">
        <div className="summary-content">
          <div className="suggestion-title">
            <span className="resident">{suggestion.resident.name}</span>
            <span className="arrow">→</span>
            <span className="activity">{suggestion.activity.label}</span>
          </div>
          <div className="confidence-bar">
            <div
              className="confidence-fill"
              style={{ width: `${explanation.overallConfidence * 100}%` }}
            />
            <span className="confidence-text">
              {Math.round(explanation.overallConfidence * 100)}% confidence
            </span>
          </div>
        </div>
      </div>

      {/* Step Navigation */}
      <div className="step-navigation">
        <button
          className="nav-button"
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          ← Previous
        </button>

        <div className="step-indicators">
          {explanation.reasoningSteps.map((step, index) => (
            <button
              key={step.stepNumber}
              className={`step-indicator ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
              onClick={() => handleStepClick(index)}
              title={step.title}
            >
              {step.stepNumber}
            </button>
          ))}
        </div>

        <button
          className="nav-button"
          onClick={handleNext}
          disabled={currentStep === explanation.reasoningSteps.length - 1}
        >
          Next →
        </button>
      </div>

      {/* Current Step Display */}
      <div className="current-step">
        <div className="step-header">
          <h4>Step {currentStepData.stepNumber}: {currentStepData.title}</h4>
          <div className="step-confidence">
            Confidence: {Math.round(currentStepData.confidence * 100)}%
          </div>
        </div>

        <div className="step-content">
          <p className="step-explanation">{currentStepData.explanation}</p>

          {currentStepData.highlights && (
            <div className="step-highlights">
              {currentStepData.highlights.resident && (
                <div className="highlight-group">
                  <span className="highlight-label">Resident:</span>
                  {currentStepData.highlights.resident.map((item, index) => (
                    <span key={index} className="highlight-item resident">{item}</span>
                  ))}
                </div>
              )}

              {currentStepData.highlights.activity && (
                <div className="highlight-group">
                  <span className="highlight-label">Activity:</span>
                  {currentStepData.highlights.activity.map((item, index) => (
                    <span key={index} className="highlight-item activity">{item}</span>
                  ))}
                </div>
              )}

              {currentStepData.highlights.stats && (
                <div className="highlight-group">
                  <span className="highlight-label">Stats:</span>
                  {currentStepData.highlights.stats.map((item, index) => (
                    <span key={index} className="highlight-item stats">{item}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentStepData.data && (
            <div className="step-data">
              <details>
                <summary>Technical Details</summary>
                <pre>{JSON.stringify(currentStepData.data, null, 2)}</pre>
              </details>
            </div>
          )}
        </div>
      </div>

      {/* Key Insights */}
      {currentStep === explanation.reasoningSteps.length - 1 && (
        <div className="key-insights">
          <h4>🎯 Key Insights</h4>
          <ul>
            {explanation.keyInsights.map((insight, index) => (
              <li key={index}>{insight}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div className="tutor-actions">
        <div className="action-buttons">
          <button
            className="action-button accept"
            onClick={onAccept}
            disabled={!suggestion.validationResult.isValid}
          >
            ✓ Accept Suggestion
          </button>
          <button
            className="action-button reject"
            onClick={onReject}
          >
            ✗ Reject Suggestion
          </button>
        </div>

        <div className="secondary-actions">
          <button
            className="secondary-button"
            onClick={() => setShowAlternatives(!showAlternatives)}
          >
            {showAlternatives ? 'Hide' : 'Show'} Alternatives
          </button>
          <button
            className="secondary-button"
            onClick={() => setShowTips(!showTips)}
          >
            {showTips ? 'Hide' : 'Show'} Learning Tips
          </button>
        </div>
      </div>

      {/* Alternatives */}
      {showAlternatives && (
        <div className="alternatives-section">
          <h4>🔄 Alternative Scenarios</h4>
          <div className="alternatives-list">
            {explanation.alternatives.map((alt, index) => (
              <div key={index} className={`alternative-item ${alt.impact}`}>
                <div className="alternative-header">
                  <span className="alternative-scenario">{alt.scenario}</span>
                  <span className={`alternative-impact ${alt.impact}`}>
                    {alt.impact.toUpperCase()}
                  </span>
                </div>
                <p className="alternative-explanation">{alt.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Learning Tips */}
      {showTips && (
        <div className="learning-tips-section">
          <h4>📚 Learning Tips</h4>
          <ul className="learning-tips-list">
            {explanation.learningTips.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export interface TutorToggleProps {
  /** Whether tutor mode is currently enabled */
  isEnabled: boolean;
  /** Callback when toggle changes */
  onToggle: (enabled: boolean) => void;
  /** CSS class name */
  className?: string;
}

/**
 * Tutor Mode Toggle Component
 */
export const TutorToggle: React.FC<TutorToggleProps> = ({
  isEnabled,
  onToggle,
  className = '',
}) => {
  return (
    <div className={`tutor-toggle ${className}`}>
      <label className="toggle-label">
        <input
          type="checkbox"
          checked={isEnabled}
          onChange={(e) => onToggle(e.target.checked)}
          className="toggle-input"
        />
        <span className="toggle-slider" />
        <span className="toggle-text">
          🤖 AI Tutor Mode
        </span>
      </label>
      {isEnabled && (
        <div className="tutor-status">
          <span className="status-indicator active" />
          <span className="status-text">Active</span>
        </div>
      )}
    </div>
  );
};

export interface MiniTutorProps {
  /** Brief suggestion info */
  suggestion: {
    resident: string;
    activity: string;
    confidence: number;
    reason: string;
  };
  /** Callback to open full tutor */
  onOpenTutor?: () => void;
  /** CSS class name */
  className?: string;
}

/**
 * Mini Tutor Component for compact displays
 */
export const MiniTutor: React.FC<MiniTutorProps> = ({
  suggestion,
  onOpenTutor,
  className = '',
}) => {
  return (
    <div className={`mini-tutor ${className}`}>
      <div className="mini-tutor-content">
        <div className="mini-suggestion">
          <span className="mini-resident">{suggestion.resident}</span>
          <span className="mini-arrow">→</span>
          <span className="mini-activity">{suggestion.activity}</span>
        </div>
        <div className="mini-confidence">
          {Math.round(suggestion.confidence * 100)}% confidence
        </div>
        <div className="mini-reason">
          {suggestion.reason}
        </div>
      </div>
      {onOpenTutor && (
        <button className="mini-tutor-button" onClick={onOpenTutor}>
          🤖 Explain
        </button>
      )}
    </div>
  );
};
