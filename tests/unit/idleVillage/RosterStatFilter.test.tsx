/**
 * RosterStatFilter Unit Tests
 *
 * Test suite for the RosterStatFilter component and its React Context
 * Tests cover filter state management, UI rendering, user interactions, and filter logic
 *
 * Framework: Vitest + React Testing Library
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { RosterStatFilter, RosterFilterProvider, useRosterFilter } from '@/ui/idleVillage/components/RosterStatFilter';
import type { FilterCriterion } from '@/ui/idleVillage/config/rosterFilterConfig';

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}));

describe('RosterStatFilter', () => {
  describe('RosterFilterProvider', () => {
    it('should provide filter context to children', () => {
      const TestComponent = () => {
        const { criteria } = useRosterFilter();
        return <div data-testid="filter-count">{criteria.length}</div>;
      };

      render(
        <RosterFilterProvider>
          <TestComponent />
        </RosterFilterProvider>
      );

      expect(screen.getByTestId('filter-count')).toHaveTextContent('0');
    });

    it('should initialize with empty filter criteria', () => {
      const TestComponent = () => {
        const { criteria } = useRosterFilter();
        return <div data-testid="criteria">{JSON.stringify(criteria)}</div>;
      };

      render(
        <RosterFilterProvider>
          <TestComponent />
        </RosterFilterProvider>
      );

      expect(screen.getByTestId('criteria')).toHaveTextContent('[]');
    });
  });

  describe('useRosterFilter hook', () => {
    it('should throw error when used outside provider', () => {
      const TestComponent = () => {
        try {
          const { criteria } = useRosterFilter();
          return <div>{criteria.length}</div>;
        } catch (error) {
          return <div data-testid="error">Error</div>;
        }
      };

      render(<TestComponent />);
      expect(screen.getByTestId('error')).toBeInTheDocument();
    });

    it('should add filter criterion', () => {
      const TestComponent = () => {
        const { criteria, addCriterion } = useRosterFilter();
        return (
          <div>
            <div data-testid="filter-count">{criteria.length}</div>
            <button onClick={() => addCriterion({ stat: 'hp', operator: '>', threshold: 50 })}>
              Add Filter
            </button>
          </div>
        );
      };

      render(
        <RosterFilterProvider>
          <TestComponent />
        </RosterFilterProvider>
      );

      fireEvent.click(screen.getByText('Add Filter'));
      expect(screen.getByTestId('filter-count')).toHaveTextContent('1');
    });

    it('should remove filter criterion by index', () => {
      const TestComponent = () => {
        const { criteria, addCriterion, removeCriterion } = useRosterFilter();
        return (
          <div>
            <div data-testid="filter-count">{criteria.length}</div>
            <button onClick={() => addCriterion({ stat: 'hp', operator: '>', threshold: 50 })}>
              Add Filter
            </button>
            <button onClick={() => removeCriterion(0)}>Remove Filter</button>
          </div>
        );
      };

      render(
        <RosterFilterProvider>
          <TestComponent />
        </RosterFilterProvider>
      );

      fireEvent.click(screen.getByText('Add Filter'));
      expect(screen.getByTestId('filter-count')).toHaveTextContent('1');

      fireEvent.click(screen.getByText('Remove Filter'));
      expect(screen.getByTestId('filter-count')).toHaveTextContent('0');
    });

    it('should clear all filter criteria', () => {
      const TestComponent = () => {
        const { criteria, addCriterion, clearCriteria } = useRosterFilter();
        return (
          <div>
            <div data-testid="filter-count">{criteria.length}</div>
            <button onClick={() => addCriterion({ stat: 'hp', operator: '>', threshold: 50 })}>
              Add Filter
            </button>
            <button onClick={() => addCriterion({ stat: 'damage', operator: '<', threshold: 30 })}>
              Add Filter 2
            </button>
            <button onClick={() => clearCriteria()}>Clear All</button>
          </div>
        );
      };

      render(
        <RosterFilterProvider>
          <TestComponent />
        </RosterFilterProvider>
      );

      fireEvent.click(screen.getByText('Add Filter'));
      fireEvent.click(screen.getByText('Add Filter 2'));
      expect(screen.getByTestId('filter-count')).toHaveTextContent('2');

      fireEvent.click(screen.getByText('Clear All'));
      expect(screen.getByTestId('filter-count')).toHaveTextContent('0');
    });

    it('should update filter criterion by index', () => {
      const TestComponent = () => {
        const { criteria, addCriterion, updateCriterion } = useRosterFilter();
        return (
          <div>
            <div data-testid="filter-count">{criteria.length}</div>
            <div data-testid="filter-threshold">
              {criteria[0]?.threshold ?? 'none'}
            </div>
            <button onClick={() => addCriterion({ stat: 'hp', operator: '>', threshold: 50 })}>
              Add Filter
            </button>
            <button onClick={() => updateCriterion(0, { stat: 'hp', operator: '>', threshold: 75 })}>
              Update Filter
            </button>
          </div>
        );
      };

      render(
        <RosterFilterProvider>
          <TestComponent />
        </RosterFilterProvider>
      );

      fireEvent.click(screen.getByText('Add Filter'));
      expect(screen.getByTestId('filter-threshold')).toHaveTextContent('50');

      fireEvent.click(screen.getByText('Update Filter'));
      expect(screen.getByTestId('filter-threshold')).toHaveTextContent('75');
    });
  });

  describe('RosterStatFilter component', () => {
    it('should render filter UI', () => {
      render(
        <RosterFilterProvider>
          <RosterStatFilter />
        </RosterFilterProvider>
      );

      // Check for filter controls presence
      expect(screen.getByTestId('roster-stat-filter')).toBeInTheDocument();
      expect(screen.getByTestId('filter-stat-select')).toBeInTheDocument();
      expect(screen.getByTestId('filter-operator-select')).toBeInTheDocument();
      expect(screen.getByTestId('filter-threshold-input')).toBeInTheDocument();
      expect(screen.getByTestId('add-filter-button')).toBeInTheDocument();
    });

    it('should render add filter button', () => {
      render(
        <RosterFilterProvider>
          <RosterStatFilter />
        </RosterFilterProvider>
      );

      expect(screen.getByText(/add/i)).toBeInTheDocument();
    });

    it('should not render clear filters button when no filters active', () => {
      render(
        <RosterFilterProvider>
          <RosterStatFilter />
        </RosterFilterProvider>
      );

      expect(screen.queryByText(/clear/i)).not.toBeInTheDocument();
    });

    it('should add filter when add button clicked', async () => {
      render(
        <RosterFilterProvider>
          <RosterStatFilter />
        </RosterFilterProvider>
      );

      const addButton = screen.getByText(/add/i);
      await userEvent.click(addButton);

      // After adding, should have filter controls visible
      expect(screen.getByText(/stat/i)).toBeInTheDocument();
    });

    it('should clear all filters when clear button clicked', async () => {
      const TestComponent = () => {
        const { criteria, addCriterion, clearCriteria } = useRosterFilter();
        return (
          <div>
            <RosterStatFilter />
            <button onClick={() => addCriterion({ stat: 'hp', operator: '>', threshold: 50 })}>
              Add Filter
            </button>
          </div>
        );
      };

      render(
        <RosterFilterProvider>
          <TestComponent />
        </RosterFilterProvider>
      );

      // Add a filter
      await userEvent.click(screen.getByText('Add Filter'));

      // Clear button should now be visible
      const clearButton = screen.getByText(/clear/i);
      await userEvent.click(clearButton);

      // Clear button should be hidden again
      expect(screen.queryByText(/clear/i)).not.toBeInTheDocument();
    });

    it('should render filter controls for each criterion', async () => {
      const TestComponent = () => {
        const { criteria, addCriterion } = useRosterFilter();
        return (
          <div>
            <RosterStatFilter />
            <button onClick={() => addCriterion({ stat: 'hp', operator: '>', threshold: 50 })}>
              Add Filter
            </button>
          </div>
        );
      };

      render(
        <RosterFilterProvider>
          <TestComponent />
        </RosterFilterProvider>
      );

      const addButton = screen.getByText('Add Filter');
      await userEvent.click(addButton);

      // Should have stat, operator, and threshold controls
      expect(screen.getByText(/stat/i)).toBeInTheDocument();
      expect(screen.getByText(/operator/i)).toBeInTheDocument();
      expect(screen.getByText(/threshold/i)).toBeInTheDocument();
    });

    it('should have accessible ARIA labels', () => {
      render(
        <RosterFilterProvider>
          <RosterStatFilter />
        </RosterFilterProvider>
      );

      const addButton = screen.getByRole('button', { name: /add filter/i });
      expect(addButton).toBeInTheDocument();

      // Clear button is only shown when filters are active
      const clearButton = screen.queryByRole('button', { name: /clear filters/i });
      expect(clearButton).not.toBeInTheDocument();
    });
  });

  describe('Filter logic integration', () => {
    it('should handle multiple filter criteria', () => {
      const TestComponent = () => {
        const { criteria, addCriterion } = useRosterFilter();
        return (
          <div>
            <div data-testid="filter-count">{criteria.length}</div>
            <button onClick={() => addCriterion({ stat: 'hp', operator: '>', threshold: 50 })}>
              Add HP Filter
            </button>
            <button onClick={() => addCriterion({ stat: 'damage', operator: '<', threshold: 30 })}>
              Add Damage Filter
            </button>
          </div>
        );
      };

      render(
        <RosterFilterProvider>
          <TestComponent />
        </RosterFilterProvider>
      );

      fireEvent.click(screen.getByText('Add HP Filter'));
      fireEvent.click(screen.getByText('Add Damage Filter'));

      expect(screen.getByTestId('filter-count')).toHaveTextContent('2');
    });

    it('should handle all filter operators', () => {
      const operators = ['>', '<', '=', '>=', '<='] as const;
      const TestComponent = () => {
        const { criteria, addCriterion } = useRosterFilter();
        return (
          <div>
            <div data-testid="filter-count">{criteria.length}</div>
            {operators.map((op, idx) => (
              <button
                key={op}
                onClick={() => addCriterion({ stat: 'hp', operator: op, threshold: 50 })}
              >
                Add {op}
              </button>
            ))}
          </div>
        );
      };

      render(
        <RosterFilterProvider>
          <TestComponent />
        </RosterFilterProvider>
      );

      operators.forEach((op) => {
        fireEvent.click(screen.getByText(`Add ${op}`));
      });

      expect(screen.getByTestId('filter-count')).toHaveTextContent(String(operators.length));
    });

    it('should handle different stat keys', () => {
      const stats = ['hp', 'damage', 'agility', 'evasion'] as const;
      const TestComponent = () => {
        const { criteria, addCriterion } = useRosterFilter();
        return (
          <div>
            <div data-testid="filter-count">{criteria.length}</div>
            {stats.map((stat) => (
              <button
                key={stat}
                onClick={() => addCriterion({ stat, operator: '>', threshold: 50 })}
              >
                Add {stat}
              </button>
            ))}
          </div>
        );
      };

      render(
        <RosterFilterProvider>
          <TestComponent />
        </RosterFilterProvider>
      );

      stats.forEach((stat) => {
        fireEvent.click(screen.getByText(`Add ${stat}`));
      });

      expect(screen.getByTestId('filter-count')).toHaveTextContent(String(stats.length));
    });
  });

  describe('Edge cases', () => {
    it('should handle removing non-existent filter index gracefully', () => {
      const TestComponent = () => {
        const { criteria, removeCriterion } = useRosterFilter();
        return (
          <div>
            <div data-testid="filter-count">{criteria.length}</div>
            <button onClick={() => removeCriterion(999)}>Remove Invalid</button>
          </div>
        );
      };

      render(
        <RosterFilterProvider>
          <TestComponent />
        </RosterFilterProvider>
      );

      fireEvent.click(screen.getByText('Remove Invalid'));
      expect(screen.getByTestId('filter-count')).toHaveTextContent('0');
    });

    it('should handle updating non-existent filter index gracefully', () => {
      const TestComponent = () => {
        const { criteria, updateCriterion } = useRosterFilter();
        return (
          <div>
            <div data-testid="filter-count">{criteria.length}</div>
            <button onClick={() => updateCriterion(999, { stat: 'hp', operator: '>', threshold: 50 })}>
              Update Invalid
            </button>
          </div>
        );
      };

      render(
        <RosterFilterProvider>
          <TestComponent />
        </RosterFilterProvider>
      );

      fireEvent.click(screen.getByText('Update Invalid'));
      expect(screen.getByTestId('filter-count')).toHaveTextContent('0');
    });

    it('should handle empty filter criteria on clear', () => {
      const TestComponent = () => {
        const { criteria, clearCriteria } = useRosterFilter();
        return (
          <div>
            <div data-testid="filter-count">{criteria.length}</div>
            <button onClick={() => clearCriteria()}>Clear Empty</button>
          </div>
        );
      };

      render(
        <RosterFilterProvider>
          <TestComponent />
        </RosterFilterProvider>
      );

      fireEvent.click(screen.getByText('Clear Empty'));
      expect(screen.getByTestId('filter-count')).toHaveTextContent('0');
    });
  });
});
