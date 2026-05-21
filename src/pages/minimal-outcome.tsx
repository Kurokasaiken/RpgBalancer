import React, { useState } from 'react';

/**
 * MinimalOutcomeModalPage
 *
 * Isolated test page for OutcomeModal component.
 * Shows outcome result modal after skill check.
 *
 * Route: /minimal-outcome
 * Spec: src/docs/docs/minimal_slice/10_outcome.md
 */

interface OutcomeData {
  id: string;
  residentName: string;
  portraitUrl: string;
  success: boolean;
  rollMargin: number;
  baseReward: number;
  baseXp: number;
  actualReward: number;
  actualXp: number;
  description: string;
  consequence: string | null;
}

const mockOutcomes: OutcomeData[] = [
  {
    id: 'outcome_001',
    residentName: 'Ragnar Strongarm',
    portraitUrl: 'https://via.placeholder.com/100/4ECDC4/FFFFFF?text=Ragnar',
    success: true,
    rollMargin: 5,
    baseReward: 100,
    baseXp: 50,
    actualReward: 100,
    actualXp: 50,
    description: 'Ragnar successfully defeated the goblins! The village is safe.',
    consequence: null,
  },
  {
    id: 'outcome_002',
    residentName: 'Lyra the Sage',
    portraitUrl: 'https://via.placeholder.com/100/95E1D3/FFFFFF?text=Lyra',
    success: false,
    rollMargin: -3,
    baseReward: 150,
    baseXp: 75,
    actualReward: 0,
    actualXp: 15,
    description: 'Lyra failed to retrieve the artifact. The ancient trap was triggered.',
    consequence: 'Lyra took 15 damage and gained no gold reward.',
  },
  {
    id: 'outcome_003',
    residentName: 'Celia the Archer',
    portraitUrl: 'https://via.placeholder.com/100/6BCB77/FFFFFF?text=Celia',
    success: true,
    rollMargin: 8,
    baseReward: 200,
    baseXp: 100,
    actualReward: 250,
    actualXp: 125,
    description: 'Celia achieved a critical success! She found additional treasure.',
    consequence: null,
  },
];

