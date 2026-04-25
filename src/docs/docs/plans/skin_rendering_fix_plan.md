# Skin Rendering Fix — Diagnosi e Piano di Implementazione

## Data: 2026-03-10
## Stato: DRAFT — In attesa di approvazione

---

## 1. DIAGNOSI: Perché le Skin Non Si Vedono

### 1.1 Il Pipeline Attuale (Broken)

```
JSON Skin Files                    HTML Reference Files
(slot-v12-skin.json)               (medal4.html, material-canvas-v2.html)
(slot-rack-iron-bronze.skin.json)
         │                                    │
         ▼                                    │
Converted Config                              │
(slotWildernessBronzeConfig.ts)               │
  → htmlTemplate: string  ◄──────────────────►│  (SIMILE ma SEMPLIFICATO)
  → cssStyles: string                         │
         │                                    │
         ▼                                    │
temporarySkinRegistry.ts                      │
  Map<id, TemporarySkinConfig>                │
         │                                    │
         ▼                                    ▼
SlotRackWithSkin                        WHAT YOU EXPECT
  → getTemporarySkinConfig()            (SVG filters, lighting,
  → SkinSlot wrapper                     specular highlights,
         │                               oxidation textures,
         ▼                               halo canvas, animations)
    useSkinSlot hook                          │
      → skinSystem.generateClasses()         │
      → skinSystem.generateAttributes()      │
      → skinSystem.generateStyles()          │
         │                                    │
         ▼                                    │
    WHAT YOU GET                              │
    (CSS classes: "slot-v12--wilderness")     │
    (data-attrs: data-slot-skin="...")   ◄────┘  NESSUNA CONNESSIONE
    (NO visual rendering)
```

### 1.2 I Tre Problemi Root-Cause

#### PROBLEMA 1: htmlTemplate e cssStyles sono Dead Data
`slotWildernessBronzeConfig.ts` converte il JSON in `TemporarySkinConfig` con:
- `htmlTemplate`: stringa HTML con struttura SVG slot
- `cssStyles`: stringa CSS con gradienti, animazioni, shadows

**MA** `SlotRackWithSkin` chiama `getTemporarySkinConfig(skinId)`, riceve il config, 
e poi lo passa a `SkinSlot` che usa `useSkinSlot` — un hook che genera SOLO:
- CSS class names generiche (`slot-v12--wilderness`)
- data attributes (`data-slot-skin="slot_wilderness_bronze"`)
- inline styles minimali (vuoti di default)

**htmlTemplate e cssStyles non vengono MAI iniettati nel DOM.**

#### PROBLEMA 2: Due Sistemi Skin Paralleli Disconnessi

| Sistema | File | Usato da | Cosa fa |
|---------|------|----------|---------|
| **TemporarySkinConfig** | `temporarySkinRegistry.ts` | `SlotRackWithSkin` | Ha htmlTemplate + cssStyles ma NON li renderizza |
| **SlotRackSkinConfig** | `slotRackSkinConfig.ts` | `ResidentSlotRackSkin` | Ha CSS vars ma sono solo `--slot-rack-bg`, `--slot-rack-border` etc. |

Nessuno dei due sistemi renderizza l'HTML/SVG complesso dei prototipi HTML.

#### PROBLEMA 3: Gap tra CSS Variables e SVG Rendering

I prototipi HTML (`medal4.html`, `material-canvas-v2.html`) usano:
- **SVG inline** con `<radialGradient>`, `<linearGradient>`, `<feSpecularLighting>`, `<feTurbulence>`
- **Canvas 2D** per halo arcs
- **SVG filters** per texture basalto, venature, ossidazione
- **CSS animations** complesse multi-fase (lock, spring-back)

I componenti React attualmente applicano:
- CSS custom properties (`--slot-rack-bg: #0e0f10`)
- `background: var(--slot-rack-bg-gradient)` — un semplice `linear-gradient`
- `border: var(--slot-rack-border)` — un bordo piatto

**Il divario è enorme.** È come confrontare una foto con una descrizione testuale.

### 1.3 Cosa Succede Concretamente

Quando apri `/test` e vedi Rack A e Rack B:

1. `ResidentSlotRackSkin` applica `SLOT_RACK_IRON_BRONZE_CONFIG.cssVars` al `<html>` root
2. Queste CSS vars definiscono colori piatti: `--slot-rack-bg: #0e0f10`, `--slot-rack-border: 2px solid #3a2008`
3. Il wrapper applica `background: var(--slot-rack-bg-gradient)` e `border: var(--slot-rack-border)`
4. **Risultato**: un rettangolo scuro con bordo marrone

**Cosa dovrebbe essere**: un tray di ferro ossidato con texture feTurbulence, borchie rivettate con specular lighting, edge bronzei con gradiente 3D, cavità slot con venature anisotropiche, ghiera argento con 16 segmenti rotanti, medaglioni con highlights, halo canvas con arco animato.

