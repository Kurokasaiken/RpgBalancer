/**
 * NP-031 – Idle Village Map Layer Configuration DSL
 * 
 * Domain Specific Language for map layer configuration with
 * config-first design, hook loader integration, and CLI preview.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

import { z } from 'zod';

// DSL Grammar and Types
export interface MapLayerDSLContext {
  layers: MapLayerConfig[];
  variables: Record<string, any>;
  imports: string[];
  version: string;
  metadata: {
    name: string;
    description?: string;
    author?: string;
    created: number;
    updated: number;
  };
}

export interface MapLayerConfig {
  id: string;
  name: string;
  type: 'tile' | 'vector' | 'raster' | 'marker' | 'heatmap' | 'path' | 'annotation' | 'custom';
  source: LayerSource;
  style: LayerStyle;
  visibility: LayerVisibility;
  interaction: LayerInteraction;
  data: LayerData;
  metadata: LayerMetadata;
}

export interface LayerSource {
  type: 'file' | 'url' | 'api' | 'database' | 'generated';
  path?: string;
  url?: string;
  format?: 'json' | 'csv' | 'geojson' | 'xml' | 'binary' | 'custom';
  credentials?: {
    username?: string;
    password?: string;
    token?: string;
    apiKey?: string;
  };
  options?: Record<string, any>;
  cache?: {
    enabled: boolean;
    ttl: number; // in seconds
    maxSize: number; // in bytes
  };
}

export interface LayerStyle {
  type: 'simple' | 'categorized' | 'graduated' | 'proportional' | 'custom';
  paint: Record<string, any>;
  layout: Record<string, any>;
  expressions?: Record<string, string>;
  functions?: Record<string, Function>;
  variables?: Record<string, any>;
}

export interface LayerVisibility {
  visible: boolean;
  opacity: number; // 0-1
  zIndex: number;
  minZoom: number;
  maxZoom: number;
  zoomStrategy: 'fixed' | 'adaptive' | 'progressive';
  fadeEffect: {
    enabled: boolean;
    duration: number; // in milliseconds
    easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  };
}

export interface LayerInteraction {
  clickable: boolean;
  hoverable: boolean;
  selectable: boolean;
  draggable: boolean;
  resizable: boolean;
  editable: boolean;
  events: LayerEvent[];
  actions: LayerAction[];
  tooltips: LayerTooltip[];
  popups: LayerPopup[];
}

export interface LayerEvent {
  type: 'click' | 'hover' | 'select' | 'drag' | 'resize' | 'edit' | 'custom';
  handler: string; // DSL function name
  options?: Record<string, any>;
}

export interface LayerAction {
  id: string;
  name: string;
  type: 'button' | 'menu' | 'shortcut' | 'gesture' | 'custom';
  trigger: string; // DSL trigger condition
  handler: string; // DSL function name
  icon?: string;
  shortcut?: string;
  enabled: boolean;
}

export interface LayerTooltip {
  template: string; // DSL template string
  variables: Record<string, any>;
  style: {
    backgroundColor: string;
    textColor: string;
    fontSize: number;
    padding: number;
    borderRadius: number;
    boxShadow: boolean;
  };
  position: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'cursor';
  delay: number; // in milliseconds
  duration: number; // in milliseconds
}

export interface LayerPopup {
  template: string; // DSL template string
  variables: Record<string, any>;
  style: {
    width: number;
    height: number;
    backgroundColor: string;
    textColor: string;
    fontSize: number;
    padding: number;
    borderRadius: number;
    boxShadow: boolean;
    closable: boolean;
    draggable: boolean;
  };
  position: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'cursor';
  triggers: string[]; // DSL trigger conditions
}

export interface LayerData {
  static?: Record<string, any>;
  dynamic?: {
    source: string; // DSL data source
    refresh: {
      enabled: boolean;
      interval: number; // in milliseconds
      trigger?: string; // DSL trigger condition
    };
    transform?: string; // DSL transformation function
    validate?: string; // DSL validation function
  };
  computed?: Record<string, string>; // DSL computed properties
}

export interface LayerMetadata {
  tags: string[];
  category: string;
  priority: number;
  dependencies: string[];
  version: string;
  description?: string;
  author?: string;
  license?: string;
  attribution?: string;
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  center?: {
    lat: number;
    lng: number;
    zoom: number;
  };
}

// DSL Schema Validation
export const MapLayerConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['tile', 'vector', 'raster', 'marker', 'heatmap', 'path', 'annotation', 'custom']),
  source: z.object({
    type: z.enum(['file', 'url', 'api', 'database', 'generated']),
    path: z.string().optional(),
    url: z.string().optional(),
    format: z.enum(['json', 'csv', 'geojson', 'xml', 'binary', 'custom']).optional(),
    credentials: z.object({
      username: z.string().optional(),
      password: z.string().optional(),
      token: z.string().optional(),
      apiKey: z.string().optional(),
    }).optional(),
    options: z.record(z.any()).optional(),
    cache: z.object({
      enabled: z.boolean(),
      ttl: z.number(),
      maxSize: z.number(),
    }).optional(),
  }),
  style: z.object({
    type: z.enum(['simple', 'categorized', 'graduated', 'proportional', 'custom']),
    paint: z.record(z.any()),
    layout: z.record(z.any()),
    expressions: z.record(z.string()).optional(),
    functions: z.record(z.function()).optional(),
    variables: z.record(z.any()).optional(),
  }),
  visibility: z.object({
    visible: z.boolean(),
    opacity: z.number().min(0).max(1),
    zIndex: z.number(),
    minZoom: z.number(),
    maxZoom: z.number(),
    zoomStrategy: z.enum(['fixed', 'adaptive', 'progressive']),
    fadeEffect: z.object({
      enabled: z.boolean(),
      duration: z.number(),
      easing: z.enum(['linear', 'ease-in', 'ease-out', 'ease-in-out']),
    }),
  }),
  interaction: z.object({
    clickable: z.boolean(),
    hoverable: z.boolean(),
    selectable: z.boolean(),
    draggable: z.boolean(),
    resizable: z.boolean(),
    editable: z.boolean(),
    events: z.array(z.object({
      type: z.enum(['click', 'hover', 'select', 'drag', 'resize', 'edit', 'custom']),
      handler: z.string(),
      options: z.record(z.any()).optional(),
    })),
    actions: z.array(z.object({
      id: z.string(),
      name: z.string(),
      type: z.enum(['button', 'menu', 'shortcut', 'gesture', 'custom']),
      trigger: z.string(),
      handler: z.string(),
      icon: z.string().optional(),
      shortcut: z.string().optional(),
      enabled: z.boolean(),
    })),
    tooltips: z.array(z.object({
      template: z.string(),
      variables: z.record(z.any()),
      style: z.object({
        backgroundColor: z.string(),
        textColor: z.string(),
        fontSize: z.number(),
        padding: z.number(),
        borderRadius: z.number(),
        boxShadow: z.boolean(),
      }),
      position: z.enum(['top', 'bottom', 'left', 'right', 'center', 'cursor']),
      delay: z.number(),
      duration: z.number(),
    })),
    popups: z.array(z.object({
      template: z.string(),
      variables: z.record(z.any()),
      style: z.object({
        width: z.number(),
        height: z.number(),
        backgroundColor: z.string(),
        textColor: z.string(),
        fontSize: z.number(),
        padding: z.number(),
        borderRadius: z.number(),
        boxShadow: z.boolean(),
        closable: z.boolean(),
        draggable: z.boolean(),
      }),
      position: z.enum(['top', 'bottom', 'left', 'right', 'center', 'cursor']),
      triggers: z.array(z.string()),
    })),
  }),
  data: z.object({
    static: z.record(z.any()).optional(),
    dynamic: z.object({
      source: z.string(),
      refresh: z.object({
        enabled: z.boolean(),
        interval: z.number(),
        trigger: z.string().optional(),
      }),
      transform: z.string().optional(),
      validate: z.string().optional(),
    }).optional(),
    computed: z.record(z.string()).optional(),
  }),
  metadata: z.object({
    tags: z.array(z.string()),
    category: z.string(),
    priority: z.number(),
    dependencies: z.array(z.string()),
    version: z.string(),
    description: z.string().optional(),
    author: z.string().optional(),
    license: z.string().optional(),
    attribution: z.string().optional(),
    bounds: z.object({
      north: z.number(),
      south: z.number(),
      east: z.number(),
      west: z.number(),
    }).optional(),
    center: z.object({
      lat: z.number(),
      lng: z.number(),
      zoom: z.number(),
    }).optional(),
  }),
});

export type MapLayerConfigType = z.infer<typeof MapLayerConfigSchema>;

// DSL Functions and Expressions
export interface DSLFunction {
  name: string;
  parameters: DSLParameter[];
  returnType: string;
  body: string;
  description?: string;
  examples?: string[];
}

export interface DSLParameter {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: any;
  description?: string;
}

export interface DSLExpression {
  type: 'condition' | 'value' | 'transform' | 'animation' | 'custom';
  expression: string;
  variables: Record<string, any>;
  context?: Record<string, any>;
}

// Built-in DSL Functions
export const BUILTIN_DSL_FUNCTIONS: Record<string, DSLFunction> = {
  // Math functions
  'add': {
    name: 'add',
    parameters: [
      { name: 'a', type: 'number', required: true },
      { name: 'b', type: 'number', required: true },
    ],
    returnType: 'number',
    body: 'return a + b;',
    description: 'Add two numbers',
    examples: ['add(2, 3) // returns 5'],
  },
  'subtract': {
    name: 'subtract',
    parameters: [
      { name: 'a', type: 'number', required: true },
      { name: 'b', type: 'number', required: true },
    ],
    returnType: 'number',
    body: 'return a - b;',
    description: 'Subtract two numbers',
    examples: ['subtract(5, 2) // returns 3'],
  },
  'multiply': {
    name: 'multiply',
    parameters: [
      { name: 'a', type: 'number', required: true },
      { name: 'b', type: 'number', required: true },
    ],
    returnType: 'number',
    body: 'return a * b;',
    description: 'Multiply two numbers',
    examples: ['multiply(3, 4) // returns 12'],
  },
  'divide': {
    name: 'divide',
    parameters: [
      { name: 'a', type: 'number', required: true },
      { name: 'b', type: 'number', required: true },
    ],
    returnType: 'number',
    body: 'return a / b;',
    description: 'Divide two numbers',
    examples: ['divide(12, 3) // returns 4'],
  },
  'mod': {
    name: 'mod',
    parameters: [
      { name: 'a', type: 'number', required: true },
      { name: 'b', type: 'number', required: true },
    ],
    returnType: 'number',
    body: 'return a % b;',
    description: 'Modulo operation',
    examples: ['mod(7, 3) // returns 1'],
  },
  'pow': {
    name: 'pow',
    parameters: [
      { name: 'base', type: 'number', required: true },
      { name: 'exponent', type: 'number', required: true },
    ],
    returnType: 'number',
    body: 'return Math.pow(base, exponent);',
    description: 'Power operation',
    examples: ['pow(2, 3) // returns 8'],
  },
  'sqrt': {
    name: 'sqrt',
    parameters: [
      { name: 'value', type: 'number', required: true },
    ],
    returnType: 'number',
    body: 'return Math.sqrt(value);',
    description: 'Square root',
    examples: ['sqrt(16) // returns 4'],
  },
  'abs': {
    name: 'abs',
    parameters: [
      { name: 'value', type: 'number', required: true },
    ],
    returnType: 'number',
    body: 'return Math.abs(value);',
    description: 'Absolute value',
    examples: ['abs(-5) // returns 5'],
  },
  'min': {
    name: 'min',
    parameters: [
      { name: 'values', type: 'number[]', required: true },
    ],
    returnType: 'number',
    body: 'return Math.min(...values);',
    description: 'Minimum value',
    examples: ['min([1, 5, 3]) // returns 1'],
  },
  'max': {
    name: 'max',
    parameters: [
      { name: 'values', type: 'number[]', required: true },
    ],
    returnType: 'number',
    body: 'return Math.max(...values);',
    description: 'Maximum value',
    examples: ['max([1, 5, 3]) // returns 5'],
  },
  
  // String functions
  'concat': {
    name: 'concat',
    parameters: [
      { name: 'strings', type: 'string[]', required: true },
    ],
    returnType: 'string',
    body: 'return strings.join(\'\');',
    description: 'Concatenate strings',
    examples: ['concat(["Hello", " ", "World"]) // returns "Hello World"'],
  },
  'uppercase': {
    name: 'uppercase',
    parameters: [
      { name: 'text', type: 'string', required: true },
    ],
    returnType: 'string',
    body: 'return text.toUpperCase();',
    description: 'Convert to uppercase',
    examples: ['uppercase("hello") // returns "HELLO"'],
  },
  'lowercase': {
    name: 'lowercase',
    parameters: [
      { name: 'text', type: 'string', required: true },
    ],
    returnType: 'string',
    body: 'return text.toLowerCase();',
    description: 'Convert to lowercase',
    examples: ['lowercase("HELLO") // returns "hello"'],
  },
  'length': {
    name: 'length',
    parameters: [
      { name: 'value', type: 'string | any[]', required: true },
    ],
    returnType: 'number',
    body: 'return value.length;',
    description: 'Get length of string or array',
    examples: ['length("hello") // returns 5', 'length([1, 2, 3]) // returns 3'],
  },
  
  // Array functions
  'filter': {
    name: 'filter',
    parameters: [
      { name: 'array', type: 'any[]', required: true },
      { name: 'predicate', type: 'function', required: true },
    ],
    returnType: 'any[]',
    body: 'return array.filter(predicate);',
    description: 'Filter array elements',
    examples: ['filter([1, 2, 3], x => x > 1) // returns [2, 3]'],
  },
  'map': {
    name: 'map',
    parameters: [
      { name: 'array', type: 'any[]', required: true },
      { name: 'transform', type: 'function', required: true },
    ],
    returnType: 'any[]',
    body: 'return array.map(transform);',
    description: 'Transform array elements',
    examples: ['map([1, 2, 3], x => x * 2) // returns [2, 4, 6]'],
  },
  'reduce': {
    name: 'reduce',
    parameters: [
      { name: 'array', type: 'any[]', required: true },
      { name: 'reducer', type: 'function', required: true },
      { name: 'initial', type: 'any', required: false },
    ],
    returnType: 'any',
    body: 'return array.reduce(reducer, initial);',
    description: 'Reduce array to single value',
    examples: ['reduce([1, 2, 3], (sum, x) => sum + x, 0) // returns 6'],
  },
  
  // Geographic functions
  'distance': {
    name: 'distance',
    parameters: [
      { name: 'lat1', type: 'number', required: true },
      { name: 'lng1', type: 'number', required: true },
      { name: 'lat2', type: 'number', required: true },
      { name: 'lng2', type: 'number', required: true },
    ],
    returnType: 'number',
    body: 'const R = 6371e3; // Earth\'s radius in meters\nconst φ1 = lat1 * Math.PI/180;\nconst φ2 = lat2 * Math.PI/180;\nconst Δφ = (lat2-lat1) * Math.PI/180;\nconst Δλ = (lng2-lng1) * Math.PI/180;\nconst a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);\nconst c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));\nreturn R * c;',
    description: 'Calculate distance between two points in meters',
    examples: ['distance(40.7128, -74.0060, 34.0522, -118.2437) // returns ~3935750'],
  },
  'bearing': {
    name: 'bearing',
    parameters: [
      { name: 'lat1', type: 'number', required: true },
      { name: 'lng1', type: 'number', required: true },
      { name: 'lat2', type: 'number', required: true },
      { name: 'lng2', type: 'number', required: true },
    ],
    returnType: 'number',
    body: 'const φ1 = lat1 * Math.PI/180;\nconst φ2 = lat2 * Math.PI/180;\nconst Δλ = (lng2-lng1) * Math.PI/180;\nconst y = Math.sin(Δλ) * Math.cos(φ2);\nconst x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);\nconst θ = Math.atan2(y, x);\nreturn (θ * 180/Math.PI + 360) % 360;',
    description: 'Calculate bearing between two points in degrees',
    examples: ['bearing(40.7128, -74.0060, 34.0522, -118.2437) // returns ~251'],
  },
  
  // Color functions
  'rgb': {
    name: 'rgb',
    parameters: [
      { name: 'r', type: 'number', required: true },
      { name: 'g', type: 'number', required: true },
      { name: 'b', type: 'number', required: true },
    ],
    returnType: 'string',
    body: 'return `rgb(${r}, ${g}, ${b})`;',
    description: 'Create RGB color string',
    examples: ['rgb(255, 0, 0) // returns "rgb(255, 0, 0)"'],
  },
  'rgba': {
    name: 'rgba',
    parameters: [
      { name: 'r', type: 'number', required: true },
      { name: 'g', type: 'number', required: true },
      { name: 'b', type: 'number', required: true },
      { name: 'a', type: 'number', required: true },
    ],
    returnType: 'string',
    body: 'return `rgba(${r}, ${g}, ${b}, ${a})`;',
    description: 'Create RGBA color string',
    examples: ['rgba(255, 0, 0, 0.5) // returns "rgba(255, 0, 0, 0.5)"'],
  },
  'hex': {
    name: 'hex',
    parameters: [
      { name: 'r', type: 'number', required: true },
      { name: 'g', type: 'number', required: true },
      { name: 'b', type: 'number', required: true },
    ],
    returnType: 'string',
    body: 'return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);',
    description: 'Create hex color string',
    examples: ['hex(255, 0, 0) // returns "#ff0000"'],
  },
  
  // Utility functions
  'random': {
    name: 'random',
    parameters: [
      { name: 'min', type: 'number', required: false },
      { name: 'max', type: 'number', required: false },
    ],
    returnType: 'number',
    body: 'if (min !== undefined && max !== undefined) {\n  return Math.random() * (max - min) + min;\n}\nreturn Math.random();',
    description: 'Generate random number',
    examples: ['random() // returns 0-1', 'random(1, 10) // returns 1-10'],
  },
  'clamp': {
    name: 'clamp',
    parameters: [
      { name: 'value', type: 'number', required: true },
      { name: 'min', type: 'number', required: true },
      { name: 'max', type: 'number', required: true },
    ],
    returnType: 'number',
    body: 'return Math.min(Math.max(value, min), max);',
    description: 'Clamp value between min and max',
    examples: ['clamp(15, 0, 10) // returns 10'],
  },
  'lerp': {
    name: 'lerp',
    parameters: [
      { name: 'start', type: 'number', required: true },
      { name: 'end', type: 'number', required: true },
      { name: 't', type: 'number', required: true },
    ],
    returnType: 'number',
    body: 'return start + (end - start) * t;',
    description: 'Linear interpolation',
    examples: ['lerp(0, 10, 0.5) // returns 5'],
  },
  'now': {
    name: 'now',
    parameters: [],
    returnType: 'number',
    body: 'return Date.now();',
    description: 'Get current timestamp',
    examples: ['now() // returns current timestamp'],
  },
  'timestamp': {
    name: 'timestamp',
    parameters: [
      { name: 'date', type: 'string', required: false },
    ],
    returnType: 'number',
    body: 'return date ? new Date(date).getTime() : Date.now();',
    description: 'Convert date string to timestamp',
    examples: ['timestamp("2024-01-01") // returns timestamp'],
  },
};

// DSL Templates
export const DSL_TEMPLATES = {
  // Basic tile layer
  'tile_layer': `
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
  
  interaction {
    clickable: false
    hoverable: false
    selectable: false
  }
  
  metadata {
    tags: ["base", "map", "osm"]
    category: "base"
    priority: 0
    dependencies: []
    version: "1.0.0"
  }
}`,

  // Vector layer with styling
  'vector_layer': `
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
}`,

  // Marker layer
  'marker_layer': `
layer "points_of_interest" {
  type: marker
  name: "Points of Interest"
  
  source {
    type: file
    path: "./data/pois.json"
    format: json
    cache {
      enabled: true
      ttl: 1800
      maxSize: 524288
    }
  }
  
  style {
    type: simple
    paint: {
      "marker-color": {
        property: "category"
        stops: [
          ["restaurant", "#ff6b6b"],
          ["hotel", "#4ecdc4"],
          ["attraction", "#45b7d1"],
          ["shop", "#96ceb4"]
        ]
      }
      "marker-size": 20
    }
  }
  
  visibility {
    visible: true
    opacity: 1.0
    zIndex: 15
    minZoom: 12
    maxZoom: 20
    zoomStrategy: progressive
  }
  
  interaction {
    clickable: true
    hoverable: true
    selectable: true
    events: [
      {
        type: click
        handler: "handlePOIClick"
      }
    ]
    tooltips: [
      {
        template: "{name}\\n{address}\\nRating: {rating}/5"
        variables: {
          name: "property.name"
          address: "property.address"
          rating: "property.rating"
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
        delay: 50
        duration: 3000
      }
    ]
  }
  
  metadata {
    tags: ["poi", "markers", "interest"]
    category: "points_of_interest"
    priority: 8
    dependencies: []
    version: "1.0.0"
  }
}`,

  // Heatmap layer
  'heatmap_layer': `
layer "population_density" {
  type: heatmap
  name: "Population Density"
  
  source {
    type: api
    url: "https://api.example.com/population"
    format: json
    credentials {
      apiKey: "your-api-key"
    }
    cache {
      enabled: true
      ttl: 3600
      maxSize: 2097152
    }
  }
  
  style {
    type: graduated
    paint: {
      "heatmap-color": {
        stops: [
          [0, "rgba(0, 0, 255, 0)"],
          [0.25, "rgba(0, 255, 0, 0.5)"],
          [0.5, "rgba(255, 255, 0, 0.5)"],
          [0.75, "rgba(255, 128, 0, 0.5)"],
          [1, "rgba(255, 0, 0, 0.5)"]
        ]
      }
      "heatmap-radius": 25
      "heatmap-weight": {
        property: "population"
        stops: [
          [0, 0],
          [1000, 0.5],
          [10000, 1]
        ]
      }
    }
  }
  
  visibility {
    visible: true
    opacity: 0.7
    zIndex: 5
    minZoom: 8
    maxZoom: 20
    zoomStrategy: adaptive
  }
  
  interaction {
    clickable: false
    hoverable: true
    events: [
      {
        type: hover
        handler: "handleHeatmapHover"
      }
    ]
  }
  
  metadata {
    tags: ["heatmap", "population", "density"]
    category: "analytics"
    priority: 3
    dependencies: []
    version: "1.0.0"
  }
}`,

  // Dynamic data layer
  'dynamic_layer': `
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
      "marker-size": {
        property: "severity"
        stops: [
          ["low", 15],
          ["medium", 20],
          ["high", 25],
          ["critical", 30]
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
    tooltips: [
      {
        template: "{title}\\n{description}\\nTime: {timestamp}"
        variables: {
          title: "property.title"
          description: "property.description"
          timestamp: "formatTimestamp(property.timestamp)"
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
        delay: 50
        duration: 3000
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
}`,
};

// Default configuration
export const DEFAULT_MAP_LAYER_CONFIG: Partial<MapLayerConfig> = {
  type: 'tile',
  source: {
    type: 'url',
    format: 'json',
    cache: {
      enabled: true,
      ttl: 3600,
      maxSize: 1048576,
    },
  },
  style: {
    type: 'simple',
    paint: {},
    layout: {},
  },
  visibility: {
    visible: true,
    opacity: 1.0,
    zIndex: 0,
    minZoom: 0,
    maxZoom: 20,
    zoomStrategy: 'fixed',
    fadeEffect: {
      enabled: false,
      duration: 300,
      easing: 'linear',
    },
  },
  interaction: {
    clickable: false,
    hoverable: false,
    selectable: false,
    draggable: false,
    resizable: false,
    editable: false,
    events: [],
    actions: [],
    tooltips: [],
    popups: [],
  },
  data: {},
  metadata: {
    tags: [],
    category: 'default',
    priority: 0,
    dependencies: [],
    version: '1.0.0',
  },
};

// Utility functions
export function validateMapLayerConfig(config: any): { valid: boolean; errors: string[] } {
  try {
    MapLayerConfigSchema.parse(config);
    return { valid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
      };
    }
    return {
      valid: false,
      errors: [error instanceof Error ? error.message : 'Unknown validation error'],
    };
  }
}

export function createMapLayerConfig(overrides: Partial<MapLayerConfig>): MapLayerConfig {
  const config = { ...DEFAULT_MAP_LAYER_CONFIG, ...overrides };
  const validation = validateMapLayerConfig(config);
  
  if (!validation.valid) {
    throw new Error(`Invalid layer configuration: ${validation.errors.join(', ')}`);
  }
  
  return config as MapLayerConfig;
}

export function getBuiltinFunction(name: string): DSLFunction | undefined {
  return BUILTIN_DSL_FUNCTIONS[name];
}

export function getBuiltinFunctionNames(): string[] {
  return Object.keys(BUILTIN_DSL_FUNCTIONS);
}

export function getTemplate(name: string): string | undefined {
  return DSL_TEMPLATES[name];
}

export function getTemplateNames(): string[] {
  return Object.keys(DSL_TEMPLATES);
}
