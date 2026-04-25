# Mobile-First Development Guidelines

## Principi Generali 📱

**REGOLA ORO**: Ogni nuova feature deve funzionare PRIMA su mobile, poi su desktop.

### Filosofia
1. **Mobile-First Design**: Iniziare dal constraint più piccolo (mobile), poi espandere
2. **Progressive Enhancement**: Aggiungere funzionalità desktop come bonus
3. **Touch-First**: Assumere touch come input primario, mouse come secondario
4. **Responsive by Default**: Usare Tailwind responsive utilities ovunque

---

## UI Components Checklist ✅

Ogni componente deve rispettare:

### Touch Targets
- [ ] **Minimo 44x44px** per ogni elemento interattivo
- [ ] Spacing adeguato (min 8px) tra bottoni
- [ ] Areas cliccabili più grandi del content visibile

### Layout
- [ ] **Breakpoints Tailwind**:
  - `default`: mobile (< 640px)
  - `sm:`: tablet portrait (≥ 640px)
  - `md:`: tablet landscape (≥ 768px)
  - `lg:`: desktop (≥ 1024px)
  - `xl:`: large desktop (≥ 1280px)
- [ ] Stacked layout su mobile, side-by-side su desktop
- [ ] Scroll verticale OK su mobile, evitare scroll orizzontale

### Typography
- [ ] **Font size minimo**: 16px (1rem) per testo lungo/lettura
- [ ] **UI densa (tool come Balancer)**: etichette/valori possono usare 14px (0.875rem) con alto contrasto
- [ ] **Line height**: min 1.4–1.5 per leggibilità mobile
- [ ] Contrasto colori: min 4.5:1 (WCAG AA)
- [ ] Dettagli su scala tipografica e densità in [docs/plans/responsive_ui_plan.md](docs/plans/responsive_ui_plan.md)

### Interactions
- [ ] **Gesture Support**:
  - Tap/Click
  - Long press (alternative al right-click)
  - Swipe (navigazione, dismiss)
  - Pinch-to-zoom (se necessario)
- [ ] Feedback visivo immediato (active states)
- [ ] No hover-only interactions

### Input
- [ ] Keyboard mobile-friendly (type="number", "email", etc.)
- [ ] Virtual keyboard non nasconde input corrente
- [ ] Autocomplete/suggestions dove possibile

---

## Componenti Attuali - Stato Mobile

### ✅ Già Mobile-Friendly
- [x] **Balancer**: Grid responsive, input grandi
- [x] **SmartInput**: Touch-friendly sliders
- [x] **Tooltip**: Funziona con tap

### ⚠️ Richiede Adattamento
- [ ] **Grid Arena**: 
  - Tile troppo piccole su mobile
  - Click precision difficile con dita
  - Serve: swipe per movimento, tap per selezione
- [ ] **Navigation Tabs**:
  - Troppi tab in orizzontale
  - Serve: hamburger menu o tab scrollabili
- [ ] **Spell Library**:
  - Liste scrollabili OK
  - Form inputs da ingrandire
  - Bottoni "+" da espandere
- [ ] **Character Builder**:
  - Stat inputs OK
  - Spell picker da rendere touch-friendly

### ❌ Non Testato Mobile
- [ ] **Idle Arena**: Animazioni potrebbero lag
- [ ] **Stat Weigher**: Tabelle potrebbero traboccare

---

## Strategie di Implementazione

### Opzione 1: Responsive (Raccomandato)
**Un'unica UI che si adatta**

Vantaggi:
- Codebase unificata
- Meno manutenzione
- Consistent UX

Implementazione:
```tsx
// Esempio Grid Arena responsive
<div className="
  grid gap-1 
  grid-cols-6 sm:grid-cols-8 md:grid-cols-10
  w-full max-w-2xl mx-auto
">
  {tiles.map(tile => (
    <div className="
      aspect-square 
      min-h-[44px] sm:min-h-[50px] md:min-h-[60px]
      cursor-pointer active:scale-95
    ">
      {/* content */}
    </div>
  ))}
</div>
```

