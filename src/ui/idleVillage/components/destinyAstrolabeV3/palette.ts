```typescript
import { useState, useEffect } from 'react';

const getSkinToken = (tokenName: string) => {
  const token = getComputedStyle(document.documentElement).getPropertyValue(tokenName);
  return token || '#000'; // Fallback to black
};

export const usePalette = () => {
  const [palette, setPalette] = useState({
    iconColor: getSkinToken('--skin-icon-color'),
    textPrimary: getSkinToken('--skin-text-primary'),
    surfaceBase: getSkinToken('--skin-surface-base'),
    iconAccent: getSkinToken('--skin-icon-accent'),
  });

  useEffect(() => {
    const handleResize = () => {
      setPalette({
        iconColor: getSkinToken('--skin-icon-color'),
        textPrimary: getSkinToken('--skin-text-primary'),
        surfaceBase: getSkinToken('--skin-surface-base'),
        iconAccent: getSkinToken('--skin-icon-accent'),
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return palette;
};