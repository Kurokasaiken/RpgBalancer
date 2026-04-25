/**
 * ResidentPickerAvatar
 *
 * Lightweight avatar badge used across picker overlays to display
 * resident portraits (or their initials fallback) with Style Lab tokens.
 * Mirrors the PgCard portrait sizing so roster cards and picker rows
 * stay visually aligned.
 */

import { memo, useMemo } from 'react';
import clsx from 'clsx';

export type ResidentPickerAvatarSize = 'md' | 'lg';

export interface ResidentPickerAvatarProps {
  /** Resident display name used for alt text / initials fallback */
  name: string;
  /** Optional portrait URL */
  portraitUrl?: string | null;
  /** Size variant matching PgCard canonical dimensions */
  size?: ResidentPickerAvatarSize;
  /** Additional class names for layout containers */
  className?: string;
}

const SIZE_CONFIG: Record<ResidentPickerAvatarSize, { container: string; text: string }> = {
  md: { container: 'h-10 w-10', text: 'text-[10px]' },
  lg: { container: 'h-12 w-12', text: 'text-xs' },
};

const ResidentPickerAvatar: React.FC<ResidentPickerAvatarProps> = ({
  name,
  portraitUrl,
  size = 'lg',
  className,
}) => {
  const initial = useMemo(() => name.trim().charAt(0).toUpperCase() || '?', [name]);
  const { container, text } = SIZE_CONFIG[size];

  return (
    <div
      className={clsx(
        'flex items-center justify-center rounded-[18px] border border-white/15 bg-[rgba(6,10,18,0.85)] text-amber-100 shadow-[0_14px_30px_rgba(0,0,0,0.45)] transition-all overflow-hidden',
        container,
        className,
      )}
      aria-hidden={portraitUrl ? undefined : true}
    >
      {portraitUrl ? (
        <img
          src={portraitUrl}
          alt={name}
          className="h-full w-full object-cover"
          draggable={false}
        />
      ) : (
        <span className={clsx('font-semibold uppercase tracking-[0.35em]', text)}>{initial}</span>
      )}
    </div>
  );
};

export default memo(ResidentPickerAvatar);
