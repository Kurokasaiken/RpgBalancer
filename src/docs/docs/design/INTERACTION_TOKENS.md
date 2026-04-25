# INTERACTION_TOKENS.md - Mapping Fisica-Narrativa-UI

## Overview
Questo documento definisce il mapping completo tra contesti narrativi, preset fisici del Physics Lab, colori di feedback UI e cue audio. È la fonte di verità per tutte le implementazioni di interazioni nel progetto RPG Balancer.

## Mapping Tabella Completa

| Contesto Narrativo | Preset Physics Lab | Colore Feedback | Audio Cue | Style Lab Token | Timing (ms) |
|-------------------|------------------|----------------|-----------|-----------------|-------------|
| **DRAG OPERATIONS** | | | | | |
| Drag personaggio Wilderness | light | verde-grigio (rgba(120, 140, 100, 0.8)) | fruscio leggero | --forest-drag | 0-100 |
| Drag personaggio Empire | heavy | sun-bronze (rgba(205, 127, 50, 0.8)) | impatto metallico | --empire-drag | 0-100 |
| Drag oggetto legame/quest | default | amber caldo (rgba(180, 100, 30, 0.8)) | whoosh caldo | --bond-drag | 0-100 |
| Drag risorsa (gold/materiale) | snappy | oro brillante (rgba(255, 215, 0, 0.8)) | tintinnio | --resource-drag | 0-100 |
| **DROP OPERATIONS** | | | | | |
| Drop valido slot Wilderness | default | verde foresta (rgba(44, 116, 66, 0.85)) | chime armonico | --valid-drop-forest | 100-300 |
| Drop valido slot Empire | heavy | sun-bronze (rgba(205, 127, 50, 0.85)) | campana bronze | --valid-drop-empire | 100-300 |
| Drop non valido | snappy | rosso mattone (rgba(142, 35, 35, 0.85)) | thud secco | --invalid-drop | 100-300 |
| Drop fuori area | light | grigio tenue (rgba(120, 120, 120, 0.6)) | sibilo | --outside-drop | 100-300 |
| **ASSIGNMENT OPERATIONS** | | | | | |
| Assegnazione quest | heavy | oro brillante (rgba(255, 215, 0, 0.9)) | campana solenne | --quest-assign | 100-300 |
| Assegnazione lavoro | default | verde foresta (rgba(44, 116, 66, 0.9)) | chime lavoro | --job-assign | 100-300 |
| Assegnazione training | light | azure (rgba(70, 130, 180, 0.9)) | whoosh training | --training-assign | 100-300 |
| **STATE CHANGES** | | | | | |
| Completamento successo | default | verde foresta (rgba(44, 116, 66, 1.0)) | vittoria breve | --success-complete | 300-1000 |
| Completamento parziale | default | ambra (rgba(180, 100, 30, 0.9)) | soddisfazione | --partial-complete | 300-1000 |
| Fallimento critico | snappy | rosso mattone (rgba(142, 35, 35, 1.0)) | allarme | --critical-fail | 300-1000 |
| **UI INTERACTIONS** | | | | | |
| Button click valido | light | verde foresta (rgba(44, 116, 66, 0.7)) | click morbido | --button-valid | 0-100 |
| Button click disabilitato | snappy | grigio (rgba(80, 80, 80, 0.7)) | click vuoto | --button-disabled | 0-100 |
| Hover interattivo | light | bianco caldo (rgba(255, 248, 220, 0.3)) | ronzio lieve | --hover-interactive | 0-100 |
| **ACTION CARD INTERACTIONS** | | | | | |
| ActionCard hover Wilderness | light | verde foresta (rgba(44, 116, 66, 0.3)) | ronzio lieve | --action-card-hover | 0-100 |
| ActionCard hover Empire | heavy | sun-bronze (rgba(205, 127, 50, 0.3)) | ronzio caldo | --action-card-hover | 0-100 |
| ActionCard click Wilderness | light | verde foresta (rgba(44, 116, 66, 0.7)) | click morbido | --action-card-click | 0-100 |
| ActionCard click Empire | heavy | sun-bronze (rgba(205, 127, 50, 0.7)) | click morbido | --action-card-click | 0-100 |
| ActionCard collect CTA Wilderness | light | verde foresta (rgba(44, 116, 66, 0.9)) | chime armonico | --action-card-collect | 100-300 |
| ActionCard collect CTA Empire | heavy | sun-bronze (rgba(205, 127, 50, 0.9)) | campana bronze | --action-card-collect | 100-300 |
| **ACTION HALO INTERACTIONS** | | | | | |
| ActionHalo hover Wilderness | light | verde foresta (rgba(44, 116, 66, 0.4)) | ronzio lieve | --action-halo-hover | 0-100 |
| ActionHalo hover Empire | heavy | sun-bronze (rgba(205, 127, 50, 0.4)) | ronzio caldo | --action-halo-hover | 0-100 |
| ActionHalo click Wilderness | light | verde foresta (rgba(44, 116, 66, 0.8)) | chime armonico | --action-halo-click | 0-100 |
| ActionHalo click Empire | heavy | sun-bronze (rgba(205, 127, 50, 0.8)) | campana bronze | --action-halo-click | 0-100 |
| ActionHalo pulse Wilderness | light | verde foresta (rgba(44, 116, 66, 0.6)) | pulsazione leggera | --action-halo-pulse | 2000-3000 |
| ActionHalo pulse Empire | heavy | sun-bronze (rgba(205, 127, 50, 0.8)) | pulsazione forte | --action-halo-pulse | 2000-3000 |

