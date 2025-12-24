import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from 'react';

/**
 * Props for the decorative location preview card used in Idle Village.
 */
export interface LocationCardProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  title: string;
  description: string;
  iconRow?: ReactNode;
  onInspect?: () => void;
}

/**
 * Stylized card that showcases an Idle Village location with optional icon rows.
 */
const LocationCard: React.FC<LocationCardProps> = ({
  title,
  description,
  iconRow,
  onInspect,
  onClick,
  ...buttonProps
}) => {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    onInspect?.();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={[
        'flex flex-col gap-3 rounded-3xl border border-amber-400/30 bg-slate-950/80 p-4 text-left shadow-[0_15px_45px_rgba(0,0,0,0.55)] transition',
        onInspect ? 'hover:border-emerald-300/70 hover:shadow-[0_25px_55px_rgba(34,197,94,0.25)] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200/60' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      {...buttonProps}
    >
      <div className="relative w-full overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
        <div className="aspect-[2.333/1] w-full bg-linear-to-r from-emerald-900 via-slate-900 to-emerald-800 flex items-center justify-center">
          {iconRow ?? (
            <div className="flex items-center gap-3 text-emerald-200 text-4xl">
              <span>🌲</span>
              <span>🌳</span>
              <span>🌲</span>
            </div>
          )}
        </div>
      </div>
      <div className="text-sm font-semibold text-ivory">{title}</div>
      <p className="text-[12px] text-slate-300">{description}</p>
    </button>
  );
};

export default LocationCard;
