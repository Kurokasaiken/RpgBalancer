import { useEffect, useMemo, useRef, useState, useCallback, type CSSProperties, type ReactNode } from 'react';
import styles from './DragTestContainer.module.css';
import { Eye, EyeOff, GripVertical, ArrowUpDown } from 'lucide-react';
import { getFilterStatKeys, getStatDisplayConfig } from '@/ui/idleVillage/config/rosterFilterConfig';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { formatResidentLabel } from '@/ui/idleVillage/residentName';
import PgCard, { type PgCardProps } from '@/ui/idleVillage/components/PgCard';
import WanderlustRosterCard from '@/ui/idleVillage/components/WanderlustRosterCard';
import type { GetResidentCompatibility, ResidentCompatibilityState } from './ResidentRosterTypes';
import type { DropValidationResult } from '@/ui/idleVillage/config/residentDropRules';
import { createSandboxDiagnostics } from '@/ui/idleVillage/utils/sandboxDiagnostics';
import { getCurrentDragConfig } from '@/ui/idleVillage/config/dragConfig';
import { rendererStackInstrumentation } from '@/ui/idleVillage/utils/rendererStackInstrumentation';
import { getResidentPortraitUrl } from '@/engine/game/idleVillage/residentVisualResolver';
import { useMatericSkin } from '@/ui/wanderlust-surface/MatericSkinContext';
import { MATERIC_SKIN_CONFIG } from '@/ui/wanderlust-surface/matericSkinConfig';
import { WellBronzeBezel } from '@/ui/visualFidelityLab/plateVariants';

/**
 * DragTestContainer - Resident Roster Container (CANONICAL VERSION)
 * 
 * A comprehensive container for resident roster with drag-and-drop, filtering, and
 * virtualization capabilities. This component represents the canonical design after
 * post-freeze optimizations for minimal, compact display.
 * 
 * CANONICAL DESIGN (Post-Freeze Optimizations):
 * - Streamlined DOM: Removed unnecessary div wrappers for cleaner structure
 * - Inline layout: All header elements on single line with flex layout
 * - Positional dragging: Window dragging via GripVertical handle (entire window moves, no drop targets)
 * - Single drag affordance: Only the handle triggers window drag, PgCard drags remain independent
 * - Compact filters: Only dropdown filter, removed quick filter buttons
 * - Optimized text: Reduced font sizes for compact display
 * - Efficient spacing: Minimal gaps and padding
 * 
 * Header Structure (Inline Layout):
 * ┌─────────────────────────────────────────────────┐
 * │ [⋮⋮] Roster 3/3 [Filtro ▼] [👁] [Collapse ▼]      │
 * │ Drag Handle   Count   Dropdown   Controls         │
 * └─────────────────────────────────────────────────┘
 * 
 * Key Changes After Freeze:
 * - Removed "Tutti", "Eroi", "Feriti" quick filter buttons (only dropdown remains)
 * - Added positional window dragging with GripVertical handle aligned to the header label
 * - Handle has grab cursor states and does not interfere with PgCard drags
 * - PgCard drag-and-drop remains routed through ResidentRosterPanel and CustomDragOverlay
 * - Made all header elements inline with flex layout
 * - Reduced font sizes and spacing for compact display
 * - Streamlined DOM with fewer nested divs
 elements
 * - Optimized spacing: gap-2 between header elements
 * 
 * @component
 * @example
 * ```tsx
 * <DragTestContainer
 *   residents={residents}
 *   layout="inline"
 *   cardVariant="horizontal"
 *   componentId="roster-component"
 *   onResidentSelect={handleSelect}
 * />
 * ```
 */
const useVirtualization = (params: {
  itemCount: number;
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}) => {
  const { itemCount, itemHeight, containerHeight, overscan = 3 } = params;
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    itemCount - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const totalHeight = itemCount * itemHeight;
  const offsetY = startIndex * itemHeight;

  return {
    startIndex,
    endIndex,
    totalHeight,
    offsetY,
    onScroll: useCallback((event: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(event.currentTarget.scrollTop);
    }, []),
  };
};

/**
 * Filter options for resident roster.
 * Controls which residents are displayed based on status and stats.
 */
interface FilterOptions {
  status: 'all' | 'available' | 'away' | 'exhausted' | 'injured' | 'dead' | 'heroes';
  minHp: number;
  maxFatigue: number;
}

const _QUICK_STATUS_FILTERS: Array<{ value: FilterOptions['status']; label: string }> = [
  { value: 'all', label: 'Tutti' },
  { value: 'heroes', label: 'Eroi' },
  { value: 'injured', label: 'Feriti' },
  { value: 'available', label: 'Disponibili' },
  { value: 'exhausted', label: 'Esausti' },
  { value: 'away', label: 'Impegnati' },
  { value: 'dead', label: 'Caduti' },
];

/**
 * Props for DragTestContainer component.
 * Provides a configurable resident roster with drag/drop capabilities.
 */
type DragFeedbackState = NonNullable<PgCardProps['dragFeedbackState']>;

export interface DragTestContainerProps {
  residents: ResidentState[];
  onDragStart?: (residentId: string) => void;
  onDragEnd?: (residentId: string) => void;
  onDragStateChange?: (residentId: string, isDragging: boolean) => void;
  onResidentSelect?: (residentId: string) => void;
  isDayPhase?: boolean;
  getResidentCompatibility?: GetResidentCompatibility;
  cardVariant?: 'horizontal' | 'vertical';
  listClassName?: string;
  listMaxHeightPx?: number;
  onCountsChange?: (counts: { filtered: number; total: number }) => void;
  resetSignal?: number;
  lockedResidentIds?: string[];
  validationResults?: DropValidationResult[];
  showHUDSignals?: boolean;
  isInlineLayout?: boolean;
  dragVisualState?: DragVisualState;
  /** Enable virtualization for large rosters */
  enableVirtualization?: boolean;
  /** Component ID for sortable dragging */
  componentId?: string;
  /** Optional additional controls to render in header */
  headerControls?: ReactNode;
  layout?: 'showcase' | 'inline' | 'grid';
  /** Optional custom class applied to the outer wrapper */
  className?: string;
  /** Overrides the max height (in px) of the scrollable list */
  listMaxHeight?: number;
  /** Custom label shown for locked residents in the roster. Defaults to "Assigned". */
  lockedStatusLabel?: string;
  /** Visual feedback for the currently dragged resident. */
  activeDragFeedback?: DragFeedbackState;
  /** Use Wanderlust skin styling instead of default PgCard */
  useWanderlustSkin?: boolean;
}