---

## 2. COME FUNZIONANO (DOVREBBERO FUNZIONARE) I JSON SKIN

### 2.1 Il Contratto del JSON

Il `slot-v12-skin.json` è un **design token document** che descrive:

```
geometry     → Dimensioni SVG (raggi, spessori)
colorTokens  → Colori per ogni layer (cavity, collar, bezel, medal, halo)
filters      → SVG filter definitions (basalt texture, vein texture, silver texture)
animations   → Keyframes e durate per ogni stato
states       → Configurazione per empty/occupied/locking
componentSlots → Mapping DOM selectors per slot injection
```

### 2.2 Il Contratto Mancante

Il JSON descrive COSA renderizzare. Manca il **renderer** che:
1. Legge geometry → genera SVG viewBox e paths
2. Legge colorTokens → genera `<defs>` con `<radialGradient>`, `<linearGradient>`
3. Legge filters → genera `<filter>` con `<feTurbulence>`, `<feSpecularLighting>`
4. Legge animations → genera CSS @keyframes o JS requestAnimationFrame
5. Legge states → applica classi/attributi per stato corrente

**Questo renderer non esiste.** I prototipi HTML lo fanno a mano, inline.

---

## 3. PIANO DI IMPLEMENTAZIONE

### 3.1 Strategia Raccomandata: Pagina Isolata → Iterazione → Estrazione

**SÌ**, la tua intuizione è corretta. La strategia migliore è:

