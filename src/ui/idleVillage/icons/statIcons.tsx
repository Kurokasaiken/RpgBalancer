import type { FC, SVGProps } from 'react';

export type StatIconType = 
  | 'hp' | 'damage' | 'armor' | 'resistance' | 'accuracy' | 'regen'
  | 'evasion' | 'critChance' | 'agility' | 'lifesteal' | 'movementSpeed' | 'cooldown';

interface StatIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
  filled?: boolean;
}

const StatIcon: FC<StatIconProps & { type: StatIconType }> = ({ type, size = 16, filled = true, ...props }) => {
  const s = size;
  const color = filled ? 'currentColor' : 'none';
  const stroke = filled ? 'none' : 'currentColor';

  const icons: Record<StatIconType, JSX.Element> = {
    hp: (
      <svg viewBox="0 0 24 24" width={s} height={s} {...props}>
        <path d="M12 3 L7 8 L7 17 Q7 20 12 20 Q17 20 17 17 L17 8 Z" fill={color} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
    damage: (
      <svg viewBox="0 0 24 24" width={s} height={s} {...props}>
        <path d="M5 3 L9 12 L5 21 L8 21 L12 12 L16 21 L19 21 L15 12 L19 3 L16 3 L12 12 L8 3 Z" fill={color} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
    armor: (
      <svg viewBox="0 0 24 24" width={s} height={s} {...props}>
        <path d="M12 2 L6 5 L6 12 Q6 18 12 21 Q18 18 18 12 L18 5 Z" fill={color} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
    resistance: (
      <svg viewBox="0 0 24 24" width={s} height={s} {...props}>
        <path d="M12 3 L4 7 L4 12 Q4 18 12 22 Q20 18 20 12 L20 7 L12 3 Z M12 9 L15 12 L12 15 L9 12 Z" fill={color} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
    accuracy: (
      <svg viewBox="0 0 24 24" width={s} height={s} {...props}>
        <path d="M12 2 L14.2 10H22.6L16.2 14.8L18.4 22.8L12 18L5.6 22.8L7.8 14.8L1.4 10H9.8Z" fill={color} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
    regen: (
      <svg viewBox="0 0 24 24" width={s} height={s} {...props}>
        <path d="M12 2 C6.5 2 2 6.5 2 12 C2 17.5 6.5 22 12 22 C17.5 22 22 17.5 22 12 M12 8 L12 12 L16 14" fill={color} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    evasion: (
      <svg viewBox="0 0 24 24" width={s} height={s} {...props}>
        <path d="M12 3 C7 3 3 7 3 12 C3 17 7 21 12 21 C17 21 21 17 21 12 C21 7 17 3 12 3 M12 8 L15 11 L12 14 L9 11 Z" fill={color} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
    critChance: (
      <svg viewBox="0 0 24 24" width={s} height={s} {...props}>
        <path d="M12 1 L15 8 L23 9 L18 14 L20 22 L12 18 L4 22 L6 14 L1 9 L9 8 Z" fill={color} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
    agility: (
      <svg viewBox="0 0 24 24" width={s} height={s} {...props}>
        <path d="M3 10 Q6 6 12 6 Q18 6 21 10 M3 14 Q6 18 12 18 Q18 18 21 14" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="12" cy="12" r="2" fill={color} stroke={stroke} strokeWidth="1.5" />
      </svg>
    ),
    lifesteal: (
      <svg viewBox="0 0 24 24" width={s} height={s} {...props}>
        <path d="M12 2 C12 2 6 8 6 14 C6 18 9 21 12 21 C15 21 18 18 18 14 C18 8 12 2 12 2 M9 12 L15 12 M12 9 L12 15" fill={color} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    movementSpeed: (
      <svg viewBox="0 0 24 24" width={s} height={s} {...props}>
        <path d="M6 12 L3 15 L6 18 M18 12 L21 15 L18 18 M12 6 L15 3 L18 6 M12 18 L15 21 L18 18" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    cooldown: (
      <svg viewBox="0 0 24 24" width={s} height={s} {...props}>
        <circle cx="12" cy="12" r="9" fill={color} stroke={stroke} strokeWidth="1.5" />
        <path d="M12 7 L12 12 L16 16" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  };

  return icons[type];
};

export default StatIcon;
