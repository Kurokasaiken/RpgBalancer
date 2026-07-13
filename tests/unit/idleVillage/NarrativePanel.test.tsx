import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NarrativePanel } from '@/ui/idleVillage/components/NarrativePanel';

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={className} data-testid="card">{children}</div>,
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={className} data-testid="card-content">{children}</div>,
  CardHeader: ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={className} data-testid="card-header">{children}</div>,
  CardTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={className} data-testid="card-title">{children}</div>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className, variant }: { children: React.ReactNode; onClick?: () => void; className?: string; variant?: string }) => (
    <button className={className} data-variant={variant} onClick={onClick}>{children}</button>
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant }: { children: React.ReactNode; variant?: string }) => <span data-variant={variant} data-testid="badge">{children}</span>,
}));

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, value }: { children: React.ReactNode; value?: string }) => <div data-value={value}>{children}</div>,
  TabsList: ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={className} data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ children, value }: { children: React.ReactNode; value?: string }) => <button value={value}>{children}</button>,
  TabsContent: ({ children, value }: { children: React.ReactNode; value?: string }) => <div data-value={value} data-testid="tabs-content">{children}</div>,
}));

vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={className}>{children}</div>,
}));

vi.mock('@/components/ui/separator', () => ({
  Separator: ({ orientation, className }: { orientation?: string; className?: string }) => <div className={className} data-orientation={orientation} />,
}));

vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className }: { value?: number; className?: string }) => <div className={className} data-value={value} data-testid="progress" />,
}));

vi.mock('@/ui/idleVillage/hooks/useNarrativeHooks', () => ({
  useQuestNarrative: () => ({
    generateQuestStart: vi.fn(),
    generateQuestProgress: vi.fn(),
    generateQuestComplete: vi.fn(),
    generateQuestFail: vi.fn(),
    generateNarrative: vi.fn(),
    selectTemplate: vi.fn(),
    isLoading: false,
    error: null,
  }),
}));

vi.mock('@/ui/idleVillage/hooks/useNarrativeTelemetry', () => ({
  useNarrativeTelemetry: () => ({
    recordNarrativeTelemetry: vi.fn(),
    events: [],
    metrics: [],
    getStats: vi.fn(() => ({ events: 0, metrics: 0, session: { lastActivity: '-' } })),
    topEvents: [],
    topMetrics: [],
    isConnected: true,
  }),
}));

vi.mock('@/ui/idleVillage/hooks/useNarrativeConfig', () => ({
  useNarrativeConfig: () => ({
    config: {
      hooks: {},
      templates: {},
      variables: {},
      telemetry: { enabled: true },
      version: '1.0.0',
    },
    hooks: {},
    templates: {},
    hookIds: [],
    hooksByType: {},
  }),
}));

describe('NarrativePanel I18N-003c', () => {
  it('renders localized narrative panel strings', () => {
    render(<NarrativePanel />);
    expect(screen.getByText('Quest Narrative Panel')).toBeInTheDocument();
    expect(screen.getByText('Play')).toBeInTheDocument();
    expect(screen.getByText('Refresh')).toBeInTheDocument();
    expect(screen.getByText('Quest Progress')).toBeInTheDocument();
    expect(screen.getByText('Narratives')).toBeInTheDocument();
    expect(screen.getByText('Context')).toBeInTheDocument();
    expect(screen.getByText('Telemetry')).toBeInTheDocument();
    expect(screen.getByText('Config')).toBeInTheDocument();
    expect(screen.getByText('Generated Narratives')).toBeInTheDocument();
    expect(screen.getByText('No narratives generated yet')).toBeInTheDocument();
  });
});
