/**
 * Quest Decision Heatmap Engine - NP-022
 * 
 * Spatial heatmap engine with canvas/SVG rendering for quest decisions.
 * Provides data processing, visualization, and interaction capabilities.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

import { createSandboxDiagnostics } from '../utils/sandboxDiagnostics';
import {
  type QuestDecisionHeatmapConfig,
  type QuestDecisionData,
  type HeatmapCell,
  type QuestCoordinates,
  type QuestDecisionType,
  type QuestPriority,
  type QuestCategory,
  DEFAULT_QUEST_DECISION_HEATMAP_CONFIG,
  calculateDistance,
  calculateIntensity,
  getDominantDecisionType,
  getDominantCategory,
  calculateSuccessRate,
  getDecisionTypeColor,
  validateQuestDecisionData,
  aggregateDecisionsByTime,
} from '../config/questDecisionHeatmapConfig';

const diagnostics = createSandboxDiagnostics('QuestDecisionHeatmapEngine', 'engine');

/**
 * Heatmap engine events
 */
export interface HeatmapEngineEvents {
  /** Fired when data is updated */
  'data-updated': { data: QuestDecisionData[]; cells: HeatmapCell[] };
  /** Fired when rendering starts */
  'render-start': { mode: 'canvas' | 'svg' | 'webgl' };
  /** Fired when rendering completes */
  'render-complete': { mode: 'canvas' | 'svg' | 'webgl'; duration: number };
  /** Fired when cell is clicked */
  'cell-click': { cell: HeatmapCell; coordinates: { x: number; y: number } };
  /** Fired when cell is hovered */
  'cell-hover': { cell: HeatmapCell | null; coordinates: { x: number; y: number } };
  /** Fired when zoom level changes */
  'zoom-changed': { level: number; center: { x: number; y: number } };
  /** Fired when pan position changes */
  'pan-changed': { position: { x: number; y: number } };
  /** Fired when filter is applied */
  'filter-applied': { filters: any; filteredCount: number };
  /** Fired when error occurs */
  'error': { error: Error; context: string };
}

/**
 * Rendering context interface
 */
export interface RenderingContext {
  canvas?: HTMLCanvasElement;
  svg?: SVGSVGElement;
  width: number;
  height: number;
  devicePixelRatio: number;
}

/**
 * Viewport state
 */
export interface ViewportState {
  x: number;
  y: number;
  zoom: number;
  width: number;
  height: number;
}

/**
 * Selection state
 */
export interface SelectionState {
  cells: HeatmapCell[];
  decisions: QuestDecisionData[];
  mode: 'single' | 'multiple' | 'area';
  active: boolean;
}

/**
 * Quest Decision Heatmap Engine
 */