export default function MinimalOutcomeModalPage() {
  const [outcomes, setOutcomes] = useState(mockOutcomes);
  const [selectedOutcomeIdx, setSelectedOutcomeIdx] = useState(0);
  const [visibleOutcomeIdx, setVisibleOutcomeIdx] = useState<number | null>(0);

  const currentOutcome = outcomes[selectedOutcomeIdx];
  const visibleOutcome = visibleOutcomeIdx !== null ? outcomes[visibleOutcomeIdx] : null;

  const handleContinue = () => {
    setVisibleOutcomeIdx(null);
  };

  const handleShowOutcome = (idx: number) => {
    setSelectedOutcomeIdx(idx);
    setVisibleOutcomeIdx(idx);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      handleContinue();
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>OutcomeModal Isolated Test</h1>
      <p style={styles.subtitle}>Route: /minimal-outcome | Spec: src/docs/docs/minimal_slice/10_outcome.md</p>

      <div style={styles.contentArea}>
        <div style={styles.buttonsPanel}>
          <h2>Show Outcomes</h2>
          <div style={styles.buttonList}>
            {outcomes.map((outcome, idx) => (
              <button
                key={idx}
                onClick={() => handleShowOutcome(idx)}
                style={{
                  ...styles.outcomeButton,
                  backgroundColor: outcome.success ? '#4caf50' : '#f44336',
                }}
                data-testid={`btn-outcome-${idx}`}
              >
                {outcome.residentName}
                <br />
                {outcome.success ? '✓ Success' : '✗ Failure'}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Backdrop */}
        {visibleOutcome && (
          <div
            style={styles.modalBackdrop}
            onClick={handleContinue}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="dialog"
            data-testid="outcome-modal-backdrop"
          >
            {/* Modal Content */}
            <div style={styles.modal} onClick={(e) => e.stopPropagation()} data-testid="outcome-modal">
              {/* Header */}
              <div
                style={{
                  ...styles.modalHeader,
                  backgroundColor: visibleOutcome.success ? '#4caf50' : '#f44336',
                }}
              >
                <h2 style={styles.modalTitle} data-testid="outcome-title">
                  {visibleOutcome.success ? '✓ SUCCESS' : '✗ FAILURE'}
                </h2>
              </div>

              {/* Content */}
              <div style={styles.modalContent}>
                {/* Portrait */}
                <img
                  src={visibleOutcome.portraitUrl}
                  alt={visibleOutcome.residentName}
                  style={styles.outcomePortrait}
                  data-testid="outcome-portrait"
                />

                {/* Description */}
                <h3 style={styles.residentNameModal} data-testid="outcome-resident-name">
                  {visibleOutcome.residentName}
                </h3>
                <p style={styles.description} data-testid="outcome-description">
                  {visibleOutcome.description}
                </p>

                {/* Consequence (if failure) */}
                {visibleOutcome.consequence && (
                  <div style={styles.consequenceBox} data-testid="outcome-consequence">
                    <strong>⚠️ Consequence:</strong> {visibleOutcome.consequence}
                  </div>
                )}

                {/* Rewards */}
                <div style={styles.rewardSection}>
                  <h4 style={styles.rewardTitle}>Rewards</h4>
                  <div style={styles.rewardRow} data-testid="outcome-gold">
                    <span>Gold:</span>
                    <span style={styles.rewardValue}>{visibleOutcome.actualReward}</span>
                  </div>
                  <div style={styles.rewardRow} data-testid="outcome-xp">
                    <span>Experience:</span>
                    <span style={styles.rewardValue}>{visibleOutcome.actualXp} XP</span>
                  </div>
                </div>

                {/* Roll Info */}
                <div style={styles.rollInfo} data-testid="outcome-margin">
                  <small>
                    {visibleOutcome.success
                      ? `Succeeded by ${visibleOutcome.rollMargin}`
                      : `Failed by ${Math.abs(visibleOutcome.rollMargin)}`}
                  </small>
                </div>
              </div>

              {/* Actions */}
              <div style={styles.modalActions}>
                <button
                  onClick={handleContinue}
                  style={styles.continueButton}
                  data-testid="outcome-continue-button"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={styles.testInfo}>
        <h2>Test Information</h2>
        <ul>
          <li>
            <strong>Component:</strong> OutcomeModal
          </li>
          <li>
            <strong>Test Cases:</strong> 24 (rendering, display, interactions, state, edge cases)
          </li>
          <li>
            <strong>Test File:</strong> tests/e2e/minimal_slice_10_outcome.spec.ts
          </li>
          <li>
            <strong>Outcomes:</strong> 3 (Success, Failure, Critical Success)
          </li>
        </ul>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh',
  } as React.CSSProperties,
  title: {
    fontSize: '2rem',
    marginBottom: '0.5rem',
    color: '#333',
  } as React.CSSProperties,
  subtitle: {
    color: '#666',
    marginBottom: '2rem',
    fontSize: '0.9rem',
  } as React.CSSProperties,
  contentArea: {
    display: 'flex',
    gap: '2rem',
    marginBottom: '2rem',
    position: 'relative',
  } as React.CSSProperties,
  buttonsPanel: {
    width: '250px',
    backgroundColor: '#fff',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    height: 'fit-content',
  } as React.CSSProperties,
  buttonList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  } as React.CSSProperties,
  outcomeButton: {
    padding: '0.75rem',
    borderRadius: '4px',
    border: 'none',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
  } as React.CSSProperties,
  modalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  } as React.CSSProperties,
  modal: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
    maxWidth: '500px',
    width: '90%',
    overflow: 'hidden',
  } as React.CSSProperties,
  modalHeader: {
    padding: '2rem',
    color: '#fff',
    textAlign: 'center',
  } as React.CSSProperties,
  modalTitle: {
    margin: 0,
    fontSize: '1.5rem',
  } as React.CSSProperties,
  modalContent: {
    padding: '2rem',
    textAlign: 'center',
  } as React.CSSProperties,
  outcomePortrait: {
    width: '120px',
    height: '120px',
    borderRadius: '8px',
    marginBottom: '1rem',
    objectFit: 'cover',
    border: '3px solid #ddd',
  } as React.CSSProperties,
  residentNameModal: {
    margin: '0.5rem 0',
    fontSize: '1.25rem',
    color: '#333',
  } as React.CSSProperties,
  description: {
    marginBottom: '1rem',
    color: '#666',
    fontSize: '0.95rem',
    lineHeight: 1.6,
  } as React.CSSProperties,
  consequenceBox: {
    padding: '1rem',
    backgroundColor: '#ffebee',
    borderRadius: '6px',
    marginBottom: '1rem',
    color: '#c62828',
    fontSize: '0.9rem',
  } as React.CSSProperties,
  rewardSection: {
    padding: '1.5rem',
    backgroundColor: '#f5f5f5',
    borderRadius: '6px',
    marginBottom: '1rem',
  } as React.CSSProperties,
  rewardTitle: {
    margin: '0 0 0.75rem 0',
    fontSize: '0.95rem',
    color: '#333',
  } as React.CSSProperties,
  rewardRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.5rem 0',
    fontSize: '0.9rem',
  } as React.CSSProperties,
  rewardValue: {
    fontWeight: 'bold',
    color: '#4caf50',
    fontFamily: 'monospace',
  } as React.CSSProperties,
  rollInfo: {
    color: '#999',
    fontSize: '0.85rem',
  } as React.CSSProperties,
  modalActions: {
    padding: '1.5rem',
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    borderTop: '1px solid #e0e0e0',
  } as React.CSSProperties,
  continueButton: {
    padding: '0.75rem 2rem',
    backgroundColor: '#4caf50',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  } as React.CSSProperties,
  testInfo: {
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  } as React.CSSProperties,
};
