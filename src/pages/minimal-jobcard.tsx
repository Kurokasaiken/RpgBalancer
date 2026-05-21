import React, { useState } from 'react';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';

/**
 * MinimalJobCardPage
 *
 * Isolated test page for JobCard component.
 * Shows job card with drop target for resident assignment.
 *
 * Route: /minimal-jobcard
 * Spec: src/docs/docs/minimal_slice/07_jobcard.md
 */

interface JobData {
  id: string;
  name: string;
  icon: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  rewardGold: number;
  rewardXp: number;
  assignedResident: ResidentState | null;
}

const mockJobs: JobData[] = [
  {
    id: 'job_001',
    name: 'Gathering',
    icon: '🌾',
    description: 'Harvest crops and gather resources from the fields',
    difficulty: 'easy',
    rewardGold: 50,
    rewardXp: 25,
    assignedResident: null,
  },
  {
    id: 'job_002',
    name: 'Mining',
    icon: '⛏️',
    description: 'Mine ore and minerals from the mountains',
    difficulty: 'medium',
    rewardGold: 100,
    rewardXp: 50,
    assignedResident: {
      id: 'res_001',
      name: 'Ragnar Strongarm',
      portraitUrl: 'https://via.placeholder.com/60/4ECDC4/FFFFFF?text=Ragnar',
      status: 'available',
      isInjured: false,
      isHero: true,
      level: 2,
      currentHp: 75,
      maxHp: 120,
      fatigue: 45,
      survivalScore: 12,
      statSnapshot: { str: 16, dex: 10, con: 15, int: 9, wis: 11, cha: 13 },
    },
  },
  {
    id: 'job_003',
    name: 'Blacksmithing',
    icon: '🔨',
    description: 'Forge weapons and armor in the smithy',
    difficulty: 'hard',
    rewardGold: 150,
    rewardXp: 75,
    assignedResident: null,
  },
];

export default function MinimalJobCardPage() {
  const [jobs, setJobs] = useState(mockJobs);
  const [draggedResident, setDraggedResident] = useState<ResidentState | null>(null);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [hoveredJob, setHoveredJob] = useState<string | null>(null);

  const getDifficultyColor = (difficulty: 'easy' | 'medium' | 'hard'): string => {
    if (difficulty === 'easy') return '#4caf50';
    if (difficulty === 'medium') return '#ff9800';
    return '#f44336';
  };

  const getDifficultyLabel = (difficulty: 'easy' | 'medium' | 'hard'): string => {
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  };

  const handleJobDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.style.borderColor = '#4caf50';
  };

  const handleJobDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.style.borderColor = '#ddd';
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>JobCard Isolated Test</h1>
      <p style={styles.subtitle}>Route: /minimal-jobcard | Spec: src/docs/docs/minimal_slice/07_jobcard.md</p>

      <div style={styles.contentArea}>
        <div style={styles.jobsPanel}>
          <h2>Available Jobs</h2>
          <div style={styles.jobsGrid} data-testid="jobs-grid">
            {jobs.map((job) => (
              <div
                key={job.id}
                style={{
                  ...styles.jobCard,
                  borderColor: selectedJob === job.id ? '#4caf50' : '#ddd',
                  backgroundColor: hoveredJob === job.id ? '#f5f5f5' : '#fff',
                }}
                data-testid={`job-card-${job.id}`}
                data-job-id={job.id}
                data-difficulty={job.difficulty}
                onClick={() => setSelectedJob(job.id)}
                onMouseEnter={() => setHoveredJob(job.id)}
                onMouseLeave={() => setHoveredJob(null)}
                onDragOver={handleJobDragOver}
                onDragLeave={handleJobDragLeave}
              >
                <div style={styles.jobHeader}>
                  <div style={styles.jobIcon} data-testid={`job-${job.id}-icon`}>
                    {job.icon}
                  </div>
                  <div>
                    <div style={styles.jobName} data-testid={`job-${job.id}-name`}>
                      {job.name}
                    </div>
                    <div
                      style={{
                        ...styles.difficultyBadge,
                        backgroundColor: getDifficultyColor(job.difficulty),
                      }}
                      data-testid={`job-${job.id}-difficulty`}
                    >
                      {getDifficultyLabel(job.difficulty)}
                    </div>
                  </div>
                </div>

                <div style={styles.jobDescription} data-testid={`job-${job.id}-description`}>
                  {job.description}
                </div>

                <div style={styles.rewardSection}>
                  <div style={styles.reward} data-testid={`job-${job.id}-reward-gold`}>
                    💰 {job.rewardGold} Gold
                  </div>
                  <div style={styles.reward} data-testid={`job-${job.id}-reward-xp`}>
                    ⭐ {job.rewardXp} XP
                  </div>
                </div>

                {job.assignedResident ? (
                  <div style={styles.assignedSlot} data-testid={`job-${job.id}-assigned`}>
                    <div style={styles.assignedPortrait}>
                      <img
                        src={job.assignedResident.portraitUrl}
                        alt={job.assignedResident.name}
                        style={styles.portrait}
                      />
                    </div>
                    <div style={styles.assignedName}>{job.assignedResident.name}</div>
                  </div>
                ) : (
                  <div style={styles.emptySlot} data-testid={`job-${job.id}-empty`}>
                    <div style={styles.dropZoneText}>Drop resident here</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={styles.infoPanel}>
          <h2>Job Details</h2>
          {selectedJob ? (
            (() => {
              const job = jobs.find((j) => j.id === selectedJob);
              return (
                <div data-testid="selected-job-details">
                  <p>
                    <strong>Name:</strong> {job?.name}
                  </p>
                  <p>
                    <strong>Difficulty:</strong> {getDifficultyLabel(job?.difficulty || 'easy')}
                  </p>
                  <p>
                    <strong>Reward:</strong> {job?.rewardGold} Gold, {job?.rewardXp} XP
                  </p>
                  <p>
                    <strong>Assigned:</strong> {job?.assignedResident?.name || 'None'}
                  </p>
                </div>
              );
            })()
          ) : (
            <p>Select a job to see details</p>
          )}
        </div>
      </div>

      <div style={styles.testInfo}>
        <h2>Test Information</h2>
        <ul>
          <li>
            <strong>Component:</strong> JobCard
          </li>
          <li>
            <strong>Test Cases:</strong> 30 (rendering, display, state, interactions, drag readiness, edge cases)
          </li>
          <li>
            <strong>Test File:</strong> tests/e2e/minimal_slice_07_jobcard.spec.ts
          </li>
          <li>
            <strong>Jobs:</strong> 3 (Gathering, Mining, Blacksmithing)
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
  jobsPanel: {
    flex: 2,
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  } as React.CSSProperties,
  jobsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  } as React.CSSProperties,
  jobCard: {
    padding: '1.5rem',
    borderRadius: '8px',
    border: '2px solid #ddd',
    backgroundColor: '#fff',
    cursor: 'pointer',
    transition: 'all 0.2s',
  } as React.CSSProperties,
  jobHeader: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1rem',
    alignItems: 'flex-start',
  } as React.CSSProperties,
  jobIcon: {
    fontSize: '2rem',
  } as React.CSSProperties,
  jobName: {
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
  jobDescription: {
    fontSize: '0.9rem',
    color: '#666',
    marginBottom: '1rem',
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
