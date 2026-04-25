/**
 * NP-031 – Idle Village Map Layer Configuration DSL
 * 
 * Hook for loading and managing map layer DSL configurations
 * with hot-reload, validation, and CLI preview support.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  MapLayerConfig, 
  MapLayerDSLContext, 
  ParseResult, 
  ParseError, 
  ParseWarning,
  MapLayerDSLProcessor,
  DSL_TEMPLATES,
  getTemplateNames,
  getTemplate
} from '../dsl/mapLayerConfig';

export interface UseMapLayerDSLOptions {
  initialDSL?: string;
  initialContext?: Partial<MapLayerDSLContext>;
  enableHotReload?: boolean;
  enableValidation?: boolean;
  enableCache?: boolean;
  autoParse?: boolean;
  watchInterval?: number;
}

export function useMapLayerDSLOptions(options: UseMapLayerDSLOptions = {}) {
  const {
    initialDSL = '',
    initialContext = {},
    enableHotReload = true,
    enableValidation = true,
    enableCache = true,
    autoParse = true,
    watchInterval = 1000,
  } = options;

  const [dsl, setDSL] = useState(initialDSL);
  const [context, setContext] = useState<MapLayerDSLContext>({
    layers: [],
    variables: {},
    imports: [],
    version: '1.0.0',
    metadata: {
      name: 'Untitled',
      created: Date.now(),
      updated: Date.now(),
    },
    ...initialContext,
  });
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [layers, setLayers] = useState<MapLayerConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isWatching, setIsWatching] = useState(false);
  const [lastModified, setLastModified] = useState<number>(Date.now());

  const processor = useMemo(() => MapLayerDSLProcessor.getInstance(), []);

  // Parse DSL when it changes
  useEffect(() => {
    if (!autoParse || !dsl) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = processor.parse(dsl, enableCache);
      setParseResult(result);
      
      if (result.success && result.ast) {
        const interpreter = new (require('../dsl/mapLayerParser').DSLInterpreter)(result.context);
        const interpretedLayers = interpreter.interpret(result.ast);
        setLayers(interpretedLayers);
        setContext(result.context);
      } else {
        setLayers([]);
        setError(result.errors.map(e => e.message).join(', '));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setLayers([]);
    } finally {
      setIsLoading(false);
      setLastModified(Date.now());
    }
  }, [dsl, autoParse, enableCache, processor]);

  // Hot reload functionality
  useEffect(() => {
    if (!enableHotReload || !isWatching) return;

    const interval = setInterval(() => {
      // In a real implementation, this would watch file changes
      // For now, we'll just check if the DSL has changed
      if (dsl) {
        const result = processor.parse(dsl, false);
        if (result.success !== parseResult?.success) {
          // DSL has changed, re-parse
          const newResult = processor.parse(dsl, enableCache);
          setParseResult(newResult);
          
          if (newResult.success && newResult.ast) {
            const interpreter = new (require('../dsl/mapLayerParser').DSLInterpreter)(newResult.context);
            const interpretedLayers = interpreter.interpret(newResult.ast);
            setLayers(interpretedLayers);
            setContext(newResult.context);
          }
        }
      }
    }, watchInterval);

    return () => clearInterval(interval);
  }, [enableHotReload, isWatching, watchInterval, dsl, parseResult, enableCache, processor]);

  /**
   * Update DSL content
   */
  const updateDSL = useCallback((newDSL: string) => {
    setDSL(newDSL);
  }, []);

  /**
   * Update context
   */
  const updateContext = useCallback((updates: Partial<MapLayerDSLContext>) => {
    setContext(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Get layer by ID
   */
  const getLayer = useCallback((id: string): MapLayerConfig | undefined => {
    return layers.find(layer => layer.id === id);
  }, [layers]);

  /**
   * Get layers by type
   */
  const getLayersByType = useCallback((type: MapLayerConfig['type']): MapLayerConfig[] => {
    return layers.filter(layer => layer.type === type);
  }, [layers]);

  /**
   * Get layers by category
   */
  const getLayersByCategory = useCallback((category: string): MapLayerConfig[] => {
    return layers.filter(layer => layer.metadata.category === category);
  }, [layers]);

  /**
   * Get layers by tags
   */
  const getLayersByTags = useCallback((tags: string[]): MapLayerConfig[] => {
    return layers.filter(layer => 
      tags.some(tag => layer.metadata.tags.includes(tag))
    );
  }, [layers]);

  /**
   * Add layer
   */
  const addLayer = useCallback((layer: MapLayerConfig) => {
    setLayers(prev => [...prev, layer]);
  }, []);

  /**
   * Remove layer
   */
  const removeLayer = useCallback((id: string) => {
    setLayers(prev => prev.filter(layer => layer.id !== id));
  }, []);

  /**
   * Update layer
   */
  const updateLayer = useCallback((id: string, updates: Partial<MapLayerConfig>) => {
    setLayers(prev => prev.map(layer => 
      layer.id === id ? { ...layer, ...updates } : layer
    ));
  }, []);

  /**
   * Toggle layer visibility
   */
  const toggleLayerVisibility = useCallback((id: string) => {
    updateLayer(id, { 
      visibility: { 
        ...getLayer(id)?.visibility, 
        visible: !getLayer(id)?.visibility.visible 
      }
    });
  }, [getLayer, updateLayer]);

  /**
   * Set layer opacity
   */
  const setLayerOpacity = useCallback((id: string, opacity: number) => {
    updateLayer(id, { 
      visibility: { 
        ...getLayer(id)?.visibility, 
        opacity 
      }
    });
  }, [getLayer, updateLayer]);

  /**
   * Set layer z-index
   */
  const setLayerZIndex = useCallback((id: string, zIndex: number) => {
    updateLayer(id, { 
      visibility: { 
        ...getLayer(id)?.visibility, 
        zIndex 
      }
    });
  }, [getLayer, updateLayer]);

  /**
   * Reorder layers
   */
  const reorderLayers = useCallback((fromIndex: number, toIndex: number) => {
    setLayers(prev => {
      const newLayers = [...prev];
      const [movedLayer] = newLayers.splice(fromIndex, 1);
      newLayers.splice(toIndex, 0, movedLayer);
      return newLayers;
    });
  }, []);

  /**
   * Validate DSL
   */
  const validateDSL = useCallback((dslToValidate: string): ParseResult => {
    return processor.parse(dslToValidate, false);
  }, [processor]);

  /**
   * Get available templates
   */
  const getAvailableTemplates = useCallback(() => {
    return getTemplateNames().map(name => ({
      name,
      content: getTemplate(name) || '',
    }));
  }, []);

  /**
   * Insert template
   */
  const insertTemplate = useCallback((templateName: string) => {
    const template = getTemplate(templateName);
    if (template) {
      updateDSL(dsl + '\n\n' + template);
    }
  }, [updateDSL]);

  /**
   * Clear DSL
   */
  const clearDSL = useCallback(() => {
    setDSL('');
    setLayers([]);
    setParseResult(null);
    setError(null);
  }, []);

  /**
   * Reset to defaults
   */
  const resetToDefaults = useCallback(() => {
    setDSL(initialDSL);
    setContext({
      layers: [],
      variables: {},
      imports: [],
      version: '1.0.0',
      metadata: {
        name: 'Untitled',
        created: Date.now(),
        updated: Date.now(),
      },
      ...initialContext,
    });
    setLayers([]);
    setParseResult(null);
    setError(null);
  }, [initialDSL, initialContext]);

  /**
   * Export DSL
   */
  const exportDSL = useCallback(() => {
    return {
      dsl,
      context,
      layers,
      parseResult,
      metadata: {
        exportedAt: Date.now(),
        version: context.version,
        layerCount: layers.length,
        errorCount: parseResult?.errors.length || 0,
        warningCount: parseResult?.warnings.length || 0,
      },
    };
  }, [dsl, context, layers, parseResult]);

  /**
   * Import DSL
   */
  const importDSL = useCallback((importData: { dsl?: string; context?: MapLayerDSLContext }) => {
    if (importData.dsl) {
      setDSL(importData.dsl);
    }
    if (importData.context) {
      setContext(prev => ({ ...prev, ...importData.context }));
    }
  }, []);

  /**
   * Start watching for changes
   */
  const startWatching = useCallback(() => {
    setIsWatching(true);
  }, []);

  /**
   * Stop watching for changes
   */
  const stopWatching = useCallback(() => {
    setIsWatching(false);
  }, []);

  /**
   * Get statistics
   */
  const getStatistics = useCallback(() => {
    return {
      dslLength: dsl.length,
      layerCount: layers.length,
      variableCount: context.variables.length,
      importCount: context.imports.length,
      errorCount: parseResult?.errors.length || 0,
      warningCount: parseResult?.warnings.length || 0,
      lastModified,
      isWatching,
      isLoading,
    };
  }, [dsl, layers, context, parseResult, lastModified, isWatching, isLoading]);

  /**
   * Get layer statistics
   */
  const getLayerStatistics = useCallback(() => {
    const stats = {
      total: layers.length,
      byType: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
      visible: 0,
      hidden: 0,
      averageOpacity: 0,
    };

    layers.forEach(layer => {
      // Count by type
      stats.byType[layer.type] = (stats.byType[layer.type] || 0) + 1;
      
      // Count by category
      stats.byCategory[layer.metadata.category] = (stats.byCategory[layer.metadata.category] || 0) + 1;
      
      // Count visibility
      if (layer.visibility.visible) {
        stats.visible++;
      } else {
        stats.hidden++;
      }
      
      // Calculate average opacity
      stats.averageOpacity += layer.visibility.opacity;
    });

    if (layers.length > 0) {
      stats.averageOpacity /= layers.length;
    }

    return stats;
  }, [layers]);

  /**
   * Search layers
   */
  const searchLayers = useCallback((query: string): MapLayerConfig[] => {
    if (!query.trim()) return layers;
    
    const lowerQuery = query.toLowerCase();
    return layers.filter(layer => 
      layer.name.toLowerCase().includes(lowerQuery) ||
      layer.id.toLowerCase().includes(lowerQuery) ||
      layer.metadata.description?.toLowerCase().includes(lowerQuery) ||
      layer.metadata.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }, [layers]);

  /**
   * Filter layers
   */
  const filterLayers = useCallback((filters: {
    types?: MapLayerConfig['type'][];
    categories?: string[];
    tags?: string[];
    visible?: boolean;
    minZIndex?: number;
    maxZIndex?: number;
  }): MapLayerConfig[] => {
    return layers.filter(layer => {
      // Type filter
      if (filters.types && !filters.types.includes(layer.type)) {
        return false;
      }
      
      // Category filter
      if (filters.categories && !filters.categories.includes(layer.metadata.category)) {
        return false;
      }
      
      // Tags filter
      if (filters.tags && !filters.tags.some(tag => layer.metadata.tags.includes(tag))) {
        return false;
      }
      
      // Visibility filter
      if (filters.visible !== undefined && layer.visibility.visible !== filters.visible) {
        return false;
      }
      
      // Z-index filter
      if (filters.minZIndex !== undefined && layer.visibility.zIndex < filters.minZIndex) {
        return false;
      }
      
      if (filters.maxZIndex !== undefined && layer.visibility.zIndex > filters.maxZIndex) {
        return false;
      }
      
      return true;
    });
  }, [layers]);

  // Memoized values
  const availableTemplates = useMemo(() => getAvailableTemplates(), [getAvailableTemplates]);
  const statistics = useMemo(() => getStatistics(), [getStatistics]);
  const layerStatistics = useMemo(() => getLayerStatistics(), [getLayerStatistics]);

  return {
    // State
    dsl,
    context,
    layers,
    parseResult,
    isLoading,
    error,
    isWatching,
    lastModified,
    
    // Data
    availableTemplates,
    statistics,
    layerStatistics,
    
    // Methods
    updateDSL,
    updateContext,
    getLayer,
    getLayersByType,
    getLayersByCategory,
    getLayersByTags,
    addLayer,
    removeLayer,
    updateLayer,
    toggleLayerVisibility,
    setLayerOpacity,
    setLayerZIndex,
    reorderLayers,
    validateDSL,
    insertTemplate,
    clearDSL,
    resetToDefaults,
    exportDSL,
    importDSL,
    startWatching,
    stopWatching,
    searchLayers,
    filterLayers,
    
    // Options
    options,
  };
}
