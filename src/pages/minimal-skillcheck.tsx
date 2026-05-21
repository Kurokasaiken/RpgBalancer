import React, { useState } from 'react';

/**
 * MinimalSkillCheckPage
 *
 * Isolated test page for SkillCheckPanel component.
 * Shows skill check resolution interface.
 *
 * Route: /minimal-skillcheck
 * Spec: src/docs/docs/minimal_slice/09_skillcheck.md
 */

interface SkillCheckData {
  residentName: string;
  portraitUrl: string;
  stat: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
  statValue: number;
  dc: number;
  modifier: number;
  difficulty: 'easy' | 'medium' | 'hard';
  checkResult: {
    rolled: number;
    total: number;
    success: boolean;
    margin: number;
  } | null;
}

const mockChecks: SkillCheckData[] = [
  {
    residentName: 'Ragnar Strongarm',
    portraitUrl: 'https://via.placeholder.com/80/4ECDC4/FFFFFF?text=Ragnar',
    stat: 'str',
    statValue: 16,
    dc: 14,
    modifier: 2,
    difficulty: 'medium',
    checkResult: null,
  },
  {
    residentName: 'Lyra the Sage',
    portraitUrl: 'https://via.placeholder.com/80/95E1D3/FFFFFF?text=Lyra',
    stat: 'int',
    statValue: 16,
    dc: 16,
    modifier: 3,
    difficulty: 'hard',
    checkResult: null,
  },
  {
    residentName: 'Celia the Archer',
    portraitUrl: 'https://via.placeholder.com/80/6BCB77/FFFFFF?text=Celia',
    stat: 'dex',
    statValue: 16,
    dc: 12,
    modifier: 3,
    difficulty: 'easy',
    checkResult: null,
  },
];