type DragVisualState = {
  mode: 'idle' | 'dragging' | 'flight' | 'returning';
  residentId?: string;
};

/**
 * Main DragTestContainer component.
 * Renders a filtered, virtualizable resident roster with drag/drop support.
 */
function DragTestContainer({
  residents,
  onDragStart,
  onDragEnd,
  onDragStateChange,
  onCountsChange,
  onResidentSelect,
  isDayPhase = true,
  layout = 'inline',
  cardVariant = 'horizontal',
  className,
  listMaxHeight,
  lockedResidentIds,
  lockedStatusLabel = 'Assigned',
  resetSignal,
  getResidentCompatibility,
  listClassName,
  activeDragFeedback = 'idle',
  componentId,
  dragVisualState,
  headerControls,
  useWanderlustSkin = false,
}: DragTestContainerProps) {
  const isMateric = useMatericSkin();
  const [draggingResidentId, setDraggingResidentId] = useState<string | null>(null);
  const [dragStartTime, setDragStartTime] = useState<number | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    minHp: 0,
    maxFatigue: 100,
  });
  // VISUAL MOCKUP ONLY — see the TODO block above the <select> in the JSX
  // below for what this control must actually do once implemented.
  const [statSortMockup, setStatSortMockup] = useState('');
  const [statSortDirection, setStatSortDirection] = useState<'asc' | 'desc'>('desc');
  const [heroFlashIds, setHeroFlashIds] = useState<string[]>([]);
  const [recentlyDraggedResidentId, setRecentlyDraggedResidentId] = useState<string | null>(null);
  const [isRosterCollapsed, setIsRosterCollapsed] = useState(false);
  const isInlineLayout = layout === 'inline';
  const isGridLayout = layout === 'grid';
  const listMaxHeightPx = listMaxHeight ?? (isInlineLayout ? 184 : 400);

  // Initialize diagnostics logger
  const diagnostics = createSandboxDiagnostics('DragTestContainer', 'drag-test-container');

  // TODO(style-lab-flexibility): once interactionPhysics tokens land, thread them through
  // getCurrentDragConfig so this component can pick mass/damping presets and trigger
  // Framer Motion overshoot (1.0 → 0.95 → 1.0) for pick-up/drop animations.
  const dragConfig = useMemo(() => getCurrentDragConfig(), []);

  const residentsById = useMemo<Record<string, ResidentState>>(() => {
    return residents.reduce<Record<string, ResidentState>>((acc, resident) => {
      acc[resident.id] = resident;
      return acc;
    }, {});
  }, [residents]);

  const listRef = useRef<HTMLDivElement | null>(null);
  const heroStatusRef = useRef<Record<string, boolean>>({});
  const heroFlashTimeouts = useRef<Record<string, number>>({});

  const lockedSet = useMemo(() => new Set(lockedResidentIds ?? []), [lockedResidentIds]);

  const getEffectiveStatus = useCallback((resident: ResidentState): ResidentState['status'] => {
    if (lockedSet.has(resident.id)) {
      return 'away';
    }
    return resident.status;
  }, [lockedSet]);

  const getHpPercentage = useCallback((resident: ResidentState) => {
    if (resident.maxHp <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((resident.currentHp / resident.maxHp) * 100)));
  }, []);

  const isResidentBlocked = useCallback((resident: ResidentState) => {
    const hpPercent = getHpPercentage(resident);
    const status = getEffectiveStatus(resident);
    return resident.isInjured || status === 'injured' || status === 'exhausted' || hpPercent <= 25;
  }, [getEffectiveStatus, getHpPercentage]);

  const filteredResidents = useMemo(() => {
    const { minHpThreshold, maxFatigueThreshold } = dragConfig.thresholds;
    const filtered = residents.filter((resident) => {
      const status = getEffectiveStatus(resident);
      
      // Special filter: heroes
      if (filters.status === 'heroes') {
        if (!resident.isHero) return false;
      } else if (filters.status !== 'all' && status !== filters.status) {
        return false;
      }
      
      // Phase E: Apply system thresholds as hard filters for the roster
      if (resident.currentHp < minHpThreshold) {
        console.log(`Filtered ${resident.id}: HP too low (${resident.currentHp} < ${minHpThreshold})`);
        return false;
      }
      if (resident.fatigue > maxFatigueThreshold) {
        console.log(`Filtered ${resident.id}: Fatigue too high (${resident.fatigue} > ${maxFatigueThreshold})`);
        return false;
      }
      
      // Apply user-defined filters from UI
      if (resident.currentHp < filters.minHp) {
        console.log(`Filtered ${resident.id}: User HP filter (${resident.currentHp} < ${filters.minHp})`);
        return false;
      }
      if (resident.fatigue > filters.maxFatigue) {
        console.log(`Filtered ${resident.id}: User fatigue filter (${resident.fatigue} > ${filters.maxFatigue})`);
        return false;
      }
      
      return true;
    });
    
    console.log('Resident filtering results:', {
      total: residents.length,
      filtered: filtered.length,
      filters,
      thresholds: dragConfig.thresholds,
      residents: residents.map(r => ({
        id: r.id,
        name: r.displayName,
        hp: r.currentHp,
        fatigue: r.fatigue,
        status: getEffectiveStatus(r),
        isHero: r.isHero
      }))
    });
    
    return filtered;
  }, [residents, filters, getEffectiveStatus, dragConfig.thresholds]);

  const sortedResidents = useMemo(() => {
    const groupValue = (resident: ResidentState) => {
      if (resident.isHero) return 0;
      return isResidentBlocked(resident) ? 2 : 1;
    };

    return [...filteredResidents].sort((a, b) => {
      const groupDiff = groupValue(a) - groupValue(b);
      if (groupDiff !== 0) return groupDiff;

      // Within each group, sort alphabetically by display name first
      const aName = formatResidentLabel(a);
      const bName = formatResidentLabel(b);
      const nameCompare = aName.localeCompare(bName);
      if (nameCompare !== 0) return nameCompare;

      // Then by survival score (descending) for tie-breaking
      const aScore = a.survivalScore ?? 0;
      const bScore = b.survivalScore ?? 0;
      if (groupValue(a) <= 1 && aScore !== bScore) {
        return bScore - aScore;
      }

      // Finally by injury status
      if (a.isInjured !== b.isInjured) {
        return a.isInjured ? 1 : -1;
      }

      // Ultimate fallback by ID
      return a.id.localeCompare(b.id);
    });
  }, [filteredResidents, isResidentBlocked]);

  // Preload & decode every resident portrait as soon as the roster mounts, so
  // the drag-overlay medallion (SVG <image>) can paint the portrait on its very
  // first frame instead of waiting for fetch+decode at drag start.
  useEffect(() => {
    residents.forEach((resident) => {
      const url = getResidentPortraitUrl(resident);
      if (!url) return;
      const img = new Image();
      img.src = url;
      img.decode?.().catch(() => { /* decode is best-effort preloading */ });
    });
  }, [residents]);

  // Instrument renderer stack at DragTestContainer level
  // Capture processed residents and PgCard props for divergence analysis
  useEffect(() => {
    // Create PgCard props array from current sorted residents
    const pgCardProps: PgCardProps[] = sortedResidents.map((resident, index) => {
      const isLifted = (dragVisualState?.mode === 'dragging' || dragVisualState?.mode === 'flight') && 
                      dragVisualState?.residentId === resident.id;
      const dragFeedbackState: PgCardProps['dragFeedbackState'] = draggingResidentId === resident.id ? activeDragFeedback : 'idle';
      const subtitle = resident.isHero ? 'Eroe attivo' : resident.isInjured ? 'Ferito' : undefined;
      
      return {
        workerId: resident.id,
        label: formatResidentLabel(resident),
        subtitle,
        hp: resident.currentHp,
        fatigue: resident.fatigue,
        maxHp: resident.maxHp,
        isDragging: draggingResidentId === resident.id,
        disabled: isResidentBlocked(resident),
        isInteractive: !isResidentBlocked(resident),
        statusLabel: subtitle || '',
        horizontal: cardVariant === 'horizontal',
        dragFeedbackState,
        onDragStateChange,
        portraitUrl: getResidentPortraitUrl(resident),
        compatibilityState: getResidentCompatibility?.(resident.id)?.state,
        compatibilityLabel: getResidentCompatibility?.(resident.id)?.reason,
      };
    });

    rendererStackInstrumentation.captureDragTestContainer(
      residents,
      sortedResidents,
      pgCardProps
    );
  }, [residents, sortedResidents, draggingResidentId, activeDragFeedback, dragVisualState, cardVariant, getResidentCompatibility, onDragStateChange]);

  // Use virtualization for large rosters
  const shouldVirtualize = sortedResidents.length > dragConfig.thresholds.virtualizationThreshold;
  
  // Log virtualization state changes
  useEffect(() => {
    diagnostics.debug('virtualization_state', {
      shouldVirtualize,
      residentCount: sortedResidents.length,
      threshold: dragConfig.thresholds.virtualizationThreshold,
      timestamp: Date.now(),
      location: 'DragTestContainer',
      payload: {
        shouldVirtualize,
        residentCount: sortedResidents.length,
        threshold: dragConfig.thresholds.virtualizationThreshold,
      },
    }, ['performance', 'virtualization']);
  }, [shouldVirtualize, sortedResidents.length, dragConfig.thresholds.virtualizationThreshold, diagnostics]);
  
  const virtualConfig = useVirtualization({
    itemCount: sortedResidents.length,
    itemHeight: cardVariant === 'horizontal' ? 80 : 140, // Adjust for vertical cards
    containerHeight: listMaxHeightPx,
    overscan: 3,
  });

  const visibleResidents = shouldVirtualize
    ? sortedResidents.slice(virtualConfig.startIndex, virtualConfig.endIndex + 1)
    : sortedResidents;

  // Preload resident portraits for smooth drag operations
  useEffect(() => {
    const residentsToPreload = shouldVirtualize ? visibleResidents : sortedResidents;
    
    residentsToPreload.forEach((resident) => {
      if (resident.portraitUrl) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = resident.portraitUrl;
        // Preload without waiting for completion
      }
    });
  }, [sortedResidents, visibleResidents, shouldVirtualize]);

  const resetDraggingState = useCallback(() => {
    setDraggingResidentId(null);
  }, []);

  useEffect(() => {
    if (typeof resetSignal !== 'number' || resetSignal <= 0) {
      return undefined;
    }
    const frame = window.requestAnimationFrame(() => {
      resetDraggingState();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [resetSignal, resetDraggingState]);

  useEffect(() => {
    onCountsChange?.({ filtered: sortedResidents.length, total: residents.length });
  }, [sortedResidents.length, onCountsChange, residents.length]);

  useEffect(() => {
    diagnostics.info('config_loaded', {
      minHpThreshold: dragConfig.thresholds.minHpThreshold,
      maxFatigueThreshold: dragConfig.thresholds.maxFatigueThreshold,
      virtualizationThreshold: dragConfig.thresholds.virtualizationThreshold,
    });
  }, [dragConfig, diagnostics]);

  const setListPointerEvents = useCallback((enabled: boolean) => {
    if (!listRef.current) return;
    listRef.current.style.pointerEvents = enabled ? '' : 'none';
  }, []);

  useEffect(() => () => {
    setListPointerEvents(true);
  }, [setListPointerEvents]);

  useEffect(() => {
    setListPointerEvents(!draggingResidentId);
  }, [draggingResidentId, setListPointerEvents]);

  useEffect(() => {
    const handleGlobalDragEnd = () => {
      setDraggingResidentId(null);
      setListPointerEvents(true);
    };

    window.addEventListener('dragend', handleGlobalDragEnd, true);
    window.addEventListener('drop', handleGlobalDragEnd, true);

    return () => {
      window.removeEventListener('dragend', handleGlobalDragEnd, true);
      window.removeEventListener('drop', handleGlobalDragEnd, true);
    };
  }, [setListPointerEvents]);

  const _handleDragStart = useCallback((residentId: string) => {
    setDraggingResidentId(residentId);
    onDragStart?.(residentId);
    
    diagnostics.info('drag_start', {
      residentId,
      timestamp: Date.now(),
      location: 'DragTestContainer',
      payload: {
        residentId,
        filter: filters,
      },
    }, ['drag', 'start']);
  }, [diagnostics, onDragStart, filters]);

  const dragClickSuppressTimeout = useRef<number | null>(null);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }

    const handleGlobalDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const residentId = target.getAttribute('data-worker-id');
      if (!residentId) return;
      const resident = residentsById[residentId];
      if (!resident) return;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const size = 64;
      canvas.width = size;
      canvas.height = size;

      const rect = target.getBoundingClientRect();
      const offsetX = Math.max(0, Math.min(size, e.clientX - rect.left));
      const offsetY = Math.max(0, Math.min(size, e.clientY - rect.top));

      if (!ctx) return;

      ctx.fillStyle = 'rgba(6, 10, 18, 0.9)';
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.fill();

      if (resident.portraitUrl) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          ctx.save();
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(img, 4, 4, size - 8, size - 8);
          ctx.restore();
          e.dataTransfer?.setDragImage(canvas, offsetX, offsetY);
        };
        img.onerror = () => {
          e.dataTransfer?.setDragImage(canvas, offsetX, offsetY);
        };
        img.src = resident.portraitUrl;
      } else {
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 24px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const initial = (resident.displayName || resident.id).charAt(0).toUpperCase();
        ctx.fillText(initial, size / 2, size / 2);
        e.dataTransfer?.setDragImage(canvas, offsetX, offsetY);
      }
    };

    document.addEventListener('dragstart', handleGlobalDragStart);
    return () => {
      document.removeEventListener('dragstart', handleGlobalDragStart);
    };
  }, [residentsById]);

  const _handleDragEnd = useCallback((residentId: string) => {
    const endTime = Date.now();
    const dragDuration = dragStartTime ? endTime - dragStartTime : 0;
    setDraggingResidentId(null);
    setDragStartTime(null);
    setListPointerEvents(true);
    setRecentlyDraggedResidentId(residentId);
    if (dragClickSuppressTimeout.current) {
      window.clearTimeout(dragClickSuppressTimeout.current);
    }
    dragClickSuppressTimeout.current = window.setTimeout(() => {
      setRecentlyDraggedResidentId((prev) => (prev === residentId ? null : prev));
      dragClickSuppressTimeout.current = null;
    }, 200);
    onDragEnd?.(residentId);
    
    diagnostics.info('drag_end', {
      residentId,
      timestamp: endTime,
      location: 'DragTestContainer',
      payload: {
        residentId,
        dragDuration,
        slotId: null,
        dropState: null,
        filter: filters,
      },
    }, ['drag', 'end']);
  }, [diagnostics, onDragEnd, filters, dragStartTime, setListPointerEvents]);

  const handleDragStateChange = useCallback((residentId: string, isDragging: boolean) => {
    setDraggingResidentId(isDragging ? residentId : null);
    onDragStateChange?.(residentId, isDragging);
    
    diagnostics.debug('drag_state_change', {
      residentId,
      isDragging,
      timestamp: Date.now(),
      location: 'DragTestContainer',
      payload: {
        residentId,
        isDragging,
        slotId: null,
        dropState: null,
        filter: filters,
      },
    }, ['drag', 'state']);
  }, [diagnostics, onDragStateChange, filters]);

  /**
   * Returns a user-facing status label for the provided resident.
   */
  const describeStatus = useCallback((resident: ResidentState): string => {
    if (lockedSet.has(resident.id)) return lockedStatusLabel;
    if (resident.isInjured || resident.status === 'injured') return 'Injured';
    if (resident.status === 'dead') return 'Fallen';
    if (resident.status === 'exhausted') return 'Exhausted';
    switch (resident.status) {
      case 'available':
        return 'Available';
      case 'away':
        return 'Away';
      default:
        return 'Unknown';
    }
  }, [lockedSet, lockedStatusLabel]);

  /**
   * Determines if the resident can currently be assigned/dragged.
   * Uses config-based thresholds for HP and fatigue limits.
   * Returns false during night phase (isDayPhase === false).
   */
  const isResidentInteractive = useCallback((resident: ResidentState): boolean => {
    if (!isDayPhase) return false;
    const status = getEffectiveStatus(resident);
    const { minHpThreshold, maxFatigueThreshold } = dragConfig.thresholds;
    return !resident.isInjured &&
           status === 'available' &&
           resident.currentHp >= minHpThreshold &&
           resident.fatigue <= maxFatigueThreshold;
  }, [isDayPhase, getEffectiveStatus, dragConfig.thresholds]);

  const handleResidentSelectSafe = useCallback(
    (residentId: string) => {
      console.log('🔍 [DragTestContainer] handleResidentSelectSafe called:', residentId, 'draggingResidentId:', draggingResidentId, 'recentlyDraggedResidentId:', recentlyDraggedResidentId);
      
      // Block if currently dragging or recently dragged
      if (draggingResidentId === residentId || recentlyDraggedResidentId === residentId) {
        console.log('🔍 [DragTestContainer] Blocking select due to drag state');
        return;
      }
      
      // Also block if the resident is currently in 'away' status (should not be selectable)
      const resident = residents.find(r => r.id === residentId);
      if (resident?.status === 'away') {
        console.log('🔍 [DragTestContainer] Blocking select due to away status');
        return;
      }
      
      console.log('🔍 [DragTestContainer] Allowing select for resident:', residentId);
      onResidentSelect?.(residentId);
    },
    [draggingResidentId, recentlyDraggedResidentId, onResidentSelect, residents],
  );

  const renderResidentCard = useCallback((resident: ResidentState): ReactNode => {
    const isLocked = lockedSet.has(resident.id);
    const compatibilityInfo = getResidentCompatibility?.(resident.id);
    const compatibilityState: ResidentCompatibilityState = compatibilityInfo?.state ?? 'idle';
    const compatibilityLabel = compatibilityInfo?.slotLabel;
    const isCompatibilityInvalid = compatibilityState === 'invalid';
    const interactive = isResidentInteractive(resident) && !isCompatibilityInvalid;
    // REGOLA 1: Durante il drag, solo il proxy è vivo
    const isLifted = (dragVisualState?.mode === 'dragging' || dragVisualState?.mode === 'flight') &&
                    dragVisualState?.residentId === resident.id;
    // Spring-back in corso: la card è visibile ma non interagibile finché non torna idle
    const isReturningCard = dragVisualState?.mode === 'returning' &&
                    dragVisualState?.residentId === resident.id;
    
    const dragFeedbackState: PgCardProps['dragFeedbackState'] = draggingResidentId === resident.id ? activeDragFeedback : 'idle';
    const heroFlashActive = heroFlashIds.includes(resident.id);
    const isBlocked = isResidentBlocked(resident);
    const subtitle = resident.isHero ? 'Eroe attivo' : resident.isInjured ? 'Ferito' : undefined;

    // Determine drop state for accessibility
    const dropState = isLocked ? 'locked' : isCompatibilityInvalid ? 'invalid' : interactive ? 'valid' : 'disabled';
    
    // Log drop state for diagnostics
    diagnostics.debug('drop_state', {
      residentId: resident.id,
      dropState,
      isLocked,
      isCompatibilityInvalid,
      interactive,
      timestamp: Date.now(),
      location: 'DragTestContainer',
      payload: {
        residentId: resident.id,
        dropState,
        isLocked,
        isCompatibilityInvalid,
        interactive,
        compatibilityState,
        slotId: null,
        filter: filters,
      },
    }, ['drag', 'state']);

    return (
      <div
        key={resident.id}
        className="relative group"
        data-resident-id={resident.id}
        data-hero={resident.isHero}
        data-blocked={isBlocked}
        style={{ pointerEvents: isLifted || isReturningCard ? 'none' : undefined }}
      >
        {heroFlashActive && (
          <span className="pointer-events-none absolute inset-0 rounded-2xl border border-amber-300/60 opacity-70" />
        )}
        {isBlocked && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-black/60 text-[10px] uppercase tracking-[0.3em] text-amber-200">
            Recupero necessario
          </div>
        )}
        {/* Durante il drag la card resta montata e leggibile: va in alfa
            (isDragging) e lo stato del PG diventa "Away" — mai socket vuoto. */}
        {useWanderlustSkin ? (
          <WanderlustRosterCard
            workerId={resident.id}
            label={formatResidentLabel(resident)}
            subtitle={isLifted ? 'Away' : isLocked ? lockedStatusLabel : subtitle}
            hp={resident.currentHp}
            fatigue={resident.fatigue}
            maxHp={resident.maxHp}
            isDragging={isLifted || draggingResidentId === resident.id}
            disabled={!interactive}
            isInteractive={interactive}
            statusLabel={isLifted ? 'Away' : isLocked ? lockedStatusLabel : describeStatus(resident)}
            portraitUrl={getResidentPortraitUrl(resident)}
            compatibilityState={compatibilityState}
            compatibilityLabel={compatibilityLabel}
            onDragStateChange={handleDragStateChange}
            onSelect={handleResidentSelectSafe}
            isHero={resident.isHero}
            className="w-full"
            data-drag-state={dropState}
            data-resident-id={resident.id}
            data-compatibility={compatibilityState}
          />
        ) : (
          <PgCard
            workerId={resident.id}
            label={formatResidentLabel(resident)}
            subtitle={isLifted ? 'Away' : isLocked ? lockedStatusLabel : subtitle}
            hp={resident.currentHp}
            fatigue={resident.fatigue}
            maxHp={resident.maxHp}
            isDragging={isLifted || draggingResidentId === resident.id}
            disabled={!interactive}
            isInteractive={interactive}
            statusLabel={isLifted ? 'Away' : isLocked ? lockedStatusLabel : describeStatus(resident)}
            horizontal={cardVariant === 'horizontal'}
            portraitUrl={getResidentPortraitUrl(resident)}
            compatibilityState={compatibilityState}
            compatibilityLabel={compatibilityLabel}
            dragFeedbackState={dragFeedbackState}
            onDragStateChange={handleDragStateChange}
            onSelect={handleResidentSelectSafe}
                        className="w-full"
            data-drag-state={dropState}
            data-resident-id={resident.id}
            data-compatibility={compatibilityState}
          />
        )}
      </div>
    );
  }, [activeDragFeedback, lockedSet, getResidentCompatibility, isResidentInteractive, draggingResidentId, diagnostics, handleDragStateChange, handleResidentSelectSafe, describeStatus, lockedStatusLabel, filters, heroFlashIds, isResidentBlocked, cardVariant, recentlyDraggedResidentId, dragVisualState, useWanderlustSkin]);

  const renderVirtualizedResident = useCallback((resident: ResidentState, actualIndex: number) => {
    const style: CSSProperties = {
      position: 'absolute',
      top: actualIndex * (cardVariant === 'horizontal' ? 80 : 140),
      width: '100%',
    };

    return (
      <div key={resident.id} style={style}>
        {renderResidentCard(resident)}
      </div>
    );
  }, [renderResidentCard, cardVariant]);

  const wrapperClassName = [
    'relative overflow-hidden rounded-[26px] bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.08),rgba(5,9,18,0.92))] p-4 shadow-[0_25px_45px_rgba(0,0,0,0.55)]',
    isInlineLayout && 'rounded-2xl border border-white/10 bg-black/25 p-3 shadow-[0_15px_30px_rgba(0,0,0,0.4)]',
    isGridLayout && 'rounded-2xl border border-white/10 bg-black/25 p-4 shadow-[0_15px_30px_rgba(0,0,0,0.4)]',
    useWanderlustSkin && 'rounded-[20px] bg-[linear-gradient(180deg,rgba(3,2,2,0.95)_0%,rgba(6,4,3,0.98)_100%)] shadow-[inset_0_1px_0_rgba(216,177,62,0.08),0_4px_20px_rgba(0,0,0,0.6)]',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const listWrapperClassName = [
    'space-y-2 overflow-y-auto scroll-smooth',
    styles.scrollArea,
    isInlineLayout ? 'pr-0' : 'pr-1',
    listClassName,
  ]
    .filter(Boolean)
    .join(' ');

  const _headerTextClassName = useWanderlustSkin
    ? 'flex items-center gap-2 text-[15px] font-semibold tracking-[0.34em] text-[var(--skin-title-color)]'
    : isInlineLayout
      ? 'flex items-center gap-2 text-[9px] uppercase tracking-[0.4em] text-[var(--skin-label-primary)]/80'
      : 'flex items-center gap-2 text-[9px] uppercase tracking-[0.45em] text-[var(--skin-label-primary)]/70';

  const _controlButtonClassName = useWanderlustSkin
    ? 'p-1 text-[var(--skin-label-primary)] transition'
    : isInlineLayout
      ? 'p-1 text-[var(--skin-text-secondary)] transition'
      : 'p-1.5 text-[var(--skin-text-secondary)] transition';

  const handleStatusChange = useCallback((newStatus: FilterOptions['status']) => {
    if (filters.status === newStatus) return;
    setFilters((prev) => ({ ...prev, status: newStatus }));

    diagnostics.info('filter_changed', {
      filterType: 'status',
      previousStatus: filters.status,
      newStatus,
      timestamp: Date.now(),
      location: 'DragTestContainer',
      payload: {
        filterType: 'status',
        previousStatus: filters.status,
        newStatus,
        filteredCount: sortedResidents.length,
      },
    }, ['filter', 'change']);
  }, [diagnostics, filters.status, sortedResidents.length]);

  useEffect(() => {
    const newlyHeroic: string[] = [];
    residents.forEach((resident) => {
      const wasHero = heroStatusRef.current[resident.id];
      if (resident.isHero && !wasHero) {
        newlyHeroic.push(resident.id);
      }
      heroStatusRef.current[resident.id] = resident.isHero;
    });

    newlyHeroic.forEach((id) => {
      setHeroFlashIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
      if (heroFlashTimeouts.current[id]) {
        window.clearTimeout(heroFlashTimeouts.current[id]);
      }
      heroFlashTimeouts.current[id] = window.setTimeout(() => {
        setHeroFlashIds((prev) => prev.filter((flashId) => flashId !== id));
        delete heroFlashTimeouts.current[id];
      }, 1400);
    });
  }, [residents]);

  useEffect(() => () => {
    Object.values(heroFlashTimeouts.current).forEach((timeoutId) => {
      window.clearTimeout(timeoutId);
    });
    if (dragClickSuppressTimeout.current) {
      window.clearTimeout(dragClickSuppressTimeout.current);
    }
  }, []);

  const _isQuickFilterActive = useCallback(
    (value: FilterOptions['status']) => filters.status === value,
    [filters.status],
  );

  // Setup sortable for component dragging
  // Positional dragging for the roster window (not sortable drag and drop)
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const activePointerIdRef = useRef<number | null>(null);
  const FALLBACK_POINTER_ID = -1;
  const containerRef = useRef<HTMLDivElement>(null);

  // Firefly configuration for Wanderlust skin
  const FIREFLIES = useWanderlustSkin ? [
    { left: '14%', size: 4, dur: 13, delay: 0 },
    { left: '38%', size: 3, dur: 16, delay: 3.5 },
    { left: '58%', size: 4, dur: 14, delay: 6 },
    { left: '76%', size: 3, dur: 17, delay: 1.8 },
    { left: '90%', size: 3, dur: 15, delay: 8.5 },
  ] : [];

  const startDragging = useCallback(
    (clientX: number, clientY: number, pointerId: number) => {
      dragStartRef.current = {
        x: clientX - position.x,
        y: clientY - position.y,
      };
      activePointerIdRef.current = pointerId;
      setIsDragging(true);
    },
    [position],
  );

  const _handleClickInternal = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    // This function is not used in DragTestContainer; click handling is done in PgCard
    event.preventDefault();
  }, []);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!componentId) return;
      event.preventDefault();
      startDragging(event.clientX, event.clientY, event.pointerId);
      event.currentTarget.setPointerCapture?.(event.pointerId);
    },
    [componentId, startDragging],
  );

  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!componentId) return;
      const nativeEvent = event.nativeEvent as MouseEvent & { pointerId?: number };
      if (typeof nativeEvent.pointerId === 'number') {
        // Pointer events already handled
        return;
      }
      event.preventDefault();
      startDragging(event.clientX, event.clientY, FALLBACK_POINTER_ID);
    },
    [componentId, startDragging, FALLBACK_POINTER_ID],
  );

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!isDragging || activePointerIdRef.current !== event.pointerId) {
        return;
      }
      setPosition({
        x: event.clientX - dragStartRef.current.x,
        y: event.clientY - dragStartRef.current.y,
      });
    };

    const handlePointerEnd = (event: PointerEvent) => {
      if (activePointerIdRef.current !== event.pointerId) {
        return;
      }
      activePointerIdRef.current = null;
      setIsDragging(false);
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDragging || activePointerIdRef.current !== FALLBACK_POINTER_ID) {
        return;
      }
      setPosition({
        x: event.clientX - dragStartRef.current.x,
        y: event.clientY - dragStartRef.current.y,
      });
    };

    const handleMouseUp = () => {
      if (activePointerIdRef.current !== FALLBACK_POINTER_ID) {
        return;
      }
      activePointerIdRef.current = null;
      setIsDragging(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerEnd);
    window.addEventListener('pointercancel', handlePointerEnd);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerEnd);
      window.removeEventListener('pointercancel', handlePointerEnd);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, FALLBACK_POINTER_ID]);

  return (
    <section 
      ref={containerRef}
      style={{
        position: 'relative',
        transform: `translate(${position.x}px, ${position.y}px)`,
        opacity: isDragging ? 0.8 : 1,
        cursor: isDragging ? 'grabbing' : componentId ? 'grab' : 'default',
        zIndex: isDragging ? 1000 : 1,
        background: 'var(--skin-surface-bg)',
      }}
      className={wrapperClassName}
      data-testid="drag-test-container"
      data-roster-drag-state={isDragging ? 'dragging' : 'idle'}
      data-roster-position-x={position.x}
      data-roster-position-y={position.y}
      data-filtered-count={sortedResidents.length}
      data-total-count={residents.length}
      data-locked-count={lockedResidentIds?.length ?? 0}
      data-invalid-count={filteredResidents.filter(r => getResidentCompatibility?.(r.id)?.state === 'invalid').length}
      data-day-phase={isDayPhase}
      data-virtualization-enabled={shouldVirtualize}
      data-drag-config-loaded="true"
      aria-label={`Resident roster${isDayPhase ? '' : ', night phase - dragging disabled'}`}
      aria-live="polite"
      aria-atomic="true"
      data-accessible-counters="true"
      data-accessible-states="true"
    >
      {isMateric && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `url(${MATERIC_SKIN_CONFIG.grain.textureUrl})`,
            backgroundSize: MATERIC_SKIN_CONFIG.grain.size,
            backgroundRepeat: MATERIC_SKIN_CONFIG.grain.repeat,
            mixBlendMode: MATERIC_SKIN_CONFIG.grain.mixBlendMode,
            opacity: MATERIC_SKIN_CONFIG.grain.opacity,
          }}
          aria-hidden="true"
        />
      )}
      {useWanderlustSkin && (
        <div
          className="pointer-events-none absolute inset-0 rounded-[20px]"
          style={{
            boxShadow: 'inset 0 0 20px rgba(223,184,87,0.03)',
            animation: 'border-pulse 4s ease-in-out infinite',
          }}
        />
      )}
      {!isInlineLayout && !useWanderlustSkin && (
        <div
          className="pointer-events-none absolute inset-0 opacity-35"
          style={{
            background: 'var(--card-surface-radial, radial-gradient(circle at 30% 0%, rgba(255,255,255,0.2), transparent 55%))',
          }}
        />
      )}
      {useWanderlustSkin && (
        <div 
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-[20px]"
          style={{ opacity: 0.6 }}
        >
          {FIREFLIES.map((f, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: f.left,
                bottom: '-10px',
                width: `${f.size}px`,
                height: `${f.size}px`,
                borderRadius: '50%',
                background: 'var(--skin-title-color, #f0cf6a)',
                filter: 'blur(0.5px)',
                boxShadow: '0 0 6px rgba(223,184,87,0.75)',
                opacity: 0,
                animation: `firefly ${f.dur}s ease-in-out infinite`,
                animationDelay: `${f.delay}s`,
                willChange: 'transform, opacity',
              }}
            />
          ))}
        </div>
      )}
      {useWanderlustSkin && <WellBronzeBezel band={5} rx={17.5} />}
      <div className={`relative z-10 space-y-4 ${useWanderlustSkin ? 'p-6' : ''}`.trim()}>
        {useWanderlustSkin && (
          <div 
            className="block h-px mx-2 mb-5"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(223,184,87,0.32) 20%, rgba(223,184,87,0.32) 80%, transparent)',
            }}
          />
        )}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className={_headerTextClassName}>
            {componentId && (
              <div 
                className="cursor-grab active:cursor-grabbing"
                onPointerDown={handlePointerDown}
                onMouseDown={handleMouseDown}
                style={{ pointerEvents: 'auto' }}
                data-testid="roster-drag-handle"
                data-roster-handle-state={isDragging ? 'dragging' : 'idle'}
              >
                <GripVertical className={`w-3 h-3 ${useWanderlustSkin ? 'text-[var(--skin-icon-color)] hover:text-[var(--skin-title-color)]' : 'text-[var(--skin-label-primary)]/80 hover:text-[var(--skin-text-primary)]'} transition-colors`} />
              </div>
            )}
            <span style={useWanderlustSkin ? { fontFamily: 'var(--wl-font-display, "Cinzel", "Trajan Pro", serif)' } : {}}>Roster</span>
            <span 
              className={useWanderlustSkin ? 'text-[var(--skin-title-color)]' : 'text-[var(--skin-text-primary)]'}
              aria-label={`Filtered residents: ${sortedResidents.length} of ${residents.length}`}
              data-testid="resident-count"
            >
              {`${sortedResidents.length}/${residents.length}`}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <label
              className="flex items-center gap-1 px-1.5 py-0.5 text-[7px] uppercase tracking-[0.18em]"
              style={{
                borderRadius: 'var(--radius-sm, 2px)',
                border: '1px solid var(--acc-primary-dark, #6a3c10)',
                background: 'var(--card-bg, rgba(13,11,8,0.96))',
                color: 'var(--t2, #c0a878)',
              }}
            >
              <select
                value={filters.status}
                onChange={(e) => handleStatusChange(e.target.value as FilterOptions['status'])}
                className="bg-transparent text-[7px] uppercase tracking-[0.15em] focus:outline-none"
                style={{ color: 'var(--t2, #c0a878)' }}
                aria-label="Filtra residenti per status"
                data-testid="roster-filter-select"
              >
                <option value="all">Tutti</option>
                <option value="heroes">Eroi</option>
                <option value="injured">Feriti</option>
                <option value="available">Disponibili</option>
                <option value="exhausted">Esausti</option>
                <option value="away">Impegnati</option>
                <option value="dead">Caduti</option>
              </select>
            </label>

            {/*
             * TODO(roster-stat-sort): VISUAL MOCKUP ONLY — this control does not
             * sort the roster yet (`statSortMockup`/`statSortDirection` are inert
             * local state). Real implementation:
             *
             * 1. Stat list must stay DYNAMIC, not a hardcoded enum: this project's
             *    stats are inherited from other systems (e.g. the Balancer), not
             *    fixed. Keep sourcing options from `getFilterStatKeys()` /
             *    `getStatDisplayConfig()` in
             *    `@/ui/idleVillage/config/rosterFilterConfig` — already derived
             *    from `StatBlock`, so it tracks whatever the Balancer defines.
             * 2. Must COMBINE with the existing status filter (`filters.status`),
             *    not replace it: apply the stat sort to `filteredResidents`
             *    (defined above, ~line 241) — i.e. sort AFTER status filtering,
             *    never on raw `residents`.
             * 3. `sortedResidents` (~line 294) currently runs its OWN bespoke
             *    comparator (hero-group-first, then alphabetical) and does NOT
             *    go through `rosterSortConfig.ts`'s `sortResidents()` at all.
             *    Decide: extend that local comparator to also sort by the
             *    selected stat, or route through `rosterSortConfig.ts` (today
             *    `RosterSortMode` is a closed union of 4 modes — would need to
             *    become something like `{ stat: FilterStatKey; direction }` to
             *    support arbitrary Balancer stats instead of just hp/fatigue).
             * 4. Read each resident's value the SAME way `matchesCriterion` does
             *    in rosterFilterConfig.ts: `resident.statSnapshot?.[stat] ?? 0`,
             *    with a `Number.isFinite` guard before comparing.
             * 5. Open design question: does hero-group precedence still win over
             *    stat order, or does selecting a stat bypass hero-first grouping
             *    entirely? Not decided — surface it for a product call, don't
             *    assume when implementing.
             */}
            <label
              className="flex items-center gap-1 px-1.5 py-0.5 text-[7px] uppercase tracking-[0.18em]"
              style={{
                borderRadius: 'var(--radius-sm, 2px)',
                border: '1px solid var(--acc-primary-dark, #6a3c10)',
                background: 'var(--card-bg, rgba(13,11,8,0.96))',
                color: 'var(--t2, #c0a878)',
              }}
            >
              <select
                value={statSortMockup}
                onChange={(e) => setStatSortMockup(e.target.value)}
                className="bg-transparent text-[7px] uppercase tracking-[0.15em] focus:outline-none"
                style={{ color: 'var(--t2, #c0a878)' }}
                aria-label="Ordina residenti per statistica"
                data-testid="roster-stat-sort-select"
              >
                <option value="">Ordina per…</option>
                {getFilterStatKeys().map((stat) => (
                  <option key={stat} value={stat}>{getStatDisplayConfig(stat).label}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => setStatSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))}
              className={_controlButtonClassName}
              style={{
                borderRadius: 'var(--radius-sm, 2px)',
                border: '1px solid var(--acc-primary-dark, #6a3c10)',
                background: 'var(--card-bg, rgba(13,11,8,0.96))',
                color: 'var(--t2, #c0a878)',
              }}
              aria-label={statSortDirection === 'asc' ? 'Ordine crescente' : 'Ordine decrescente'}
              data-testid="roster-stat-sort-direction"
            >
              <ArrowUpDown className="h-2.5 w-2.5" />
            </button>

            {headerControls}
            <button
              type="button"
              onClick={() => {
                const newState = !isRosterCollapsed;
                setIsRosterCollapsed(newState);

                diagnostics.debug('roster_collapsed_toggled', {
                  isCollapsed: newState,
                  timestamp: Date.now(),
                  location: 'DragTestContainer',
                  payload: {
                    isCollapsed: newState,
                    filteredCount: filteredResidents.length,
                  },
                }, ['ui', 'toggle']);
              }}
              className={_controlButtonClassName}
              style={{
                borderRadius: 'var(--radius-sm, 2px)',
                border: '1px solid var(--acc-primary-dark, #6a3c10)',
                background: 'var(--card-bg, rgba(13,11,8,0.96))',
                color: 'var(--t2, #c0a878)',
              }}
              aria-label={isRosterCollapsed ? 'Mostra roster' : 'Nascondi roster'}
              aria-pressed={isRosterCollapsed}
            >
              {isRosterCollapsed ? <Eye className="h-2.5 w-2.5" /> : <EyeOff className="h-2.5 w-2.5" />}
            </button>
          </div>
        </div>

        {useWanderlustSkin && (
          <style>{`
            @keyframes firefly {
              0%, 100% {
                transform: translateY(0) scale(1);
                opacity: 0;
              }
              10% {
                opacity: 0.8;
              }
              50% {
                transform: translateY(-12px) scale(1.2);
                opacity: 0.4;
              }
              90% {
                opacity: 0.8;
              }
            }
            @keyframes border-pulse {
              0%, 100% {
                opacity: 0.5;
              }
              50% {
                opacity: 1;
              }
            }
          `}</style>
        )}

        {!isRosterCollapsed && (
          <div
            ref={listRef}
            className={listWrapperClassName}
            style={{
              maxHeight: isRosterCollapsed ? 0 : listMaxHeightPx,
              opacity: isRosterCollapsed ? 0 : 1,
              overflow: isRosterCollapsed ? 'hidden' : 'auto',
              transition: 'max-height 0.35s ease, opacity 0.35s ease',
            }}
            onScroll={virtualConfig.onScroll}
            data-resident-count={sortedResidents.length}
            data-virtualized={shouldVirtualize}
          >
            {filteredResidents.length === 0 ? (
              <div className="py-8 text-center text-sm italic text-slate-400">
                Nessun residente corrisponde ai filtri selezionati
              </div>
            ) : shouldVirtualize ? (
              // Virtualized rendering for large rosters
              <div style={{ height: virtualConfig.totalHeight, position: 'relative' }}>
                {visibleResidents.map((resident, index) => {
                  const actualIndex = virtualConfig.startIndex + index;
                  return renderVirtualizedResident(resident, actualIndex);
                })}
              </div>
            ) : (
              // Standard rendering for small rosters
              filteredResidents.map((resident) => renderResidentCard(resident))
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * CANONICAL VERSION NOTES:
 * 
 * This version of DragTestContainer is frozen and represents the canonical design
 * after post-freeze optimizations for minimal, compact roster display.
 * 
 * Key frozen characteristics:
 * - Streamlined DOM structure with minimal div nesting
 * - Inline header layout: flex-wrap with gap-2 spacing
 * - Positional window dragging with GripVertical handle aligned to the header label
 * - Handle has grab cursor states and does not interfere with PgCard drags
 * - PgCard drag-and-drop remains routed through ResidentRosterPanel and CustomDragOverlay
 * - Made all header elements inline with flex layout
 * - Reduced font sizes and spacing for compact display
 * - Streamlined DOM with fewer nested divs
 elements
 * - Optimized spacing: gap-2 between header elements
 * 
 * Header Implementation Details:
 * - Drag handle: GripVertical icon inline with "Roster" text (mousedown listeners only on the handle)
 * - Title section: "Roster" + filtered count rendered in uppercase micro-type
 * - Dropdown filter: Select con opzioni italiane ("Tutti", "Eroi", "Feriti", "Disponibili", ecc.) con label pill-shaped
 * - Control buttons: Eye toggle e collapse button compatti (rounded-full, border-white/15)
 * - Layout: flex-wrap assicura l'allineamento anche su schermi piccoli
 * 
 * Removed Elements (Post-Freeze):
 * - Quick filter buttons: "Tutti", "Eroi", "Feriti" come pulsanti separati (rimane solo il select)
 * - Extra div wrappers in header structure
 * - Larger font sizes and spacing
 * - Non-essential DOM nesting
 * 
 * Usage Pattern:
 * - Use layout="inline" for compact roster display
 * - Provide componentId="roster-component" (o simile) per abilitare il drag della finestra tramite handle
 * - Usa cardVariant="horizontal" per PG card compatte (PgCard canonical)
 * - I filtri (select + toggle) aggiornano automaticamente la lista
 * - PgCard drag events invocano onDragStateChange e visualizzano la preview circolare del CustomDragOverlay
 * - Virtualization si attiva per roster > 20 elementi per mantenere performance
 * 
 * @version 1.1.0 (CANONICAL - Post-Freeze Optimizations)
 * @component
 */

export default DragTestContainer;
