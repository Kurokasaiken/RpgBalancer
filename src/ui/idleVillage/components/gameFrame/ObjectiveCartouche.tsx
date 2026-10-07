import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HudPlaque } from '@/ui/idleVillage/skins/primitives';

export interface HudObjective {
  /** Already i18n-resolved: one sentence saying what to do now. */
  text: string;
  /** Click handler (e.g. open the quest); omit for a read-only note. */
  onSelect?: () => void;
}

/**
 * Current objective — top-left cartouche. One label and one sentence on a parchment
 * slip set inside the plaque (no pin, no tilt: the owner's "no objects" rule).
 * Not rendered when there is nothing to do, so the corner stays free.
 */
export function ObjectiveCartouche({ objective }: { objective?: HudObjective }) {
  const { t } = useTranslation('idleVillage');
  // Slides in from the edge it hangs from instead of appearing at once.
  const [entered, setEntered] = useState(false);
  const present = Boolean(objective);
  useEffect(() => {
    if (!present) {
      setEntered(false);
      return undefined;
    }
    const timer = window.setTimeout(() => setEntered(true), 30);
    return () => window.clearTimeout(timer);
  }, [present]);
  if (!objective) return null;
  return (
    <HudPlaque
      shape="hang"
      as="section"
      aria-labelledby="hud-objective-label"
      style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '8px 22px 20px', maxWidth: 300, opacity: entered ? 1 : 0, transform: entered ? 'translateY(0)' : 'translateY(-14px)', transition: 'opacity 500ms ease-out, transform 500ms ease-out' }}
    >
      <span
        id="hud-objective-label"
        style={{ fontFamily: 'var(--skin-font-display)', fontSize: 12, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--skin-label-primary)' }}
      >
        {t('gameFrame.objective.label')}
      </span>
      <button
        type="button"
        onClick={objective.onSelect}
        disabled={!objective.onSelect}
        style={{
          margin: 0,
          padding: '4px 10px',
          textAlign: 'left',
          border: 'none',
          borderRadius: 6,
          cursor: objective.onSelect ? 'pointer' : 'default',
          font: '500 16px/1.3 var(--skin-font-serif)',
          color: 'var(--skin-hud-parchment-ink)',
          background: 'var(--skin-hud-parchment)',
        }}
      >
        {objective.text}
      </button>
    </HudPlaque>
  );
}

export default ObjectiveCartouche;
