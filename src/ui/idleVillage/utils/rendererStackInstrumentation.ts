
/**
 * Renderer Stack Instrumentation System
 * 
 * Instruments the roster renderer stack to capture data at each level for
 * divergence analysis between /test and /minimal-gameplay pages.
 */

import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { PgCardProps } from '@/ui/idleVillage/components/PgCard';
import type { ResidentCompatibilityState } from '@/ui/idleVillage/components/ResidentRosterTypes';
import type { StatBlock } from '@/balancing/types';

export interface VillageRosterSectionData {
  component: 'VillageRosterSection';
  timestamp: number;
  page: 'test' | 'minimal-gameplay';
  inputResidents: ResidentState[];
  inputCount: number;
  /** Raw resident data before any processing */
  rawResidents: Array<{
    id: string;
    name: string;
    hp: number;
    maxHp: number;
    fatigue: number;
    stats: Partial<StatBlock>;
  }>;
}

export interface ResidentRosterPanelData {
  component: 'ResidentRosterPanel';
  timestamp: number;
  page: 'test' | 'minimal-gameplay';
  inputResidents: ResidentState[];
  inputCount: number;
  /** Data passed to DragTestContainer */
  passedToDragTestContainer: {
    residents: ResidentState[];
    count: number;
  };
}

export interface DragTestContainerData {
  component: 'DragTestContainer';
  timestamp: number;
  page: 'test' | 'minimal-gameplay';
  inputResidents: ResidentState[];
  inputCount: number;
  /** Data after filtering/sorting in DragTestContainer */
  processedResidents: Array<{
    id: string;
    name: string;
    hp: number;
    maxHp: number;
    fatigue: number;
    compatibilityState?: ResidentCompatibilityState;
    compatibilityLabel?: string;
    index: number;
  }>;
  /** Props passed to PgCard */
  pgCardProps: Array<{
    workerId: string;
    label: string;
    subtitle?: string;
    hp: number;
    fatigue: number;
    maxHp?: number;
    portraitUrl?: string;
    compatibilityState?: ResidentCompatibilityState;
    compatibilityLabel?: string;
    index: number;
  }>;
}

export interface PgCardData {
  component: 'PgCard';
  timestamp: number;
  page: 'test' | 'minimal-gameplay';
  renderIndex: number;
  /** Final props received by PgCard */
  finalProps: {
    workerId: string;
    label: string;
    subtitle?: string;
    hp: number;
    fatigue: number;
    maxHp?: number;
    portraitUrl?: string;
    compatibilityState?: ResidentCompatibilityState;
    compatibilityLabel?: string;
  };
  /** Computed values for display */
  displayValues: {
    displayName: string;
    displayedHp: number;
    displayedFatigue: number;
    portraitResolvedSource?: string;
    finalRenderOrder: number;
  };
}

export type RendererStackData = 
  | VillageRosterSectionData
  | ResidentRosterPanelData
  | DragTestContainerData
  | PgCardData;

export interface RendererStackExport {
  page: 'test' | 'minimal-gameplay';
  timestamp: number;
  stackData: RendererStackData[];
}

class RendererStackInstrumentation {
  private static instance: RendererStackInstrumentation;
  private data: RendererStackData[] = [];
  private page: 'test' | 'minimal-gameplay';

  private constructor() {
    // Detect page from URL
    this.page = window.location.pathname === '/test' ? 'test' : 'minimal-gameplay';
  }

  public static getInstance(): RendererStackInstrumentation {
    if (!RendererStackInstrumentation.instance) {
      RendererStackInstrumentation.instance = new RendererStackInstrumentation();
    }
    return RendererStackInstrumentation.instance;
  }

  public captureVillageRosterSection(residents: ResidentState[]): void {
    const data: VillageRosterSectionData = {
      component: 'VillageRosterSection',
      timestamp: Date.now(),
      page: this.page,
      inputResidents: residents,
      inputCount: residents.length,
      rawResidents: residents.map(r => ({
        id: r.id,
        name: r.displayName || r.id,
        hp: r.currentHp,
        maxHp: r.maxHp,
        fatigue: r.fatigue,
        stats: r.statSnapshot || {}
      }))
    };
    this.data.push(data);
  }

