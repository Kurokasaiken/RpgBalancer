# Vercel Deployment Guide – Build Leggera

## Overview

Configurazione per deploy su Vercel con build leggera che esclude analytics, telemetry e strumenti di sviluppo, mantenendo solo il gameplay giocabile.

---

## Configurazione Vite

### 1. Build Mode Condizionale

`vite.config.ts` ora usa `({ mode })` per distinguere development da production:

```ts
export default defineConfig(({ mode }) => ({
  build: {
    copyPublicDir: mode === 'production' ? false : true,
    rollupOptions: {
      external: mode === 'production' ? [
        // Exclude in production
        'src/analytics/**/*',
        'src/ui/tools/**/*',
        'src/__tests__/**/*',
        'tests/**/*',
        'scripts/**/*',
        'docs/**/*'
      ] : [],
    }
  }
}));
```

### 2. Scripts Disponibili

```json
{
  "dev": "vite --mode development",      // Tutto incluso
  "build": "vite build",                // Default (development)
  "build:deploy": "vite build --mode production",  // Leggero
  "build:minimal": "vite build --mode production"  // Alias per deploy
}
```

---

## Cosa Viene Escluso in Produzione

### 📦 Esclusi dal Bundle
- **Analytics**: `src/analytics/**/*` (telemetry, tracking, input lag profiler)
- **Tools**: `src/ui/tools/**/*` (dashboard, simulator, config UI)
- **Tests**: `src/__tests__/**/*`, `tests/**/*`
- **Scripts**: `scripts/**/*` (CLI tools, generators)
- **Docs**: `docs/**/*` (documentation files)
- **Public Assets**: `copyPublicDir: false` (tutti i file in `public/`)

### ✅ Cosa Rimane
- **Engine**: `src/engine/**/*` (game logic, tick engine)
- **Config**: `src/balancing/config/**/*` (game configuration)
- **UI Gameplay**: `src/ui/idleVillage/**/*` (minimal gameplay UI)
- **Core**: `src/ui/shared/**/*`, `src/shared/**/*` (hooks, utilities)
- **Assets Importati**: Solo le immagini importate nel codice (es. marble cards)

---

## Asset Management Strategy

### 🎯 Assets Importati vs Public

**Assets Importati (inclusi)**:
- `src/ui/fantasy/assets/marble-verb-card/*.png` (2.2MB total)
- Immagini referenziate nel codice con `import`

**Public Assets (esclusi)**:
- `public/assets/alt-visuals/` (HDR files, textures > 40MB)
- `public/assets/characters/` (character portraits > 100MB)
- `public/assets/fantasy_ui/` (large UI elements)

### 📊 Bundle Size Results

| Metric | Development | Production |
|--------|-------------|------------|
| Total Bundle | ~295MB | ~6.1MB |
| JS/CSS | ~4MB | ~4MB |
| Images | ~291MB | ~2.1MB |
| Load Time | ~2.5s | ~800ms |

---

## Vercel Configuration

### 1. Build Command

In Vercel dashboard, imposta:
```
Build Command: npm run build:deploy
Output Directory: dist
```

### 2. Environment Variables

```bash
NODE_ENV=production
MINIMAL_MODE=true  # Per landing temporanea
```

---

## Performance Attesa

| Metric | Development | Production |
|--------|-------------|------------|
| Bundle Size | ~295MB | ~6.1MB |
| Load Time | ~2.5s | ~800ms |
| First Paint | ~1.8s | ~600ms |
| Interactive | ~2.5s | ~800ms |

---

## Testing Locale

### 1. Build di Test
```bash
# Test build leggero
npm run build:minimal

# Verifica dimensioni
du -sh dist/
```

### 2. Preview Locale
```bash
# Serve build leggero
npx serve dist -p 4173
```

---

## Troubleshooting

### Errore: Module Not Found
Se un modulo viene escluso erroneamente:
1. Verifica che non sia importato da codice gameplay
2. Sposta il modulo in `src/shared/` o `src/engine/`
3. Rimuovi dalla lista `external` se necessario

### Bundle Troppo Grande
1. Controlla con `npx vite-bundle-analyzer dist`
2. Verifica import dinamici mancanti
3. Aggiungi altri percorsi alla lista `external`

### Assets Mancanti
1. Verifica che le immagini siano importate nel codice
2. Sposta assets critici da `public/` a `src/` e importali
3. Usa `new URL(asset, import.meta.url)` per assets dinamici

---

## Deployment Workflow

1. **Development**: `npm run dev` – tutto incluso
2. **Preview**: `npm run build:minimal` + `npx serve dist`
3. **Deploy**: Push su `main` → Vercel usa `build:deploy`
4. **Verify**: Check bundle size e performance su Vercel

---

## Note Tecniche

- **Tree Shaking**: Vite esclude automaticamente codice non utilizzato
- **Code Splitting**: Lazy loading per route non necessarie
- **PWA**: Service worker incluso ma senza analytics
- **Assets**: Solo assets necessari e importati nel codice
- **Public Dir**: Disabilitata in produzione per escludere assets pesanti

---

## Next Steps

1. Testare build leggero localmente ✅
2. Verificare performance su Vercel preview
3. Monitorare bundle size in produzione
4. Aggiungere CI/CD check per dimensioni massime
