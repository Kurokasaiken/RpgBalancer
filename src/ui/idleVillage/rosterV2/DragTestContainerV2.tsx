import { useEffect, useMemo, useRef, useState, useCallback, type CSSProperties, type ReactNode } from 'react';
import styles from '../components/DragTestContainer.module.css';
import { EngravedIcon } from '@/ui/idleVillage/components/gameFrame/engravedIcons';
import { getFilterStatKeys, getStatDisplayConfig, type FilterStatKey } from '@/ui/idleVillage/config/rosterFilterConfig';
import { getRosterSortModes, type RosterSortMode } from '@/ui/idleVillage/config/rosterSortConfig';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { formatResidentLabel } from '@/ui/idleVillage/residentName';
import PgCard, { type PgCardProps } from '@/ui/idleVillage/components/PgCard';
import WanderlustRosterCardV2 from '@/ui/idleVillage/rosterV2/WanderlustRosterCardV2';
import { HeroLevelDecor } from '@/ui/idleVillage/rosterV2/HeroLevelDecor';
import type { GetResidentCompatibility, ResidentCompatibilityState } from '../components/ResidentRosterTypes';
import type { DropValidationResult } from '@/ui/idleVillage/config/residentDropRules';
import { createSandboxDiagnostics } from '@/ui/idleVillage/utils/sandboxDiagnostics';
import { getCurrentDragConfig } from '@/ui/idleVillage/config/dragConfig';
import { rendererStackInstrumentation } from '@/ui/idleVillage/utils/rendererStackInstrumentation';
import { getResidentPortraitUrl } from '@/engine/game/idleVillage/residentVisualResolver';
import { useMatericSkin } from '@/ui/wanderlust-surface/MatericSkinContext';
import { MATERIC_SKIN_CONFIG } from '@/ui/wanderlust-surface/matericSkinConfig';
import { BezelMolding, WellBronzeBezel } from '@/ui/visualFidelityLab/plateVariants';
import { useTranslation } from 'react-i18next';
import { HudPlaque } from '@/ui/idleVillage/skins/primitives';

/**
 * DragTestContainerV2 - Resident Roster Container (CANONICAL VERSION)
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
 * - PgCard drag-and-drop remains routed through ResidentRosterPanelV2 and CustomDragOverlay
 * - Made all header elements inline with flex layout
 * - Reduced font sizes and spacing for compact display
 * - Streamlined DOM with fewer nested divs
 elements
 * - Optimized spacing: gap-2 between header elements
 * 
 * @component
 * @example
 * ```tsx
 * <DragTestContainerV2
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

/** HUD panel title: the shared `--skin-hud-title-*` scale (PLAN-058 T0.2). */
const HUD_TITLE_STYLE: CSSProperties = {
  fontSize: 'var(--skin-hud-title-size)',
  fontWeight: 'var(--skin-hud-title-weight)',
  letterSpacing: 'var(--skin-hud-title-tracking)',
};

/**
 * Props for DragTestContainerV2 component.
 * Provides a configurable resident roster with drag/drop capabilities.
 */
type DragFeedbackState = NonNullable<PgCardProps['dragFeedbackState']>;

export interface DragTestContainerV2Props {
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
  /** Adds a close (X) button to the header; the host decides how the panel comes back. */
  onClose?: () => void;
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
  /**
   * `compact`: one-line resident strips, tight padding, small header controls (see
   * `[data-roster-controls="compact"]` in skinScope.css), no grain or decorative
   * animations. Default keeps the frozen look.
   */
  density?: 'default' | 'compact';
}

type DragVisualState = {
  mode: 'idle' | 'dragging' | 'flight' | 'returning';
  residentId?: string;
};

/**
 * Main DragTestContainerV2 component.
 * Renders a filtered, virtualizable resident roster with drag/drop support.
 */
