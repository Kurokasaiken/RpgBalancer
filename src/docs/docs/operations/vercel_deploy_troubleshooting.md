# 🔧 Vercel Deployment Troubleshooting Guide

**Guida completa per risolvere problemi di deploy su Vercel e garantire deploy di successo.**

---

## 🚨 Problemi Comuni di Deploy su Vercel

### 1. Build Fallito su Vercel (ma Local Funziona)

**Sintomi:**
- Build locale: ✅ `npm run build` funziona
- Build Vercel: ❌ "Build failed" nei logs

**Cause Principali:**
- Node.js version mismatch
- Environment variables mancanti
- Dependencies non installate correttamente
- Build commands diversi

---

## 🔍 Diagnosi del Problema

### Step 1: Controllare Logs Vercel

```bash
# Vedi ultimi deploy logs
vercel logs

# Logs specifici di un deploy
vercel logs --since=1h

# Logs in real-time durante deploy
vercel --prod --debug
```

### Step 2: Verificare Node Version

```bash
# Controlla versione locale
node --version
npm --version

# Controlla .nvmrc
cat .nvmrc

# Verifica versione Vercel
vercel env ls
```

### Step 3: Controllare Environment Variables

```bash
# Lista tutte env vars
vercel env ls

# Aggiungi env variable se mancante
vercel env add NODE_ENV production
vercel env add NPM_CONFIG_PRODUCTION false
```

---

## 🛠️ Soluzioni Immediate

### Soluzione 1: Fix Node Version

**Crea/Aggiorna `.nvmrc`:**
```bash
echo "22" > .nvmrc
```

**Aggiungi `vercel.json` con Node version:**
```json
{
  "version": 2,
  "framework": "vite",
  "buildCommand": "npm run build:deploy",
  "outputDirectory": "dist",
  "installCommand": "npm ci",
  "functions": {
    "src/api/**/*.ts": {
      "runtime": "nodejs22.x"
    }
  },
  "build": {
    "env": {
      "NODE_VERSION": "22"
    }
  }
}
```

### Soluzione 2: Fix Build Command

**Aggiorna `vercel.json`:**
```json
{
  "version": 2,
  "framework": "vite",
  "outputDirectory": "dist",
  "installCommand": "npm ci",
  "buildCommand": "npm run build:deploy",
  "devCommand": "npm run dev"
}
```

### Soluzione 3: Fix Dependencies

**Crea `.vercelignore`:**
```
node_modules
.git
dist
.env.local
.env.*.local
```

**Aggiorna `package.json` scripts:**
```json
{
  "scripts": {
    "build": "vite build",
    "build:vercel": "npm ci --only=production && npm run build",
    "postbuild": "echo 'Build completed successfully'"
  }
}
```

---

## 📋 Checklist Pre-Deploy

### ✅ Verifica Locale

```bash
# 1. Pulisci e rebuild
rm -rf dist node_modules package-lock.json
npm install
npm run build:deploy

# 2. Test production build
npm run preview

# 3. Verifica output
ls -la dist/
```

### ✅ Verifica Configurazione

```bash
# 1. Controlla vercel.json
cat vercel.json

# 2. Controlla package.json engines
cat package.json | grep -A 5 "engines"

# 3. Controlla environment
vercel env ls
```

### ✅ Verifica Assets

```bash
# 1. Controlla dimensioni assets
du -sh dist/assets/*

# 2. Verifica file critici
ls -la dist/index.html
ls -la dist/manifest.json
ls -la dist/service-worker.js
```

---

## 🚀 Deploy Procedure Corretta

### Method 1: Vercel CLI (Consigliato)

```bash
# 1. Setup iniziale (solo prima volta)
vercel link

# 2. Deploy di test
vercel

# 3. Verifica deploy di test
curl https://your-app-git-main.vercel.app

# 4. Deploy production
vercel --prod

# 5. Verifica production
curl https://your-app.vercel.app
```

### Method 2: Git Integration

