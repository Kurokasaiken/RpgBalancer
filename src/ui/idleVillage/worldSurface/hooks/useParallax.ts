import { useState, useEffect } from 'react';
import { calculateParallaxOffset } from '../layers/ParallaxController';

export const useParallax = () => {
  const [parallaxOffset, setParallaxOffset] = useState(0);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const offset = calculateParallaxOffset(event.clientX, event.clientY);
      setParallaxOffset(offset);
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return parallaxOffset;
};
