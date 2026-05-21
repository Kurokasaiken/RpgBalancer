import React, { useState } from 'react';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';

/**
 * MinimalQuestCardPage
 *
 * Isolated test page for QuestCard component.
 * Shows quest card with drop target for resident assignment.
 *
 * Route: /minimal-questcard
 * Spec: src/docs/docs/minimal_slice/08_questcard.md
 */

interface QuestData {
  id: string;
  title: string;
  icon: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  rewardGold: number;
  rewardXp: number;
  requiredLevel: number;
  requiredStats: { str?: number; dex?: number; con?: number };
  assignedResident: ResidentState | null;
  isLocked: boolean;
}

const mockQuests: QuestData[] = [
  {
    id: 'quest_001',
    title: 'Goblin Raid',
    icon: '🗡️',
    description: 'Defeat the goblin raiders threatening the village',
    difficulty: 'medium',
    rewardGold: 200,
    rewardXp: 100,
    requiredLevel: 2,
    requiredStats: { str: 12, dex: 10 },
    assignedResident: null,
    isLocked: false,
  },
  {
    id: 'quest_002',
    title: 'Dragon Slaying',
    icon: '🐉',
    description: 'Slay the ancient dragon guarding the mountain treasure',
    difficulty: 'hard',
    rewardGold: 500,
    rewardXp: 250,
    requiredLevel: 4,
    requiredStats: { str: 16, con: 15 },
    assignedResident: null,
    isLocked: true,
  },
  {
    id: 'quest_003',
    title: 'Lost Artifact',
    icon: '📿',
    description: 'Retrieve the lost artifact from the ancient ruins',
    difficulty: 'easy',
    rewardGold: 100,
    rewardXp: 50,
    requiredLevel: 1,
    requiredStats: { dex: 12 },
    assignedResident: {
      id: 'res_002',
      name: 'Lyra the Sage',
      portraitUrl: 'https://via.placeholder.com/60/95E1D3/FFFFFF?text=Lyra',
      status: 'available',
      isInjured: false,
      isHero: true,
      level: 3,
      currentHp: 60,
      maxHp: 90,
      fatigue: 85,
      survivalScore: 14,
      statSnapshot: { str: 9, dex: 12, con: 11, int: 16, wis: 15, cha: 14 },
    },
    isLocked: false,
  },
];

