# Visual Design Philosophy - Blizzard-Style Layered Components

## Overview

Questo documento descrive la filosofia di design grafico usata nel progetto RPG Balancer per creare componenti UI ricchi e materici, ispirati allo stile Blizzard: tanti layer, imperfezioni organiche, texture complesse, e animazioni sottili.

## Core Principles

### 1. Multi-Layer Architecture

Ogni componente visivo è costruito con **8-12 layer** che si sovrappongono per creare profondità e complessità:

**Layer Pattern Tipico (dal basso all'alto):**
1. **Base Layer** - Forma primaria con colore solido
2. **Texture Layer** - Rumore organico (feTurbulence)
3. **Gradient Layer** - Sfumature radiali/lineari
4. **Highlight Layer** - Riflessi e specchi
5. **Detail Layer** - Imperfezioni, scratches, patina
6. **Overlay Layer** - Effetti di vetro, cristallo
7. **Accent Layer** - Bordi, anelli decorativi
8. **Animation Layer** - Elementi animati (pulse, flicker)
9. **Shadow Layer** - Ombre per profondità
10. **Glow Layer** - Bloom e glow esterni

### 2. Organic Imperfections

**Niente superfici perfette.** Ogni componente ha imperfezioni organiche che lo rendono "materico":

- **feTurbulence filters** per creare texture naturali
- **Scratches e nicks** sui bordi metallici
- **Patina spots** per ossidazione
- **Oxidation streaks** per invecchiamento
- **Noise overlay** per rugosità

**Esempio - Bronze Texture:**
```svg
<filter id="f-nm" x="0%" y="0%" width="100%" height="100%">
  <feTurbulence type="fractalNoise" baseFrequency="0.52" numOctaves="4" seed="3" stitchTiles="stitch" result="n" />
  <feColorMatrix in="n" type="matrix" values="0 0 0 0 .068  0 0 0 0 .046  0 0 0 0 .021  0 0 0 .25 0" result="c" />
  <feBlend in="SourceGraphic" in2="c" mode="overlay" />
</filter>
```

### 3. Complex Gradient Systems

**Gradient multipli per ricchezza cromatica:**

- **Radial gradients** per illuminazione da sorgente puntiforme
- **Linear gradients** per riflessi direzionali
- **Multi-stop gradients** (6-8 stop) per transizioni ricche
- **Specular gradients** per riflessi metallici
- **Vignette gradients** per profondità

**Esempio - Bronze Gradient:**
```svg
<linearGradient id="g-b" x1="14%" y1="4%" x2="86%" y2="96%">
  <stop offset="0%" stopColor="#fce890" />   <!-- Light highlight -->
  <stop offset="9%" stopColor="#e4b048" />   <!-- Mid-light -->
  <stop offset="28%" stopColor="#a05c18" />  <!-- Mid-tone -->
  <stop offset="52%" stopColor="#602c08" />  <!-- Mid-dark -->
  <stop offset="76%" stopColor="#341604" />  <!-- Dark -->
  <stop offset="100%" stopColor="#0e0602" /> <!-- Shadow -->
</linearGradient>
```

### 4. Subtle Animations

**Animazioni che danno vita senza distrarre:**

- **Breathing** - Opacity 0.68 ↔ 0.92 (9.4s ease-in-out)
- **Flicker** - Steps(1,end) per effetto torch/fiamma (4.3s)
- **Pulse** - Scale 1.0 ↔ 1.1 (2.5s)
- **Drift** - Movimento lento di particelle
- **Sweep** - Arco di luce che si muove

**Esempio - Rim Breathing:**
```css
@keyframes rim-breath {
  0%, 100% { opacity: 0.92; }
  45% { opacity: 0.68; }
  75% { opacity: 0.85; }
}

.rim {
  animation: rim-breath 9.4s ease-in-out infinite;
}
```

### 5. Config-First Design

**Tutti i parametri visivi sono configurabili:**

- Color tokens con label descrittive
- Filter parameters (baseFrequency, numOctaves, seed)
- Animation timing (duration, easing, keyframes)
- Particle systems (spawnInterval, speedRange, lifetime)
- Layer opacity e blend modes

**Esempio - Config Structure:**
```typescript
{
  colorTokens: {
    'corona.core': { r: 210, g: 138, b: 28, label: 'Colore principale arco' },
    'rim.stop0': '#fce890',
    'stone.ambient': 'rgba(255,220,120,.22)',
  },
  filters: {
    'rim.imperfections': {
      baseFrequency: '0.8 0.4',
      numOctaves: 3,
      seed: 22,
      blendAlpha: 0.18,
    },
  },
  animation: {
    'rim.breath': { duration: '9.4s', easing: 'ease-in-out', opacityMin: 0.68, opacityMax: 0.92 },
  },
}
```

## Component Examples

### POI Skin (Point of Interest)

**Struttura Layer:**
1. **Stone Field** - Cerchio base con gradient radiale + noise
2. **Rim Circle** - Anello bronzo con imperfezioni + breathing animation
3. **Corona Glow** - Glow esterno con blur
4. **Corona Turbulence A** - Arco animato con displacement
5. **Corona Turbulence B** - Arco secondario più veloce
6. **Corona Reflect** - Highlight arc
7. **Pin Icon** - Icona centrale con flicker
8. **Particle Layer** - Particelle animate

**Key SVG Filters:**
- `feTurbulence` per texture organica
- `feDisplacementMap` per distorsione animata
- `feGaussianBlur` per glow e bloom
- `feColorMatrix` per color correction

**File di riferimento:**
- `poi-skin-preview.html` - HTML standalone con preview
- `src/ui/idleVillage/skins/poi/poiAmberSkinConfig.ts` - Config TypeScript

### Wanderlust Medal

**Struttura Layer:**
1. **Bronze Body** - Cerchio esterno con gradient bronze + noise
2. **Bevel Diagonal** - Effetto smusso con gradient diagonale
3. **Rim Top** - Arco di luce calda
4. **Inner Ring** - Anello separatore
5. **Field Stone** - Campo centrale con gradient scuro
6. **Portrait** - Immagine reale con vignette
7. **Glass Layer** - Effetto cristallo convesso
8. **Patina** - Macchie di ossidazione
9. **Scratches** - Graffi e nicks
10. **Gem Stone** - Gemma con facets e glow

**Key Features:**
- Canvas-based rim sweep animation
- Multiple gradient systems per ogni layer
- Animated gem con pulse effect
- Glass simulation con radial gradients

**File di riferimento:**
- `medal4.html` - HTML standalone con preview
- `src/ui/idleVillage/components/WanderlustMedalOverlay.tsx` - Component React

## Technical Implementation

### SVG Filter Library

**Filters Comuni Usati:**

**1. Noise Texture (fractalNoise):**
```svg
<filter id="noise-texture">
  <feTurbulence type="fractalNoise" baseFrequency="0.52" numOctaves="4" seed="3" stitchTiles="stitch" result="n" />
  <feColorMatrix in="n" type="matrix" values="0 0 0 0 .068  0 0 0 0 .046  0 0 0 0 .021  0 0 0 .25 0" result="c" />
  <feBlend in="SourceGraphic" in2="c" mode="overlay" />
</filter>
```

**2. Displacement Animation:**
```svg
<filter id="displacement">
  <feTurbulence type="turbulence" baseFrequency="0.030" numOctaves="3" seed="7" result="t">
    <animate attributeName="seed" values="7;8;9;7" dur="3.1s" repeatCount="indefinite"/>
  </feTurbulence>
  <feDisplacementMap in="SourceGraphic" in2="t" scale="3.5" xChannelSelector="R" yChannelSelector="G" />
</filter>
```

**3. Glow/Bloom:**
```svg
<filter id="glow">
  <feGaussianBlur stdDeviation="4" result="blur" />
  <feComposite in="SourceGraphic" in2="blur" operator="over" />
</filter>
```

**4. Glass Effect:**
```svg
<filter id="glass">
  <feGaussianBlur stdDeviation="1.5" result="blur" />
  <feComposite in="SourceGraphic" in2="blur" operator="over" />
</filter>
```

### Gradient Patterns

**Radial Gradient per Illuminazione:**
```svg
<radialGradient id="illumination" cx="40%" cy="30%" r="60%">
  <stop offset="0%" stopColor="#ffffff" />     <!-- Highlight -->
  <stop offset="40%" stopColor="#e0e0e0" />    <!-- Mid -->
  <stop offset="100%" stopColor="#808080" />   <!-- Shadow -->
</radialGradient>
```

**Linear Gradient per Riflessi:**
```svg
<linearGradient id="reflection" x1="0%" y1="0%" x2="100%" y2="100%">
  <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
  <stop offset="50%" stopColor="rgba(255,255,255,0.1)" />
  <stop offset="100%" stopColor="rgba(255,255,255,0)" />
</linearGradient>
```

### Animation Patterns

**Breathing (Subtle Opacity):**
```css
@keyframes breathe {
  0%, 100% { opacity: 0.92; }
  50% { opacity: 0.68; }
}

.element {
  animation: breathe 9.4s ease-in-out infinite;
}
```

**Flicker (Torch/Flame):**
```css
@keyframes flicker {
  0%, 100% { opacity: 0.50; }
  25% { opacity: 0.85; }
  50% { opacity: 0.30; }
  75% { opacity: 0.65; }
}

.flame {
  animation: flicker 4.3s steps(1, end) infinite;
}
```

**Pulse (Scale):**
```css
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.pulse {
  animation: pulse 2.5s ease-in-out infinite;
}
```

## Art Direction Alignment

### Gilded Observatory Theme

**Palette di Riferimento:**
- **Obsidian backgrounds:** #050509, #0f1a1d
- **Slate borders:** #3b4b4d
- **Ivory text:** #f0efe4
- **Teal accents:** #8db3a5
- **Gold highlights:** #c9a227

**Regole:**
- Tutti i componenti devono funzionare con la palette Gilded Observatory
- Ombre non sono mai grigie/marroni, ma teal/smeraldo
- Luce è bianca accecante con lens flare prismatici

### Wanderlust DNA

**Dual Pillars:**
- **Wilderness:** Rude beauty, golden thatch, timber, azure sky
- **Empire:** Solar baroque, basalt, sun-bronze, indigo

**Split Rendering:**
- **Faces:** Ruan Jia polish, flawless, digital
- **Bodies/Matter:** Jaime Jones impasto, thick brushstrokes

**Kill List:**
- NO grim (sporcizia fine a se stessa)
- NO mud (colori fangosi)
- NO symmetry (architetture asimmetriche)
- NO flat design (superfici lisce digitali)

## Workflow per Nuovi Componenti

### 1. HTML Prototype

Crea un file HTML standalone per iterare sulla grafica:

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    /* CSS per layout e animazioni */
  </style>
</head>
<body>
  <svg>
    <defs>
      <!-- Gradient e filters -->
    </defs>
    <!-- Layer SVG -->
  </svg>
  <script>
    // JavaScript per animazioni complesse
  </script>
</body>
</html>
```

### 2. Layer Construction

Costruisci il componente layer per layer:

1. **Base shape** - Forma geometrica di base
2. **Primary gradient** - Gradient principale
3. **Texture filter** - Aggiungi rumore organico
4. **Secondary gradients** - Gradient per dettagli
5. **Highlights** - Riflessi e specchi
6. **Imperfections** - Scratches, patina
7. **Overlay effects** - Vetro, cristallo
8. **Animations** - Breathing, flicker, pulse
9. **Shadows** - Ombre per profondità
10. **Glow** - Bloom esterno

### 3. Config Extraction

Estrai i parametri in una config TypeScript:

```typescript
export const COMPONENT_SKIN_CONFIG = {
  id: 'component-skin-id',
  name: 'Component Name',
  version: '1.0.0',
  htmlTemplate: `<!-- SVG HTML -->`,
  cssStyles: `/* CSS styles */`,
  colorTokens: {
    'primary': { r: 210, g: 138, b: 28, label: 'Primary color' },
  },
  filters: {
    'texture': {
      baseFrequency: '0.52',
      numOctaves: 4,
      seed: 3,
    },
  },
  animation: {
    'breathe': {
      duration: '9.4s',
      easing: 'ease-in-out',
      opacityMin: 0.68,
      opacityMax: 0.92,
    },
  },
};
```

### 4. React Integration

Crea il componente React:

```typescript
import React from 'react';
import { COMPONENT_SKIN_CONFIG } from './componentSkinConfig';

export const ComponentSkin: React.FC<ComponentProps> = ({ isActive, isDragging }) => {
  return (
    <div className="component-wrapper">
      <svg dangerouslySetInnerHTML={{ __html: COMPONENT_SKIN_CONFIG.htmlTemplate }} />
      <style>{COMPONENT_SKIN_CONFIG.cssStyles}</style>
    </div>
  );
};
```

### 5. Testing

- Verifica rendering su diversi browser
- Testa animazioni (performance)
- Controlla accessibilità (ARIA labels)
- Valuta coerenza con Gilded Observatory theme

## Best Practices

### DO

- ✅ Usa 8-12 layer per profondità
- ✅ Aggiungi imperfezioni organiche (noise, scratches)
- ✅ Usa gradient multipli (6-8 stop)
- ✅ Animazioni sottili (breathing, flicker)
- ✅ Config-first per tutti i parametri
- ✅ Coerenza con palette Gilded Observatory
- ✅ HTML prototype prima di React integration
- ✅ JSDoc completo per tutte le funzioni

### DON'T

- ❌ Superfici lisce perfette
- ❌ Gradient semplici (2-3 stop)
- ❌ Animazioni veloci/distrattive
- ❌ Hardcoded color values
- ❌ Ombre grigie/marroni
- ❌ Simmetria perfetta
- ❌ Flat design digitale

## File di Riferimento

### HTML Prototypes
- `poi-skin-preview.html` - POI skin con preview interattivo
- `medal4.html` - Wanderlust medal con animazioni
- `debug-drag-test.html` - Drag & drop debug
- `debug-drag-detailed.html` - Drag & drop dettagliato

### Config Files
- `src/ui/idleVillage/skins/poi/poiAmberSkinConfig.ts` - POI skin config
- `src/ui/idleVillage/skins/dayNightPoiSkinConfig.ts` - Day/night POI config
- `src/ui/idleVillage/skins/slotRackSkinConfig.ts` - Slot rack config

### React Components
- `src/ui/idleVillage/components/WanderlustMedalOverlay.tsx` - Medal component
- `src/ui/idleVillage/components/SlottedMedalSkin.tsx` - Medal skin component
- `src/ui/idleVillage/components/PoiSkinAware.tsx` - POI skin wrapper

### Art Direction
- `src/docs/docs/plans/art_direction_plan.md` - Bibbia art direction
- `src/docs/docs/plans/idle_village_art_style_plan.md` - Idle village art style
- `src/docs/docs/archmage/ArtDirection_Wanderlust.md` - Wanderlust DNA summary

## Prompt per Claude

Quando chiedi a Claude di creare nuovi componenti con questo stile, usa questo prompt:

```
Crea un componente UI seguendo la filosofia "Blizzard-Style Layered Components" descritta in docs/visual_design_philosophy.md.

Requisiti:
1. Multi-layer architecture (8-12 layer per profondità)
2. Organic imperfections (feTurbulence per texture, scratches, patina)
3. Complex gradient systems (6-8 stop radial/linear gradients)
4. Subtle animations (breathing, flicker, pulse - 2-10s duration)
5. Config-first design (tutti i parametri in config TypeScript)
6. Coerenza con Gilded Observatory palette (obsidian, slate, ivory, teal, gold)
7. HTML prototype standalone prima di React integration
8. JSDoc completo per tutte le funzioni

Workflow:
1. Crea HTML prototype con SVG layers
2. Estrai parametri in config TypeScript
3. Integra in React component
4. Aggiungi animazioni CSS/JS
5. Testa rendering e performance

Riferimenti:
- poi-skin-preview.html per esempio POI
- medal4.html per esempio Medal
- src/ui/idleVillage/skins/poi/poiAmberSkinConfig.ts per config structure
```

## Conclusioni

Questa filosofia di design produce componenti UI ricchi, materici e "vivi" che si distinguono per:

- **Profondità visiva** - Layer multipli creano senso di tridimensionalità
- **Autenticità** - Imperfezioni organiche rendono i componenti realistici
- **Ricchezza cromatica** - Gradient complessi per transizioni sofisticate
- **Vitalità** - Animazioni sottili danno vita senza distrarre
- **Manutenibilità** - Config-first design per facile iterazione
- **Coerenza** - Allineamento con Gilded Observatory theme

Usa questo documento come guida per creare nuovi componenti che mantengano lo stesso livello di qualità e dettaglio.