function DragTestContainerV2({
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
  onClose,
  useWanderlustSkin = false,
  density = 'default',
}: DragTestContainerV2Props) {
  const isCompact = density === 'compact';
  const { t } = useTranslation('idleVillage');
  // V2: the compact roster is a HUD plaque (same material as the other HUD pieces), not a bezel on its own fill.
  const hudSurface = useWanderlustSkin && isCompact;
  /** Row pitch used by virtualization; must match the rendered card height + gap. */
  const itemPitchPx = isCompact ? 36 : cardVariant === 'horizontal' ? 80 : 140;
  const isMateric = useMatericSkin();
  const [draggingResidentId, setDraggingResidentId] = useState<string | null>(null);
  const [dragStartTime, setDragStartTime] = useState<number | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    minHp: 0,
    maxFatigue: 100,
  });
  /**
   * Active header sort selection: '' keeps the upstream order (RosterSortIcon /
   * filterCriteria), a RosterSortMode applies a named sort, and `stat:<key>`
   * sorts by a dynamic statSnapshot stat combined with statSortDirection.
   */
  const [sortSelection, setSortSelection] = useState<'' | RosterSortMode | `stat:${FilterStatKey}`>('');
  const [statSortDirection, setStatSortDirection] = useState<'asc' | 'desc'>('desc');
  const [heroFlashIds, setHeroFlashIds] = useState<string[]>([]);
  const [recentlyDraggedResidentId, setRecentlyDraggedResidentId] = useState<string | null>(null);
  const [isRosterCollapsed, setIsRosterCollapsed] = useState(false);
  const isInlineLayout = layout === 'inline';
  const isGridLayout = layout === 'grid';
  const listMaxHeightPx = listMaxHeight ?? (isInlineLayout ? 184 : 400);

  // Initialize diagnostics logger
  const diagnostics = createSandboxDiagnostics('DragTestContainerV2', 'drag-test-container');

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
        return false;
      }
      if (resident.fatigue > maxFatigueThreshold) {
        return false;
      }

      // Apply user-defined filters from UI
      if (resident.currentHp < filters.minHp) {
        return false;
      }
      if (resident.fatigue > filters.maxFatigue) {
        return false;
      }

      return true;
    });

    return filtered;
  }, [residents, filters, getEffectiveStatus, dragConfig.thresholds]);

  const sortedResidents = useMemo(() => {
    const groupValue = (resident: ResidentState) => {
      if (resident.isHero) return 0;
      return isResidentBlocked(resident) ? 2 : 1;
    };

    // `stat:<key>` selections read the same field as `matchesCriterion` in
    // rosterFilterConfig.ts so the sort tracks whatever stats the Balancer defines.
    const statKey = sortSelection.startsWith('stat:')
      ? (sortSelection.slice('stat:'.length) as FilterStatKey)
      : null;
    const statValue = (resident: ResidentState) => {
      const value = statKey ? resident.statSnapshot?.[statKey] : undefined;
      return typeof value === 'number' && Number.isFinite(value) ? value : 0;
    };

    const compareByMode = (a: ResidentState, b: ResidentState, mode: RosterSortMode) => {
      switch (mode) {
        case 'name-desc':
          return formatResidentLabel(b).localeCompare(formatResidentLabel(a));
        case 'hp-desc':
          return b.currentHp - a.currentHp;
        case 'fatigue-asc':
          return a.fatigue - b.fatigue;
        case 'name-asc':
        default:
          return formatResidentLabel(a).localeCompare(formatResidentLabel(b));
      }
    };

    return [...filteredResidents].sort((a, b) => {
      const groupDiff = groupValue(a) - groupValue(b);
      if (groupDiff !== 0) return groupDiff;

      // No explicit header selection: keep the incoming order, which is what the
      // upstream sortMode (RosterSortIcon) already produced — the toggle stays live.
      if (sortSelection === '') return 0;

      if (statKey) {
        const diff = statValue(a) - statValue(b);
        if (diff !== 0) return statSortDirection === 'asc' ? diff : -diff;
      } else {
        const diff = compareByMode(a, b, sortSelection);
        if (diff !== 0) return diff;
      }

      // Deterministic tiebreak for explicit sorts.
      const nameCompare = formatResidentLabel(a).localeCompare(formatResidentLabel(b));
      if (nameCompare !== 0) return nameCompare;
      return a.id.localeCompare(b.id);
    });
  }, [filteredResidents, isResidentBlocked, sortSelection, statSortDirection]);

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

  // Instrument renderer stack at DragTestContainerV2 level
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
      location: 'DragTestContainerV2',
      payload: {
        shouldVirtualize,
        residentCount: sortedResidents.length,
        threshold: dragConfig.thresholds.virtualizationThreshold,
      },
    }, ['performance', 'virtualization']);
  }, [shouldVirtualize, sortedResidents.length, dragConfig.thresholds.virtualizationThreshold, diagnostics]);
  
  const virtualConfig = useVirtualization({
    itemCount: sortedResidents.length,
    itemHeight: itemPitchPx,
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
      location: 'DragTestContainerV2',
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
      location: 'DragTestContainerV2',
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
      location: 'DragTestContainerV2',
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
      // Block if currently dragging or recently dragged
      if (draggingResidentId === residentId || recentlyDraggedResidentId === residentId) {
        return;
      }

      // Also block if the resident is currently in 'away' status (should not be selectable)
      const resident = residents.find(r => r.id === residentId);
      if (resident?.status === 'away') {
        return;
      }

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
      location: 'DragTestContainerV2',
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
        data-resident-xp={resident.xp ?? 0}
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
        {/* PLAN-032 SP-5: the level-up decorative layer lives here, in the
         *  rosterV2 card layer — pgcardKit and both card renderers below stay
         *  untouched. The badge slot is always mounted; it draws only for a
         *  leveled hero (view-model gate). */}
        <HeroLevelDecor resident={resident} />
        {useWanderlustSkin ? (
          <WanderlustRosterCardV2
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
            xp={resident.xp}
            compact={isCompact}
            statusKind={
              !isCompact
                ? undefined
                : isLifted
                ? 'away'
                : isLocked
                ? 'assigned'
                : resident.status === 'dead'
                ? 'dead'
                : resident.isInjured || resident.status === 'injured'
                ? 'injured'
                : resident.status === 'exhausted'
                ? 'exhausted'
                : resident.status === 'away'
                ? 'away'
                : 'active'
            }
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
  }, [activeDragFeedback, lockedSet, getResidentCompatibility, isResidentInteractive, draggingResidentId, diagnostics, handleDragStateChange, handleResidentSelectSafe, describeStatus, lockedStatusLabel, filters, heroFlashIds, isResidentBlocked, cardVariant, recentlyDraggedResidentId, dragVisualState, useWanderlustSkin, isCompact]);

  const renderVirtualizedResident = useCallback((resident: ResidentState, actualIndex: number) => {
    const style: CSSProperties = {
      position: 'absolute',
      top: actualIndex * itemPitchPx,
      width: '100%',
    };

    return (
      <div key={resident.id} style={style}>
        {renderResidentCard(resident)}
      </div>
    );
  }, [renderResidentCard, itemPitchPx]);

  // HUD plaque: the plaque draws the frame, so the section must not add its own border, radius,
  // fill, shadow or `overflow: hidden` (the border painted grey over the bronze band, and the
  // overflow clipped the plaque's shadow).
  const wrapperClassName = hudSurface
    ? ['relative', isInlineLayout && 'p-(--skin-hud-plaque-clearance)', className].filter(Boolean).join(' ')
    : [
    'relative',
    isInlineLayout && 'rounded-2xl border border-white/10 bg-black/25 p-3 shadow-[0_15px_30px_rgba(0,0,0,0.4)]',
    isGridLayout && 'rounded-2xl border border-white/10 bg-black/25 p-4 shadow-[0_15px_30px_rgba(0,0,0,0.4)]',
    useWanderlustSkin && 'relative overflow-hidden rounded-[20px] bg-[linear-gradient(180deg,rgba(3,2,2,0.95)_0%,rgba(6,4,3,0.98)_100%)] shadow-[inset_0_1px_0_rgba(216,177,62,0.08),0_4px_20px_rgba(0,0,0,0.6)]',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const listWrapperClassName = [
    isCompact ? 'space-y-(--skin-hud-row-gap) overflow-y-auto scroll-smooth' : 'space-y-2 overflow-y-auto scroll-smooth',
    styles.scrollArea,
    isInlineLayout ? 'pr-0' : 'pr-1',
    listClassName,
  ]
    .filter(Boolean)
    .join(' ');

  const _headerTextClassName = useWanderlustSkin && isCompact
    ? 'flex items-center gap-(--skin-hud-stack-gap) text-[var(--skin-title-color)]'
    : useWanderlustSkin
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
      location: 'DragTestContainerV2',
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
  // While the window is dragged its position is written straight to the element and
  // committed to state on release: re-rendering the whole roster on every pointer move
  // made the window trail the cursor (and blank out) on slower WebViews.
  const livePositionRef = useRef({ x: 0, y: 0 });
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
      livePositionRef.current = { ...position };
      activePointerIdRef.current = pointerId;
      setIsDragging(true);
    },
    [position],
  );

  const _handleClickInternal = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    // This function is not used in DragTestContainerV2; click handling is done in PgCard
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
    const moveLive = (x: number, y: number) => {
      livePositionRef.current = { x, y };
      const el = containerRef.current;
      if (el) {
        el.style.transform = `translate(${x}px, ${y}px)`;
        el.dataset.rosterPositionX = String(x);
        el.dataset.rosterPositionY = String(y);
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!isDragging || activePointerIdRef.current !== event.pointerId) {
        return;
      }
      moveLive(event.clientX - dragStartRef.current.x, event.clientY - dragStartRef.current.y);
    };

    const handlePointerEnd = (event: PointerEvent) => {
      if (activePointerIdRef.current !== event.pointerId) {
        return;
      }
      activePointerIdRef.current = null;
      setPosition({ ...livePositionRef.current });
      setIsDragging(false);
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDragging || activePointerIdRef.current !== FALLBACK_POINTER_ID) {
        return;
      }
      moveLive(event.clientX - dragStartRef.current.x, event.clientY - dragStartRef.current.y);
    };

    const handleMouseUp = () => {
      if (activePointerIdRef.current !== FALLBACK_POINTER_ID) {
        return;
      }
      activePointerIdRef.current = null;
      setPosition({ ...livePositionRef.current });
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
        transform: `translate(${(isDragging ? livePositionRef.current : position).x}px, ${(isDragging ? livePositionRef.current : position).y}px)`,
        cursor: isDragging ? 'grabbing' : componentId ? 'grab' : 'default',
        zIndex: isDragging ? 1000 : 1,
        background: hudSurface ? 'transparent' : 'var(--skin-surface-bg)',
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
      aria-label={isDayPhase ? t('gameFrame.roster.ariaLabel') : t('gameFrame.roster.ariaLabelNight')}
      aria-live="polite"
      aria-atomic="true"
      data-accessible-counters="true"
      data-accessible-states="true"
    >
      {isMateric && !isCompact && (
        <div
          className="pointer-events-none absolute inset-0 rounded-[20px]"
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
      {useWanderlustSkin && !isCompact && (
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
      {useWanderlustSkin && !isCompact && (
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
      {hudSurface ? (
        <HudPlaque shape="panel" aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {null}
        </HudPlaque>
      ) : (
        useWanderlustSkin && <WellBronzeBezel band={2} rx={19} flush />
      )}
      <div className={`relative z-10 ${isCompact ? (isRosterCollapsed ? 'px-(--skin-hud-panel-padding) py-1.5' : 'space-y-(--skin-hud-stack-gap) p-(--skin-hud-panel-padding)') : `space-y-4 ${useWanderlustSkin ? 'p-6' : 'p-4'}`}`.trim()}>
        {useWanderlustSkin && !isCompact && (
          <div 
            className="block h-px mx-2 mb-5"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(223,184,87,0.32) 20%, rgba(223,184,87,0.32) 80%, transparent)',
            }}
          />
        )}
        <div
          className={`${isCompact ? 'flex flex-nowrap items-center justify-between gap-(--skin-hud-stack-gap)' : 'flex flex-wrap items-center justify-between gap-2'} ${componentId ? 'cursor-grab active:cursor-grabbing' : ''}`}
          onPointerDown={(event) => {
            if ((event.target as HTMLElement).closest('button, select, input, label, a')) return;
            handlePointerDown(event);
          }}
          onMouseDown={(event) => {
            if ((event.target as HTMLElement).closest('button, select, input, label, a')) return;
            handleMouseDown(event);
          }}
          onDoubleClick={(event) => {
            if ((event.target as HTMLElement).closest('button, select, input, label, a')) return;
            livePositionRef.current = { x: 0, y: 0 };
            setPosition({ x: 0, y: 0 });
          }}
          title={componentId ? t('gameFrame.panel.dragHint') : undefined}
          style={{ touchAction: 'none' }}
          data-testid="roster-drag-handle"
          data-roster-handle-state={isDragging ? 'dragging' : 'idle'}
        >
          <div className={_headerTextClassName} style={useWanderlustSkin && isCompact ? HUD_TITLE_STYLE : undefined}>
            <span style={useWanderlustSkin ? { fontFamily: 'var(--wl-font-display, "Cinzel", "Trajan Pro", serif)' } : {}}>{t('gameFrame.roster.title')}</span>
            <span 
              className={useWanderlustSkin ? 'text-[var(--skin-title-color)]' : 'text-[var(--skin-text-primary)]'}
              aria-label={`Filtered residents: ${sortedResidents.length} of ${residents.length}`}
              data-testid="resident-count"
            >
              {`${sortedResidents.length}/${residents.length}`}
            </span>
          </div>
          <div className={isCompact ? 'flex min-w-0 items-center gap-(--skin-hud-control-gap)' : 'flex items-center gap-1'} data-hud-controls={isCompact ? '' : undefined} data-collapsed={isCompact && isRosterCollapsed ? '' : undefined}>
            <label>
              <EngravedIcon id="cmd-filter" className="h-3 w-3 shrink-0" />
              <select
                value={filters.status}
                onChange={(e) => handleStatusChange(e.target.value as FilterOptions['status'])}
                aria-label={t('gameFrame.roster.filter.ariaLabel')}
                data-testid="roster-filter-select"
              >
                <option value="all">{t('gameFrame.roster.filter.all')}</option>
                <option value="heroes">{t('gameFrame.roster.filter.heroes')}</option>
                <option value="injured">{t('gameFrame.roster.filter.injured')}</option>
                <option value="available">{t('gameFrame.roster.filter.available')}</option>
                <option value="exhausted">{t('gameFrame.roster.filter.exhausted')}</option>
                <option value="away">{t('gameFrame.roster.filter.away')}</option>
                <option value="dead">{t('gameFrame.roster.filter.dead')}</option>
              </select>
            </label>

            {/* Ordering control: restores the V1 surface — the four rosterSortConfig
                modes plus dynamic statSnapshot stats, applied after status filtering
                and inside the hero/active/blocked groups. */}
            <label>
              <EngravedIcon id="cmd-menu" className="h-3 w-3 shrink-0" />
              <select
                value={sortSelection}
                onChange={(e) => {
                  const value = e.target.value as typeof sortSelection;
                  setSortSelection(value);
                  diagnostics.info('sort_changed', {
                    sortSelection: value,
                    timestamp: Date.now(),
                    location: 'DragTestContainerV2',
                    payload: { sortSelection: value },
                  }, ['filter', 'change']);
                }}
                aria-label={t('gameFrame.roster.sort.ariaLabel')}
                data-testid="roster-stat-sort-select"
              >
                <option value="">{t('gameFrame.roster.sort.placeholder')}</option>
                {getRosterSortModes().map((mode) => (
                  <option key={mode.mode} value={mode.mode}>{t(mode.labelKey, mode.label)}</option>
                ))}
                {getFilterStatKeys().map((stat) => (
                  <option key={stat} value={`stat:${stat}`}>{getStatDisplayConfig(stat).label}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => setStatSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))}
              disabled={!sortSelection.startsWith('stat:')}
              className={_controlButtonClassName}
              aria-label={statSortDirection === 'asc' ? t('gameFrame.roster.sort.asc') : t('gameFrame.roster.sort.desc')}
              data-testid="roster-stat-sort-direction"
            >
              <EngravedIcon id="cmd-sort" className="h-3.5 w-3.5" />
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
                  location: 'DragTestContainerV2',
                  payload: {
                    isCollapsed: newState,
                    filteredCount: filteredResidents.length,
                  },
                }, ['ui', 'toggle']);
              }}
              className={_controlButtonClassName}
              aria-label={isRosterCollapsed ? t('gameFrame.roster.show') : t('gameFrame.roster.hide')}
              aria-pressed={isRosterCollapsed}
              data-keep=""
            >
              <EngravedIcon id={isRosterCollapsed ? 'cmd-eye' : 'cmd-eye-off'} className="h-3.5 w-3.5" />
            </button>
            {onClose && (
              <button type="button" onClick={onClose} aria-label={t('gameFrame.panels.close')} title={t('gameFrame.panels.close')} data-keep="">
                <EngravedIcon id="cmd-close" className="h-3.5 w-3.5" />
              </button>
            )}
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
              sortedResidents.map((resident) => renderResidentCard(resident))
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
 * This version of DragTestContainerV2 is frozen and represents the canonical design
 * after post-freeze optimizations for minimal, compact roster display.
 * 
 * Key frozen characteristics:
 * - Streamlined DOM structure with minimal div nesting
 * - Inline header layout: flex-wrap with gap-2 spacing
 * - Positional window dragging with GripVertical handle aligned to the header label
 * - Handle has grab cursor states and does not interfere with PgCard drags
 * - PgCard drag-and-drop remains routed through ResidentRosterPanelV2 and CustomDragOverlay
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

export default DragTestContainerV2;
