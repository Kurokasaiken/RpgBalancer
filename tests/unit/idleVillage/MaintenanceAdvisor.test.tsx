import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MaintenanceAdvisorPanel } from '@/ui/idleVillage/components/MaintenanceAdvisorPanel';
import { useMaintenanceAdvisor } from '@/ui/idleVillage/hooks/useMaintenanceAdvisor';
import type { VillageState } from '@/engine/game/idleVillage/TimeEngine';
import type { Resident } from '@/engine/game/idleVillage/types';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/activities';

// Mock the hook
vi.mock('@/ui/idleVillage/hooks/useMaintenanceAdvisor', () => ({
  useMaintenanceAdvisor: vi.fn(),
}));

// Mock the config hook
vi.mock('@/balancing/hooks/useIdleVillageConfig', () => ({
  useIdleVillageConfig: vi.fn(() => ({
    config: {
      globalRules: {
        foodWarningThreshold: 50,
        goldWarningThreshold: 100,
        foodConsumptionPerResidentPerDay: 2,
        maxConcurrentActivities: 5,
        recommendedGoldReserve: 500,
      },
    },
    initialized: true,
    isInitializing: false,
  })),
}));

describe('MaintenanceAdvisorPanel', () => {
  const mockVillageState: VillageState = {
    time: 0,
    resources: { food: 30, gold: 50 },
    buildings: [],
    scheduledActivities: [],
    completedActivities: [],
  };

  const mockResidents: Resident[] = [
    {
      id: 'founder',
      displayName: 'Founder',
      status: 'available',
      stats: { combat: 50 },
      fatigue: 0,
    },
    {
      id: 'worker1',
      displayName: 'Worker 1',
      status: 'injured',
      stats: { farming: 60 },
      fatigue: 10,
    },
  ];

  const mockActivities: ActivityDefinition[] = [
    {
      id: 'farming',
      label: 'Farming',
      kind: 'job',
      duration: 100,
      tags: ['job'],
      rewards: { food: 50 },
      requirements: { fatigueCost: 20 },
    },
  ];

  const mockAnalysis = {
    timestamp: Date.now(),
    recommendations: [
      {
        id: 'food-critical',
        type: 'resource_management' as const,
        priority: 'critical' as const,
        title: 'Critical Food Shortage',
        description: 'Food reserves are critically low (30). Residents may starve soon.',
        metadata: { currentFood: 30 },
      },
      {
        id: 'gold-low',
        type: 'resource_management' as const,
        priority: 'medium' as const,
        title: 'Low Gold Reserves',
        description: 'Gold reserves are below recommended levels (50).',
        metadata: { currentGold: 50 },
      },
      {
        id: 'multiple-injuries',
        type: 'resident_health' as const,
        priority: 'high' as const,
        title: 'Multiple Injuries',
        description: '1 residents are injured. Review quest assignments.',
        metadata: { injuredCount: 1 },
      },
    ],
    summary: {
      criticalCount: 1,
      highCount: 1,
      mediumCount: 1,
      lowCount: 0,
      totalCount: 3,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock the hook implementation
    (useMaintenanceAdvisor as any).mockReturnValue({
      analysis: mockAnalysis,
      isAnalyzing: false,
      analyze: vi.fn(),
      getRecommendationsByPriority: vi.fn((priority) =>
        mockAnalysis.recommendations.filter(r => r.priority === priority)
      ),
      getRecommendationsByType: vi.fn((type) =>
        mockAnalysis.recommendations.filter(r => r.type === type)
      ),
    });
  });

  describe('Rendering', () => {
    it('renders the panel with title and summary badges', () => {
      render(
        <MaintenanceAdvisorPanel
          villageState={mockVillageState}
          residents={mockResidents}
          activities={mockActivities}
        />
      );

      expect(screen.getByText('Maintenance Advisor')).toBeInTheDocument();
      expect(screen.getByText('AI')).toBeInTheDocument();
      expect(screen.getByText('1 Critical')).toBeInTheDocument();
      expect(screen.getByText('1 High')).toBeInTheDocument();
    });

    it('displays recommendations when expanded', () => {
      render(
        <MaintenanceAdvisorPanel
          villageState={mockVillageState}
          residents={mockResidents}
          activities={mockActivities}
        />
      );

      expect(screen.getByText('Critical Food Shortage')).toBeInTheDocument();
      expect(screen.getByText('Multiple Injuries')).toBeInTheDocument();
      expect(screen.getByText('Low Gold Reserves')).toBeInTheDocument();
    });

    it('shows "All Systems Optimal" when no recommendations', () => {
      (useMaintenanceAdvisor as any).mockReturnValue({
        analysis: {
          ...mockAnalysis,
          recommendations: [],
          summary: { criticalCount: 0, highCount: 0, mediumCount: 0, lowCount: 0, totalCount: 0 },
        },
        isAnalyzing: false,
        analyze: vi.fn(),
        getRecommendationsByPriority: vi.fn(() => []),
        getRecommendationsByType: vi.fn(() => []),
      });

      render(
        <MaintenanceAdvisorPanel
          villageState={mockVillageState}
          residents={mockResidents}
          activities={mockActivities}
        />
      );

      expect(screen.getByText('All Systems Optimal')).toBeInTheDocument();
    });

    it('shows loading state when no analysis available', () => {
      (useMaintenanceAdvisor as any).mockReturnValue({
        analysis: null,
        isAnalyzing: false,
        analyze: vi.fn(),
        getRecommendationsByPriority: vi.fn(() => []),
        getRecommendationsByType: vi.fn(() => []),
      });

      render(
        <MaintenanceAdvisorPanel
          villageState={mockVillageState}
          residents={mockResidents}
          activities={mockActivities}
        />
      );

      expect(screen.getByText('Loading Maintenance Advisor...')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls analyze when refresh button is clicked', async () => {
      const mockAnalyze = vi.fn();
      (useMaintenanceAdvisor as any).mockReturnValue({
        analysis: mockAnalysis,
        isAnalyzing: false,
        analyze: mockAnalyze,
        getRecommendationsByPriority: vi.fn((priority) =>
          mockAnalysis.recommendations.filter(r => r.priority === priority)
        ),
        getRecommendationsByType: vi.fn((type) =>
          mockAnalysis.recommendations.filter(r => r.type === type)
        ),
      });

      const user = userEvent.setup();
      render(
        <MaintenanceAdvisorPanel
          villageState={mockVillageState}
          residents={mockResidents}
          activities={mockActivities}
        />
      );

      const refreshButton = screen.getByTitle('Refresh analysis');
      await user.click(refreshButton);

      expect(mockAnalyze).toHaveBeenCalledTimes(1);
    });

    it('toggles collapse state when collapse button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <MaintenanceAdvisorPanel
          villageState={mockVillageState}
          residents={mockResidents}
          activities={mockActivities}
        />
      );

      const collapseButton = screen.getByTitle('Collapse');
      await user.click(collapseButton);

      // Content should be hidden
      expect(screen.queryByText('Critical Food Shortage')).not.toBeInTheDocument();

      // Click again to expand
      const expandButton = screen.getByTitle('Expand');
      await user.click(expandButton);

      expect(screen.getByText('Critical Food Shortage')).toBeInTheDocument();
    });

    it('starts collapsed when collapsed prop is true', () => {
      render(
        <MaintenanceAdvisorPanel
          villageState={mockVillageState}
          residents={mockResidents}
          activities={mockActivities}
          collapsed={true}
        />
      );

      expect(screen.queryByText('Critical Food Shortage')).not.toBeInTheDocument();
    });

    it('respects maxRecommendations prop', () => {
      render(
        <MaintenanceAdvisorPanel
          villageState={mockVillageState}
          residents={mockResidents}
          activities={mockActivities}
          maxRecommendations={2}
        />
      );

      expect(screen.getByText('Critical Food Shortage')).toBeInTheDocument();
      expect(screen.getByText('Multiple Injuries')).toBeInTheDocument();
      expect(screen.queryByText('Low Gold Reserves')).not.toBeInTheDocument();
    });
  });

  describe('Recommendation Cards', () => {
    it('displays correct priority styling and icons', () => {
      render(
        <MaintenanceAdvisorPanel
          villageState={mockVillageState}
          residents={mockResidents}
          activities={mockActivities}
        />
      );

      // Critical recommendation should have red styling
      const criticalCard = screen.getByText('Critical Food Shortage').closest('div');
      expect(criticalCard).toHaveClass('text-red-400');

      // High recommendation should have orange styling
      const highCard = screen.getByText('Multiple Injuries').closest('div');
      expect(highCard).toHaveClass('text-orange-400');

      // Medium recommendation should have yellow styling
      const mediumCard = screen.getByText('Low Gold Reserves').closest('div');
      expect(mediumCard).toHaveClass('text-yellow-400');
    });

    it('displays recommendation type badges', () => {
      render(
        <MaintenanceAdvisorPanel
          villageState={mockVillageState}
          residents={mockResidents}
          activities={mockActivities}
        />
      );

      expect(screen.getByText('resource management')).toBeInTheDocument();
      expect(screen.getByText('resident health')).toBeInTheDocument();
    });

    it('shows action button when recommendation has action', () => {
      const recommendationWithAction = {
        ...mockAnalysis.recommendations[0],
        action: {
          label: 'Fix Now',
          callback: vi.fn(),
        },
      };

      (useMaintenanceAdvisor as any).mockReturnValue({
        analysis: {
          ...mockAnalysis,
          recommendations: [recommendationWithAction],
        },
        isAnalyzing: false,
        analyze: vi.fn(),
        getRecommendationsByPriority: vi.fn(() => [recommendationWithAction]),
        getRecommendationsByType: vi.fn(() => [recommendationWithAction]),
      });

      render(
        <MaintenanceAdvisorPanel
          villageState={mockVillageState}
          residents={mockResidents}
          activities={mockActivities}
        />
      );

      expect(screen.getByText('Fix Now')).toBeInTheDocument();
    });

    it('calls action callback when action button is clicked', async () => {
      const mockCallback = vi.fn();
      const recommendationWithAction = {
        ...mockAnalysis.recommendations[0],
        action: {
          label: 'Fix Now',
          callback: mockCallback,
        },
      };

      (useMaintenanceAdvisor as any).mockReturnValue({
        analysis: {
          ...mockAnalysis,
          recommendations: [recommendationWithAction],
        },
        isAnalyzing: false,
        analyze: vi.fn(),
        getRecommendationsByPriority: vi.fn(() => [recommendationWithAction]),
        getRecommendationsByType: vi.fn(() => [recommendationWithAction]),
      });

      const user = userEvent.setup();
      render(
        <MaintenanceAdvisorPanel
          villageState={mockVillageState}
          residents={mockResidents}
          activities={mockActivities}
        />
      );

      const actionButton = screen.getByText('Fix Now');
      await user.click(actionButton);

      expect(mockCallback).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading States', () => {
    it('shows loading indicator when analyzing', () => {
      (useMaintenanceAdvisor as any).mockReturnValue({
        analysis: mockAnalysis,
        isAnalyzing: true,
        analyze: vi.fn(),
        getRecommendationsByPriority: vi.fn(() => []),
        getRecommendationsByType: vi.fn(() => []),
      });

      render(
        <MaintenanceAdvisorPanel
          villageState={mockVillageState}
          residents={mockResidents}
          activities={mockActivities}
        />
      );

      // Should show loading spinner
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('disables refresh button when analyzing', () => {
      (useMaintenanceAdvisor as any).mockReturnValue({
        analysis: mockAnalysis,
        isAnalyzing: true,
        analyze: vi.fn(),
        getRecommendationsByPriority: vi.fn(() => []),
        getRecommendationsByType: vi.fn(() => []),
      });

      render(
        <MaintenanceAdvisorPanel
          villageState={mockVillageState}
          residents={mockResidents}
          activities={mockActivities}
        />
      );

      const refreshButton = screen.getByTitle('Refresh analysis');
      expect(refreshButton).toBeDisabled();
    });
  });

  describe('Summary Footer', () => {
    it('displays recommendation counts', () => {
      render(
        <MaintenanceAdvisorPanel
          villageState={mockVillageState}
          residents={mockResidents}
          activities={mockActivities}
        />
      );

      expect(screen.getByText('Showing 3 of 3 recommendations')).toBeInTheDocument();
      expect(screen.getByText('Critical: 1')).toBeInTheDocument();
      expect(screen.getByText('High: 1')).toBeInTheDocument();
      expect(screen.getByText('Medium: 1')).toBeInTheDocument();
      expect(screen.getByText('Low: 0')).toBeInTheDocument();
    });

    it('shows truncated message when maxRecommendations is exceeded', () => {
      render(
        <MaintenanceAdvisorPanel
          villageState={mockVillageState}
          residents={mockResidents}
          activities={mockActivities}
          maxRecommendations={2}
        />
      );

      expect(screen.getByText('Showing 2 of 3 recommendations')).toBeInTheDocument();
      expect(screen.getByText('1 more available')).toBeInTheDocument();
    });
  });
});
