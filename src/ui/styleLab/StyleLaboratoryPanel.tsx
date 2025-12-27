import type { ThemePreset, ThemePresetId } from '@/data/themePresets';

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
}: StyleLaboratoryPanelProps) {
  return (
    <section
      className={`rounded-2xl border p-4 shadow-xl backdrop-blur-sm ${className ?? ''}`}
      style={{
        borderColor: 'var(--panel-border)',
        background: `linear-gradient(120deg, rgba(255,255,255,0.02), transparent), var(--panel-surface)`,
        boxShadow: `0 30px 60px var(--card-shadow-color)`,
      }}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.5em]" style={{ color: 'var(--slot-helper-color, rgba(255,255,255,0.55))' }}>
            {kickerLabel}
          </p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {activePreset.label}
            {isRandomized ? ' + Chaos Mix' : ''} · {activePreset.description}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
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
        </div>
      </div>
    </section>
  );
}

export default StyleLaboratoryPanel;
