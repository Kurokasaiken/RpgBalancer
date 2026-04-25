import type { CSSProperties } from 'react';

/**
 * Configurazione centralizzata per la modalità di debug degli slot residenti.
 * Permette di evidenziare ghiera, medaglia e token del PG senza dover
 * intervenire manualmente sul DOM.
 */
export interface SlotDebugVisualizationConfig {
  /** Chiave di persistenza utilizzata dal PersistenceService */
  persistenceKey: string;
  /** Valore predefinito quando non esistono preferenze salvate */
  enabledByDefault: boolean;
  /** Mostra etichette tipografiche oltre agli overlay cromatici */
  showLabels: boolean;
  /** Palette dedicata agli overlay di debug */
  colors: {
    bezel: string;
    medal: string;
    pgToken: string;
    labelText: string;
    labelBackdrop: string;
  };
  /** Stili opzionali per etichette SVG */
  labelStyle?: CSSProperties;
}

export interface SlotDebugVisualizationSettings {
  enabled: boolean;
  showLabels: boolean;
  colors: SlotDebugVisualizationConfig['colors'];
}

export const SLOT_DEBUG_VISUALIZATION_CONFIG: SlotDebugVisualizationConfig = {
  persistenceKey: 'idleVillage_slot_debug_visualization',
  enabledByDefault: false,
  showLabels: true,
  colors: {
    bezel: '#FF5C8D',
    medal: '#FF1744', // Rosso vivo molto contrastante
    pgToken: '#4FD1C5',
    labelText: '#0B0F16',
    labelBackdrop: 'rgba(255,255,255,0.9)',
  },
  labelStyle: {
    fontFamily: 'Space Grotesk, system-ui, sans-serif',
    letterSpacing: '0.08em',
    fontWeight: 600,
  },
};
