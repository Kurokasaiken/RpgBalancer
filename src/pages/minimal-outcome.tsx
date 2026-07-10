import React, { useState } from 'react';
import {
  SkinScope,
  SkinTitle,
  SkinButton,
  SkinCloseButton,
  SkinBadge,
} from '@/ui/idleVillage/skins/primitives';

/**
 * MinimalOutcomeModalPage
 *
 * Isolated test page for OutcomeModal component.
 * Shows outcome result modal after skill check.
 *
 * Route: /minimal-outcome
 * Spec: src/docs/docs/minimal_slice/10_outcome.md
 *
 * Skinned via <SkinScope> + role primitives — no hardcoded colors. Every
 * title/button/close/badge inherits the active `--skin-*` skin (V9 default).
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
  const [outcomes] = useState(mockOutcomes);
  const [selectedOutcomeIdx, setSelectedOutcomeIdx] = useState(0);
  const [visibleOutcomeIdx, setVisibleOutcomeIdx] = useState<number | null>(0);

  const visibleOutcome = visibleOutcomeIdx !== null ? outcomes[visibleOutcomeIdx] : null;
  void selectedOutcomeIdx;

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
    <SkinScope style={styles.container}>
      <SkinTitle>OutcomeModal Isolated Test</SkinTitle>
      <SkinTitle level="subtitle">
        Route: /minimal-outcome · Spec: src/docs/docs/minimal_slice/10_outcome.md
      </SkinTitle>

      <div style={styles.contentArea}>
        <div data-skin="panel" style={styles.buttonsPanel}>
          <SkinTitle level="section">Show Outcomes</SkinTitle>
          <div style={styles.buttonList}>
            {outcomes.map((outcome, idx) => (
              <SkinButton
                key={idx}
                variant="secondary"
                onClick={() => handleShowOutcome(idx)}
                style={styles.outcomeButton}
                data-testid={`btn-outcome-${idx}`}
              >
                {outcome.residentName}
                <br />
                <span className={outcome.success ? 'skin-status-met' : 'skin-status-unmet'}>
                  {outcome.success ? '✓ Success' : '✗ Failure'}
                </span>
              </SkinButton>
            ))}
          </div>
        </div>

        {/* Modal Backdrop */}
        {visibleOutcome && (
          <div
            data-skin="modal-backdrop"
            onClick={handleContinue}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="dialog"
            data-testid="outcome-modal-backdrop"
          >
            {/* Modal Content */}
            <div
              data-skin="modal"
              style={styles.modal}
              onClick={(e) => e.stopPropagation()}
              data-testid="outcome-modal"
            >
              <SkinCloseButton corner onClick={handleContinue} aria-label="Chiudi esito" />

              {/* Header */}
              <div style={styles.modalHeader}>
                <SkinBadge>{visibleOutcome.success ? 'Esito' : 'Esito'}</SkinBadge>
                <SkinTitle
                  data-testid="outcome-title"
                  className={visibleOutcome.success ? 'skin-status-met' : 'skin-status-unmet'}
                  style={styles.modalTitle}
                >
                  {visibleOutcome.success ? '✓ Success' : '✗ Failure'}
                </SkinTitle>
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
                <SkinTitle level="section" data-testid="outcome-resident-name" style={styles.residentNameModal}>
                  {visibleOutcome.residentName}
                </SkinTitle>
                <p data-testid="outcome-description" style={styles.description}>
                  {visibleOutcome.description}
                </p>

                {/* Consequence (if failure) */}
                {visibleOutcome.consequence && (
                  <div data-skin="panel" style={styles.consequenceBox} data-testid="outcome-consequence">
                    <strong className="skin-status-unmet">⚠️ Consequence:</strong>{' '}
                    <span className="skin-status-unmet">{visibleOutcome.consequence}</span>
                  </div>
                )}

                {/* Rewards */}
                <div data-skin="panel" style={styles.rewardSection}>
                  <SkinTitle level="section">Rewards</SkinTitle>
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
                <div data-testid="outcome-margin" style={styles.rollInfo}>
                  <small className="skin-text-secondary">
                    {visibleOutcome.success
                      ? `Succeeded by ${visibleOutcome.rollMargin}`
                      : `Failed by ${Math.abs(visibleOutcome.rollMargin)}`}
                  </small>
                </div>
              </div>

              {/* Actions */}
              <div style={styles.modalActions}>
                <SkinButton variant="cta" onClick={handleContinue} data-testid="outcome-continue-button">
                  Continue
                </SkinButton>
              </div>
            </div>
          </div>
        )}
      </div>

      <div data-skin="panel" style={styles.testInfo}>
        <SkinTitle level="section">Test Information</SkinTitle>
        <ul style={styles.testList}>
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
    </SkinScope>
  );
}

/* Layout only — NO colors here. Every color comes from the skin scope/tokens. */
const styles = {
  container: {
    padding: '2rem',
    maxWidth: '1200px',
    margin: '0 auto',
    minHeight: '100vh',
    background: 'var(--skin-surface-bg)',
  } as React.CSSProperties,
  contentArea: {
    display: 'flex',
    gap: '2rem',
    margin: '1.5rem 0 2rem',
    position: 'relative',
  } as React.CSSProperties,
  buttonsPanel: {
    width: '260px',
    padding: '1.5rem',
    height: 'fit-content',
  } as React.CSSProperties,
  buttonList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginTop: '0.75rem',
  } as React.CSSProperties,
  outcomeButton: {
    width: '100%',
    textAlign: 'center',
    lineHeight: 1.5,
  } as React.CSSProperties,
  modal: {
    position: 'relative',
    maxWidth: '500px',
    width: '90%',
  } as React.CSSProperties,
  modalHeader: {
    padding: '1.75rem 2rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.6rem',
  } as React.CSSProperties,
  modalTitle: {
    margin: 0,
    fontSize: '1.6rem',
  } as React.CSSProperties,
  modalContent: {
    padding: '0 2rem 1rem',
    textAlign: 'center',
  } as React.CSSProperties,
  outcomePortrait: {
    width: '120px',
    height: '120px',
    borderRadius: '10px',
    marginBottom: '1rem',
    objectFit: 'cover',
    border: '2px solid var(--skin-surface-border)',
  } as React.CSSProperties,
  residentNameModal: {
    margin: '0.5rem 0',
    fontSize: '1.1rem',
  } as React.CSSProperties,
  description: {
    marginBottom: '1rem',
    fontSize: '0.95rem',
    lineHeight: 1.6,
  } as React.CSSProperties,
  consequenceBox: {
    padding: '1rem',
    marginBottom: '1rem',
    fontSize: '0.9rem',
    textAlign: 'left',
  } as React.CSSProperties,
  rewardSection: {
    padding: '1.25rem 1.5rem',
    marginBottom: '1rem',
    textAlign: 'left',
  } as React.CSSProperties,
  rewardRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.4rem 0',
    fontSize: '0.9rem',
  } as React.CSSProperties,
  rewardValue: {
    fontWeight: 'bold',
    color: 'var(--skin-title-color)',
    fontFamily: 'var(--skin-font-display)',
  } as React.CSSProperties,
  rollInfo: {
    fontSize: '0.85rem',
  } as React.CSSProperties,
  modalActions: {
    padding: '1.25rem 1.5rem 1.75rem',
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    borderTop: '1px solid var(--skin-separator)',
  } as React.CSSProperties,
  testInfo: {
    padding: '1.5rem 2rem',
  } as React.CSSProperties,
  testList: {
    margin: '0.5rem 0 0',
    paddingLeft: '1.1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  } as React.CSSProperties,
};
