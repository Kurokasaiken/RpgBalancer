import { useCallback, useEffect, useMemo, useRef } from 'react';
import { getSensoryFeedbackConfig } from '@/ui/idleVillage/config/minimalFeedbackConfig';

export type SensoryCue = 'pickup' | 'hover_valid' | 'drop_success' | 'drop_invalid';

interface AudioElements {
  success?: HTMLAudioElement;
  warning?: HTMLAudioElement;
  blocked?: HTMLAudioElement;
}

const cueToKey: Record<SensoryCue, keyof AudioElements> = {
  pickup: 'warning',
  hover_valid: 'success',
  drop_success: 'success',
  drop_invalid: 'blocked',
};

/**
 * Hook that centralizes sensory (audio) cues for roster ↔ slot interactions.
 * Respects the Minimal Gameplay sensory config while falling back gracefully when audio is disabled.
 */
export function useSensoryAudio() {
  const sensoryConfig = useMemo(() => getSensoryFeedbackConfig(), []);
  const audioConfig = sensoryConfig.audio;
  const audioRefs = useRef<AudioElements>({});

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!audioConfig.enabled) return;

    const basePath = (path?: string) => (path ? `/assets/audio/${path}` : undefined);

    audioRefs.current.success = audioConfig.successSound ? new Audio(basePath(audioConfig.successSound)) : undefined;
    audioRefs.current.warning = audioConfig.warningSound ? new Audio(basePath(audioConfig.warningSound)) : undefined;
    audioRefs.current.blocked = audioConfig.blockedSound ? new Audio(basePath(audioConfig.blockedSound)) : undefined;

    return () => {
      (Object.values(audioRefs.current) as HTMLAudioElement[])
        .filter(Boolean)
        .forEach((audio) => {
          audio.pause();
        });
      audioRefs.current = {};
    };
  }, [audioConfig.enabled, audioConfig.successSound, audioConfig.warningSound, audioConfig.blockedSound]);

  const playCue = useCallback(
    (cue: SensoryCue) => {
      if (!audioConfig.enabled) return;
      const key = cueToKey[cue];
      const element = audioRefs.current[key];
      if (!element) return;
      try {
        element.currentTime = 0;
        element.volume = audioConfig.volume ?? 0.5;
        void element.play();
      } catch {
        // Ignore playback errors (e.g., autoplay restrictions)
      }
    },
    [audioConfig.enabled, audioConfig.volume],
  );

  return { playCue };
}
