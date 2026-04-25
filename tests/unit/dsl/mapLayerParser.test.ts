/**
 * NP-031 – Idle Village Map Layer Configuration DSL
 * 
 * Unit tests for DSL parser, interpreter, and CLI functionality.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { MapLayerDSLProcessor, DSL_TEMPLATES, getTemplateNames, getTemplate } from '../../../src/ui/idleVillage/dsl/mapLayerConfig';

// Mock fs
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn(),
    readFileSync: vi.fn(),
  };
});

// Mock child_process
vi.mock('child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('child_process')>();
  return {
    ...actual,
    execSync: vi.fn(),
  };
});

const mockExistsSync = existsSync as Mock<typeof existsSync>;
const mockMkdirSync = mkdirSync as Mock<typeof mkdirSync>;
const mockWriteFileSync = writeFileSync as Mock<typeof writeFileSync>;
const mockReadFileSync = readFileSync as Mock<typeof readFileSync>;

describe('MapLayerDSLProcessor', () => {
  let processor: MapLayerDSLProcessor;

  beforeEach(() => {
    processor = MapLayerDSLProcessor.getInstance();
    processor.clearCache();
    vi.clearAllMocks();
  });

  afterEach(() => {
    processor.clearCache();
    vi.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = MapLayerDSLProcessor.getInstance();
      const instance2 = MapLayerProcessor.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Caching', () => {
    it('should cache parse results', () => {
      const dsl = 'layer "test" { type: tile name: "Test" }';
      
      const result1 = processor.parse(dsl, true);
      const result2 = processor.parse(dslsl, true);
      
      expect(result1).toBe(result2);
    });

    it('should not cache when disabled', () => {
      const dsl = 'layer "test" { type: tile name: "Test" }';
      
      const result1 = processor.parse(dslsl, true);
      const result2 = processor.parse(dslsl, false);
      
      expect(result1).not.toBe(result2);
    });

    it('should clear cache', () => {
      const dsl = 'layer "test" { type: tile name: "Test" }';
      
      const result1 = processor.parse(dsl, true);
      processor.clearCache();
      const result2 = processor.parse(dslsl, true);
      
      expect(result1).not.toBe(result2);
    });
  });

  describe('Basic Parsing', () => {
    it('should parse simple layer declaration', () => {
      const dsl = 'layer "test" { type: tile name: "Test Layer" }';
      
      const result = processor.parse(dsl);
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.context.layers).toHaveLength(1);
      
      const layer = result.context.layers[0];
      expect(layer.id).toBe('test');
      expect(layer.type).toBe('tile');
      expect(layer.name).toBe('Test Layer');
    });

    it('should parse layer with multiple properties', () => {
      const dsl = `
        layer "complex" {
          type: vector
          name: "Complex Layer"
          source {
            type: url
            url: "https://example.com/data.geojson"
            format: geojson
          }
          style {
            type: categorized
            paint: {
              "line-color": "#ff0000"
            }
          }
          visibility {
            visible: true
            opacity: 0.8
            zIndex: 10
          }
        }
      `;
      
      const result = processor.parse(dsl);
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.context.layers).toHaveLength(1);
      
      const layer = result.context.layers[0];
      expect(layer.id).toBe('complex');
      expect(layer.type).toBe('vector');
      expect(layer.name).toBe('Complex Layer');
      expect(layer.source.type).toBe('url');
      expect(layer.source.url).toBe('https://example.com/data.geojson');
      expect(layer.source.format).toBe('geojson');
      expect(layer.style.type).toBe('categorized');
      expect(layer.style.paint['line-color']).toBe('#ff0000');
      expect(layer.visibility.visible).toBe(true);
      expect(layer.visibility.opacity).toBe(0.8);
      expect(layer.visibility.zIndex).toBe(10);
    });

    it('should parse multiple layers', () => {
      const dsl = `
        layer "layer1" {
          type: tile
          name: "Base Layer"
        }
        
        layer "layer2" {
          type: vector
          name: "Vector Layer"
        }
      `;
      
      const result = processor.parse(dsl);
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.context.layers).toHaveLength(2);
      
      expect(result.context.layers[0].id).toBe('layer1');
      expect(result.context.layers[1].id).toBe('layer2');
      expect(result.context.layers[0].type).toBe('tile');
      expect(result.context.layers[1].type).toBe('vector');
    });

    it('should parse variables', () => {
      const dsl = `
        var baseUrl = "https://api.example.com"
        var apiKey = "secret-key"
        
        layer "api_layer" {
          type: vector
          name: "API Layer"
          source {
            type: url
            url: baseUrl + "/data"
            credentials {
              apiKey: apiKey
            }
          }
        }
      `;
      
      const result = processor.parse(dsl);
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.context.variables.baseUrl).toBe('https://api.example.com');
      expect(result.context.variables.apiKey).toBe('secret-key');
      
      const layer = result.context.layers[0];
      expect(layer.source.url).toBe('https://api.example.com/data');
      expect(layer.source.credentials.apiKey).toBe('secret-key');
    });

    it('should parse imports', () => {
      const dsl = `
        import "common-functions"
        import "styles/colors" as colors
        
        layer "styled_layer" {
          type: tile
          name: "Styled Layer"
          style {
            paint: {
              "background-color": colors.primary
            }
          }
        }
      `;
      
      const result = processor.parse(dsl);
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.context.imports).toHaveLength(2);
      expect(result.context.imports[0]).toBe('common-functions');
      expect(result.context.imports[1]).toBe('styles/colors');
    });

    it('should parse functions', () => {
      const dsl = `
        function calculateDistance(lat1, lng1, lat2, lng2) {
          const R = 6371e3;
          const φ1 = lat1 * Math.PI/180;
          const φ2 = lat2 * Math.PI/180;
          const Δφ = (lat2-lat1) * Math.PI/180;
          const Δλ = (lng2-lng1) * Math.PI/180;
          const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          return R * c;
        }
        
        layer "distance_layer" {
          type: heatmap
          name: "Distance Heatmap"
          data {
            dynamic {
              source: "distance_api"
              transform: "calculateDistance(lat, lng, feature.lat, feature.lng)"
            }
          }
        }
      `;
      
      const result = processor.parse(dsl);
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.context.layers).toHaveLength(1);
      
      const layer = result.context.layers[0];
      expect(layer.data.dynamic?.transform).toBe('calculateDistance(lat, lng, feature.lat, feature.lng)');
    });

    it('should parse metadata', () => {
      const dsl = `
        metadata {
          name: "Map Configuration"
          description: "Main map configuration"
          author: "Map Team"
          version: "1.0.0"
        }
        
        layer "metadata_layer" {
          type: tile
          name: "Metadata Layer"
          metadata {
            tags: ["base", "main"]
            category: "base"
            priority: 0
          }
        }
      `;
      
      const result = processor.parse(dsl);
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.context.metadata.name).toBe('Map Configuration');
      expect(result.context.metadata.description).toBe('Main map configuration');
      expect(result.context.metadata.author).toBe('Map Team');
      expect(result.context.metadata.version).toBe('1.0.0');
      
      const layer = result.context.layers[0];
      expect(layer.metadata.tags).toEqual(['base', 'main']);
      expect(layer.metadata.category).toBe('base');
      expect(layer.metadata.priority).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle syntax errors', () => {
      const dsl = `
        layer "test" {
          type: tile
          name: "Test Layer"
          // Missing closing brace
      `;
      
      const result = processor.parse(dsl);
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle semantic errors', () => {
      const dsl = `
        layer "test" {
          // Missing required properties
        }
      `;
      
      const result = processor.parse(dsl);
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle invalid expressions', () => {
      const dsl = `
        layer "test" {
          type: tile
          name: "Test Layer"
          style {
            paint: {
              "line-color": invalid_color
            }
          }
        }
      `;
      
      const result = processor.parse(dsl);
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle circular dependencies', () => {
      const dsl = `
        layer "layer1" {
          type: tile
          name: "Layer 1"
          metadata {
            dependencies: ["layer2"]
          }
        }
        
        layer "layer2" {
          type: tile
          name: "Layer 2"
          metadata {
            dependencies: ["layer1"]
          }
        }
      `;
      
      const result = processor.parse(dsl);
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Complex Expressions', () => {
    it('should parse nested objects', () => {
      const dsl = `
        layer "complex" {
          type: tile
          name: "Complex Layer"
          style {
            paint: {
              "background-color": {
                property: "type"
                stops: [
                  [0, "#ffffff"],
                  [1, "#f0f0f0"],
                  [2, "#e0e0e0"]
                ]
              }
            }
          }
        }
      `;
      
      const result = processor.parse(dsl);
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      
      const layer = result.context.layers[0];
      expect(layer.style.paint['background-color']).toBeDefined();
    });

    it('should parse array expressions', () => {
      const dsl = `
        layer "array_layer" {
          type: marker
          name: "Array Layer"
          data {
            static: {
              points: [
                { lat: 40.7128, lng: -74.0060 },
                { lat: 34.0522, lng: -118.2437 }
              ]
            }
          }
        }
      `;
      
      const result = processor.parse(dsl);
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      
      const layer = result.context.layers[0];
      expect(layer.data.static.points).toHaveLength(2);
    });

    it('should parse function calls', () => {
      const dsl = `
        layer "function_layer" {
          type: tile
          name: "Function Layer"
          style {
            paint: {
              "background-color": randomColor()
            }
          }
        }
      `;
      
      const result = processor.parse(dsl);
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      
      const layer = result.context.layers[0];
      expect(layer.style.paint['background-color']).toBeDefined();
    });
  });
});

describe('DSL Templates', () => {
  describe('Template Retrieval', () => {
    it('should return all template names', () => {
      const names = getTemplateNames();
      expect(names).toContain('tile_layer');
      expect(names).toContain('vector_layer');
      expect(names).toContain('marker_layer');
      expect(names).toContain('heatmap_layer');
      expect(names).toContain('dynamic_layer');
    });

    it('should return template content', () => {
      const template = getTemplate('tile_layer');
      expect(template).toContain('layer "base_map"');
      expect(template).toContain('type: tile');
      expect(template).toContain('name: "Base Map"');
    });

    it('should return undefined for non-existent template', () => {
      const template = getTemplate('non_existent');
      expect(template).toBeUndefined();
    });
  });
});

describe('Built-in Functions', () => {
  describe('Math Functions', () => {
    it('should have basic math functions', () => {
      const functions = [
        'add', 'subtract', 'multiply', 'divide', 'mod', 'pow', 'sqrt', 'abs', 'min', 'max'
      ];
      
      functions.forEach(func => {
        expect(getTemplate(func)).toBeDefined();
      });
    });

    it('should have string functions', () => {
      const functions = [
        'concat', 'uppercase', 'lowercase', 'length'
      ];
      
      functions.forEach(func => {
        expect(getTemplate(func)).toBeDefined();
      });
    });

    it('should have array functions', () => {
      const functions = [
        'filter', 'map', 'reduce'
      ];
      
      functions.forEach(func => {
        expect(getTemplate(func)).toBeDefined();
      });
    });

    it('should have geographic functions', () => {
      const functions = [
        'distance', 'bearing'
      ];
      
      functions.forEach(func => {
        expect(getTemplate(func)).toBeDefined();
      });
    });

    it('should have utility functions', () => {
      const functions = [
        'random', 'clamp', 'lerp', 'now', 'timestamp'
      ];
      
      functions.forEach(func => {
        expect(getTemplate(func)).toBeDefined();
      });
    });

    it('should have color functions', () => {
      const functions = [
        'rgb', 'rgba', 'hex'
      ];
      
      functions.forEach(func => {
        expect(getTemplate(func)).toBeDefined();
      });
    });
  });
});

describe('Integration Tests', () => {
  describe('Full DSL Workflow', () => {
    it('should process complete DSL configuration', () => {
      const dsl = `
        import "common-functions"
        import "styles/colors" as colors
        
        var mapCenter = { lat: 40.7128, lng: -74.0060, zoom: 10 }
        var defaultZoom = 10
        
        layer "base_map" {
          type: tile
          name: "Base Map"
          source {
            type: url
            url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            format: png
            cache {
              enabled: true
              ttl: 86400
              maxSize: 10485760
            }
          }
          style {
            type: simple
            paint: {
              "background-color": "#f0f0f0"
            }
          }
          visibility {
            visible: true
            opacity: 1.0
            zIndex: 0
            minZoom: 0
            maxZoom: 20
            zoomStrategy: fixed
          }
          metadata {
            tags: ["base", "map", "osm"]
            category: "base"
            priority: 0
            dependencies: []
            version: "1.0.0"
          }
        }
        
        layer "roads" {
          type: vector
          name: "Roads"
          source {
            type: file
            path: "./data/roads.geojson"
            format: geojson
            cache {
              enabled: true
              ttl: 3600
              maxSize: 1048576
            }
          }
          style {
            type: categorized
            paint: {
              "line-color": {
                property: "type"
                stops: [
                  [0, "#ff0000"],
                  [1, "#00ff00"],
                  [2, "#0000ff"]
                ]
              }
              "line-width": 2
            }
            layout: {
              "line-join": "round"
              "line-cap": "round"
            }
          }
          visibility {
            visible: true
            opacity: 0.8
            zIndex: 10
            minZoom: 10
            maxZoom: 20
            zoomStrategy: adaptive
          }
          interaction {
            clickable: true
            hoverable: true
            selectable: true
            events: [
              {
                type: click
                handler: "handleRoadClick"
              }
            ]
            tooltips: [
              {
                template: "Road: {name}\\nType: {type}\\nLength: {length}km"
                variables: {
                  name: "property.name"
                  type: "property.type"
                  length: "property.length"
                }
                style: {
                  backgroundColor: "#333333"
                  textColor: "#ffffff"
                  fontSize: 12
                  padding: 8
                  borderRadius: 4
                  boxShadow: true
                }
                position: cursor
                delay: 100
                duration: 2000
              }
            ]
          }
          metadata {
            tags: ["roads", "vector", "infrastructure"]
            category: "transportation"
            priority: 5
            dependencies: []
            version: "1.0.0"
          }
        }
        
        metadata {
          name: "Complete Map Configuration"
          description: "Complete map with base and road layers"
          author: "Map Team"
          version: "1.0.0"
        }
      `;
      
      const result = processor.parse(dsl);
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.context.layers).toHaveLength(2);
      expect(result.context.imports).toHaveLength(2);
      expect(result.context.variables).toBeDefined();
      
      const baseLayer = result.context.layers.find(l => l.id === 'base_map');
      const roadLayer = result.context.layers.find(l => l.id === 'roads');
      
      expect(baseLayer).toBeDefined();
      expect(roadLayer).toBeDefined();
      expect(baseLayer.type).toBe('tile');
      expect(roadLayer.type).toBe('vector');
      expect(baseLayer.metadata.category).toBe('base');
      expect(roadLayer.metadata.category).toBe('transportation');
    });

    it('should handle dynamic data layers', () => {
      const dsl = `
        layer "live_events" {
          type: marker
          name: "Live Events"
          source {
            type: api
            url: "https://api.example.com/events"
            format: json
            credentials {
              token: "your-token"
            }
            cache {
              enabled: true
              ttl: 60
              maxSize: 1048576
            }
          }
          style {
            type: simple
            paint: {
              "marker-color": {
                property: "severity"
                stops: [
                  ["low", "#4ade80"],
                  ["medium", "#fbbf24"],
                  ["high", "#f87171"],
                  ["critical", "#dc2626"]
                ]
              }
            }
          }
          visibility {
            visible: true
            opacity: 1.0
            zIndex: 20
            minZoom: 5
            maxZoom: 20
            zoomStrategy: progressive
          }
          data {
            dynamic {
              source: "live_events_api"
              refresh {
                enabled: true
                interval: 30000
                trigger: "shouldRefresh()"
              }
              transform: "transformEventData"
              validate: "validateEventData"
            }
          }
          interaction {
            clickable: true
            hoverable: true
            selectable: true
            events: [
              {
                type: click
                handler: "handleEventClick"
              }
            ]
          }
          metadata {
            tags: ["live", "events", "dynamic", "real-time"]
            category: "events"
            priority: 10
            dependencies: []
            version: "1.0.0"
          }
        }
      `;
      
      const result = processor.parse(dsl);
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      
      const layer = result.context.layers[0];
      expect(layer.type).toBe('marker');
      expect(layer.data.dynamic).toBeDefined();
      expect(layer.data.dynamic!.source).toBe('live_events_api');
      expect(layer.data.dynamic!.refresh.enabled).toBe(true);
      expect(layer.data.dynamic!.refresh.interval).toBe(30000);
    });

    it('should handle complex nested configurations', () => {
      const dsl = `
        import "utils/validation"
        
        layer "complex_layer" {
          type: custom
          name: "Complex Layer"
          source {
            type: database
            connection: "postgresql://localhost:5432/mapdb"
            query: "SELECT * FROM layers WHERE active = true"
            credentials: {
              username: "map_user"
              password: "map_password"
            }
          }
          style {
            type: custom
            paint: {
              "fill-color": {
                expression: "getRiskColor(risk_level)"
              }
              "fill-opacity": {
                expression: "clamp(opacity, 0, 1)"
              }
            }
            layout: {
              "visibility": {
                expression: "zoom >= min_zoom && zoom <= max_zoom"
              }
            }
          }
          visibility {
            visible: {
              expression: "is_visible && is_in_viewport"
            }
            opacity: {
              expression: "1.0 - distance / max_distance"
            }
            minZoom: {
              expression: "calculate_min_zoom(layer_complexity)"
            }
            maxZoom: {
              expression: "calculate_max_zoom(layer_complexity)"
            }
            zoomStrategy: adaptive
          }
          interaction {
            clickable: {
              expression: "is_interactive"
            }
            hoverable: {
              expression: "has_tooltip"
            }
            events: [
              {
                type: click
                handler: "handleComplexClick"
                options: {
                  validate: true
                }
              }
            ]
          }
          data {
            static: {
              config: {
                risk_threshold: 0.7
                max_distance: 10000
                layer_complexity: "medium"
              }
            }
            dynamic: {
              source: "risk_analysis_api"
              refresh: {
                enabled: true
                interval: 15000
                trigger: "should_update_risk"
              }
              transform: "calculate_risk_score"
              validate: "validate_risk_data"
            }
            computed: {
              risk_level: "evaluate_risk_level"
              visibility: "calculate_visibility"
              priority: "calculate_priority"
            }
          }
          metadata {
            tags: ["complex", "dynamic", "risk", "validation"]
            category: "analytics"
            priority: 8
            dependencies: ["validation"]
            version: "2.0.0"
          }
        }
      `;
      
      const result = processor.parse(dsl);
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      
      const layer = result.context.layers[0];
      expect(layer.type).toBe('custom');
      expect(layer.source.type).toBe('database');
      expect(layer.style.paint['fill-color'].expression).toBe('getRiskColor(risk_level)');
      expect(layer.visibility.visible.expression).toBe('is_visible && is_in_viewport');
      expect(layer.data.static.config.risk_threshold).toBe(0.7);
      expect(layer.data.dynamic.transform).toBe('calculate_risk_score');
    });
  });

  describe('Error Recovery', () => {
    it('should recover from partial failures', () => {
      const dsl = `
        layer "valid_layer" {
          type: tile
          name: "Valid Layer"
          source {
            type: url
            url: "https://example.com/tiles/{z}/{x}/{y}.png"
          }
          style {
            paint: {
              "background-color": "#ffffff"
            }
          }
        }
        
        layer "invalid_layer" {
          type: tile
          name: "Invalid Layer"
          // Missing required properties
        }
      `;
      
      const result = processor.parse(dsl);
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.context.layers).toHaveLength(1);
      
      const validLayer = result.context.layers.find(l => l.id === 'valid_layer');
      expect(validLayer).toBeDefined();
      expect(validLayer.name).toBe('Valid Layer');
    });

    it('should provide helpful error messages', () => {
      const dsl = `
        layer "test" {
          type: invalid_type
          name: "Test Layer"
        }
      `;
      
      const result = processor.parse(dsl);
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      const error = result.errors[0];
      expect(error.type).toBe('semantic');
      expect(error.message).toContain('Invalid enum value');
      expect(error.line).toBeGreaterThan(0);
      expect(error.column).toBeGreaterThan(0);
    });
  });
});

describe('Performance', () => {
  it('should handle large DSL files efficiently', () => {
      // Create a large DSL with many layers
      let dsl = '';
      for (let i = 0; i < 100; i++) {
        dsl += `
layer "layer_${i}" {
          type: tile
          name: "Layer ${i}"
          source {
            type: url
            url: "https://example.com/tiles/{z}/{x}/{y}.png"
          }
          style {
            paint: {
              "background-color": "#ffffff"
            }
          }
          visibility {
            visible: ${i % 2 === 0 ? 'true' : 'false'}
            opacity: ${0.5 + (i % 10) / 10}
            zIndex: i
          }
          metadata {
            tags: ["test", "generated"]
            category: "test"
            priority: i
            version: "1.0.0"
          }
        }
      `;
      
      const startTime = performance.now();
      const result = processor.parse(dsl);
      const endTime = performance.now();
      
      expect(result.success).toBe(true);
      expect(result.context.layers).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should cache repeated parses efficiently', () => {
      const dsl = `
        layer "cached_layer" {
          type: tile
          name: "Cached Layer"
          source {
            type: url
            url: "https://example.com/tiles/{z}/{x}/{y}.png"
          }
          style {
            paint: {
              "background-color": "#ffffff"
            }
          }
        }
      `;
      
      // First parse (cache miss)
      const startTime1 = performance.now();
      const result1 = processor.parse(dsl, true);
      const endTime1 = performance.now();
      
      // Second parse (cache hit)
      const startTime2 = performance.now();
      const result2 = processor.parse(dsl, true);
      const endTime2 = performance.now();
      
      expect(result1).toBe(result2);
      expect(endTime1 - startTime1).toBeGreaterThan(endTime2 - startTime2); // First parse should be slower
    });
  });
});
