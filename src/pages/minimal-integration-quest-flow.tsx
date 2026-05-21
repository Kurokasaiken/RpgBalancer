import React, { useState } from 'react';

/**
 * MinimalIntegrationQuestFlowPage
 *
 * Integration test page for full quest flow.
 * QuestCard → SkillCheckPanel → OutcomeModal
 *
 * Route: /minimal-integration-quest-flow
 * Spec: src/docs/docs/minimal_slice/13_integration_quest.md
 */

interface QuestFlow {
  questId: string;
  questName: string;
  icon: string;
  dc: number;
  assignedResident: string | null;
  checkResult: { roll: number; total: number; success: boolean; margin: number } | null;
  outcome: { success: boolean; gold: number; xp: number } | null;
}

const initialQuests: QuestFlow[] = [
  {
    questId: 'quest_001',
    questName: 'Goblin Raid',
    icon: '🗡️',
    dc: 14,
    assignedResident: null,
    checkResult: null,
    outcome: null,
  },
  {
    questId: 'quest_002',
    questName: 'Dragon Slaying',
    icon: '🐉',
    dc: 18,
    assignedResident: null,
    checkResult: null,
    outcome: null,
  },
];

const residentNames = ['Ragnar Strongarm', 'Lyra the Sage', 'Celia the Archer'];

