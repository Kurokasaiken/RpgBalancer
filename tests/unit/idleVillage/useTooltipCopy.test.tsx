/**
 * useTooltipCopy tests
 *
 * Verifies the i18next-backed tooltip copy hook, telemetry events, and
 * fallback behaviour.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useTooltipCopy, useTooltipInteraction } from '@/ui/idleVillage/hooks/useTooltipCopy';
import { useTranslation } from '@/localization/useTranslation';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';

const defaultResources = {
  hudResources: {
    gold: 'Translated gold tooltip',
    food: 'Translated food tooltip',
  },
  workerTraits: {
    strength: 'Translated strength tooltip',
  },
  slotStatus: {
    idle: 'Translated idle tooltip',
  },
};

let resources: typeof defaultResources = JSON.parse(JSON.stringify(defaultResources));

function getNestedValue(obj: unknown, path: string): unknown {
  const keys = path.split('.');
  let current = obj;
  for (const key of keys) {
    if (current === null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function keyExistsInResources(path: string): boolean {
  return getNestedValue(resources, path) !== undefined;
}

const tMock = vi.fn((key: string, options?: { defaultValue?: string }) => {
  const value = getNestedValue(resources, key);
  if (value !== undefined) return value;
  return options?.defaultValue ?? key;
});

const i18nMock = {
  language: 'en',
  resolvedLanguage: 'en',
  getResourceBundle: vi.fn((_lng: string, _ns: string) => resources),
  exists: vi.fn((key: string) => keyExistsInResources(key)),
};

vi.mock('@/localization/useTranslation', () => ({
  useTranslation: vi.fn(),
}));

vi.mock('@/analytics/telemetry/telemetryProvider', () => ({
  trackTelemetryEvent: vi.fn(),
}));

interface TestHarnessProps {
  section: 'hudResources' | 'workerTraits' | 'slotStatus';
  tooltipKey: string;
  tooltipConfig?: {
    hudResources?: { entries?: Record<string, string> };
    workerTraits?: { entries?: Record<string, string> };
    slotStatus?: { entries?: Record<string, string> };
  };
}

function TestHarness({ section, tooltipKey, tooltipConfig }: TestHarnessProps) {
  const { getTooltipCopy, hasTooltip, getSectionTooltips } = useTooltipCopy({
    tooltipConfig,
    telemetryEnabled: true,
    telemetrySource: 'unit-test',
  });
  const { trackHover } = useTooltipInteraction({
    tooltipId: `${section}.${tooltipKey}`,
    telemetrySource: 'unit-test',
  });

  return (
    <div>
      <span data-testid="copy">{getTooltipCopy(section, tooltipKey)}</span>
      <span data-testid="has">{hasTooltip(section, tooltipKey) ? 'yes' : 'no'}</span>
      <span data-testid="section">{JSON.stringify(getSectionTooltips(section))}</span>
      <button type="button" data-testid="hover" onClick={trackHover}>
        Hover
      </button>
    </div>
  );
}

describe('useTooltipCopy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resources = JSON.parse(JSON.stringify(defaultResources));
    (useTranslation as any).mockReturnValue({ t: tMock, i18n: i18nMock });
  });

  it('returns i18next translation when available', () => {
    render(<TestHarness section="hudResources" tooltipKey="gold" />);

    expect(screen.getByTestId('copy').textContent).toBe('Translated gold tooltip');
    expect(trackTelemetryEvent).toHaveBeenCalledWith('tooltip_shown', expect.objectContaining({
      tooltipId: 'hudResources.gold',
      section: 'hudResources',
      key: 'gold',
      content: 'Translated gold tooltip',
      source: 'unit-test',
    }));
  });

  it('uses config fallback when i18next translation is missing', () => {
    resources.hudResources.gold = undefined as any;
    const config = {
      hudResources: { entries: { gold: 'Config fallback gold' } },
    };
    render(<TestHarness section="hudResources" tooltipKey="gold" tooltipConfig={config} />);

    expect(screen.getByTestId('copy').textContent).toBe('Config fallback gold');
    expect(tMock).toHaveBeenCalledWith('hudResources.gold', { defaultValue: 'Config fallback gold' });
  });

  it('uses static fallback when i18next and config are missing', () => {
    resources.hudResources.gold = undefined as any;
    render(<TestHarness section="hudResources" tooltipKey="gold" />);

    expect(screen.getByTestId('copy').textContent).toBe('Gold reserves for village operations.');
  });

  it('reports hasTooltip=true for existing i18next keys', () => {
    render(<TestHarness section="hudResources" tooltipKey="gold" />);

    expect(screen.getByTestId('has').textContent).toBe('yes');
  });

  it('reports hasTooltip=true for config fallback entries', () => {
    const config = {
      workerTraits: { entries: { custom: 'Custom config tooltip' } },
    };
    render(<TestHarness section="workerTraits" tooltipKey="custom" tooltipConfig={config} />);

    expect(screen.getByTestId('has').textContent).toBe('yes');
  });

  it('reports hasTooltip=false for missing keys without config fallback', () => {
    render(<TestHarness section="hudResources" tooltipKey="missing" />);

    expect(screen.getByTestId('has').textContent).toBe('no');
  });

  it('returns all tooltips for a section from i18next resources', () => {
    render(<TestHarness section="hudResources" tooltipKey="gold" />);

    expect(screen.getByTestId('section').textContent).toBe(
      JSON.stringify(resources.hudResources)
    );
  });

  it('falls back to config entries for getSectionTooltips when i18next resources are empty', () => {
    resources = {} as any;
    const config = {
      workerTraits: { entries: { custom: 'Custom config tooltip' } },
    };
    render(<TestHarness section="workerTraits" tooltipKey="custom" tooltipConfig={config} />);

    expect(screen.getByTestId('section').textContent).toBe(JSON.stringify(config.workerTraits.entries));
  });

  it('emits tooltip_interaction on hover', () => {
    render(<TestHarness section="hudResources" tooltipKey="gold" />);
    fireEvent.click(screen.getByTestId('hover'));

    expect(trackTelemetryEvent).toHaveBeenCalledWith('tooltip_interaction', expect.objectContaining({
      tooltipId: 'hudResources.gold',
      action: 'hover',
      source: 'unit-test',
    }));
  });

  it('skips telemetry when telemetryEnabled is false', () => {
    function DisabledComponent() {
      const { getTooltipCopy } = useTooltipCopy({
        telemetryEnabled: false,
      });
      return <span data-testid="copy">{getTooltipCopy('hudResources', 'gold')}</span>;
    }

    render(<DisabledComponent />);
    expect(screen.getByTestId('copy').textContent).toBe('Translated gold tooltip');
    expect(trackTelemetryEvent).not.toHaveBeenCalledWith(
      'tooltip_shown',
      expect.anything()
    );
  });
});
