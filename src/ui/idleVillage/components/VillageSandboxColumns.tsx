import clsx from 'clsx';
import type { ReactNode } from 'react';
import { useResponsiveLayout } from '@/ui/idleVillage/hooks/useResponsiveLayout';

/**
 * Props for the structural VillageSandboxColumns layout component.
 */
export interface VillageSandboxColumnsProps {
  /** Content rendered inside the left column (roster + board controls). */
  leftColumn: ReactNode;
  /** Content rendered inside the right column (HUD placeholder). */
  rightColumn: ReactNode;
  /** Optional layout variant for responsive spacing and stacking. */
  layout?: 'board' | 'stacked';
  /** Optional class applied to the root grid. */
  className?: string;
  /** Optional extra class for the left column wrapper. */
  leftWrapperClassName?: string;
  /** Optional extra class for the right column wrapper. */
  rightWrapperClassName?: string;
  /** Override for the layout test id (default: village-sandbox-columns). */
  layoutTestId?: string;
  /** Override for the left column test id (default: village-sandbox-left-column). */
  leftColumnTestId?: string;
  /** Override for the right column test id (default: village-sandbox-right-column). */
  rightColumnTestId?: string;
}

/**
 * Grid layout shared by the sandbox skeleton so Prompt 3 extractions can re-use column plumbing.
 */
const VillageSandboxColumns: React.FC<VillageSandboxColumnsProps> = ({
  leftColumn,
  rightColumn,
  layout = 'board',
  className,
  leftWrapperClassName,
  rightWrapperClassName,
  layoutTestId = 'village-sandbox-columns',
  leftColumnTestId = 'village-sandbox-left-column',
  rightColumnTestId = 'village-sandbox-right-column',
}) => {
  const { gridColumns } = useResponsiveLayout();
  
  return (
    <section 
      data-testid={layoutTestId}
      data-layout={layout}
      className={clsx(
        layout === 'stacked' ? 'flex flex-col gap-2' : `grid gap-4 lg:grid-cols-${gridColumns}`,
        className
      )}>
      <div
        data-testid={leftColumnTestId}
        className={clsx(
          layout === 'stacked' ? 'order-first' : `lg:col-span-${Math.max(1, gridColumns - 1)}`,
          'space-y-4',
          leftWrapperClassName
        )}
      >
        {leftColumn}
      </div>
      <div
        data-testid={rightColumnTestId}
        className={clsx(
          layout === 'stacked' ? 'order-last' : '',
          'default-card min-h-80',
          rightWrapperClassName
        )}
      >
        {rightColumn}
      </div>
    </section>
  );
};

export default VillageSandboxColumns;
