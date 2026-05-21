import React, { useState } from 'react';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';

/**
 * MinimalIntegrationDragJobPage
 *
 * Integration test page for PgCard + JobCard.
 * Tests drag-drop assignment of residents to jobs.
 *
 * Route: /minimal-integration-drag-job
 * Spec: src/docs/docs/minimal_slice/12_integration_drag.md
 */

interface JobSlot {
  jobId: string;
  jobName: string;
  icon: string;
  reward: number;
  assignedResident: ResidentState | null;
}

const mockResidents: ResidentState[] = [
  {
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
  {
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
];

const mockJobs: JobSlot[] = [
  {
    jobId: 'job_001',
    jobName: 'Mining',
    icon: '⛏️',
    reward: 100,
    assignedResident: null,
  },
  {
    jobId: 'job_002',
    jobName: 'Gathering',
    icon: '🌾',
    reward: 50,
    assignedResident: null,
  },
];

export default function MinimalIntegrationDragJobPage() {
  const [residents, setResidents] = useState(mockResidents);
  const [jobs, setJobs] = useState(mockJobs);
  const [draggedResident, setDraggedResident] = useState<ResidentState | null>(null);
  const [dragSource, setDragSource] = useState<'roster' | 'job' | null>(null);

  const handleResidentDragStart = (resident: ResidentState) => {
    setDraggedResident(resident);
    setDragSource('roster');
  };

  const handleJobDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.style.borderColor = '#4caf50';
  };

  const handleJobDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.style.borderColor = '#ddd';
  };

  const handleJobDrop = (jobIdx: number) => {
    if (!draggedResident) return;

    const job = jobs[jobIdx];
    if (job.assignedResident) return; // Already occupied

    // Update job
    const newJobs = [...jobs];
    newJobs[jobIdx] = { ...job, assignedResident: draggedResident };
    setJobs(newJobs);

    // Remove from roster
    const newResidents = residents.filter((r) => r.id !== draggedResident.id);
    setResidents(newResidents);

    // Reset drag
    setDraggedResident(null);
    setDragSource(null);
  };

  const handleUnassign = (jobIdx: number) => {
    const job = jobs[jobIdx];
    if (!job.assignedResident) return;

    // Add back to roster
    setResidents([...residents, job.assignedResident]);

    // Remove from job
    const newJobs = [...jobs];
    newJobs[jobIdx] = { ...job, assignedResident: null };
    setJobs(newJobs);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Integration: Drag PgCard to JobCard</h1>
      <p style={styles.subtitle}>Route: /minimal-integration-drag-job | Spec: src/docs/docs/minimal_slice/12_integration_drag.md</p>

      <div style={styles.contentArea}>
        {/* Roster */}
        <div style={styles.panel}>
          <h2>Available Residents</h2>
          <div style={styles.rosterGrid} data-testid="integration-roster">
            {residents.map((resident) => (
              <div
                key={resident.id}
                style={styles.residentCard}
                draggable
                onDragStart={() => handleResidentDragStart(resident)}
                data-testid={`integration-resident-${resident.id}`}
              >
                <img
                  src={resident.portraitUrl}
                  alt={resident.name}
                  style={styles.portrait}
                  data-testid={`integration-resident-portrait-${resident.id}`}
                />
                <div style={styles.residentName}>{resident.name}</div>
                <div style={styles.residentMeta}>Lv {resident.level}</div>
              </div>
            ))}
          </div>
          {residents.length === 0 && (
            <div style={styles.emptyMessage} data-testid="integration-roster-empty">
              All residents assigned
            </div>
          )}
        </div>

        {/* Jobs */}
        <div style={styles.panel}>
          <h2>Job Assignments</h2>
          <div style={styles.jobsList} data-testid="integration-jobs">
            {jobs.map((job, idx) => (
              <div
                key={job.jobId}
                style={{
                  ...styles.jobSlot,
                  borderColor: draggedResident ? '#4caf50' : '#ddd',
                }}
                data-testid={`integration-job-${idx}`}
                onDragOver={handleJobDragOver}
                onDragLeave={handleJobDragLeave}
                onDrop={() => handleJobDrop(idx)}
              >
                <div style={styles.jobHeader}>
                  <span style={styles.jobIcon}>{job.icon}</span>
                  <span style={styles.jobName}>{job.jobName}</span>
                </div>

                {job.assignedResident ? (
                  <div style={styles.assignedSlot} data-testid={`integration-job-${idx}-assigned`}>
                    <img
                      src={job.assignedResident.portraitUrl}
                      alt={job.assignedResident.name}
                      style={styles.assignedPortrait}
                    />
                    <div style={styles.assignedInfo}>
                      <div style={styles.assignedName}>{job.assignedResident.name}</div>
                      <button
                        onClick={() => handleUnassign(idx)}
                        style={styles.unassignButton}
                        data-testid={`integration-unassign-${idx}`}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={styles.emptyDropZone} data-testid={`integration-job-${idx}-empty`}>
                    Drop resident here
                  </div>
                )}

                <div style={styles.jobReward}>Reward: {job.reward} Gold</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={styles.testInfo}>
        <h2>Test Information</h2>
        <ul>
          <li>
            <strong>Integration Test:</strong> Drag PgCard to JobCard
          </li>
          <li>
            <strong>Test Cases:</strong> 16 (drag setup, drag-drop flow, validation, visual feedback)
          </li>
          <li>
            <strong>Test File:</strong> tests/e2e/minimal_slice_12_integration_drag_job.spec.ts
          </li>
          <li>
            <strong>Interaction:</strong> Drag residents from roster to job slots
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
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '2rem',
    marginBottom: '2rem',
  } as React.CSSProperties,
  panel: {
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  } as React.CSSProperties,
  rosterGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
    gap: '1rem',
  } as React.CSSProperties,
  residentCard: {
    padding: '1rem',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    border: '2px solid #ddd',
    cursor: 'grab',
    textAlign: 'center',
    transition: 'all 0.2s',
  } as React.CSSProperties,
  portrait: {
    width: '80px',
    height: '80px',
    borderRadius: '6px',
    objectFit: 'cover',
    marginBottom: '0.5rem',
  } as React.CSSProperties,
  residentName: {
    fontWeight: 'bold',
    fontSize: '0.9rem',
    color: '#333',
  } as React.CSSProperties,
  residentMeta: {
    fontSize: '0.8rem',
    color: '#666',
    marginTop: '0.25rem',
  } as React.CSSProperties,
  emptyMessage: {
    padding: '2rem',
    textAlign: 'center',
    color: '#999',
    fontSize: '0.95rem',
  } as React.CSSProperties,
  jobsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  } as React.CSSProperties,
  jobSlot: {
    padding: '1.5rem',
    backgroundColor: '#fafafa',
    borderRadius: '8px',
    border: '2px solid #ddd',
    transition: 'border-color 0.2s',
  } as React.CSSProperties,
  jobHeader: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
    marginBottom: '1rem',
  } as React.CSSProperties,
  jobIcon: {
    fontSize: '1.5rem',
  } as React.CSSProperties,
  jobName: {
    fontWeight: 'bold',
    color: '#333',
  } as React.CSSProperties,
  assignedSlot: {
    padding: '1rem',
    backgroundColor: '#e8f5e9',
    borderRadius: '6px',
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
    marginBottom: '0.75rem',
  } as React.CSSProperties,
  assignedPortrait: {
    width: '60px',
    height: '60px',
    borderRadius: '4px',
    objectFit: 'cover',
  } as React.CSSProperties,
  assignedInfo: {
    flex: 1,
  } as React.CSSProperties,
  assignedName: {
    fontWeight: 'bold',
    fontSize: '0.95rem',
    color: '#333',
    marginBottom: '0.5rem',
  } as React.CSSProperties,
  unassignButton: {
    padding: '0.4rem 0.8rem',
    backgroundColor: '#ff9800',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    cursor: 'pointer',
  } as React.CSSProperties,
  emptyDropZone: {
    padding: '2rem',
    backgroundColor: '#f0f0f0',
    borderRadius: '6px',
    border: '2px dashed #ddd',
    textAlign: 'center',
    color: '#999',
    fontSize: '0.9rem',
    marginBottom: '0.75rem',
  } as React.CSSProperties,
  jobReward: {
    fontSize: '0.85rem',
    color: '#4caf50',
    fontWeight: 'bold',
  } as React.CSSProperties,
  testInfo: {
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  } as React.CSSProperties,
};