export default function MinimalSkillCheckPage() {
  const [checks, setChecks] = useState(mockChecks);
  const [selectedCheckIdx, setSelectedCheckIdx] = useState(0);
  const [rollInput, setRollInput] = useState('');

  const statLabel: { [key: string]: string } = {
    str: 'STR',
    dex: 'DEX',
    con: 'CON',
    int: 'INT',
    wis: 'WIS',
    cha: 'CHA',
  };

  const handleRoll = () => {
    if (!rollInput) {
      return;
    }

    const roll = parseInt(rollInput, 10);
    if (isNaN(roll) || roll < 1 || roll > 20) {
      return;
    }

    const check = checks[selectedCheckIdx];
    const total = roll + check.modifier;
    const success = total >= check.dc;
    const margin = success ? total - check.dc : check.dc - total;

    const updatedChecks = [...checks];
    updatedChecks[selectedCheckIdx] = {
      ...check,
      checkResult: {
        rolled: roll,
        total,
        success,
        margin,
      },
    };

    setChecks(updatedChecks);
    setRollInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleRoll();
    }
  };

  const currentCheck = checks[selectedCheckIdx];

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>SkillCheckPanel Isolated Test</h1>
      <p style={styles.subtitle}>Route: /minimal-skillcheck | Spec: src/docs/docs/minimal_slice/09_skillcheck.md</p>

      <div style={styles.contentArea}>
        <div style={styles.checksPanel}>
          <h2>Skill Checks</h2>
          <div style={styles.checksList} data-testid="skill-checks-list">
            {checks.map((check, idx) => (
              <div
                key={idx}
                style={{
                  ...styles.checkTab,
                  backgroundColor: selectedCheckIdx === idx ? '#e8f5e9' : '#f0f0f0',
                  borderLeftColor: selectedCheckIdx === idx ? '#4caf50' : '#ddd',
                }}
                data-testid={`check-tab-${idx}`}
                onClick={() => setSelectedCheckIdx(idx)}
              >
                <div style={styles.tabName}>{check.residentName}</div>
                <div style={styles.tabMeta}>
                  {statLabel[check.stat]} DC {check.dc}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.panelArea}>
          <div style={styles.checkPanel} data-testid="skill-check-panel">
            {/* Header */}
            <div style={styles.header}>
              <img
                src={currentCheck.portraitUrl}
                alt={currentCheck.residentName}
                style={styles.portrait}
                data-testid={`check-portrait-${selectedCheckIdx}`}
              />
              <div style={styles.headerText}>
                <h3 style={styles.residentName} data-testid={`check-name-${selectedCheckIdx}`}>
                  {currentCheck.residentName}
                </h3>
                <div style={styles.meta} data-testid={`check-dc-${selectedCheckIdx}`}>
                  Difficulty Class: {currentCheck.dc}
                </div>
                <div style={styles.meta} data-testid={`check-stat-${selectedCheckIdx}`}>
                  {statLabel[currentCheck.stat]} {currentCheck.statValue} (modifier: +{currentCheck.modifier})
                </div>
                <div
                  style={{
                    ...styles.difficultyTag,
                    backgroundColor:
                      currentCheck.difficulty === 'easy'
                        ? '#4caf50'
                        : currentCheck.difficulty === 'medium'
                          ? '#ff9800'
                          : '#f44336',
                  }}
                  data-testid={`check-difficulty-${selectedCheckIdx}`}
                >
                  {currentCheck.difficulty.charAt(0).toUpperCase() + currentCheck.difficulty.slice(1)}
                </div>
              </div>
            </div>

            {/* Roll Input */}
            {!currentCheck.checkResult ? (
              <div style={styles.inputArea} data-testid={`check-input-${selectedCheckIdx}`}>
                <label style={styles.label}>Roll a d20 (1-20):</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={rollInput}
                  onChange={(e) => setRollInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  style={styles.input}
                  placeholder="Enter roll..."
                  data-testid={`check-input-field-${selectedCheckIdx}`}
                />
                <button
                  onClick={handleRoll}
                  style={styles.checkButton}
                  data-testid={`check-button-${selectedCheckIdx}`}
                >
                  Check
                </button>
              </div>
            ) : (
              <div style={styles.resultArea} data-testid={`check-result-${selectedCheckIdx}`}>
                <div
                  style={{
                    ...styles.resultCard,
                    backgroundColor: currentCheck.checkResult.success ? '#e8f5e9' : '#ffebee',
                  }}
                >
                  <div style={styles.resultRow}>
                    <span style={styles.resultLabel}>Rolled:</span>
                    <span style={styles.resultValue} data-testid={`check-roll-${selectedCheckIdx}`}>
                      {currentCheck.checkResult.rolled}
                    </span>
                  </div>
                  <div style={styles.resultRow}>
                    <span style={styles.resultLabel}>Modifier:</span>
                    <span style={styles.resultValue}>+{currentCheck.modifier}</span>
                  </div>
                  <div style={styles.resultRow} style={{ borderTop: '1px solid #ddd', paddingTop: '0.75rem' }}>
                    <span style={styles.resultLabel}>Total:</span>
                    <span
                      style={{
                        ...styles.resultValue,
                        fontWeight: 'bold',
                        color: currentCheck.checkResult.success ? '#4caf50' : '#f44336',
                      }}
                      data-testid={`check-total-${selectedCheckIdx}`}
                    >
                      {currentCheck.checkResult.total}
                    </span>
                  </div>

                  <div style={styles.resultRow}>
                    <span style={styles.resultLabel}>DC:</span>
                    <span style={styles.resultValue}>{currentCheck.dc}</span>
                  </div>

                  <div style={{ ...styles.resultRow, marginTop: '1rem' }}>
                    <div
                      style={{
                        ...styles.outcomeLabel,
                        backgroundColor: currentCheck.checkResult.success ? '#4caf50' : '#f44336',
                      }}
                      data-testid={`check-outcome-${selectedCheckIdx}`}
                    >
                      {currentCheck.checkResult.success ? 'SUCCESS' : 'FAILURE'}
                    </div>
                  </div>

                  <div style={styles.marginDisplay} data-testid={`check-margin-${selectedCheckIdx}`}>
                    Margin of {currentCheck.checkResult.success ? 'Success' : 'Failure'}: {currentCheck.checkResult.margin}
                  </div>
                </div>

                <button
                  onClick={() => {
                    const updatedChecks = [...checks];
                    updatedChecks[selectedCheckIdx].checkResult = null;
                    setChecks(updatedChecks);
                  }}
                  style={styles.resetButton}
                  data-testid={`check-reset-${selectedCheckIdx}`}
                >
                  Roll Again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={styles.testInfo}>
        <h2>Test Information</h2>
        <ul>
          <li>
            <strong>Component:</strong> SkillCheckPanel
          </li>
          <li>
            <strong>Test Cases:</strong> 28 (rendering, display, state, interactions, edge cases)
          </li>
          <li>
            <strong>Test File:</strong> tests/e2e/minimal_slice_09_skillcheck.spec.ts
          </li>
          <li>
            <strong>Checks:</strong> 3 (STR, INT, DEX based)
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
  } as React.CSSProperties,
  checksPanel: {
    width: '200px',
    backgroundColor: '#fff',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    height: 'fit-content',
  } as React.CSSProperties,
  checksList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  } as React.CSSProperties,
  checkTab: {
    padding: '1rem',
    borderRadius: '4px',
    borderLeft: '4px solid #ddd',
    cursor: 'pointer',
    transition: 'all 0.2s',
  } as React.CSSProperties,
  tabName: {
    fontWeight: 'bold',
    fontSize: '0.9rem',
    color: '#333',
  } as React.CSSProperties,
  tabMeta: {
    fontSize: '0.75rem',
    color: '#666',
    marginTop: '0.25rem',
  } as React.CSSProperties,
  panelArea: {
    flex: 1,
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  } as React.CSSProperties,
  checkPanel: {
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '1.5rem',
    backgroundColor: '#fafafa',
  } as React.CSSProperties,
  header: {
    display: 'flex',
    gap: '1.5rem',
    marginBottom: '2rem',
    alignItems: 'flex-start',
  } as React.CSSProperties,
  portrait: {
    width: '80px',
    height: '80px',
    borderRadius: '8px',
    objectFit: 'cover',
  } as React.CSSProperties,
  headerText: {
    flex: 1,
  } as React.CSSProperties,
  residentName: {
    margin: 0,
    fontSize: '1.2rem',
    color: '#333',
  } as React.CSSProperties,
  meta: {
    fontSize: '0.9rem',
    color: '#666',
    marginTop: '0.25rem',
  } as React.CSSProperties,
  difficultyTag: {
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    marginTop: '0.5rem',
  } as React.CSSProperties,
  inputArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  } as React.CSSProperties,
  label: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: '0.95rem',
  } as React.CSSProperties,
  input: {
    padding: '0.75rem',
    borderRadius: '4px',
    border: '2px solid #ddd',
    fontSize: '1rem',
    fontFamily: 'monospace',
    textAlign: 'center',
  } as React.CSSProperties,
  checkButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#4caf50',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  } as React.CSSProperties,
  resultArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  } as React.CSSProperties,
  resultCard: {
    padding: '1.5rem',
    borderRadius: '8px',
    border: '1px solid #ddd',
  } as React.CSSProperties,
  resultRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.95rem',
    padding: '0.5rem 0',
  } as React.CSSProperties,
  resultLabel: {
    fontWeight: '600',
    color: '#333',
  } as React.CSSProperties,
  resultValue: {
    fontFamily: 'monospace',
    color: '#666',
  } as React.CSSProperties,
  outcomeLabel: {
    padding: '0.75rem',
    borderRadius: '4px',
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  } as React.CSSProperties,
  marginDisplay: {
    marginTop: '1rem',
    padding: '0.75rem',
    backgroundColor: '#f0f0f0',
    borderRadius: '4px',
    fontSize: '0.9rem',
    color: '#555',
    textAlign: 'center',
  } as React.CSSProperties,
  resetButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#2196F3',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    alignSelf: 'flex-start',
  } as React.CSSProperties,
  testInfo: {
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  } as React.CSSProperties,
};