```bash
# 1. Push a main branch
git add .
git commit -m "Deploy: $(date)"
git push origin main

# 2. Monitora deploy su Vercel Dashboard
# 3. Controlla logs se fallisce
vercel logs
```

---

## 🔧 Debugging Avanzato

### Debug Build Process

```bash
# Build con output dettagliato
npm run build -- --mode production --debug

# Controlla warnings
npm run build 2>&1 | grep -i warn

# Verifica chunks grandi
npm run build | grep "larger than 500KB"
```

### Debug Runtime Errors

```bash
# Test production build localmente
npm run preview &
PID=$!
sleep 5
curl http://localhost:4173
kill $PID
```

### Debug Assets Loading

```bash
# Verifica asset paths
grep -r "assets/" dist/index.html

# Test manifest
curl -I https://your-app.vercel.app/manifest.json

# Test service worker
curl -I https://your-app.vercel.app/service-worker.js
```

---

## 📊 Performance Optimization

### Riduci Bundle Size

**Aggiorna `vite.config.ts`:**
```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          balancer: ['@dnd-kit/core', '@dnd-kit/sortable'],
          idle: ['src/ui/idleVillage'],
          punch: ['src/ui/punchClub']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
```

### Ottimizza Assets

**Configura compression:**
```json
// vercel.json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" },
        { "key": "Content-Encoding", "value": "gzip" }
      ]
    }
  ]
}
```

---

## 🆘 Recovery Procedures

### Rollback Immediato

```bash
# 1. Identifica ultimo deploy funzionante
vercel list

# 2. Rollback a deploy precedente
vercel rollback [deployment-url]

# 3. Oppure rollback a specific commit
git reset --hard [commit-hash]
git push --force-with-lease origin main
```

### Fix Incrementale

```bash
# 1. Deploy fix singolo
git add .
git commit -m "fix: resolve build issue"
git push origin main

# 2. Monitora deploy
vercel logs --follow
```

---

## 📚 Riferimenti Utili

### Documentazione Ufficiale

- **Vercel React Guide**: https://vercel.com/guides/deploying-react-with-vercel
- **Vite on Vercel**: https://vercel.com/guides/deploying-a-vite-project
- **Build Configuration**: https://vercel.com/docs/concepts/projects/configuration

### Tools e Commands

```bash
# Vercel CLI help
vercel --help

# Project info
vercel info

# Environment management
vercel env pull .env.production
vercel env push .env.production

# Domain management
vercel domains add
vercel domains ls
```

---

## 🎯 Quick Fix Template

**Copia e incolla questo template per fix rapidi:**

```bash
# 1. Fix Node version
echo "22" > .nvmrc

# 2. Update vercel.json
cat > vercel.json << 'EOF'
{
  "version": 2,
  "framework": "vite",
  "outputDirectory": "dist",
  "installCommand": "npm ci",
  "buildCommand": "npm run build:deploy",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
EOF

# 3. Clean build
rm -rf dist node_modules package-lock.json
npm install
npm run build:deploy

# 4. Deploy
vercel --prod

# 5. Verify
curl https://your-app.vercel.app
```

---

## 📞 Supporto

### Se il Problema Persiste

1. **Controlla Vercel Dashboard** → Deploy tab → Logs
2. **Controlla Status Page**: https://www.vercel-status.com/
3. **Community Vercel**: https://vercel.com/discord
4. **Stack Overflow**: https://stackoverflow.com/questions/tagged/vercel

### Debug Information da Raccoltare

```bash
# System info
vercel info
node --version
npm --version

# Project structure
ls -la
cat package.json | grep -A 10 "scripts"
cat vercel.json

# Build output
npm run build 2>&1 | tee build.log
```

---

**Ricorda**: 99% dei problemi di deploy su Vercel sono risolvibili con:
1. ✅ Node version corretta
2. ✅ Build command funzionante
3. ✅ Environment variables configurate
4. ✅ Dependencies installate correttamente

**Se hai ancora problemi, esegui il template quick fix sopra e contatta il supporto con le informazioni raccolte.**
