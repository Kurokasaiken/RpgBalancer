import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'lucide-react';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';

export interface HudHideToggleProps {
  /** True while the chrome is slid off-screen. */
  hidden: boolean;
  onToggle: () => void;
}

/**
 * The pearl that outlives the HUD: the one control that stays on screen after
 * the player sends every ribbon and plaque off its edge, so the world can be
 * watched clean — and the chrome can be called back. Lives in the bottom-right
 * utility cluster; the `h` key does the same thing.
 */
export function HudHideToggle({ hidden, onToggle }: HudHideToggleProps) {
  const { t } = useTranslation('idleVillage');
  const key = hidden ? 'gameFrame.hud.show' : 'gameFrame.hud.hide';
  const label = `${t(key)} — ${DEFAULT_GAME_FRAME_CONFIG.hudHide.shortcut.toUpperCase()}`;
  return (
    <div data-hud-controls="" data-hud-hide-toggle="" style={{ position: 'relative', pointerEvents: 'auto' }}>
      <button
        type="button"
        data-testid="hud-hide-toggle"
        aria-pressed={hidden}
        aria-label={label}
        title={label}
        onClick={onToggle}
        style={{ width: 40, height: 40 }}
      >
        {hidden ? <EyeOff /> : <Eye />}
      </button>
    </div>
  );
}

export default HudHideToggle;