### Opzione 2: Adaptive (Solo se necessario)
**Due UI distinte: mobile vs desktop**

Quando usare:
- UX completamente diversa richiesta
- Performance critiche

Implementazione:
```tsx
const isMobile = window.innerWidth < 768;

return isMobile ? 
  <GridArenaMobile /> : 
  <GridArenaDesktop />;
```

**Decisione**: Partire con **Responsive**, passare ad Adaptive solo se necessario.

---

## Testing Mobile

### Browser DevTools (Immediato)
```bash
# Apri in Chrome/Safari
open http://localhost:5174

# Cmd+Shift+M → Device Toolbar
# Dispositivi da testare:
# - iPhone 14 Pro (393x852)
# - Pixel 7 (412x915)
# - iPad Air (820x1180)
```

### Playwright Mobile Testing
Aggiungere device profiles:
```typescript
// playwright.config.ts
projects: [
  { name: 'Desktop Chrome', use: devices['Desktop Chrome'] },
  { name: 'Mobile Safari', use: devices['iPhone 14 Pro'] },
  { name: 'Mobile Chrome', use: devices['Pixel 7'] },
],
```

### Tauri Mobile (Build Reali)
```bash
# Android
cargo tauri android dev

# iOS
cargo tauri ios dev
```

---

## Priorità Implementazione

### Phase 1: Core Responsive (Questa Sessione)
1. [/] Grid Arena → touch-friendly tiles
2. [ ] Navigation → mobile menu
3. [ ] Buttons → min 44px everywhere

### Phase 2: Enhanced Mobile UX
4. [ ] Gesture support (swipe, long-press)
5. [ ] Mobile-specific shortcuts
6. [ ] Orientation handling

### Phase 3: Polish
7. [ ] Mobile splash screen
8. [ ] PWA manifest
9. [ ] Performance optimization

---

## Best Practices

### CSS/Tailwind
```tsx
// ✅ GOOD: Mobile-first
className="text-base md:text-lg lg:text-xl"

// ❌ BAD: Desktop-first
className="text-xl md:text-base"
```

### Event Handlers
```tsx
// ✅ GOOD: Touch + Click
onPointerDown={handleSelect}  // Works for both!

// ⚠️ OK: Fallback
onClick={handleClick}
onTouchStart={handleTouch}

// ❌ BAD: Mouse-only
onMouseEnter={showTooltip}  // No mobile equivalent!
```

### Media Queries
```tsx
// ✅ GOOD: useMediaQuery hook
const isMobile = useMediaQuery('(max-width: 768px)');

// ⚠️ OK: CSS-only
<div className="hidden md:block">Desktop only</div>
```

---

## Metrics da Monitorare

- [ ] **Touch target size**: Min 44x44px
- [ ] **FPS**: Min 30 FPS su mobile (60 preferred)
- [ ] **Bundle size**: Max 500KB initial load
- [ ] **First Contentful Paint**: < 1.5s su 3G
- [ ] **Lighthouse Mobile Score**: > 90

---

## Resources

- [Apple HIG Touch Targets](https://developer.apple.com/design/human-interface-guidelines/inputs)
- [Material Design Touch Targets](https://m3.material.io/foundations/accessible-design/accessibility-basics)
- [Tailwind Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [Tauri Mobile Docs](https://v2.tauri.app/develop/mobile/)

---

---

## Mobile + Desktop Workflow (Sintesi)

- Ogni nuova pagina UI:
  - [ ] Deve essere progettata in modalità **mobile-first**, poi arricchita per desktop.
  - [ ] Deve avere una review estetica esplicita in DevTools (almeno iPhone 14 Pro + Desktop ~1440px).
  - [ ] Deve seguire il piano in [docs/plans/responsive_ui_plan.md](docs/plans/responsive_ui_plan.md).
- La **prima pagina target** per questo workflow è il **Balancer**.

**Ultimo Aggiornamento**: 2025-12-06  
**Autore**: Antigravity Agent + Cascade  
**Status**: Living Document (aggiorna con nuove best practices)