export class QuestDecisionHeatmapEngine {
  private config: QuestDecisionHeatmapConfig;
  private data: QuestDecisionData[] = [];
  private cells: HeatmapCell[] = [];
  private filteredData: QuestDecisionData[] = [];
  private filteredCells: HeatmapCell[] = [];
  private viewport: ViewportState;
  private selection: SelectionState;
  private renderingContext: RenderingContext | null = null;
  private eventListeners: Map<keyof HeatmapEngineEvents, Array<(data: any) => void>> = new Map();
  private animationFrame: number | null = null;
  private renderStartTime: number = 0;
  private bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  } = { minX: 0, minY: 0, maxX: 100, maxY: 100 };

  constructor(config?: Partial<QuestDecisionHeatmapConfig>) {
    this.config = { ...DEFAULT_QUEST_DECISION_HEATMAP_CONFIG, ...config };
    
    this.viewport = {
      x: 0,
      y: 0,
      zoom: 1,
      width: this.config.layout.width,
      height: this.config.layout.height,
    };
    
    this.selection = {
      cells: [],
      decisions: [],
      mode: 'multiple',
      active: false,
    };
    
    this.initializeEventListeners();
  }

  /**
   * Initialize event listeners
   */
  private initializeEventListeners(): void {
    const events: (keyof HeatmapEngineEvents)[] = [
      'data-updated',
      'render-start',
      'render-complete',
      'cell-click',
      'cell-hover',
      'zoom-changed',
      'pan-changed',
      'filter-applied',
      'error',
    ];
    
    events.forEach(event => {
      this.eventListeners.set(event, []);
    });
  }

  /**
   * Add event listener
   */
  public addEventListener<K extends keyof HeatmapEngineEvents>(
    event: K,
    listener: (data: HeatmapEngineEvents[K]) => void
  ): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.push(listener);
    this.eventListeners.set(event, listeners);
  }

  /**
   * Remove event listener
   */
  public removeEventListener<K extends keyof HeatmapEngineEvents>(
    event: K,
    listener: (data: HeatmapEngineEvents[K]) => void
  ): void {
    const listeners = this.eventListeners.get(event) || [];
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
      this.eventListeners.set(event, listeners);
    }
  }

  /**
   * Emit event to listeners
   */
  private emit<K extends keyof HeatmapEngineEvents>(event: K, data: HeatmapEngineEvents[K]): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        diagnostics.error('Error in event listener', { event, error });
      }
    });
  }

  /**
   * Set quest decision data
   */
  public setData(data: QuestDecisionData[]): void {
    // Validate data
    const validationResults = data.map(d => validateQuestDecisionData(d));
    const invalidData = validationResults.filter(r => !r.valid);
    
    if (invalidData.length > 0) {
      diagnostics.warn('Invalid quest decision data detected', {
        count: invalidData.length,
        errors: invalidData.flatMap(r => r.errors),
      });
    }

    // Filter valid data
    this.data = data.filter((_, index) => validationResults[index].valid);
    
    // Calculate bounds
    this.calculateBounds();
    
    // Apply aggregation if configured
    if (this.config.data.aggregation !== 'none') {
      this.data = aggregateDecisionsByTime(this.data, this.config.data.aggregation);
    }
    
    // Generate heatmap cells
    this.generateCells();
    
    // Apply current filters
    this.applyFilters();
    
    // Emit data updated event
    this.emit('data-updated', { data: this.data, cells: this.cells });
  }

  /**
   * Calculate data bounds
   */
  private calculateBounds(): void {
    if (this.data.length === 0) {
      this.bounds = { minX: 0, minY: 0, maxX: 100, maxY: 100 };
      return;
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    this.data.forEach(decision => {
      const { x, y } = decision.coordinates;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    });
    
    // Add padding
    const padding = 10;
    this.bounds = {
      minX: minX - padding,
      minY: minY - padding,
      maxX: maxX + padding,
      maxY: maxY + padding,
    };
  }

  /**
   * Generate heatmap cells from data
   */
  private generateCells(): void {
    const { rendering } = this.config.visualization;
    const cellSize = rendering.resolution * 10; // Base cell size
    
    this.cells = [];
    
    // Create grid based on bounds and resolution
    const cols = Math.ceil((this.bounds.maxX - this.bounds.minX) / cellSize);
    const rows = Math.ceil((this.bounds.maxY - this.bounds.minY) / cellSize);
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = this.bounds.minX + col * cellSize;
        const y = this.bounds.minY + row * cellSize;
        
        // Find decisions within this cell
        const cellDecisions = this.data.filter(decision => {
          const dx = Math.abs(decision.coordinates.x - (x + cellSize / 2));
          const dy = Math.abs(decision.coordinates.y - (y + cellSize / 2));
          return dx <= cellSize / 2 && dy <= cellSize / 2;
        });
        
        if (cellDecisions.length > 0) {
          const cell: HeatmapCell = {
            x,
            y,
            decisions: cellDecisions,
            intensity: calculateIntensity(cellDecisions),
            dominantDecision: getDominantDecisionType(cellDecisions),
            dominantCategory: getDominantCategory(cellDecisions),
            averagePriority: cellDecisions.reduce((sum, d) => 
              sum + this.getPriorityNumeric(d.priority), 0) / cellDecisions.length,
            successRate: calculateSuccessRate(cellDecisions),
            totalDecisions: cellDecisions.length,
            region: cellDecisions[0]?.coordinates.region,
            zone: cellDecisions[0]?.coordinates.zone,
          };
          
          this.cells.push(cell);
        }
      }
    }
    
    diagnostics.info('Generated heatmap cells', {
      totalCells: this.cells.length,
      dataPoints: this.data.length,
      bounds: this.bounds,
    });
  }

  /**
   * Convert priority enum to numeric value
   */
  private getPriorityNumeric(priority: QuestPriority): number {
    switch (priority) {
      case QuestPriority.CRITICAL: return 5;
      case QuestPriority.HIGH: return 4;
      case QuestPriority.MEDIUM: return 3;
      case QuestPriority.LOW: return 2;
      case QuestPriority.TRIVIAL: return 1;
      default: return 1;
    }
  }

  /**
   * Apply filters to data and cells
   */
  public applyFilters(filters?: Partial<typeof this.config.filter.filters>): void {
    const filterConfig = filters || this.config.filter.filters;
    
    this.filteredData = this.data.filter(decision => {
      // Decision type filter
      if (filterConfig.decisionTypes.length > 0 && 
          !filterConfig.decisionTypes.includes(decision.decisionType)) {
        return false;
      }
      
      // Priority filter
      if (filterConfig.priorities.length > 0 && 
          !filterConfig.priorities.includes(decision.priority)) {
        return false;
      }
      
      // Category filter
      if (filterConfig.categories.length > 0 && 
          !filterConfig.categories.includes(decision.category)) {
        return false;
      }
      
      // Outcome filter
      if (filterConfig.outcomes && filterConfig.outcomes.length > 0 && 
          decision.outcome && !filterConfig.outcomes.includes(decision.outcome)) {
        return false;
      }
      
      // Time range filter
      if (filterConfig.timeRange) {
        if (decision.timestamp < filterConfig.timeRange.start || 
            decision.timestamp > filterConfig.timeRange.end) {
          return false;
        }
      }
      
      // Region filter
      if (filterConfig.regions && filterConfig.regions.length > 0) {
        const region = decision.coordinates.region;
        if (!region || !filterConfig.regions.includes(region)) {
          return false;
        }
      }
      
      // Zone filter
      if (filterConfig.zones && filterConfig.zones.length > 0) {
        const zone = decision.coordinates.zone;
        if (!zone || !filterConfig.zones.includes(zone)) {
          return false;
        }
      }
      
      // Decision maker filter
      if (filterConfig.decisionMakers && filterConfig.decisionMakers.length > 0) {
        const maker = decision.decisionMaker;
        if (!maker || !filterConfig.decisionMakers.includes(maker)) {
          return false;
        }
      }
      
      return true;
    });
    
    // Regenerate cells from filtered data
    this.generateFilteredCells();
    
    // Emit filter applied event
    this.emit('filter-applied', {
      filters: filterConfig,
      filteredCount: this.filteredData.length,
    });
  }

  /**
   * Generate cells from filtered data
   */
  private generateFilteredCells(): void {
    const { rendering } = this.config.visualization;
    const cellSize = rendering.resolution * 10;
    
    this.filteredCells = [];
    
    // Create grid based on bounds and resolution
    const cols = Math.ceil((this.bounds.maxX - this.bounds.minX) / cellSize);
    const rows = Math.ceil((this.bounds.maxY - this.bounds.minY) / cellSize);
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = this.bounds.minX + col * cellSize;
        const y = this.bounds.minY + row * cellSize;
        
        // Find decisions within this cell
        const cellDecisions = this.filteredData.filter(decision => {
          const dx = Math.abs(decision.coordinates.x - (x + cellSize / 2));
          const dy = Math.abs(decision.coordinates.y - (y + cellSize / 2));
          return dx <= cellSize / 2 && dy <= cellSize / 2;
        });
        
        if (cellDecisions.length > 0) {
          const cell: HeatmapCell = {
            x,
            y,
            decisions: cellDecisions,
            intensity: calculateIntensity(cellDecisions),
            dominantDecision: getDominantDecisionType(cellDecisions),
            dominantCategory: getDominantCategory(cellDecisions),
            averagePriority: cellDecisions.reduce((sum, d) => 
              sum + this.getPriorityNumeric(d.priority), 0) / cellDecisions.length,
            successRate: calculateSuccessRate(cellDecisions),
            totalDecisions: cellDecisions.length,
            region: cellDecisions[0]?.coordinates.region,
            zone: cellDecisions[0]?.coordinates.zone,
          };
          
          this.filteredCells.push(cell);
        }
      }
    }
  }

  /**
   * Initialize rendering context
   */
  public initializeRenderingContext(element: HTMLCanvasElement | SVGSVGElement): void {
    const isCanvas = element instanceof HTMLCanvasElement;
    
    this.renderingContext = {
      canvas: isCanvas ? element as HTMLCanvasElement : undefined,
      svg: !isCanvas ? element as SVGSVGElement : undefined,
      width: this.config.layout.width,
      height: this.config.layout.height,
      devicePixelRatio: window.devicePixelRatio || 1,
    };
    
    // Setup canvas if needed
    if (isCanvas && this.renderingContext.canvas) {
      const canvas = this.renderingContext.canvas;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Set canvas size accounting for device pixel ratio
        canvas.width = this.config.layout.width * this.renderingContext.devicePixelRatio;
        canvas.height = this.config.layout.height * this.renderingContext.devicePixelRatio;
        canvas.style.width = `${this.config.layout.width}px`;
        canvas.style.height = `${this.config.layout.height}px`;
        
        // Scale context for device pixel ratio
        ctx.scale(this.renderingContext.devicePixelRatio, this.renderingContext.devicePixelRatio);
      }
    }
    
    // Setup SVG if needed
    if (!isCanvas && this.renderingContext.svg) {
      const svg = this.renderingContext.svg;
      svg.setAttribute('width', this.config.layout.width.toString());
      svg.setAttribute('height', this.config.layout.height.toString());
      svg.setAttribute('viewBox', `0 0 ${this.config.layout.width} ${this.config.layout.height}`);
    }
  }

  /**
   * Render heatmap
   */
  public render(): void {
    if (!this.renderingContext) {
      const error = new Error('Rendering context not initialized');
      this.emit('error', { error, context: 'render' });
      return;
    }

    this.renderStartTime = performance.now();
    const { rendering } = this.config.visualization;
    
    // Emit render start event
    this.emit('render-start', { mode: rendering.mode });
    
    // Clear previous animation frame
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    // Render based on mode
    switch (rendering.mode) {
      case 'canvas':
        this.renderCanvas();
        break;
      case 'svg':
        this.renderSVG();
        break;
      case 'webgl':
        this.renderWebGL();
        break;
      default:
        this.renderCanvas();
    }
  }

  /**
   * Render using Canvas API
   */
  private renderCanvas(): void {
    if (!this.renderingContext?.canvas) return;
    
    const canvas = this.renderingContext.canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, this.config.layout.width, this.config.layout.height);
    
    // Apply viewport transformation
    ctx.save();
    ctx.translate(this.viewport.x, this.viewport.y);
    ctx.scale(this.viewport.zoom, this.viewport.zoom);
    
    // Render cells
    const cells = this.filteredCells.length > 0 ? this.filteredCells : this.cells;
    cells.forEach(cell => {
      this.renderCanvasCell(ctx, cell);
    });
    
    // Render selection if active
    if (this.selection.active) {
      this.renderCanvasSelection(ctx);
    }
    
    ctx.restore();
    
    // Emit render complete event
    const duration = performance.now() - this.renderStartTime;
    this.emit('render-complete', { mode: 'canvas', duration });
  }

  /**
   * Render individual cell on canvas
   */
  private renderCanvasCell(ctx: CanvasRenderingContext2D, cell: HeatmapCell): void {
    const { rendering } = this.config.visualization;
    const cellSize = rendering.resolution * 10;
    
    // Convert world coordinates to screen coordinates
    const screenX = cell.x - this.bounds.minX;
    const screenY = cell.y - this.bounds.minY;
    
    // Get color based on dominant decision
    const color = getDecisionTypeColor(cell.dominantDecision, this.config.visualization.colorScheme);
    
    // Apply intensity to opacity
    const opacity = this.config.visualization.colorScheme.opacity * cell.intensity;
    
    // Draw cell
    ctx.globalAlpha = opacity;
    ctx.fillStyle = color;
    
    if (rendering.smoothing) {
      // Draw with rounded corners for smoothing
      const radius = 2;
      ctx.beginPath();
      ctx.roundRect(screenX, screenY, cellSize, cellSize, radius);
      ctx.fill();
    } else {
      // Draw as rectangle
      ctx.fillRect(screenX, screenY, cellSize, cellSize);
    }
    
    ctx.globalAlpha = 1;
  }

  /**
   * Render selection on canvas
   */
  private renderCanvasSelection(ctx: CanvasRenderingContext2D): void {
    const { rendering } = this.config.visualization;
    const cellSize = rendering.resolution * 10;
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2 / this.viewport.zoom;
    ctx.setLineDash([5, 5]);
    
    this.selection.cells.forEach(cell => {
      const screenX = cell.x - this.bounds.minX;
      const screenY = cell.y - this.bounds.minY;
      
      ctx.strokeRect(screenX, screenY, cellSize, cellSize);
    });
    
    ctx.setLineDash([]);
  }

  /**
   * Render using SVG
   */
  private renderSVG(): void {
    if (!this.renderingContext?.svg) return;
    
    const svg = this.renderingContext.svg;
    
    // Clear existing content
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }
    
    // Create main group for viewport transformation
    const mainGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    mainGroup.setAttribute('transform', 
      `translate(${this.viewport.x}, ${this.viewport.y}) scale(${this.viewport.zoom})`
    );
    
    // Render cells
    const cells = this.filteredCells.length > 0 ? this.filteredCells : this.cells;
    cells.forEach(cell => {
      this.renderSVGCell(mainGroup, cell);
    });
    
    // Render selection if active
    if (this.selection.active) {
      this.renderSVGSelection(mainGroup);
    }
    
    svg.appendChild(mainGroup);
    
    // Emit render complete event
    const duration = performance.now() - this.renderStartTime;
    this.emit('render-complete', { mode: 'svg', duration });
  }

  /**
   * Render individual cell in SVG
   */
  private renderSVGCell(parent: SVGGElement, cell: HeatmapCell): void {
    const { rendering } = this.config.visualization;
    const cellSize = rendering.resolution * 10;
    
    // Convert world coordinates to screen coordinates
    const screenX = cell.x - this.bounds.minX;
    const screenY = cell.y - this.bounds.minY;
    
    // Get color based on dominant decision
    const color = getDecisionTypeColor(cell.dominantDecision, this.config.visualization.colorScheme);
    
    // Apply intensity to opacity
    const opacity = this.config.visualization.colorScheme.opacity * cell.intensity;
    
    // Create rectangle element
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', screenX.toString());
    rect.setAttribute('y', screenY.toString());
    rect.setAttribute('width', cellSize.toString());
    rect.setAttribute('height', cellSize.toString());
    rect.setAttribute('fill', color);
    rect.setAttribute('fill-opacity', opacity.toString());
    rect.setAttribute('stroke', 'none');
    
    // Add hover effect
    rect.addEventListener('mouseenter', () => {
      rect.setAttribute('stroke', '#ffffff');
      rect.setAttribute('stroke-width', '2');
      rect.setAttribute('stroke-opacity', '0.5');
    });
    
    rect.addEventListener('mouseleave', () => {
      rect.setAttribute('stroke', 'none');
    });
    
    // Add click handler
    rect.addEventListener('click', () => {
      this.handleCellClick(cell, { x: screenX, y: screenY });
    });
    
    parent.appendChild(rect);
  }

  /**
   * Render selection in SVG
   */
  private renderSVGSelection(parent: SVGGElement): void {
    const { rendering } = this.config.visualization;
    const cellSize = rendering.resolution * 10;
    
    this.selection.cells.forEach(cell => {
      const screenX = cell.x - this.bounds.minX;
      const screenY = cell.y - this.bounds.minY;
      
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', screenX.toString());
      rect.setAttribute('y', screenY.toString());
      rect.setAttribute('width', cellSize.toString());
      rect.setAttribute('height', cellSize.toString());
      rect.setAttribute('fill', 'none');
      rect.setAttribute('stroke', '#ffffff');
      rect.setAttribute('stroke-width', '2');
      rect.setAttribute('stroke-dasharray', '5,5');
      
      parent.appendChild(rect);
    });
  }

  /**
   * Render using WebGL (placeholder)
   */
  private renderWebGL(): void {
    // WebGL rendering would be implemented here
    // For now, fall back to canvas
    this.renderCanvas();
  }

  /**
   * Handle cell click
   */
  private handleCellClick(cell: HeatmapCell, coordinates: { x: number; y: number }): void {
    const { interaction } = this.config.visualization;
    
    if (!interaction.selection.enabled) return;
    
    switch (interaction.selection.mode) {
      case 'single':
        this.selection.cells = [cell];
        this.selection.decisions = cell.decisions;
        break;
      case 'multiple':
        const existingIndex = this.selection.cells.findIndex(c => 
          c.x === cell.x && c.y === cell.y
        );
        
        if (existingIndex >= 0) {
          this.selection.cells.splice(existingIndex, 1);
          this.selection.decisions = this.selection.cells.flatMap(c => c.decisions);
        } else {
          this.selection.cells.push(cell);
          this.selection.decisions.push(...cell.decisions);
        }
        break;
      case 'area':
        // Area selection would be handled separately
        break;
    }
    
    this.selection.active = true;
    
    // Re-render to show selection
    this.render();
    
    // Emit click event
    this.emit('cell-click', { cell, coordinates });
  }

  /**
   * Handle mouse move for hover effects
   */
  public handleMouseMove(x: number, y: number): void {
    // Convert screen coordinates to world coordinates
    const worldX = (x - this.viewport.x) / this.viewport.zoom + this.bounds.minX;
    const worldY = (y - this.viewport.y) / this.viewport.zoom + this.bounds.minY;
    
    // Find cell at world coordinates
    const cells = this.filteredCells.length > 0 ? this.filteredCells : this.cells;
    const cell = cells.find(c => {
      const { rendering } = this.config.visualization;
      const cellSize = rendering.resolution * 10;
      
      return worldX >= c.x && worldX < c.x + cellSize &&
             worldY >= c.y && worldY < c.y + cellSize;
    });
    
    // Emit hover event
    this.emit('cell-hover', { cell: cell || null, coordinates: { x: worldX, y: worldY } });
  }

  /**
   * Handle zoom
   */
  public handleZoom(delta: number, centerX: number, centerY: number): void {
    const { zoom } = this.config.visualization.interaction;
    
    if (!zoom.enabled) return;
    
    const newZoom = Math.max(zoom.min, Math.min(zoom.max, this.viewport.zoom * (1 + delta)));
    
    if (newZoom !== this.viewport.zoom) {
      // Adjust viewport to zoom towards center point
      const worldCenterX = (centerX - this.viewport.x) / this.viewport.zoom + this.bounds.minX;
      const worldCenterY = (centerY - this.viewport.y) / this.viewport.zoom + this.bounds.minY;
      
      this.viewport.zoom = newZoom;
      
      // Recalculate viewport position to keep center point stable
      this.viewport.x = centerX - (worldCenterX - this.bounds.minX) * this.viewport.zoom;
      this.viewport.y = centerY - (worldCenterY - this.bounds.minY) * this.viewport.zoom;
      
      // Re-render
      this.render();
      
      // Emit zoom changed event
      this.emit('zoom-changed', { 
        level: this.viewport.zoom, 
        center: { x: worldCenterX, y: worldCenterY } 
      });
    }
  }

  /**
   * Handle pan
   */
  public handlePan(deltaX: number, deltaY: number): void {
    const { pan } = this.config.visualization.interaction;
    
    if (!pan.enabled) return;
    
    this.viewport.x += deltaX;
    this.viewport.y += deltaY;
    
    // Apply boundaries if enabled
    if (pan.boundaries) {
      const maxPanX = 0;
      const maxPanY = 0;
      const minPanX = this.config.layout.width - (this.bounds.maxX - this.bounds.minX) * this.viewport.zoom;
      const minPanY = this.config.layout.height - (this.bounds.maxY - this.bounds.minY) * this.viewport.zoom;
      
      this.viewport.x = Math.max(minPanX, Math.min(maxPanX, this.viewport.x));
      this.viewport.y = Math.max(minPanY, Math.min(maxPanY, this.viewport.y));
    }
    
    // Re-render
    this.render();
    
    // Emit pan changed event
    this.emit('pan-changed', { position: { x: this.viewport.x, y: this.viewport.y } });
  }

  /**
   * Reset viewport to default
   */
  public resetViewport(): void {
    this.viewport = {
      x: 0,
      y: 0,
      zoom: 1,
      width: this.config.layout.width,
      height: this.config.layout.height,
    };
    
    this.render();
  }

  /**
   * Clear selection
   */
  public clearSelection(): void {
    this.selection = {
      cells: [],
      decisions: [],
      mode: this.selection.mode,
      active: false,
    };
    
    this.render();
  }

  /**
   * Get current data
   */
  public getData(): QuestDecisionData[] {
    return this.data;
  }

  /**
   * Get filtered data
   */
  public getFilteredData(): QuestDecisionData[] {
    return this.filteredData;
  }

  /**
   * Get cells
   */
  public getCells(): HeatmapCell[] {
    return this.cells;
  }

  /**
   * Get filtered cells
   */
  public getFilteredCells(): HeatmapCell[] {
    return this.filteredCells;
  }

  /**
   * Get viewport state
   */
  public getViewport(): ViewportState {
    return { ...this.viewport };
  }

  /**
   * Get selection state
   */
  public getSelection(): SelectionState {
    return { ...this.selection };
  }

  /**
   * Get bounds
   */
  public getBounds(): typeof this.bounds {
    return { ...this.bounds };
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<QuestDecisionHeatmapConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Re-render if layout changed
    if (newConfig.layout) {
      this.viewport.width = this.config.layout.width;
      this.viewport.height = this.config.layout.height;
      
      if (this.renderingContext) {
        this.renderingContext.width = this.config.layout.width;
        this.renderingContext.height = this.config.layout.height;
      }
    }
    
    // Re-generate cells if rendering config changed
    if (newConfig.visualization?.rendering) {
      this.generateCells();
      this.applyFilters();
    }
    
    this.render();
  }

  /**
   * Get cell at coordinates
   */
  public getCellAt(x: number, y: number): HeatmapCell | null {
    const cells = this.filteredCells.length > 0 ? this.filteredCells : this.cells;
    const { rendering } = this.config.visualization;
    const cellSize = rendering.resolution * 10;
    
    return cells.find(cell => 
      x >= cell.x && x < cell.x + cellSize &&
      y >= cell.y && y < cell.y + cellSize
    ) || null;
  }

  /**
   * Get statistics
   */
  public getStatistics(): {
    totalDecisions: number;
    totalCells: number;
    averageIntensity: number;
    dominantDecision: QuestDecisionType;
    dominantCategory: QuestCategory;
    successRate: number;
    bounds: typeof this.bounds;
  } {
    const cells = this.filteredCells.length > 0 ? this.filteredCells : this.cells;
    
    if (cells.length === 0) {
      return {
        totalDecisions: 0,
        totalCells: 0,
        averageIntensity: 0,
        dominantDecision: QuestDecisionType.ROUTINE,
        dominantCategory: QuestCategory.COMBAT,
        successRate: 0,
        bounds: this.bounds,
      };
    }
    
    const totalDecisions = cells.reduce((sum, cell) => sum + cell.totalDecisions, 0);
    const averageIntensity = cells.reduce((sum, cell) => sum + cell.intensity, 0) / cells.length;
    
    const decisionCounts = cells.reduce((acc, cell) => {
      acc[cell.dominantDecision] = (acc[cell.dominantDecision] || 0) + 1;
      return acc;
    }, {} as Record<QuestDecisionType, number>);
    
    const dominantDecision = Object.entries(decisionCounts).reduce((a, b) => 
      decisionCounts[a[0] as QuestDecisionType] > decisionCounts[b[0] as QuestDecisionType] ? a : b
    )[0] as QuestDecisionType;
    
    const categoryCounts = cells.reduce((acc, cell) => {
      acc[cell.dominantCategory] = (acc[cell.dominantCategory] || 0) + 1;
      return acc;
    }, {} as Record<QuestCategory, number>);
    
    const dominantCategory = Object.entries(categoryCounts).reduce((a, b) => 
      categoryCounts[a[0] as QuestCategory] > categoryCounts[b[0] as QuestCategory] ? a : b
    )[0] as QuestCategory;
    
    const successRate = cells.reduce((sum, cell) => sum + cell.successRate, 0) / cells.length;
    
    return {
      totalDecisions,
      totalCells: cells.length,
      averageIntensity,
      dominantDecision,
      dominantCategory,
      successRate,
      bounds: this.bounds,
    };
  }

  /**
   * Destroy engine and cleanup
   */
  public destroy(): void {
    // Cancel animation frame
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    // Clear event listeners
    this.eventListeners.clear();
    
    // Clear rendering context
    this.renderingContext = null;
    
    // Clear data
    this.data = [];
    this.cells = [];
    this.filteredData = [];
    this.filteredCells = [];
    
    diagnostics.info('Quest decision heatmap engine destroyed');
  }
}
