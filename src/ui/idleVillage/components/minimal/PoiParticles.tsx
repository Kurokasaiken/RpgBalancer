import type { JSX } from 'react';
import { useId, useMemo } from 'react';

export interface PoiParticlesProps {
  isVisible: boolean; // Show on hover/selected
  color?: { r: number; g: number; b: number };
  size?: number;
  count?: number; // Budget: max particles
}

export function PoiParticles({
  isVisible,
  color = { r: 255, g: 200, b: 100 },
  size = 120,
  count = 6,
}: PoiParticlesProps): JSX.Element {
  const uniqueId = useId().replace(/:/g, '');

  // Generate deterministic particle positions (same every frame)
  const particles = useMemo(() => {
    const result = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 18 + Math.sin(i * 0.73) * 4; // Varied radius
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      result.push({ x, y, angle, id: i });
    }
    return result;
  }, [count]);

  return (
    <g
      style={{
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 300ms ease-out',
        pointerEvents: 'none',
      }}
    >
      <style>{`
        @keyframes poi-particle-twinkle {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
        [data-poi-particle] {
          animation: poi-particle-twinkle 1.8s ease-in-out infinite;
          transform-origin: center;
        }
      `}</style>

      {particles.map((p) => (
        <circle
          key={p.id}
          cx={p.x}
          cy={p.y}
          r="0.8"
          fill={`rgba(${color.r},${color.g},${color.b},0.8)`}
          style={{
            filter: 'drop-shadow(0 0 1.2px rgba(255,200,100,0.6))',
            animationDelay: `${(p.id * 0.2) % 1.8}s`,
          }}
          data-poi-particle
        />
      ))}
    </g>
  );
}
