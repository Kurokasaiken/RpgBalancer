# Tauri Mobile - Guida Setup e Testing

## Come Funziona Tauri Mobile

Tauri 2 permette di creare app native Android e iOS dalla stessa codebase React/TypeScript. Il processo:

1. **Inizializzazione**: Crea progetti nativi (Android Studio / Xcode)
2. **Build**: Compila Rust + web assets in un'app nativa
3. **Test**: Esegui su emulatore/simulatore o dispositivo fisico

---

## Android Setup 🤖

### Requisiti
- ✅ Rust (già installato)
- ⚠️ Android Studio con SDK
- ⚠️ Android NDK (Native Development Kit)
- ⚠️ Java JDK 17+

### Installazione Android Studio

#### 1. Download
```bash
# Vai su: https://developer.android.com/studio
# Scarica Android Studio per macOS (ARM)
```

#### 2. Installa SDK Components
Dopo aver installato Android Studio:
1. Apri Android Studio
2. Settings → Appearance & Behavior → System Settings → Android SDK
3. Installa:
   - Android 13.0 (API 33) o superiore
   - Android SDK Build-Tools
   - Android SDK Platform-Tools
   - Android SDK Command-line Tools
4. SDK Manager → SDK Tools → installa NDK

#### 3. Configura Environment Variables
Aggiungi al tuo `~/.zshrc`:

```bash
# Android SDK
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$PATH:$ANDROID_HOME/emulator"
export PATH="$PATH:$ANDROID_HOME/platform-tools"
export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin"

# Java (necessario per Android)
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
```

Poi ricarica: `source ~/.zshrc`

### Inizializza Progetto Android

```bash
cargo tauri android init
```

Questo crea `src-tauri/gen/android/` con un progetto Android Studio completo.

### Build e Test Android

#### Opzione 1: Emulatore (più facile)
```bash
# Crea un emulatore in Android Studio
# Device Manager → Create Virtual Device → Pixel 6 (API 33)

# Avvia emulatore
emulator -avd Pixel_6_API_33

# Build e run
cargo tauri android dev
```

#### Opzione 2: Dispositivo Fisico
1. Abilita "Developer Options" sul telefono Android
2. Attiva "USB Debugging"
3. Collega via USB
4. Accetta il prompt di autorizzazione
5. `cargo tauri android dev`

### Cosa Succede
- Compila il codice Rust per Android (architetture ARM/x86)
- Bundla gli asset web (HTML/CSS/JS)
- Crea un APK
- Installa automaticamente su emulatore/device
- Avvia l'app con hot-reload attivo

---

## iOS Setup 🍎

### Requisiti
- ✅ Rust (già installato)
- ✅ macOS (hai un Mac)
- ✅ Xcode (già installato - licenza accettata)
- ⚠️ Xcode Command Line Tools

### Verifica Command Line Tools

```bash
xcode-select --install
```

Se già installato, darà errore (va bene).

### Inizializza Progetto iOS

```bash
cargo tauri ios init
```

Questo crea `src-tauri/gen/apple/` con un progetto Xcode.

### Build e Test iOS

#### Simulatore (più facile)
```bash
# Avvia simulatore iOS
open -a Simulator

# Build e run
cargo tauri ios dev
```

#### Dispositivo Fisico (richiede Apple Developer Account)
1. Registra un Apple Developer account (gratuito per testing)
2. In Xcode: Apri `src-tauri/gen/apple/*.xcodeproj`
3. Signing & Capabilities → Team → Seleziona il tuo account
4. Collega iPhone via cavo
5. `cargo tauri ios dev --device`

### Cosa Succede
- Compila Rust per iOS (ARM64)
- Bundla web assets
- Crea un `.app`
- Installa su simulatore/device
- Avvia con hot-reload

---

## Limitazioni UI Corrente ⚠️

L'UI attuale **non è ottimizzata per mobile**. Problemi:

1. **Touch Controls**: Grid Arena richiede click precisi
2. **Bottoni Piccoli**: Non rispettano i 44x44px minimi
3. **Layout Fisso**: Non responsive per schermi piccoli
4. **Orientamento**: Solo landscape ottimizzato

### Miglioramenti Necessari

Prima di pubblicare su store:

- [ ] Adattare Grid Arena per touch (swipe, tap)
- [ ] Ingrandire tutti i bottoni
- [ ] Layout responsive (Tailwind già presente)
- [ ] Support orientamento portrait
- [ ] Virtual keyboard handling
- [ ] Gesture support (pinch-to-zoom?)

---

## Comandi Utili

```bash
# Desktop
npm run tauri:dev        # Dev mode
npm run tauri:build      # Production build

# Android
cargo tauri android init # Prima volta
cargo tauri android dev  # Dev mode
cargo tauri android build # Release APK/AAB

# iOS
cargo tauri ios init     # Prima volta
cargo tauri ios dev      # Dev mode
cargo tauri ios build    # Release IPA
```

---

## Prossimi Step Suggeriti

### Per Testare Subito (senza Android Studio)
Usa il **browser responsive mode** per simulare mobile:

1. Apri `http://localhost:5174` in Chrome/Safari
2. F12 → Device Toolbar (Cmd+Shift+M su Mac)
3. Seleziona "iPhone 14 Pro" o "Pixel 7"
4. Testa l'UI mobile-like

### Per Build Vero
1. Installa Android Studio (più semplice di iOS setup)
2. Configura SDK/NDK
3. `cargo tauri android init`
4. `cargo tauri android dev`
5. Vedi app su emulatore!

---

## Tempo Stimato

- **Android Studio Setup**: 30-60 min (download + configurazione)
- **Prima Build Android**: 10-15 min (compila tutte le dipendenze)
- **iOS Simulatore**: 5-10 min (Xcode già presente)
- **Build Successive**: 2-3 min (incremental)
