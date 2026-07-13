import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MultiVillageSchedulerMonitorDashboard } from '@/ui/idleVillage/MultiVillageSchedulerMonitor';

const mockKPIs = {
  villageId: 'village-1',
  timestamp: Date.now(),
  queue: { size: 10, averageSize: 9, maxSize: 100, utilization: 0.1 },
  assignments: { total: 50, successful: 45, failed: 5, successRate: 0.9, averageDuration: 1000000 },
  residents: { total: 10, active: 7, idle: 3, utilization: 0.7, fatigueDistribution: { low: 5, medium: 3, high: 1, critical: 1 } },
  activities: { total: 5, active: 4, utilization: 0.8, byType: { food: 2, build: 2 } },
  performance: { averageProcessingTime: 120, throughput: 1.5, efficiency: 0.75, loadFactor: 0.4 },
};

const mockMonitor = {
  getVillages: () => [{ id: 'village-1', name: 'Test Village' }],
  getLatestKPIs: () => mockKPIs,
  getKPIHistory: () => [mockKPIs],
  getActiveAlerts: () => [],
  performComparativeAnalysis: () => ({
    timeWindow: 3600000,
    summary: {
      averageEfficiency: 0.75,
      standardDeviation: 0.05,
      bestPerformer: 'Test Village',
      worstPerformer: 'Test Village',
      recommendations: [],
    },
    rankings: [],
  }),
  getStats: () => ({ villagesMonitored: 1, totalKpisCollected: 1, activeAlerts: 0, uptime: 0.99 }),
};

function renderMonitor() {
  return render(<MultiVillageSchedulerMonitorDashboard monitor={mockMonitor as any} />);
}

describe('MultiVillageSchedulerMonitor I18N-003c', () => {
  it('renders localized title and subtitle', () => {
    renderMonitor();
    expect(screen.getByText(/Multi-Village Scheduler Monitor/)).toBeInTheDocument();
    expect(screen.getByText(/Monitoring 1 villages/)).toBeInTheDocument();
  });

  it('renders localized tabs', () => {
    renderMonitor();
    expect(screen.getByText(/Overview/)).toBeInTheDocument();
    expect(screen.getByText(/Comparison/)).toBeInTheDocument();
    expect(screen.getByText(/Alerts/)).toBeInTheDocument();
    expect(screen.getByText(/Details/)).toBeInTheDocument();
  });

  it('renders localized overview card labels', () => {
    renderMonitor();
    expect(screen.getByText('Test Village')).toBeInTheDocument();
    expect(screen.getByText('Queue')).toBeInTheDocument();
    expect(screen.getByText('Success Rate')).toBeInTheDocument();
    expect(screen.getByText('Utilization')).toBeInTheDocument();
  });
});