## Specifiche Physics Lab Presets

### Light (Wilderness/Nature)
- **Damping**: 0.92
- **Stiffness**: 0.15
- **Mass**: 0.8
- **Friction**: 0.98
- **Uso**: Oggetti naturali, personaggi Wilderness, interazioni leggere, ActionCard base, ActionHalo POI

### Heavy (Empire/Monumental)
- **Damping**: 0.88
- **Stiffness**: 0.25
- **Mass**: 1.5
- **Friction**: 0.95
- **Uso**: Oggetti Empire, quest importanti, ActionCard dettagliate, ActionHalo importanti

### Default (Standard)
- **Damping**: 0.90
- **Stiffness**: 0.20
- **Mass**: 1.0
- **Friction**: 0.96
- **Uso**: Interazioni standard, drag base, drop validi

### Snappy (Rejection/Error)
- **Damping**: 0.85
- **Stiffness**: 0.30
- **Mass**: 0.6
- **Friction**: 0.99
- **Uso**: Errori, reject, feedback negativi rapidi

## Colori Brand (Hex/RGBA)

### Verde Foresta (Wilderness)
- **Hex**: #2C7442
- **RGBA**: rgba(44, 116, 66, <alpha>)
- **Uso**: Successi Wilderness, nature, validazioni

### Sun-Bronze (Empire)
- **Hex**: #CD7F32
- **RGBA**: rgba(205, 127, 50, <alpha>)
- **Uso**: Successi Empire, monumentalità, oggetti preziosi

### Rosso Mattone (Error)
- **Hex**: #8E2323
- **RGBA**: rgba(142, 35, 35, <alpha>)
- **Uso**: Errori, fallimenti, reject

### Ambra Calda (Neutral)
- **Hex**: #B4641E
- **RGBA**: rgba(180, 100, 30, <alpha>)
- **Uso**: Interazioni neutre, drag base, warnings

### Azure (Sky/Training)
- **Hex**: #4682B4
- **RGBA**: rgba(70, 130, 180, <alpha>)
- **Uso**: Training, sky, abilities

## Audio Cue Specifications

### Chime Armonico
- **Frequenza**: 800Hz + 1200Hz
- **Durata**: 150ms
- **Envelope**: Soft attack, quick decay
- **Uso**: Drop validi Wilderness

### Campana Bronze
- **Frequenza**: 600Hz + 900Hz
- **Durata**: 200ms
- **Envelope**: Medium attack, medium decay
- **Uso**: Drop validi Empire, quest assign

### Thud Secco
- **Frequenza**: 200Hz
- **Durata**: 50ms
- **Envelope**: Hard attack, instant decay
- **Uso**: Drop invalidi, errori

### Whoosh Caldo
- **Frequenza**: White noise + 400Hz
- **Durata**: 100ms
- **Envelope**: Soft attack, medium decay
- **Uso**: Drag personaggi, bond drag

## Regole di Applicazione

### 1. Priorità Contesto
Il contesto narrativo ha sempre priorità sul tipo di interazione:
- Wilderness vs Empire → determina preset physics
- Quest vs Job vs Training → determina colore/audio

### 2. Fallback Chain
Se il contesto non è identificato:
1. Usa preset "default"
2. Colore "ambra calda"
3. Audio "click morbido"

