import type { ReactNode } from 'react';
import clsx from 'clsx';
import type { DropState } from '@/ui/idleVillage/legacy/VerbCard';

export interface ActionCardFrameProps {
  children: ReactNode;
  dropState?: DropState;
  className?: string;
  dataTestId?: string;
  role?: string;
  onDragOver?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragEnter?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (event: React.DragEvent<HTMLDivElement>) => void;
}

/**
 * Shared chrome for Idle Village action cards (jobs, quests, rule timers).
 * Keeps border/ring/drag feedback consistent across all ActionCard derivatives.
 */
export const ActionCardFrame: React.FC<ActionCardFrameProps> = ({
  children,
  dropState = 'idle',
  className,
  dataTestId,
  role,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
}) => {
  const dropRingClass = clsx(
    dropState === 'valid'
      ? 'ring-2 ring-emerald-400/70 shadow-[0_0_22px_rgba(16,185,129,0.35)]'
      : dropState === 'invalid'
        ? 'ring-2 ring-white/20 shadow-[0_0_22px_rgba(255,255,255,0.15)]'
        : 'ring-1 ring-slate-900/50 shadow-[0_18px_35px_rgba(0,0,0,0.35)]',
  );

  return (
    <div
      className={clsx(
        'w-full flex items-center justify-center rounded-3xl bg-black/25 p-4 transition-all duration-200',
        dropRingClass,
        className,
      )}
      data-testid={dataTestId}
      role={role}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {children}
    </div>
  );
};

export default ActionCardFrame;