export default function MinimalIntegrationQuestFlowPage() {
  const [quests, setQuests] = useState(initialQuests);
  const [selectedQuestIdx, setSelectedQuestIdx] = useState(0);
  const [stage, setStage] = useState<'assignment' | 'check' | 'outcome'>('assignment');
  const [rollInput, setRollInput] = useState('');

  const currentQuest = quests[selectedQuestIdx];

  const handleAssignResident = (residentName: string) => {
    const newQuests = [...quests];
    newQuests[selectedQuestIdx] = { ...currentQuest, assignedResident: residentName };
    setQuests(newQuests);
    setStage('check');
  };

  const handleRoll = () => {
    if (!rollInput) return;
    const roll = parseInt(rollInput, 10);
    if (isNaN(roll) || roll < 1 || roll > 20) return;

    const total = roll + 2; // Modifier
    const success = total >= currentQuest.dc;
    const margin = success ? total - currentQuest.dc : currentQuest.dc - total;

    const newQuests = [...quests];
    newQuests[selectedQuestIdx] = {
      ...currentQuest,
      checkResult: { roll, total, success, margin },
      outcome: {
        success,
        gold: success ? 200 : 0,
        xp: success ? 100 : 20,
      },
    };
    setQuests(newQuests);
    setStage('outcome');
    setRollInput('');
  };

  const handleContinue = () => {
    setStage('assignment');
  };

  const handleReset = () => {
    const newQuests = [...quests];
    newQuests[selectedQuestIdx] = {
      ...currentQuest,
      assignedResident: null,
      checkResult: null,
      outcome: null,
    };
    setQuests(newQuests);
    setStage('assignment');
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Integration: Full Quest Flow</h1>
      <p style={styles.subtitle}>Route: /minimal-integration-quest-flow | Spec: src/docs/docs/minimal_slice/13_integration_quest.md</p>

      <div style={styles.contentArea}>
        {/* Quest Selection */}
        <div style={styles.sidebar}>
          <h2>Quests</h2>
          <div style={styles.questList}>
            {quests.map((quest, idx) => (
              <button
                key={quest.questId}
                onClick={() => {
                  setSelectedQuestIdx(idx);
                  setStage('assignment');
                }}
                style={{
                  ...styles.questButton,
                  backgroundColor: selectedQuestIdx === idx ? '#4caf50' : '#f0f0f0',
                  color: selectedQuestIdx === idx ? '#fff' : '#333',
                }}
                data-testid={`flow-quest-${idx}`}
              >
                {quest.icon} {quest.questName}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div style={styles.mainPanel}>
          {stage === 'assignment' && (
            <div style={styles.stage} data-testid="flow-assignment-stage">
              <h2>{currentQuest.questName}</h2>
              <p>DC: {currentQuest.dc}</p>

              {currentQuest.assignedResident ? (
                <div style={styles.assignedInfo}>
                  <p>Assigned to: {currentQuest.assignedResident}</p>
                  <button onClick={() => setStage('check')} style={styles.continueButton} data-testid="flow-start-check">
                    Start Check
                  </button>
                  <button onClick={handleReset} style={styles.resetButton} data-testid="flow-reset">
                    Reassign
                  </button>
                </div>
              ) : (
                <div style={styles.assignmentOptions}>
                  {residentNames.map((name) => (
                    <button
                      key={name}
                      onClick={() => handleAssignResident(name)}
                      style={styles.assignButton}
                      data-testid={`flow-assign-${name.replace(/\s+/g, '-')}`}
                    >
                      Assign {name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {stage === 'check' && currentQuest.checkResult === null && (
            <div style={styles.stage} data-testid="flow-check-stage">
              <h2>Skill Check: {currentQuest.questName}</h2>
              <p>{currentQuest.assignedResident}</p>
              <p>DC: {currentQuest.dc}</p>

              <div style={styles.rollArea}>
                <label>Roll d20:</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={rollInput}
                  onChange={(e) => setRollInput(e.target.value)}
                  style={styles.rollInput}
                  data-testid="flow-roll-input"
                  placeholder="1-20"
                />
                <button onClick={handleRoll} style={styles.rollButton} data-testid="flow-roll-button">
                  Roll
                </button>
              </div>
            </div>
          )}

          {stage === 'outcome' && currentQuest.outcome && (
            <div style={styles.stage} data-testid="flow-outcome-stage">
              <h2 style={{ color: currentQuest.outcome.success ? '#4caf50' : '#f44336' }}>
                {currentQuest.outcome.success ? '✓ SUCCESS' : '✗ FAILURE'}
              </h2>

              {currentQuest.checkResult && (
                <div style={styles.checkDetails}>
                  <p>Rolled: {currentQuest.checkResult.roll}</p>
                  <p>Total: {currentQuest.checkResult.total}</p>
                  <p>DC: {currentQuest.dc}</p>
                  <p>Margin: {currentQuest.checkResult.margin}</p>
                </div>
              )}

              <div style={styles.rewardBox}>
                <p>Gold: {currentQuest.outcome.gold}</p>
                <p>XP: {currentQuest.outcome.xp}</p>
              </div>

              <button onClick={handleContinue} style={styles.continueButton} data-testid="flow-continue">
                Continue
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={styles.testInfo}>
        <h2>Test Information</h2>
        <ul>
          <li>
            <strong>Integration Test:</strong> Full Quest Flow
          </li>
          <li>
            <strong>Test Cases:</strong> 20 (assignment, check, outcome, state)
          </li>
          <li>
            <strong>Test File:</strong> tests/e2e/minimal_slice_13_integration_quest_flow.spec.ts
          </li>
          <li>
            <strong>Flow:</strong> QuestCard → SkillCheckPanel → OutcomeModal
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
  sidebar: {
    width: '200px',
    backgroundColor: '#fff',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    height: 'fit-content',
  } as React.CSSProperties,
  questList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  } as React.CSSProperties,
  questButton: {
    padding: '0.75rem',
    borderRadius: '4px',
    border: 'none',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s',
  } as React.CSSProperties,
  mainPanel: {
    flex: 1,
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  } as React.CSSProperties,
  stage: {
    minHeight: '300px',
  } as React.CSSProperties,
  assignedInfo: {
    marginTop: '1.5rem',
    padding: '1rem',
    backgroundColor: '#e8f5e9',
    borderRadius: '6px',
  } as React.CSSProperties,
  assignmentOptions: {
    marginTop: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  } as React.CSSProperties,
  assignButton: {
    padding: '0.75rem',
    backgroundColor: '#4caf50',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontWeight: 'bold',
    cursor: 'pointer',
  } as React.CSSProperties,
  rollArea: {
    marginTop: '1.5rem',
    padding: '1rem',
    backgroundColor: '#f5f5f5',
    borderRadius: '6px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  } as React.CSSProperties,
  rollInput: {
    padding: '0.75rem',
    borderRadius: '4px',
    border: '2px solid #ddd',
    fontSize: '1rem',
    fontFamily: 'monospace',
    textAlign: 'center',
  } as React.CSSProperties,
  rollButton: {
    padding: '0.75rem',
    backgroundColor: '#2196F3',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontWeight: 'bold',
    cursor: 'pointer',
  } as React.CSSProperties,
  checkDetails: {
    marginTop: '1rem',
    padding: '1rem',
    backgroundColor: '#f5f5f5',
    borderRadius: '6px',
    fontSize: '0.9rem',
  } as React.CSSProperties,
  rewardBox: {
    marginTop: '1rem',
    padding: '1rem',
    backgroundColor: '#e8f5e9',
    borderRadius: '6px',
    fontWeight: 'bold',
  } as React.CSSProperties,
  continueButton: {
    marginTop: '1.5rem',
    padding: '0.75rem 1.5rem',
    backgroundColor: '#4caf50',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontWeight: 'bold',
    cursor: 'pointer',
  } as React.CSSProperties,
  resetButton: {
    marginTop: '0.5rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#ff9800',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontWeight: 'bold',
    cursor: 'pointer',
  } as React.CSSProperties,
  testInfo: {
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  } as React.CSSProperties,
};