1. **Creare una pagina isolata** (`/skin-lab`) con UN solo componente
2. **Iniettare l'HTML del prototipo** direttamente (dangerouslySetInnerHTML)
3. **Verificare che si vede corretto** (match 1:1 con l'HTML reference)
4. **Progressivamente convertire** da HTML inline → React component che legge dal JSON
5. **Estrarre** il componente finito nella struttura esistente

### 3.2 Fasi Dettagliate

---

#### FASE 0: Setup Pagina Isolata (30 min)

**Obiettivo**: Nuova route `/skin-lab` con un solo slot component che renderizza l'HTML del prototipo.

**Steps**:
1. Creare `src/pages/SkinLabPage.tsx` — pagina minimale, sfondo nero, centrata
2. Aggiungere route in `App.tsx`: `<Route path="/skin-lab" component={SkinLabPage} />`
3. Copiare l'SVG/CSS da `medal4.html` direttamente nel componente
4. **Checkpoint visivo**: aprire `/skin-lab` e verificare che il medaglione si vede IDENTICO all'HTML

**Criterio di successo**: Lo slot renderizzato su `/skin-lab` è visivamente identico a `medal4.html` aperto nel browser.

---

#### FASE 1: Slot V12 Standalone (2-3h)

**Obiettivo**: Creare `SlotV12Renderer` che legge `slot-v12-skin.json` e renderizza SVG completo.

**Steps**:
1. Creare `src/ui/idleVillage/components/SlotV12Renderer.tsx`
2. Il componente riceve `skinConfig: SlotV12SkinData` (parsed dal JSON)
3. Genera SVG inline con:
   - `<defs>` per tutti i gradienti (da `colorTokens`)
   - `<filter>` per tutte le texture (da `filters`)
   - Layer nell'ordine corretto (da `metadata.layerOrder`):
     - shadow-circles
     - cavity-group (clipped a R_BZ_IN)
     - collar-ring (R_CAV → R_BZ_IN)
     - bezel-group (silver, segmenti rotanti, denti)
     - medal-group (solo se occupied)
     - halo-canvas (solo se occupied)
4. Applica animazioni CSS (da `animations`)
5. Gestisce stati (da `states`): empty → occupied → locking

**Troubleshooting step-by-step**:
- Iniziare con solo la cavity (gradiente radiale)
- Aggiungere il collar (gradiente lineare bronzo)
- Aggiungere la bezel (gradiente argento + segments)
- Aggiungere i teeth (3 artigli)
- Aggiungere il medal (quando occupied)
- Aggiungere il halo canvas
- Ad ogni step: confronto visivo con HTML reference

**Criterio di successo**: `SlotV12Renderer` su `/skin-lab` produce output identico a `medal4.html`.

---

#### FASE 2: Rack Renderer (1-2h)

**Obiettivo**: Creare `SlotRackRenderer` che legge `slot-rack-iron-bronze.skin.json` e renderizza il tray.

**Steps**:
1. Creare `src/ui/idleVillage/components/SlotRackRenderer.tsx`
2. Il componente riceve `rackSkinConfig` + `slotSkinConfig`
3. Genera il tray con:
   - Background con SVG feTurbulence texture (da `texture`)
   - Edge bronzei con gradient 3D (da `colors.edge*`)
   - Borchie rivettate (da `colors.rivet*`)
   - Contact shadow (da `shadows`)
   - Inner shadows multi-direzione
4. Posiziona N `SlotV12Renderer` dentro il tray
5. Applica animazione entry drop-in (da `animations.entry`)

**Criterio di successo**: `/skin-lab` mostra il rack completo con 3 slot, identico a come appare nel prototipo HTML.

---

#### FASE 3: Integrazione con Sistema Esistente (2-3h)

**Obiettivo**: I nuovi renderer sostituiscono i wrapper attuali nella TestRosterPage.

**Steps**:
1. `SlotRackWithSkin` ora usa `SlotRackRenderer` internamente
2. `ResidentSlotRackSkin` delega a `SlotRackRenderer` per il rendering visivo
3. I JSON skin vengono importati come moduli (già fatto per `slot-v12-skin.json`)
4. Mantenere backward compatibility con CSS vars per componenti che ne dipendono
5. Connettere stato occupied/empty dal `useResidentSlotController`

**Criterio di successo**: Rack A e Rack B su `/test` mostrano le skin corrette.

---

#### FASE 4: Animazioni e Interazioni (1-2h)

**Obiettivo**: Lock animation, halo canvas, drag-and-drop feedback.

**Steps**:
1. Implementare animazione lock (3 fasi dal JSON: scale, teeth-press, spring-back)
2. Implementare halo canvas con arc fill animato
3. Collegare drag-and-drop: quando un PG viene droppato, trigger lock animation
4. Metal-click feedback visivo al drop

**Criterio di successo**: Assegnare un PG a uno slot produce l'animazione lock completa.

---

### 3.3 Decisione Architettonica Chiave

**Opzione A — SVG-in-React (RACCOMANDATA)**:
- Il componente React genera SVG inline leggendo dal JSON
- Più manutenibile, testabile, animabile con React state
- Ogni layer è un componente React figlio

**Opzione B — dangerouslySetInnerHTML permanente**:
- Inietta htmlTemplate + cssStyles dal TemporarySkinConfig
- Veloce ma fragile, difficile da collegare a React state
- Non raccomandato per produzione

**Opzione C — CSS-only con variables**:
- Quello che esiste oggi
- Impossibile replicare SVG filters e lighting con solo CSS
- NON sufficiente per raggiungere la qualità dei prototipi HTML

**Raccomandazione**: Opzione A per Fase 1-4. Opzione B come fallback rapido per Fase 0 (prototipo su `/skin-lab`).

---

## 4. TIMELINE STIMATA

| Fase | Durata | Dipendenze |
|------|--------|------------|
| **Fase 0**: Pagina isolata | 30 min | Nessuna |
| **Fase 1**: Slot V12 Renderer | 2-3h | Fase 0 |
| **Fase 2**: Rack Renderer | 1-2h | Fase 1 |
| **Fase 3**: Integrazione | 2-3h | Fase 2 |
| **Fase 4**: Animazioni | 1-2h | Fase 3 |
| **Totale** | **7-11h** | — |

---

## 5. FILE DA CREARE/MODIFICARE

### Nuovi File
- `src/pages/SkinLabPage.tsx` — Pagina isolata per iterazione visiva
- `src/ui/idleVillage/components/SlotV12Renderer.tsx` — SVG renderer per slot
- `src/ui/idleVillage/components/SlotRackRenderer.tsx` — SVG renderer per rack

### File da Modificare
- `src/App.tsx` — Aggiungere route `/skin-lab`
- `src/ui/idleVillage/components/SlotRackWithSkin.tsx` — Usare SlotRackRenderer
- `src/ui/idleVillage/components/ResidentSlotRackSkin.tsx` — Delegare a SlotRackRenderer

### File di Riferimento (Non Modificare)
- `slot-v12-skin.json` — Source of truth per slot design
- `slot-rack-iron-bronze.skin.json` — Source of truth per rack design
- `medal4.html` — Reference visivo per slot
- `material-canvas-v2.html` — Reference visivo per materiali

---

## 6. RISCHI E MITIGAZIONI

| Rischio | Probabilità | Mitigazione |
|---------|-------------|-------------|
| SVG filters non performanti | Media | Usare `will-change`, lazy loading, ridurre octaves |
| Font Cinzel non caricato | Bassa | Già caricato in index.html, fallback Georgia,serif |
| Canvas halo non sincronizzato | Media | useRef + requestAnimationFrame, non React state |
| Bundle size aumento | Bassa | SVG inline è piccolo, filtri sono dichiarativi |
| Breaking drag-and-drop | Media | Mantenere data-testid e event handlers esistenti |

---

## 7. PROSSIMO PASSO IMMEDIATO

**Fase 0**: Creare `/skin-lab` e copiare l'HTML del prototipo per verificare che il visual match funziona nel contesto React/Vite.

Vuoi procedere?