  public captureResidentRosterPanel(residents: ResidentState[]): void {
    const data: ResidentRosterPanelData = {
      component: 'ResidentRosterPanel',
      timestamp: Date.now(),
      page: this.page,
      inputResidents: residents,
      inputCount: residents.length,
      passedToDragTestContainer: {
        residents,
        count: residents.length
      }
    };
    this.data.push(data);
  }

  public captureDragTestContainer(
    inputResidents: ResidentState[],
    processedResidents: ResidentState[],
    pgCardProps: PgCardProps[]
  ): void {
    const data: DragTestContainerData = {
      component: 'DragTestContainer',
      timestamp: Date.now(),
      page: this.page,
      inputResidents,
      inputCount: inputResidents.length,
      processedResidents: processedResidents.map((r, index) => ({
        id: r.id,
        name: r.displayName || r.id,
        hp: r.currentHp,
        maxHp: r.maxHp,
        fatigue: r.fatigue,
        compatibilityState: undefined, // Will be filled by actual component
        compatibilityLabel: undefined,
        index
      })),
      pgCardProps: pgCardProps.map((props, index) => ({
        workerId: props.workerId,
        label: props.label,
        subtitle: props.subtitle,
        hp: props.hp,
        fatigue: props.fatigue,
        maxHp: props.maxHp,
        portraitUrl: props.portraitUrl,
        compatibilityState: props.compatibilityState,
        compatibilityLabel: props.compatibilityLabel,
        index
      }))
    };
    this.data.push(data);
  }

  public capturePgCard(
    renderIndex: number,
    props: PgCardProps,
    displayValues: {
      displayName: string;
      displayedHp: number;
      displayedFatigue: number;
      portraitResolvedSource?: string;
      finalRenderOrder: number;
    }
  ): void {
    const data: PgCardData = {
      component: 'PgCard',
      timestamp: Date.now(),
      page: this.page,
      renderIndex,
      finalProps: {
        workerId: props.workerId,
        label: props.label,
        subtitle: props.subtitle,
        hp: props.hp,
        fatigue: props.fatigue,
        maxHp: props.maxHp,
        portraitUrl: props.portraitUrl,
        compatibilityState: props.compatibilityState,
        compatibilityLabel: props.compatibilityLabel
      },
      displayValues
    };
    this.data.push(data);
  }

  public exportData(): RendererStackExport {
    return {
      page: this.page,
      timestamp: Date.now(),
      stackData: [...this.data]
    };
  }

  public clearData(): void {
    this.data = [];
  }

  public getPage(): 'test' | 'minimal-gameplay' {
    return this.page;
  }
}

// Export singleton instance
export const rendererStackInstrumentation = RendererStackInstrumentation.getInstance();

// Export utility function for manual data export
export const exportRendererStackData = (): string => {
  const data = rendererStackInstrumentation.exportData();
  return JSON.stringify(data, null, 2);
};

// Export utility to save data to window for manual extraction
export const exposeRendererStackData = (): void => {
  if (typeof window !== 'undefined') {
    const page = rendererStackInstrumentation.getPage();
    const data = rendererStackInstrumentation.exportData();
    
    // Expose page-specific globals as required by prompt
    if (page === 'test') {
      (window as any).__IV_TEST_RENDERER__ = data;
      console.log('🔍 Test renderer data exposed to window.__IV_TEST_RENDERER__');
    } else {
      (window as any).__IV_MINIMAL_RENDERER__ = data;
      console.log('🔍 Minimal renderer data exposed to window.__IV_MINIMAL_RENDERER__');
    }
    
    // Also keep the generic global for backward compatibility
    (window as any).__RENDERER_STACK_DATA__ = data;
  }
};
