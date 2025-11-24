# Pubblicazione Privata Online 🌐

## Opzioni per Condividere il Gioco via Internet

Vuoi accedere al gioco da altri PC/cellulari con password? Ecco le soluzioni:

---

## 🚀 Opzione 1: Vercel (RACCOMANDATO)

**Vantaggi**:
- ✅ Deploy in 2 minuti
- ✅ Password protection integrata
- ✅ HTTPS automatico
- ✅ Gratuito fino a 100GB bandwidth/mese
- ✅ URL personalizzato (e.g., `mio-gioco.vercel.app`)

### Setup

#### 1. Installa Vercel CLI
```bash
npm install -g vercel
```

#### 2. Build Produzione
```bash
npm run build
```

#### 3. Deploy
```bash
cd dist
vercel --prod
```

Segui le istruzioni:
- Login con GitHub/Email
- Scegli nome progetto
- Conferma impostazioni

#### 4. Password Protection

**Opzione A: Environment Variable (Gratis)**

1. Vai su `vercel.com` → Project Settings → Environment Variables
2. Aggiungi:
   - `PASSWORD=tuapassword`
3. Crea file `middleware.ts` nella root:

```typescript
import { NextResponse } from 'next/server';

export function middleware(request: Request) {
  const auth = request.headers.get('authorization');
  
  if (!auth || auth !== `Bearer ${process.env.PASSWORD}`) {
    return new Response('Accesso Negato', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Area"',
      },
    });
  }
  
  return NextResponse.next();
}
```

**Opzione B: Vercel Pro ($20/mese)**
- Password protection nativa
- UI visuale, no codice

---

## 🔒 Opzione 2: ngrok (Per Testing Rapido)

**Vantaggi**:
- ✅ Immediato (nessun deploy)
- ✅ Tunnel dal tuo `localhost`
- ✅ Password protection (con account)

**Svantaggi**:
- ❌ Devi lasciare il PC acceso
- ❌ URL random (cambia ogni volta)

### Setup

#### 1. Installa ngrok
```bash
brew install ngrok/ngrok/ngrok
```

#### 2. Registrati
```bash
ngrok config add-authtoken YOUR_TOKEN
```
(Ottieni token gratuito su `ngrok.com`)

#### 3. Avvia Tunnel
```bash
# Tieni il server vite attivo
npm run dev

# In un altro terminale
ngrok http 5174
```

Output:
```
Forwarding  https://a1b2-c3d4.ngrok.io -> http://localhost:5174
```

Condividi: `https://a1b2-c3d4.ngrok.io`

#### 4. Password Protection (ngrok Basic Plan - $10/mese)
```bash
ngrok http 5174 --basic-auth="username:password"
```

---

## ☁️ Opzione 3: Cloudflare Tunnel + Access (GRATUITO!)

**Vantaggi**:
- ✅ Gratuito
- ✅ Password/Email authentication
- ✅ Domain personalizzato
- ✅ Tunnel persistente

### Setup

#### 1. Installa cloudflared
```bash
brew install cloudflare/cloudflare/cloudflared
```

#### 2. Login
```bash
cloudflared tunnel login
```

#### 3. Crea Tunnel
```bash
cloudflared tunnel create mio-gioco
```

#### 4. Configura
File `~/.cloudflared/config.yml`:
```yaml
tunnel: YOUR_TUNNEL_ID
credentials-file: /Users/tuonome/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  - hostname: mio-gioco.tuodominio.com
    service: http://localhost:5174
  - service: http_status:404
```

#### 5. Route DNS
```bash
cloudflared tunnel route dns mio-gioco mio-gioco.tuodominio.com
```

#### 6. Avvia Tunnel
```bash
npm run dev  # In un terminale
cloudflared tunnel run mio-gioco  # In altro terminale
```

#### 7. Cloudflare Access (Password Protection)

1. Vai su `dash.cloudflare.com`
2. Zero Trust → Access → Applications
3. Add Application
4. Policy:
   - "One-time PIN" (invia codice via email)
   - "Username/Password"

---

## 📦 Opzione 4: Deploy su Server Personale

Se hai un server/VPS:

### Nginx + Basic Auth

#### 1. Build
```bash
npm run build
```

#### 2. Copia dist/ sul server
```bash
scp -r dist/* user@server:/var/www/mio-gioco/
```

#### 3. Nginx Config
`/etc/nginx/sites-available/mio-gioco`:
```nginx
server {
  listen 80;
  server_name miogioco.example.com;

  root /var/www/mio-gioco;
  index index.html;

  # Password Protection
  auth_basic "Restricted Access";
  auth_basic_user_file /etc/nginx/.htpasswd;

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

#### 4. Crea Password
```bash
sudo htpasswd -c /etc/nginx/.htpasswd username
```

---

## 🎮 Opzione 5: Tauri Mobile App (Privata)

Distribuisci come APK (Android) o TestFlight (iOS):

### Android APK
```bash
cargo tauri android build
```

Condividi APK via Google Drive/Dropbox (nessun Google Play richiesto)

### iOS TestFlight
```bash
cargo tauri ios build
```

Upload su App Store Connect → TestFlight → Invita beta testers

---

## Confronto Rapido

| Opzione | Costo | Difficoltà | Password | Persistente |
|---------|-------|------------|----------|-------------|
| **Vercel** | Gratis | ⭐ Facile | Via Pro ($20) | ✅ Sì |
| **ngrok** | $10/mese per pwd | ⭐⭐ Medio | Con account | ❌ Serve PC acceso |
| **Cloudflare** | Gratis | ⭐⭐⭐ Medio | ✅ Free! | ❌ Serve PC acceso |
| **Server VPS** | $5-20/mese | ⭐⭐⭐⭐ Difficile | ✅ Sì | ✅ Sì |
| **Tauri App** | $0 (o $99 iOS) | ⭐⭐⭐⭐⭐ Difficile | N/A | ✅ App nativa |

---

## 🎯 Raccomandazione per Te

Basato sulle tue esigenze:

### Per Testing Immediato (Oggi)
→ **ngrok** (gratis, 5 minuti setup)

```bash
brew install ngrok
ngrok http 5174
# Condividi link!
```

### Per Uso Continuativo + Password
→ **Cloudflare Tunnel + Access** (gratis, 30 min setup)

### Per Deploy Professionale
→ **Vercel** (gratis, upgrade $20/mese per password)

---

## Setup Step-by-Step (ngrok)

Ti mostro il più veloce:

```bash
# 1. Installa
brew install ngrok

# 2. Registrati (gratuito)
# Vai su: https://ngrok.com/signup
# Copia il token

# 3. Configura token
ngrok config add-authtoken YOUR_TOKEN_HERE

# 4. Tieni server attivo
npm run dev

# 5. In altro terminale
ngrok http 5174

# OUTPUT:
# Forwarding https://xyz.ngrok.io -> localhost:5174
# ^^^^^^^^^^^^^^ Questo è il link da condividere!
```

**Accesso da cell**:
- Apri `https://xyz.ngrok.io` da Safari/Chrome mobile
- Funziona identico!

**Password** (se paghi $10/mese):
```bash
ngrok http 5174 --basic-auth="user:pass123"
```

---

Quale opzione preferisci testare?
