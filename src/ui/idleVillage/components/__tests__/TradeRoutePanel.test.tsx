/**
 * Tests for TradeRoutePanel component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import TradeRoutePanel from '../TradeRoutePanel';
import type { TradeRoute, TradeResult } from '@/ui/idleVillage/state/VillageRegistry';

// Mock the console for cleaner test output
const mockConsole = vi.fn();
console.log = mockConsole;

describe('TradeRoutePanel', () => {
  const mockVillageIds = ['village-alpha', 'village-beta'];
  const mockTradeRoutes: TradeRoute[] = [
    {
      id: 'trade-1',
      fromVillageId: 'village-alpha',
      toVillageId: 'village-beta',
      sendResources: { gold: 50 },
      receiveResources: { food: 25 },
      duration: 3,
      risk: 0.1,
    },
  ];
  const mockLastTradeResult: TradeResult = {
    success: true,
    routeId: 'trade-1',
    executedAt: Date.now(),
    resourcesSent: { gold: 50 },
    resourcesReceived: { food: 25 },
  };

  const mockProps = {
    villageIds: mockVillageIds,
    tradeRoutes: mockTradeRoutes,
    lastTradeResult: mockLastTradeResult,
    onCreateTradeRoute: vi.fn(),
    onExecuteTradeRoute: vi.fn(),
  };

  it('renders the panel with trade routes', () => {
    render(<TradeRoutePanel {...mockProps} />);

    const panel = screen.getByTestId('trade-route-panel');
    expect(panel).toBeInTheDocument();

    const card = screen.getByTestId('trade-route-card-trade-1');
    expect(
      within(card).getByText('village-alpha → village-beta')
    ).toBeInTheDocument();
    expect(
      within(card).getByText('Send: 50 gold | Receive: 25 food')
    ).toBeInTheDocument();
    expect(
      within(card).getByRole('button', { name: /execute trade route/i })
    ).toBeInTheDocument();
  });

  it('shows create form when button is clicked', () => {
    render(<TradeRoutePanel {...mockProps} />);

    const createButton = screen.getByRole('button', { name: '+ Create Route' });
    fireEvent.click(createButton);

    expect(screen.getByRole('heading', { name: /Create Trade Route/i })).toBeInTheDocument();
    expect(screen.getByText('From Village')).toBeInTheDocument();
    expect(screen.getByText('To Village')).toBeInTheDocument();
  });

  it('calls onCreateTradeRoute when form is submitted', () => {
    render(<TradeRoutePanel {...mockProps} />);

    // Open form
    fireEvent.click(screen.getByRole('button', { name: '+ Create Route' }));

    // Fill form
    fireEvent.change(screen.getByLabelText('From Village'), { target: { value: 'village-alpha' } });
    fireEvent.change(screen.getByLabelText('To Village'), { target: { value: 'village-beta' } });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /Create Trade Route/i }));

    expect(mockProps.onCreateTradeRoute).toHaveBeenCalledWith(
      expect.objectContaining({
        fromVillageId: 'village-alpha',
        toVillageId: 'village-beta',
        sendResources: {},
        receiveResources: {},
        duration: 3,
        risk: 0.1,
      })
    );
  });

  it('calls onExecuteTradeRoute when execute button is clicked', () => {
    render(<TradeRoutePanel {...mockProps} />);

    const executeButton = screen.getByRole('button', { name: /execute trade route trade-1/i });
    fireEvent.click(executeButton);

    expect(mockProps.onExecuteTradeRoute).toHaveBeenCalledWith('trade-1');
  });

  it('displays last trade result', () => {
    render(<TradeRoutePanel {...mockProps} />);

    const result = screen.getByTestId('trade-route-last-result');
    expect(within(result).getByText('Last Trade Result')).toBeInTheDocument();
    expect(within(result).getByText('Route: trade-1')).toBeInTheDocument();
    expect(within(result).getByText('Sent: 50 gold')).toBeInTheDocument();
    expect(within(result).getByText('Received: 25 food')).toBeInTheDocument();
  });

  it('shows empty state when no trade routes exist', () => {
    render(<TradeRoutePanel {...mockProps} tradeRoutes={[]} />);

    expect(screen.getByTestId('trade-route-empty-state')).toBeInTheDocument();
  });

  it('handles failed trade result', () => {
    const failedResult: TradeResult = {
      success: false,
      routeId: 'trade-1',
      executedAt: Date.now(),
      resourcesSent: { gold: 50 },
      resourcesReceived: {},
      riskEvent: 'Trade caravan was ambushed by bandits',
    };

    render(<TradeRoutePanel {...mockProps} lastTradeResult={failedResult} />);

    expect(screen.getByText('⚠️ Trade caravan was ambushed by bandits')).toBeInTheDocument();
  });
});
