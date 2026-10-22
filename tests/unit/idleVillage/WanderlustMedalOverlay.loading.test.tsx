import '@testing-library/jest-dom';
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WanderlustMedalOverlay } from '@/ui/idleVillage/components/WanderlustMedalOverlay';

const portraitMocks = vi.hoisted(() => ({
  preloadPortrait: vi.fn(() => ({
    complete: false,
    naturalWidth: 0,
    decode: () => new Promise<void>(() => {}),
  })),
  isPortraitDecoded: vi.fn(() => false),
}));

vi.mock('@/ui/idleVillage/utils/portraitDecodeCache', () => portraitMocks);
vi.mock('@/balancing/config/idleVillage/medalPortraitAssets', () => ({
  getMedalPortraitUrl: (portraitUrl: string) => `${portraitUrl}.medal`,
}));
vi.mock('@/localization/useTranslation', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('WanderlustMedalOverlay portrait loading', () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    portraitMocks.preloadPortrait.mockClear();
    portraitMocks.isPortraitDecoded.mockReturnValue(false);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('keeps the medal visible with a fallback portrait while the real crop decodes', () => {
    render(
      <WanderlustMedalOverlay
        portraitUrl="/assets/portraits/hero.webp"
        data-testid="loading-medal"
      />,
    );

    const medal = screen.getByTestId('loading-medal');
    expect(medal).toBeVisible();
    expect(portraitMocks.preloadPortrait).toHaveBeenCalledWith('/assets/portraits/hero.webp.medal');
    expect(medal.querySelector('image')?.getAttribute('href')).toMatch(/^data:image\/jpeg;base64,/);
  });
});