export default function MinimalQuestCardPage() {
  const [quests, setQuests] = useState(mockQuests);
  const [selectedQuest, setSelectedQuest] = useState<string | null>(null);
  const [hoveredQuest, setHoveredQuest] = useState<string | null>(null);

  const getDifficultyColor = (difficulty: 'easy' | 'medium' | 'hard'): string => {
    if (difficulty === 'easy') return '#4caf50';
    if (difficulty === 'medium') return '#ff9800';
    return '#f44336';
  };

  const getDifficultyLabel = (difficulty: 'easy' | 'medium' | 'hard'): string => {
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  };

  const formatStats = (stats: { str?: number; dex?: number; con?: number }): string => {
    return Object.entries(stats)
      .map(([key, value]) => `${key.toUpperCase()} ${value}`)
      .join(', ');
  };

  const handleQuestDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.style.borderColor = '#4caf50';
  };

  const handleQuestDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.style.borderColor = '#ddd';
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>QuestCard Isolated Test</h1>
      <p style={styles.subtitle}>Route: /minimal-questcard | Spec: src/docs/docs/minimal_slice/08_questcard.md</p>

      <div style={styles.contentArea}>
        <div style={styles.questsPanel}>
          <h2>Available Quests</h2>
          <div style={styles.questsGrid} data-testid="quests-grid">
            {quests.map((quest) => (
              <div
                key={quest.id}
                style={{
                  ...styles.questCard,
                  borderColor: selectedQuest === quest.id ? '#4caf50' : '#ddd',
                  backgroundColor: hoveredQuest === quest.id ? '#f5f5f5' : '#fff',
                  opacity: quest.isLocked ? 0.6 : 1,
                }}
                data-testid={`quest-card-${quest.id}`}
                data-quest-id={quest.id}
                data-difficulty={quest.difficulty}
                data-locked={quest.isLocked}
                onClick={() => !quest.isLocked && setSelectedQuest(quest.id)}
                onMouseEnter={() => !quest.isLocked && setHoveredQuest(quest.id)}
                onMouseLeave={() => setHoveredQuest(null)}
                onDragOver={handleQuestDragOver}
                onDragLeave={handleQuestDragLeave}
              >
                <div style={styles.questHeader}>
                  <div style={styles.questIcon} data-testid={`quest-${quest.id}-icon`}>
                    {quest.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={styles.questTitle} data-testid={`quest-${quest.id}-title`}>
                      {quest.title}
                      {quest.isLocked && ' 🔒'}
                    </div>
                    <div
                      style={{
                        ...styles.difficultyBadge,
                        backgroundColor: getDifficultyColor(quest.difficulty),
                      }}
                      data-testid={`quest-${quest.id}-difficulty`}
                    >
                      {getDifficultyLabel(quest.difficulty)}
                    </div>
                  </div>
                </div>

                <div style={styles.questDescription} data-testid={`quest-${quest.id}-description`}>
                  {quest.description}
                </div>

                <div style={styles.requirementsSection}>
                  <div style={styles.requirement} data-testid={`quest-${quest.id}-level`}>
                    <strong>Level:</strong> {quest.requiredLevel}+
                  </div>
                  <div style={styles.requirement} data-testid={`quest-${quest.id}-stats`}>
                    <strong>Stats:</strong> {formatStats(quest.requiredStats)}
                  </div>
                </div>

                <div style={styles.rewardSection}>
                  <div style={styles.reward} data-testid={`quest-${quest.id}-reward-gold`}>
                    💰 {quest.rewardGold} Gold
                  </div>
                  <div style={styles.reward} data-testid={`quest-${quest.id}-reward-xp`}>
                    ⭐ {quest.rewardXp} XP
                  </div>
                </div>

                {quest.assignedResident ? (
                  <div style={styles.assignedSlot} data-testid={`quest-${quest.id}-assigned`}>
                    <div style={styles.assignedPortrait}>
                      <img
                        src={quest.assignedResident.portraitUrl}
                        alt={quest.assignedResident.name}
                        style={styles.portrait}
                      />
                    </div>
                    <div style={styles.assignedName}>{quest.assignedResident.name}</div>
                  </div>
                ) : (
                  <div style={styles.emptySlot} data-testid={`quest-${quest.id}-empty`}>
                    <div style={styles.dropZoneText}>Drop resident here</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={styles.infoPanel}>
          <h2>Quest Details</h2>
          {selectedQuest ? (
            (() => {
              const quest = quests.find((q) => q.id === selectedQuest);
              return (
                <div data-testid="selected-quest-details">
                  <p>
                    <strong>Title:</strong> {quest?.title}
                  </p>
                  <p>
                    <strong>Difficulty:</strong> {getDifficultyLabel(quest?.difficulty || 'easy')}
                  </p>
                  <p>
                    <strong>Required Level:</strong> {quest?.requiredLevel}
                  </p>
                  <p>
                    <strong>Required Stats:</strong> {formatStats(quest?.requiredStats || {})}
                  </p>
                  <p>
                    <strong>Reward:</strong> {quest?.rewardGold} Gold, {quest?.rewardXp} XP
                  </p>
                  <p>
                    <strong>Assigned:</strong> {quest?.assignedResident?.name || 'None'}
                  </p>
                </div>
              );
            })()
          ) : (
            <p>Select a quest to see details</p>
          )}
        </div>
      </div>

      <div style={styles.testInfo}>
        <h2>Test Information</h2>
        <ul>
          <li>
            <strong>Component:</strong> QuestCard
          </li>
          <li>
            <strong>Test Cases:</strong> 30 (rendering, display, state, interactions, drag readiness, edge cases)
          </li>
          <li>
            <strong>Test File:</strong> tests/e2e/minimal_slice_08_questcard.spec.ts
          </li>
          <li>
            <strong>Quests:</strong> 3 (Goblin Raid, Dragon Slaying, Lost Artifact)
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
  questsPanel: {
    flex: 2,
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  } as React.CSSProperties,
  questsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  } as React.CSSProperties,
  questCard: {
    padding: '1.5rem',
    borderRadius: '8px',
    border: '2px solid #ddd',
    backgroundColor: '#fff',
    cursor: 'pointer',
    transition: 'all 0.2s',
  } as React.CSSProperties,
  questHeader: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1rem',
    alignItems: 'flex-start',
  } as React.CSSProperties,
  questIcon: {
    fontSize: '2rem',
  } as React.CSSProperties,
  questTitle: {
    fontWeight: 'bold',
    fontSize: '1.1rem',
    color: '#333',
  } as React.CSSProperties,
  difficultyBadge: {
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    marginTop: '0.25rem',
  } as React.CSSProperties,
  questDescription: {
    fontSize: '0.9rem',
    color: '#666',
    marginBottom: '1rem',
  } as React.CSSProperties,
  requirementsSection: {
    padding: '1rem',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px',
    marginBottom: '1rem',
  } as React.CSSProperties,
  requirement: {
    fontSize: '0.85rem',
    color: '#555',
    marginBottom: '0.5rem',
  } as React.CSSProperties,
  rewardSection: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1rem',
  } as React.CSSProperties,
  reward: {
    padding: '0.5rem 1rem',
    backgroundColor: '#f0f0f0',
    borderRadius: '4px',
    fontSize: '0.9rem',
    fontWeight: 'bold',
  } as React.CSSProperties,
  assignedSlot: {
    padding: '1rem',
    backgroundColor: '#e8f5e9',
    borderRadius: '4px',
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
  } as React.CSSProperties,
  assignedPortrait: {
    width: '50px',
    height: '50px',
    borderRadius: '4px',
    overflow: 'hidden',
    backgroundColor: '#ddd',
  } as React.CSSProperties,
  portrait: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  } as React.CSSProperties,
  assignedName: {
    fontWeight: 'bold',
    fontSize: '0.9rem',
    color: '#333',
  } as React.CSSProperties,
  emptySlot: {
    padding: '1.5rem',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px',
    border: '2px dashed #ddd',
    textAlign: 'center',
  } as React.CSSProperties,
  dropZoneText: {
    color: '#999',
    fontSize: '0.9rem',
    fontWeight: '500',
  } as React.CSSProperties,
  infoPanel: {
    flex: 1,
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    height: 'fit-content',
  } as React.CSSProperties,
  testInfo: {
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  } as React.CSSProperties,
};
