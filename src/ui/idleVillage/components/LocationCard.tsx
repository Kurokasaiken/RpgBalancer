import type { ButtonHTMLAttributes, MouseEvent, ReactNode, DragEvent } from 'react';

/**
 * Props for the decorative location preview card used in Idle Village.
 */
export interface LocationCardProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  title: string;
  description: string;
  iconRow?: ReactNode;
  onInspect?: () => void;
  onResidentDrop?: (residentId: string) => void;
}

/**
 * Stylized card that showcases an Idle Village location with optional icon rows.
 */
const LocationCard: React.FC<LocationCardProps> = ({
  title,
  description,
  iconRow,
  onInspect,
  onResidentDrop,
  onClick,
  ...buttonProps
}) => {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    onInspect?.();
  };

  const handleDragOver = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    console.log("LocationCard dragOver detected");    event.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const residentId = event.dataTransfer.getData('text/resident-id') || event.dataTransfer.getData('text/plain');
    console.log("LocationCard drop - residentId:", residentId);
    if (residentId && onResidentDrop) {
      onResidentDrop(residentId);
    }
    onInspect?.();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={[
        'rounded-3xl border bg-transparent p-1 shadow-[0_15px_45px_rgba(0,0,0,0.55)] transition',
        onInspect ? 'hover:shadow-[0_25px_55px_rgba(34,197,94,0.25)] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200/60' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ borderColor: 'var(--color-bronze-light, rgba(201,162,39,0.6))' }}
      aria-label={title}
      {...buttonProps}
    >
      <div className="relative flex aspect-[2.333/1] w-full items-center justify-center overflow-hidden rounded-[26px] bg-linear-to-r from-emerald-800 via-emerald-700 to-emerald-800">
        {iconRow ?? (
          <div className="flex items-center gap-3 text-emerald-100 text-4xl">
            <span>🌲</span>
            <span>🌳</span>
            <span>🌲</span>
          </div>
        )}
      </div>
    </button>
  );
};

export default LocationCard;
