import type { ButtonHTMLAttributes, MouseEvent, ReactNode, DragEvent } from 'react';
import type { DropState } from '@/ui/idleVillage/components/ActivitySlot';
import theaterPlaceholder from '@/assets/ui/idleVillage/panorama-hotspring.jpg';

/**
 * Props for the decorative location preview card used in Idle Village.
 */
export interface LocationCardProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  title: string;
  description: string;
  iconRow?: ReactNode;
  onInspect?: () => void;
  onResidentDrop?: (residentId: string) => void;
  onDragIntent?: (residentId: string | null) => void;
  dropState?: DropState;
  backgroundImageSrc?: string;
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
  onDragIntent,
  dropState = 'idle',
  backgroundImageSrc,
  onClick,
  ...buttonProps
}) => {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    onInspect?.();
  };

  const extractResidentId = (event: DragEvent<HTMLElement>) =>
    event.dataTransfer.getData('text/resident-id') || event.dataTransfer.getData('text/plain') || null;

  const handleDragOver = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    onDragIntent?.(extractResidentId(event));
  };

  const handleDragEnter = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    onDragIntent?.(extractResidentId(event));
  };

  const handleDragLeave = () => {
    onDragIntent?.(null);
  };

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (dropState === 'invalid') return;
    const residentId = extractResidentId(event);
    if (residentId && onResidentDrop) {
      onResidentDrop(residentId);
    }
    onInspect?.();
    onDragIntent?.(null);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      aria-pressed={dropState !== 'idle'}
      aria-dropeffect={dropState === 'valid' ? 'copy' : undefined}
      className={[
        'group relative block w-full overflow-hidden rounded-[28px] border transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-200/30',
        dropState === 'valid'
          ? 'border-amber-300/80 shadow-[0_0_70px_rgba(236,197,94,0.45)] ring-4 ring-amber-200/50'
          : dropState === 'invalid'
            ? 'border-white/20 opacity-40 pointer-events-none'
            : 'border-[color:var(--panel-border)] shadow-[0_22px_55px_rgba(0,0,0,0.55)] hover:border-emerald-200/60',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        background: 'var(--panel-surface)',
      }}
      aria-label={title}
      {...buttonProps}
    >
      <div className="relative flex w-full flex-col rounded-[24px] bg-[radial-gradient(circle_at_25%_10%,rgba(88,142,122,0.25),rgba(2,4,6,0.92))] px-2 py-2 text-left text-ivory">
        <div className="relative aspect-[2.1/1] w-full overflow-hidden rounded-[26px] border border-white/8 bg-[rgba(9,12,17,0.9)]">
          <img
            src={backgroundImageSrc ?? theaterPlaceholder}
            alt=""
            className="h-full w-full object-cover brightness-[0.78]"
            loading="lazy"
            aria-hidden="true"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          {dropState === 'valid' && (
            <div className="pointer-events-none absolute inset-0 animate-pulse rounded-[26px] border border-amber-200/70 ring-4 ring-amber-100/20" />
          )}
          <span className="sr-only">{`${title} – ${description}`}</span>
        </div>

        {/* Minimal garnish only; user requested no labels/buttons */}
      </div>
    </button>
  );
};

export default LocationCard;
