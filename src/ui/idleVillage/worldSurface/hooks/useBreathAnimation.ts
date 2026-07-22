import { useState, useEffect } from 'react';
import { WORLD_SURFACE_CONFIG } from '../config/worldSurfaceConfig';

export const useBreathAnimation = () => {
  const [breathPhase, setBreathPhase] = useState(0);

  useEffect(() => {
    const intervalMs = 16;
    const cycleMs = WORLD_SURFACE_CONFIG.breath.timing;
    const intervalId = setInterval(() => {
      setBreathPhase((prevPhase) => (prevPhase + intervalMs / cycleMs) % 1);
    }, intervalMs);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return breathPhase;
};
