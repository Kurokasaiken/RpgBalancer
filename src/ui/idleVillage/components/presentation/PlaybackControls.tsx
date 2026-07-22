import { useTranslation } from 'react-i18next';
import { SkinButton } from '../../skins/primitives/SkinButton';
import { SkinScope } from '../../skins/primitives/SkinScope';

interface PlaybackControlsProps {
  isPlaying: boolean;
  tick: number;
  seed: number;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onSeedChange: (seed: number) => void;
  onTickChange: (tick: number) => void;
}

/**
 * Playback controls for the presentation director: play, pause, step, seed, tick.
 */
export function PlaybackControls({
  isPlaying,
  tick,
  seed,
  onPlay,
  onPause,
  onStep,
  onSeedChange,
  onTickChange,
}: PlaybackControlsProps) {
  const { t } = useTranslation('idleVillage');

  return (
    <SkinScope className="presentation-playback-controls space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <SkinButton onClick={onPlay} disabled={isPlaying} data-testid="play-button">
          {t('idleVillage:presentation.play')}
        </SkinButton>
        <SkinButton onClick={onPause} disabled={!isPlaying} data-testid="pause-button">
          {t('idleVillage:presentation.pause')}
        </SkinButton>
        <SkinButton onClick={onStep} data-testid="step-button">
          {t('idleVillage:presentation.step')}
        </SkinButton>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <label className="text-slate-300" htmlFor="presentation-seed">
          {t('idleVillage:presentation.seed')}
        </label>
        <input
          id="presentation-seed"
          type="number"
          value={seed}
          onChange={(e) => onSeedChange(Number(e.target.value))}
          className="rounded bg-slate-900 px-2 py-1 text-slate-100"
          data-testid="seed-input"
        />

        <label className="text-slate-300" htmlFor="presentation-tick">
          {t('idleVillage:presentation.tick')}
        </label>
        <input
          id="presentation-tick"
          type="number"
          value={tick}
          onChange={(e) => onTickChange(Number(e.target.value))}
          className="rounded bg-slate-900 px-2 py-1 text-slate-100"
          data-testid="tick-input"
        />
      </div>
    </SkinScope>
  );
}
