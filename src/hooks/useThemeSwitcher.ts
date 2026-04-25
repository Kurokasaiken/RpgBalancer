import { useCallback, useEffect, useMemo, useState } from 'react';
import { DEFAULT_THEME_ID, themePresetMap, themePresets, type ThemePreset, type ThemePresetId } from '@/data/themePresets';

const THEME_STORAGE_KEY = 'idle-village.theme-preset';

interface ThemeState {
  presetId: ThemePresetId;
  customTokens: Record<string, string> | null;
  randomVersion: number;
}

export interface ThemeSwitcherApi {
  activePreset: ThemePreset;
  activePresetId: ThemePresetId;
  presets: ThemePreset[];
  isRandomized: boolean;
  setPreset: (presetId: ThemePresetId) => void;
  randomizeTheme: () => void;
  resetRandomization: () => void;
}

const randomFontPairs = [
  { header: "'Cinzel', serif", body: "'Crimson Text', serif" },
  { header: "'Cormorant Garamond', serif", body: "'Work Sans', sans-serif" },
  { header: "'Unica One', sans-serif", body: "'Space Grotesk', sans-serif" },
  { header: "'Marcellus', serif", body: "'Inter', sans-serif" },
  { header: "'IM Fell DW Pica', serif", body: "'Rubik', sans-serif" },
];

const random = (min: number, max: number) => Math.random() * (max - min) + min;

const randomHsl = (type: 'dark' | 'light' | 'accent'): string => {
  const hue = Math.round(random(0, 360));
  const sat = Math.round(
    type === 'light' ? random(25, 60) : type === 'accent' ? random(55, 90) : random(35, 70),
  );
  const light = Math.round(
    type === 'dark' ? random(4, 22) : type === 'accent' ? random(40, 70) : random(75, 95),
  );
  return `hsl(${hue}, ${sat}%, ${light}%)`;
};

const randomGradient = () =>
  `radial-gradient(circle at ${Math.round(random(10, 90))}% ${Math.round(random(10, 90))}%, ${randomHsl('accent')} 0%, transparent 65%)`;

const loadStoredPresetId = (): ThemePresetId => {
  if (typeof window === 'undefined') return DEFAULT_THEME_ID;
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY) as ThemePresetId | null;
  if (!stored) return DEFAULT_THEME_ID;
  if (stored in themePresetMap) return stored;
  return DEFAULT_THEME_ID;
};

const persistPresetId = (presetId: ThemePresetId) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(THEME_STORAGE_KEY, presetId);
};

const applyTokensToDocument = (preset: ThemePreset, customTokens: Record<string, string> | null) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const tokens = { ...preset.tokens, ...(customTokens ?? {}) };
  Object.entries(tokens).forEach(([token, value]) => {
    root.style.setProperty(`--${token}`, value);
  });
  root.dataset.themePreset = preset.id;
  root.dataset.themeRandomized = customTokens ? 'true' : 'false';
};

const buildRandomTokens = (): Record<string, string> => {
  const fontPair = randomFontPairs[Math.floor(random(0, randomFontPairs.length))];
  const darkBase = randomHsl('dark');
  const panel = randomHsl('dark');
  const accentPrimary = randomHsl('accent');
  const accentSecondary = randomHsl('accent');
  const highlight = randomGradient();
  const badgeBg = Math.random() > 0.5 ? randomHsl('dark') : randomHsl('light');
  return {
    'font-header': fontPair.header,
    'font-body': fontPair.body,
    'surface-base': darkBase,
    'surface-panel': panel,
    'panel-border': randomHsl('accent'),
    'panel-surface': panel,
    'panel-sheen': highlight,
    'text-primary': Math.random() > 0.5 ? randomHsl('light') : '#f8f9fa',
    'text-secondary': accentSecondary,
    'text-muted': randomHsl('accent'),
    'accent-color': accentPrimary,
    'accent-strong': accentSecondary,
    'card-border-color': randomHsl('accent'),
    'card-shadow-color': 'rgba(0,0,0,0.65)',
    'card-surface': Math.random() > 0.5 ? darkBase : panel,
    'card-surface-radial': highlight,
    'card-highlight': accentPrimary.replace('hsl', 'hsla').replace(')', ', 0.25)'),
    'halo-color': accentSecondary,
    'halo-strength': `${random(0.7, 1.6).toFixed(2)}`,
    'slot-ring-idle': accentPrimary,
    'slot-ring-active': accentSecondary,
    'slot-ring-hover': randomHsl('accent'),
    'slot-glow-idle': accentPrimary,
    'slot-glow-active': accentSecondary,
    'slot-glow-hover': randomHsl('accent'),
    'slot-icon-color': randomHsl('accent'),
    'slot-worker-badge-bg': badgeBg,
    'slot-worker-badge-border': randomHsl('accent'),
    'slot-worker-badge-text': Math.random() > 0.5 ? '#fff' : '#111',
    'hp-bar-start': randomHsl('accent'),
    'hp-bar-end': randomHsl('accent'),
    'fatigue-bar-start': randomHsl('accent'),
    'fatigue-bar-end': randomHsl('accent'),
    'button-bg': Math.random() > 0.5 ? randomHsl('dark') : randomHsl('light'),
    'button-border': randomHsl('accent'),
    'button-text': Math.random() > 0.5 ? '#050505' : '#fdfdfd',
  };
};

const createInitialState = (): ThemeState => ({
  presetId: loadStoredPresetId(),
  customTokens: null,
  randomVersion: 0,
});

/** Hook returning helpers to switch Idle Village UI themes at runtime. */
export const useThemeSwitcher = (): ThemeSwitcherApi => {
  const [themeState, setThemeState] = useState<ThemeState>(createInitialState);

  const activePreset = useMemo(() => themePresetMap[themeState.presetId] ?? themePresetMap[DEFAULT_THEME_ID], [themeState.presetId]);

  useEffect(() => {
    applyTokensToDocument(activePreset, themeState.customTokens);
  }, [activePreset, themeState.customTokens, themeState.randomVersion]);

  const setPreset = useCallback((presetId: ThemePresetId) => {
    setThemeState({ presetId, customTokens: null, randomVersion: 0 });
    persistPresetId(presetId);
  }, []);

  const randomizeTheme = useCallback(() => {
    setThemeState((prev) => ({
      ...prev,
      customTokens: buildRandomTokens(),
      randomVersion: prev.randomVersion + 1,
    }));
  }, []);

  const resetRandomization = useCallback(() => {
    setThemeState((prev) => ({ ...prev, customTokens: null, randomVersion: prev.randomVersion + 1 }));
  }, []);

  return {
    activePreset,
    activePresetId: activePreset.id,
    presets: themePresets,
    isRandomized: themeState.customTokens !== null,
    setPreset,
    randomizeTheme,
    resetRandomization,
  };
};

export default useThemeSwitcher;