### 3. Combinazioni Supportate
Alcune combinazioni hanno mapping specifici:
- Wilderness + Quest = Light + Verde Foresta + Chime
- Empire + Job = Heavy + Sun-Bronze + Campana
- Training (any) = Light + Azure + Whoosh
- ActionCard + Wilderness = Light + Verde Foresta + Ronzio lieve
- ActionCard + Empire = Heavy + Sun-Bronze + Ronzio caldo
- ActionHalo POI + Wilderness = Light + Verde Foresta + Pulsazione leggera
- ActionHalo POI + Empire = Heavy + Sun-Bronze + Pulsazione forte
- ActionCard Collect CTA + Wilderness = Light + Verde Foresta + Chime armonico
- ActionCard Collect CTA + Empire = Heavy + Sun-Bronze + Campana bronze

### 4. Variazioni Alpha
L'alpha del colore varia per tipo di feedback:
- **Drag**: 0.8 (semi-trasparente)
- **Drop valido**: 0.85 (più opaco)
- **Stato finale**: 1.0 (completamente opaco)
- **Hover**: 0.3 (molto trasparente)

## Implementazione Style Lab

### Token Structure
```css
:root {
  /* Physics Lab Colors */
  --forest-drag: rgba(120, 140, 100, 0.8);
  --empire-drag: rgba(205, 127, 50, 0.8);
  --valid-drop-forest: rgba(44, 116, 66, 0.85);
  --valid-drop-empire: rgba(205, 127, 50, 0.85);
  --invalid-drop: rgba(142, 35, 35, 0.85);
  --quest-assign: rgba(255, 215, 0, 0.9);
  
  /* ActionCard Tokens */
  --action-card-hover-wilderness: rgba(44, 116, 66, 0.3);
  --action-card-hover-empire: rgba(205, 127, 50, 0.3);
  --action-card-click-wilderness: rgba(44, 116, 66, 0.7);
  --action-card-click-empire: rgba(205, 127, 50, 0.7);
  --action-card-collect-wilderness: rgba(44, 116, 66, 0.9);
  --action-card-collect-empire: rgba(205, 127, 50, 0.9);
  
  /* ActionHalo Tokens */
  --action-halo-hover-wilderness: rgba(44, 116, 66, 0.4);
  --action-halo-hover-empire: rgba(205, 127, 50, 0.4);
  --action-halo-click-wilderness: rgba(44, 116, 66, 0.8);
  --action-halo-click-empire: rgba(205, 127, 50, 0.8);
  --action-halo-pulse-wilderness: rgba(44, 116, 66, 0.6);
  --action-halo-pulse-empire: rgba(205, 127, 50, 0.8);
  
  /* Audio Cue References */
  --audio-chime-harmonic: 'chime_harmonic.mp3';
  --audio-campana-bronze: 'campana_bronze.mp3';
  --audio-thud-secco: 'thud_secco.mp3';
  --audio-whoosh-caldo: 'whoosh_caldo.mp3';
  --audio-ronzio-lieve: 'ronzio_lieve.mp3';
  --audio-ronzio-caldo: 'ronzio_caldo.mp3';
  --audio-pulsazione-leggera: 'pulsazione_leggera.mp3';
  --audio-pulsazione-forte: 'pulsazione_forte.mp3';
}
```

### Helper Functions
```typescript
export function getInteractionToken(
  context: NarrativeContext,
  interaction: InteractionType
): InteractionToken {
  // Lookup in mapping table
  // Return complete token with physics, color, audio
}
```

## Test Coverage

### Unit Tests Required
- Mapping lookup accuracy
- Color RGBA conversion
- Physics preset application
- Audio cue selection
- Fallback chain behavior

### Integration Tests Required
- End-to-end drag/drop flows
- Cross-context interactions
- Audio + visual synchronization
- Performance under load

### E2E Tests Required
- Real user interaction flows
- Accessibility (screen reader + audio)
- Mobile touch interactions
- Keyboard navigation

## Version History

- **v1.0** - Initial mapping table
- **v1.1** - Added training context
- **v1.2** - Updated color brand values
- **v1.3** - Added audio specifications

## References

- Game Feel & Juice Design Guide - Timing principles (0-100ms, 100-300ms, 300-1000ms)
- Art Direction DNA - Wilderness vs Empire pillars
- Physics Lab Documentation - Preset configurations
- Style Lab Token System - CSS variable structure
