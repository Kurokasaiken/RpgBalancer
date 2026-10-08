import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HudPlaque } from '@/ui/idleVillage/skins/primitives';
import { useHudPanelDrag } from './useHudPanelDrag';

export interface TuningField {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
}

export interface TuningPanelProps {
  fields: TuningField[];
  /** Called when a slider is released (rebuilding the map on every pixel of a drag would stutter). */
  onCommit: (id: string, value: number) => void;
  onReset?: () => void;
  onClose?: () => void;
}

/**
 * Tuning panel — a dev instrument like the Director: every look-and-feel number of the map on screen, with a
 * slider each. The value is shown live while dragging and applied on release; the last line is the current set,
 * ready to paste into `gameFrameConfig.ts`.
 */
export const TuningPanel: React.FC<TuningPanelProps> = ({ fields, onCommit, onReset, onClose }) => {
  const { t } = useTranslation('idleVillage');
  const { panelStyle, handleProps } = useHudPanelDrag();
  const [draft, setDraft] = useState<Record<string, number>>({});
  useEffect(() => setDraft({}), [fields]);
  const shown = (field: TuningField) => draft[field.id] ?? field.value;
  const commit = (field: TuningField) => {
    if (draft[field.id] !== undefined && draft[field.id] !== field.value) onCommit(field.id, draft[field.id]);
  };
  return (
    <HudPlaque
      shape="panel"
      as="section"
      aria-label={t('gameFrame.panels.names.tuning')}
      data-testid="tuning-panel"
      style={{ position: 'fixed', left: 24, top: 120, zIndex: 1000, width: 260, display: 'flex', flexDirection: 'column', gap: 8, padding: '9px 12px 12px', pointerEvents: 'auto', maxHeight: 'calc(100vh - 220px)', overflowY: 'auto', ...panelStyle }}
    >
      <div {...handleProps} title={t('gameFrame.panel.dragHint')} style={{ ...handleProps.style, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ flex: 1, fontFamily: 'var(--skin-font-display)', fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--skin-title-color)' }}>
          {t('gameFrame.panels.names.tuning')}
        </span>
        {onClose && (
          <button type="button" onClick={onClose} aria-label={t('gameFrame.panels.close')} title={t('gameFrame.panels.close')} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--skin-label-primary)', cursor: 'pointer', fontSize: 14 }}>
            ×
          </button>
        )}
      </div>
      {fields.map((field) => (
        <label key={field.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 2, fontFamily: 'var(--skin-font-serif)', fontSize: 13, color: 'var(--skin-body-color)' }}>
          <span>{field.label}</span>
          <output style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--skin-title-color)' }}>{shown(field)}</output>
          <input
            type="range"
            min={field.min}
            max={field.max}
            step={field.step}
            value={shown(field)}
            onChange={(event) => setDraft((d) => ({ ...d, [field.id]: Number(event.target.value) }))}
            onPointerUp={() => commit(field)}
            onKeyUp={() => commit(field)}
            style={{ gridColumn: '1 / -1', width: '100%' }}
          />
        </label>
      ))}
      <code style={{ fontSize: 12, lineHeight: 1.35, color: 'var(--skin-label-primary)', wordBreak: 'break-word' }}>
        {fields.map((field) => `${field.id}: ${field.value}`).join(', ')}
      </code>
      {onReset && (
        <button type="button" onClick={onReset} data-hud-controls="" style={{ alignSelf: 'flex-start' }}>
          {t('gameFrame.tuning.reset')}
        </button>
      )}
    </HudPlaque>
  );
};

export default TuningPanel;
