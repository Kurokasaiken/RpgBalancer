import { useState } from 'react';
import type { ThemePreset, ThemePresetId } from '@/data/themePresets';
import { Eye, EyeOff } from 'lucide-react';

export interface StyleLaboratoryPanelProps {
  /** Currently active preset. */
  activePreset: ThemePreset;
  /** Presets available for selection. */
  presets: ThemePreset[];
  /** Indicates whether random tokens are active. */
  isRandomized: boolean;
  /** Callback invoked when a preset button is selected. */
  onSelectPreset: (presetId: ThemePresetId) => void;
  /** Triggers the randomizer mix. */
  onRandomize: () => void;
  /** Restores the preset tokens after a randomization. */
  onResetRandomization: () => void;
  /** Optional className applied to the outer section. */
  className?: string;
  /** Optional label displayed above the description copy. */
  kickerLabel?: string;
  /** Optional label used for the collapsible header (defaults to kickerLabel). */
  headerLabel?: string;
  /** Whether the panel can be collapsed inline. */
  collapsible?: boolean;
  /** Whether the panel starts collapsed. */
  defaultCollapsed?: boolean;
}

/**
 * Shared Style Laboratory control bar shown in Idle Village surfaces.
 * Provides a consistent way to preview presets, trigger randomization,
 * and reset the palette to its deterministic state.
 */
export function StyleLaboratoryPanel({
  activePreset,
  presets,
  isRandomized,
  onSelectPreset,
  onRandomize,
  onResetRandomization,
  className,
  kickerLabel = 'Style Laboratory',
  headerLabel,
  collapsible = true,
  defaultCollapsed = false,
}: StyleLaboratoryPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <section
      data-testid="minimal-gameplay-style-lab"
      className={`rounded-2xl border p-4 shadow-xl backdrop-blur-sm ${className ?? ''}`}
      style={{
        borderColor: 'var(--panel-border)',
        background: `linear-gradient(120deg, rgba(255,255,255,0.02), transparent), var(--panel-surface)`,
        boxShadow: `0 30px 60px var(--card-shadow-color)`,
      }}
    >
      {!isCollapsed && (
        <div className="flex flex-wrap gap-2 justify-between items-center">
          <div className="flex flex-wrap gap-2 justify-center flex-1">
            {presets.map((preset) => {
              const isPresetActive = activePreset.id === preset.id && !isRandomized;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onSelectPreset(preset.id)}
                  className="rounded-full px-4 py-1 text-[11px] uppercase tracking-[0.3em] transition-colors"
                  style={{
                    border: `1px solid ${isPresetActive ? 'var(--accent-color)' : 'var(--panel-border)'}`,
                    background: isPresetActive ? 'var(--card-highlight)' : 'transparent',
                    color: isPresetActive ? 'var(--text-primary)' : 'var(--text-muted)',
                    boxShadow: isPresetActive ? `0 0 20px var(--halo-color)` : 'none',
                  }}
                >
                  {preset.label}
              </button>
            );
          })}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onRandomize}
              className="rounded-full px-4 py-1 text-[11px] uppercase tracking-[0.3em] transition-colors"
              style={{
                border: '1px solid var(--accent-strong)',
                background: 'var(--card-highlight)',
                color: 'var(--text-primary)',
              }}
            >
              Randomize
            </button>
            {isRandomized && (
              <button
                type="button"
                onClick={onResetRandomization}
                className="rounded-full px-4 py-1 text-[11px] uppercase tracking-[0.3em] transition-colors"
                style={{
                  border: '1px dashed var(--panel-border)',
                  color: 'var(--text-muted)',
                }}
              >
                Reset
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsCollapsed((prev) => !prev)}
              className="rounded-full border border-white/15 bg-white/5 p-1.5 text-slate-200 transition hover:border-amber-300/70 hover:text-amber-200"
              aria-label={isCollapsed ? 'Mostra Style Lab' : 'Nascondi Style Lab'}
              aria-pressed={!isCollapsed}
            >
              {isCollapsed ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      )}
      {isCollapsed && (
        <button
          type="button"
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="rounded-full border border-white/15 bg-white/5 p-1.5 text-slate-200 transition hover:border-amber-300/70 hover:text-amber-200 ml-auto"
          aria-label={isCollapsed ? 'Mostra Style Lab' : 'Nascondi Style Lab'}
          aria-pressed={!isCollapsed}
        >
          {isCollapsed ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
        </button>
      )}
    </section>
  );
}

export default StyleLaboratoryPanel;
